import { Heart } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-soft">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            MediGuide
          </span>
        </div>

        {/* Tagline */}
        <p className="hidden sm:block text-sm text-muted-foreground">
          Your trusted health companion
        </p>
      </div>
    </header>
  );
}
