import { MovieProvider } from '@/contexts/MovieContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MovieChatbot } from '@/components/MovieChatbot';

const Index = () => {
  return (
    <ThemeProvider>
      <MovieProvider>
        <MovieChatbot />
      </MovieProvider>
    </ThemeProvider>
  );
};

export default Index;
