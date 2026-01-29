import { useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomeMessage } from "./WelcomeMessage";
import { EmergencyButton, EmergencyButtonRef } from "./EmergencyButton";
import { useMediGuideChat } from "@/hooks/useMediGuideChat";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useInactivityTrigger } from "@/hooks/useInactivityTrigger";
import { LanguageSelector } from "./LanguageSelector";
import { RotateCcw, Heart, LogIn, LogOut } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 120000; // 2 minutes

export function ChatContainer() {
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, clearMessages, language, setLanguage, updateUserProfile } = useMediGuideChat();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile(user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emergencyButtonRef = useRef<EmergencyButtonRef>(null);
  const lastUserMessageTimeRef = useRef<number>(Date.now());

  // Check if the last message was from the assistant (waiting for user response)
  const lastMessage = messages[messages.length - 1];
  const isWaitingForUserResponse = lastMessage?.role === "assistant" && !isLoading;

  // Callback for when user is inactive
  const handleInactivity = useCallback(() => {
    if (emergencyButtonRef.current) {
      emergencyButtonRef.current.triggerAutoEmergency();
    }
  }, []);

  // Inactivity trigger - only active when waiting for user response
  const { resetTimer } = useInactivityTrigger({
    timeout: INACTIVITY_TIMEOUT_MS,
    onInactive: handleInactivity,
    isEnabled: isWaitingForUserResponse,
    hasMessages: messages.length > 0,
  });

  // Reset the timer whenever user sends a message
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length > 0) {
      lastUserMessageTimeRef.current = Date.now();
      resetTimer();
    }
  }, [messages, resetTimer]);

  // Fetch profile when user is available
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Update chat hook with user profile for personalized AI responses
  useEffect(() => {
    updateUserProfile(profile);
  }, [profile, updateUserProfile]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleQuickStart = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">MediGuide</h2>
            <p className="text-xs text-muted-foreground">
              {user && profile ? `Hi, ${profile.full_name.split(" ")[0]}` : "Your health companion"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Emergency Button - always visible */}
          <EmergencyButton ref={emergencyButtonRef} profile={profile} />
          
          <LanguageSelector value={language} onChange={setLanguage} />
          
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              New chat
            </Button>
          )}

          {/* Auth button */}
          {!authLoading && (
            user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign out
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4 mr-1" />
                Sign in
              </Button>
            )
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-4">
          {messages.length === 0 ? (
            <WelcomeMessage onQuickStart={handleQuickStart} />
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLatest={index === messages.length - 1}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <TypingIndicator />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} />
    </div>
  );
}
