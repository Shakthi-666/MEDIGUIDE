import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Heart } from "lucide-react";
import type { Message } from "@/hooks/useMediGuideChat";
import { AudioPlayButton } from "./AudioPlayButton";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { isPlaying, playText, stopPlaying } = useTextToSpeech();
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      setIsLoadingAudio(true);
      try {
        await playText(message.content);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{ animationDelay: isLatest ? "0ms" : "0ms" }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-card",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card text-card-foreground rounded-tl-sm border border-border"
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 mt-2",
            isUser ? "justify-end" : "justify-between"
          )}
        >
          <span className={cn("text-xs opacity-60")}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && message.content && (
            <AudioPlayButton
              isPlaying={isPlaying}
              isLoading={isLoadingAudio}
              onPlay={handlePlayAudio}
              onStop={stopPlaying}
            />
          )}
        </div>
      </div>
    </div>
  );
}
