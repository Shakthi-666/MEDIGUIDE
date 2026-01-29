import { Heart } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
        <Heart className="w-4 h-4" />
      </div>

      {/* Typing bubble */}
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
