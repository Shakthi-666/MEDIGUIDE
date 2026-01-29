import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onStop: () => void;
  className?: string;
}

export function AudioPlayButton({
  isPlaying,
  isLoading,
  onPlay,
  onStop,
  className,
}: AudioPlayButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={isPlaying ? onStop : onPlay}
      disabled={isLoading}
      className={cn(
        "h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground",
        isPlaying && "text-primary",
        className
      )}
      title={isPlaying ? "Stop audio" : "Play audio"}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
