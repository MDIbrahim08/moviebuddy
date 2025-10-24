import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { trackMovieInteraction } from '@/utils/embeddingUtils';
import { useToast } from '@/hooks/use-toast';

interface MovieActionsProps {
  movieId: string;
  genres: string[];
}

export const MovieActions = ({ movieId, genres }: MovieActionsProps) => {
  const { toast } = useToast();

  const handleLike = async () => {
    await trackMovieInteraction(movieId, 'like', genres.length > 0 ? genres : []);
    toast({
      title: "👍 Liked!",
      description: "We'll recommend more movies like this",
    });
  };

  const handleDislike = async () => {
    await trackMovieInteraction(movieId, 'dislike', genres.length > 0 ? genres : []);
    toast({
      title: "👎 Noted",
      description: "We'll show you different types of movies",
    });
  };

  const handleWatched = async () => {
    await trackMovieInteraction(movieId, 'watched', genres.length > 0 ? genres : []);
    toast({
      title: "✅ Marked as watched",
      description: "Added to your watch history",
    });
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        className="flex items-center gap-1"
      >
        <ThumbsUp className="h-4 w-4" />
        Like
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDislike}
        className="flex items-center gap-1"
      >
        <ThumbsDown className="h-4 w-4" />
        Dislike
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWatched}
        className="flex items-center gap-1"
      >
        <Eye className="h-4 w-4" />
        Watched
      </Button>
    </div>
  );
};