
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/hooks/useProfile";

export type Language = "en" | "ta" | "hi" | "te" | "kn" | "mr";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mediguide-chat`;
const MAX_HISTORY_MESSAGES = 10; // Limit context to reduce API load
const COOLDOWN_MS_ON_429 = 15000;

function getRetryAfterMs(resp: Response): number | null {
  const retryAfter = resp.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : null;
}

// Build user context string from profile for personalized suggestions
function buildUserContext(profile: Profile | null): string {
  if (!profile) return "";
  
  const parts: string[] = [];
  
  if (profile.full_name) {
    parts.push(`User's name is ${profile.full_name.split(" ")[0]}`);
  }
  if (profile.age) {
    parts.push(`Age: ${profile.age} years`);
  }
  if (profile.height_cm && profile.weight_kg) {
    const bmi = (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1);
    parts.push(`Height: ${profile.height_cm}cm, Weight: ${profile.weight_kg}kg (BMI: ${bmi})`);
  }
  if (profile.health_conditions && profile.health_conditions.trim()) {
    parts.push(`Known health conditions: ${profile.health_conditions}`);
  }
  if (profile.allergies && profile.allergies.trim()) {
    parts.push(`ALLERGIES (CRITICAL - NEVER suggest remedies containing these): ${profile.allergies}`);
  }
  if (profile.checkup_data && profile.checkup_data.trim()) {
    parts.push(`Recent checkup data: ${profile.checkup_data}`);
  }
  
  if (parts.length === 0) return "";
  
  return `\n\n[USER HEALTH PROFILE - Use this to personalize your advice and consider any contraindications. NEVER suggest remedies containing user's listed allergies.]\n${parts.join("\n")}`;
}

export function useMediGuideChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const updateUserProfile = useCallback((profile: Profile | null) => {
    setUserProfile(profile);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (Date.now() < cooldownUntil) {
      toast({
        title: "Please wait",
        description: "The service is busy right now. Try again in a few seconds.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      // Limit message history to reduce API load
      const recentMessages = [...messages, userMessage].slice(-MAX_HISTORY_MESSAGES);
      
      // Build user context from profile for personalized suggestions
      const userContext = buildUserContext(userProfile);
      
      // Prepend user context to the first message if available
      const allMessages = recentMessages.map((m, index) => {
        if (index === 0 && m.role === "user" && userContext) {
          return {
            role: m.role,
            content: m.content + userContext,
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, language }),
      });

      if (!resp.ok) {
        const retryAfterMs = resp.status === 429 ? getRetryAfterMs(resp) : null;
        const errorData = await resp.json().catch(() => ({}));

        if (resp.status === 429) {
          const waitMs = retryAfterMs ?? COOLDOWN_MS_ON_429;
          setCooldownUntil(Date.now() + waitMs);
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }

        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Unable to send message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      // Remove the user message if we couldn't get a response
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, language, userProfile, cooldownUntil]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    language,
    setLanguage,
    cooldownUntil,
    updateUserProfile,
  };
}

