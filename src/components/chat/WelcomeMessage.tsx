import { Heart, Droplets, Moon, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeMessageProps {
  onQuickStart: (prompt: string) => void;
}

const quickStarts = [
  {
    icon: Thermometer,
    label: "I have a headache",
    prompt: "I have a headache that started today",
  },
  {
    icon: Droplets,
    label: "Cold symptoms",
    prompt: "I'm experiencing cold symptoms like runny nose and sneezing",
  },
  {
    icon: Moon,
    label: "Can't sleep well",
    prompt: "I've been having trouble sleeping lately",
  },
];

export function WelcomeMessage({ onQuickStart }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4 animate-fade-in">
      {/* Logo */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-primary" />
      </div>

      {/* Welcome text */}
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Welcome to MediGuide
      </h1>
      <p className="text-muted-foreground max-w-sm mb-6">
        I'm here to provide general health guidance and home remedies. 
        Tell me how you're feeling, and I'll do my best to help.
      </p>

      {/* Safety note */}
      <div className="bg-secondary/50 rounded-xl px-4 py-3 mb-6 max-w-sm">
        <p className="text-sm text-secondary-foreground">
          💚 I provide general wellness tips only. For medical emergencies or serious 
          symptoms, please contact a healthcare professional.
        </p>
      </div>

      {/* Quick start prompts */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-sm text-muted-foreground mb-3">Quick start:</p>
        {quickStarts.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all"
            onClick={() => onQuickStart(item.prompt)}
          >
            <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground text-left">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
