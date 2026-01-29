import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ChatContainer } from "@/components/chat/ChatContainer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Hero section - visible on larger screens, hidden when chatting on mobile */}
        <div className="hidden lg:block lg:w-1/2 xl:w-3/5 border-r border-border/50">
          <HeroSection />
        </div>

        {/* Chat container */}
        <div className="flex-1 lg:w-1/2 xl:w-2/5 h-[calc(100vh-4rem)] lg:h-auto">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};

export default Index;
