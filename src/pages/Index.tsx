import { MovieProvider } from '@/contexts/MovieContext';
import { MovieChatbot } from '@/components/MovieChatbot';

const Index = () => {
  return (
    <MovieProvider>
      <MovieChatbot />
    </MovieProvider>
  );
};

export default Index;
