import Papa from 'papaparse';
import { Movie, MoodType, SearchFilters } from '@/types/movie';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const parseMovieData = async (): Promise<Movie[]> => {
  try {
    const response = await fetch('/movies.csv');
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const movies = results.data.map((row: any) => ({
            id: row.id || Math.random().toString(),
            title: row.Title || row.title || '',
            director: row.Director || '',
            cast: row.Cast || '',
            genres: row.genres || '',
            imdb_id: row.imdb_id || '',
            original_language: row.original_language || '',
            overview: row.overview || '',
            popularity: parseFloat(row.popularity) || 0,
            poster_path: row.poster_path || '',
            release_date: row.release_date || '',
            runtime: row.runtime || '',
            vote_average: parseFloat(row.vote_average) || 0,
            vote_count: parseInt(row.vote_count) || 0,
          })).filter(movie => movie.title);
          resolve(movies);
        }
      });
    });
  } catch (error) {
    console.error('Error parsing movie data:', error);
    return [];
  }
};

export const getFullPosterUrl = (posterPath: string): string => {
  if (!posterPath) return '/placeholder.svg';
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

export const getWatchUrl = (movie: Movie): string => {
  return `https://www.google.com/search?q=Watch+${encodeURIComponent(movie.title)}+${movie.release_date.split('-')[0]}`;
};

export const getMoodBasedGenres = (mood: MoodType): string[] => {
  const moodMap: Record<MoodType, string[]> = {
    bored: ['Comedy', 'Action', 'Adventure'],
    sad: ['Drama', 'Romance', 'Family'],
    excited: ['Action', 'Adventure', 'Thriller'],
    romantic: ['Romance', 'Drama'],
    adventure: ['Adventure', 'Action', 'Thriller'],
    family: ['Family', 'Comedy', 'Animation']
  };
  return moodMap[mood] || [];
};

export const searchMovies = (movies: Movie[], query: string, filters?: SearchFilters): Movie[] => {
  let filteredMovies = [...movies];

  // Text search
  if (query.trim()) {
    const searchLower = query.toLowerCase();
    filteredMovies = filteredMovies.filter(movie =>
      movie.title.toLowerCase().includes(searchLower) ||
      movie.director.toLowerCase().includes(searchLower) ||
      movie.cast.toLowerCase().includes(searchLower) ||
      movie.genres.toLowerCase().includes(searchLower) ||
      movie.overview.toLowerCase().includes(searchLower)
    );
  }

  // Apply filters
  if (filters) {
    if (filters.genre) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.genres.toLowerCase().includes(filters.genre!.toLowerCase())
      );
    }

    if (filters.language) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.original_language.toLowerCase() === filters.language!.toLowerCase()
      );
    }

    if (filters.director) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.director.toLowerCase().includes(filters.director!.toLowerCase())
      );
    }

    if (filters.actor) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.cast.toLowerCase().includes(filters.actor!.toLowerCase())
      );
    }

    if (filters.year) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.release_date.startsWith(filters.year!)
      );
    }

    if (filters.decade) {
      const startYear = parseInt(filters.decade!);
      const endYear = startYear + 9;
      filteredMovies = filteredMovies.filter(movie => {
        const movieYear = parseInt(movie.release_date.split('-')[0]);
        return movieYear >= startYear && movieYear <= endYear;
      });
    }

    if (filters.mood) {
      const moodGenres = getMoodBasedGenres(filters.mood);
      filteredMovies = filteredMovies.filter(movie =>
        moodGenres.some(genre => movie.genres.toLowerCase().includes(genre.toLowerCase()))
      );
    }
  }

  return filteredMovies.sort((a, b) => b.popularity - a.popularity);
};

export const getRandomMovie = (movies: Movie[]): Movie | null => {
  if (movies.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
};

export const getMoviesByDecade = (movies: Movie[], decade: string): Movie[] => {
  return searchMovies(movies, '', { decade });
};

export const getTags = (movie: Movie): string[] => {
  const tags: string[] = [];
  
  if (movie.vote_average >= 8.0) tags.push('Highly Rated');
  if (movie.vote_average >= 7.5) tags.push('Critic Choice');
  if (movie.popularity > 10) tags.push('Popular');
  if (movie.genres.toLowerCase().includes('family')) tags.push('Family Favorite');
  if (movie.original_language === 'hi') tags.push('Bollywood');
  if (movie.original_language === 'en') tags.push('Hollywood');
  if (movie.original_language === 'ta') tags.push('Tamil Cinema');
  if (movie.original_language === 'te') tags.push('Telugu Cinema');
  
  const year = parseInt(movie.release_date.split('-')[0]);
  if (year >= 2020) tags.push('Recent Release');
  if (year < 2000) tags.push('Classic');
  
  return tags.slice(0, 3); // Limit to 3 tags
};