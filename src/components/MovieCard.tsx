import { Movie } from '@/types/movie';
import { getFullPosterUrl, getTags } from '@/utils/movieUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, User, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export const MovieCard = ({ movie, className = "" }: MovieCardProps) => {
  const tags = getTags(movie);
  const year = movie.release_date.split('-')[0];

  return (
    <div className={`glass-card glass-hover group p-4 max-w-sm w-full ${className}`}>
      {/* Movie Poster */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img
          src={getFullPosterUrl(movie.poster_path)}
          alt={`${movie.title} poster`}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 glass-card px-2 py-1">
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground font-medium">{movie.vote_average.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
            {movie.runtime && (
              <>
                <span>•</span>
                <span>{movie.runtime}</span>
              </>
            )}
          </div>
        </div>

        {movie.director && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Dir: {movie.director}</span>
          </div>
        )}

        {movie.genres && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Genres: </span>
            <span>{movie.genres}</span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Overview */}
        {movie.overview && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {movie.overview}
          </p>
        )}

        {/* Watch Button */}
        <Button
          asChild
          className="w-full professional-button hover:scale-105 transition-all duration-300"
          variant="default"
        >
          <Link
            to={`/watch/${movie.id}`}
            className="flex items-center gap-2"
          >
            <span>🔗 Watch Now</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};