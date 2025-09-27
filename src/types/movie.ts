export interface Movie {
  id: string;
  title: string;
  director: string;
  cast: string;
  genres: string;
  imdb_id: string;
  original_language: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  runtime: string;
  vote_average: number;
  vote_count: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  movies?: Movie[];
  timestamp: Date;
}

export type MoodType = 'bored' | 'sad' | 'excited' | 'romantic' | 'adventure' | 'family';

export interface SearchFilters {
  genre?: string;
  language?: string;
  year?: string;
  decade?: string;
  director?: string;
  actor?: string;
  mood?: MoodType;
}