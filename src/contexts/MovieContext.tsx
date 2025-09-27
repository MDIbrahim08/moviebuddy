import React, { createContext, useContext, useEffect, useState } from 'react';
import { Movie } from '@/types/movie';
import { parseMovieData } from '@/utils/movieUtils';

interface MovieContextType {
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const movieData = await parseMovieData();
        setMovies(movieData);
        setError(null);
      } catch (err) {
        setError('Failed to load movie data');
        console.error('Error loading movies:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  return (
    <MovieContext.Provider value={{ movies, loading, error }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};