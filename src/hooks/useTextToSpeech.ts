import { useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

interface TextToSpeechHook {
  isPlaying: boolean;
  playText: (text: string) => Promise<void>;
  stopPlaying: () => void;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mediguide-tts`;

export function useTextToSpeech(): TextToSpeechHook {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playText = useCallback(async (text: string) => {
    // Stop any currently playing audio
    stopPlaying();

    if (!text || text.trim().length === 0) return;

    // Clean the text - remove markdown and emojis for better TTS
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/💚|🔴|⚠️|💧|✅/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();

    if (!cleanText) return;

    setIsPlaying(true);

    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        stopPlaying();
      };

      audio.onerror = () => {
        console.error("Audio playback error");
        stopPlaying();
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      toast({
        title: "Voice playback failed",
        description: "Could not play audio response.",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  }, [stopPlaying]);

  return {
    isPlaying,
    playText,
    stopPlaying,
  };
}
