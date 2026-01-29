import { Heart, Shield, Clock, Users } from "lucide-react";
import { MyHospitalsPanel } from "@/components/hospitals/MyHospitalsPanel";

const features = [
  {
    icon: Shield,
    title: "Safe Guidance",
    description: "Non-diagnostic support focused on home remedies and wellness",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Get helpful health tips anytime you need them",
  },
  {
    icon: Users,
    title: "For Everyone",
    description: "Simple advice anyone can understand and follow",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 lg:py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
      
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Your Health Companion</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Gentle Health Guidance
            <br />
            <span className="text-primary">When You Need It</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            MediGuide offers caring support with home remedies, wellness tips, 
            and guidance on when to seek professional care — all in a calm, 
            reassuring conversation.
          </p>
        </div>

        {/* My Hospitals Panel - Quick Access */}
        <div className="max-w-md mx-auto mb-8">
          <MyHospitalsPanel />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-soft transition-shadow duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            ⚕️ MediGuide is for informational purposes only and does not provide 
            medical diagnoses or prescriptions. Always consult a healthcare 
            professional for medical advice.
          </p>
        </div>
      </div>
    </section>
  );
}
