import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isListening,
  isSupported,
  onStart,
  onStop,
  disabled,
}: VoiceButtonProps) {
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={cn(
        "shrink-0 transition-all duration-200",
        isListening && "bg-destructive/10 text-destructive animate-pulse"
      )}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <Square className="w-4 h-4 fill-current" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
