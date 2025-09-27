import { useParams, Link } from 'react-router-dom';
import { useMovies } from '@/contexts/MovieContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StreamingPlatform } from '@/components/StreamingPlatform';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { getFullPosterUrl } from '@/utils/movieUtils';

const WatchSuggestions = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { movies } = useMovies();
  
  const movie = movies.find(m => m.id.toString() === movieId);

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-4">Movie Not Found</h2>
          <p className="text-muted-foreground mb-6">The movie you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to MovieBot
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const streamingPlatforms = [
    {
      name: 'Netflix',
      icon: '🎬',
      searchUrl: `https://www.netflix.com/search?q=${encodeURIComponent(movie.title)}`,
      color: 'bg-red-600'
    },
    {
      name: 'Amazon Prime',
      icon: '📺',
      searchUrl: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(movie.title)}`,
      color: 'bg-blue-600'
    },
    {
      name: 'Disney+',
      icon: '🏰',
      searchUrl: `https://www.disneyplus.com/search?q=${encodeURIComponent(movie.title)}`,
      color: 'bg-blue-500'
    },
    {
      name: 'Hulu',
      icon: '🌊',
      searchUrl: `https://www.hulu.com/search?q=${encodeURIComponent(movie.title)}`,
      color: 'bg-green-600'
    },
    {
      name: 'HBO Max',
      icon: '🎭',
      searchUrl: `https://www.max.com/search?q=${encodeURIComponent(movie.title)}`,
      color: 'bg-purple-600'
    },
    {
      name: 'YouTube Movies',
      icon: '📹',
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' full movie')}`,
      color: 'bg-red-500'
    },
    {
      name: 'Apple TV+',
      icon: '🍎',
      searchUrl: `https://tv.apple.com/search?term=${encodeURIComponent(movie.title)}`,
      color: 'bg-gray-800'
    },
    {
      name: 'Google Search',
      icon: '🔍',
      searchUrl: `https://www.google.com/search?q=watch+${encodeURIComponent(movie.title)}+online`,
      color: 'bg-blue-500'
    }
  ];

  const year = movie.release_date.split('-')[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card m-4 p-4">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="glass-hover">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to MovieBot
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Movie Info & Streaming Options */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Movie Poster */}
            <div className="flex-shrink-0">
              <img
                src={getFullPosterUrl(movie.poster_path)}
                alt={`${movie.title} poster`}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Movie Details */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{movie.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{year}</p>
              
              {movie.director && (
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium">Director:</span> {movie.director}
                </p>
              )}
              
              {movie.genres && (
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium">Genres:</span> {movie.genres}
                </p>
              )}
              
              {movie.runtime && (
                <p className="text-muted-foreground mb-4">
                  <span className="font-medium">Runtime:</span> {movie.runtime}
                </p>
              )}

              {movie.overview && (
                <p className="text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Streaming Platforms */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Where to Watch</h2>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Click on any platform below to search for "{movie.title}" on that service:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {streamingPlatforms.map((platform, index) => (
              <StreamingPlatform
                key={index}
                platform={platform}
              />
            ))}
          </div>

          <div className="mt-6 p-4 glass-subtle rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Availability may vary by region. Some platforms may require a subscription or rental fee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchSuggestions;