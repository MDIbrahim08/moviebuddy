import { MovieProvider } from '@/contexts/MovieContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MovieChatbot } from '@/components/MovieChatbot';
import { Sparkles, Star, Zap, Heart, Film } from 'lucide-react';

const Index = () => {
  return (
    <ThemeProvider>
      <MovieProvider>
        <div className="relative min-h-screen overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Orbs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-pulse delay-1000"></div>
            <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
            <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-accent/15 rounded-full blur-md animate-pulse delay-500"></div>
            
            {/* Floating Icons */}
            <div className="absolute top-16 right-16 text-primary/30 animate-bounce delay-1000">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="absolute top-1/2 left-8 text-accent/30 animate-bounce delay-2000">
              <Star className="h-5 w-5" />
            </div>
            <div className="absolute bottom-20 right-32 text-primary/40 animate-bounce">
              <Film className="h-7 w-7" />
            </div>
            <div className="absolute top-3/4 left-20 text-accent/25 animate-bounce delay-1500">
              <Zap className="h-4 w-4" />
            </div>
            <div className="absolute top-28 left-1/2 text-primary/35 animate-bounce delay-3000">
              <Heart className="h-5 w-5" />
            </div>
            
            {/* Gradient Mesh Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-primary/3 via-transparent to-accent/3"></div>
          </div>
          
          {/* Main Content with Enhanced Glassmorphism */}
          <div className="relative z-10">
            <MovieChatbot />
          </div>
        </div>
      </MovieProvider>
    </ThemeProvider>
  );
};

export default Index;
