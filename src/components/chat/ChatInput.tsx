import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceButton } from "./VoiceButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  language?: string;
}

export function ChatInput({ 
  onSend, 
  isLoading, 
  placeholder = "Describe how you're feeling...",
  language = "en"
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAutoSentRef = useRef<string>("");
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported 
  } = useSpeechRecognition(language);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-send once when speech recognition stops with content
  useEffect(() => {
    const t = transcript.trim();
    if (isLoading) return;
    if (!isListening && t && lastAutoSentRef.current !== t) {
      lastAutoSentRef.current = t;
      const timer = setTimeout(() => {
        onSend(t);
        setInput("");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, onSend, isLoading]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="flex items-end gap-2 p-4 bg-card/80 backdrop-blur-sm border-t border-border">
      <VoiceButton
        isListening={isListening}
        isSupported={isSupported}
        onStart={startListening}
        onStop={stopListening}
        disabled={isLoading}
      />
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={isLoading || isListening}
        className={cn(
          "min-h-[48px] max-h-[150px] resize-none rounded-xl border-border/50",
          "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "placeholder:text-muted-foreground/60",
          isListening && "border-destructive/50 bg-destructive/5"
        )}
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading}
        size="icon"
        className={cn(
          "h-12 w-12 rounded-xl flex-shrink-0",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-soft transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
