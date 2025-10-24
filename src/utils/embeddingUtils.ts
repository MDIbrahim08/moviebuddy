import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";

// Generate a unique user ID for tracking preferences (stored in localStorage)
export const getUserId = (): string => {
  let userId = localStorage.getItem('moviebuddy_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('moviebuddy_user_id', userId);
  }
  return userId;
};

// Track user interaction with a movie
export const trackMovieInteraction = async (
  movieId: string,
  interactionType: 'like' | 'dislike' | 'watched' | 'search',
  genres: string[]
) => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        movie_id: movieId,
        interaction_type: interactionType,
        genres: genres
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
};

// Get user's preferred genres
export const getUserPreferredGenres = async (): Promise<string[]> => {
  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .rpc('get_personalized_movies', { 
        p_user_id: userId, 
        p_limit: 5 
      });

    if (error) throw error;
    return data?.map((item: any) => item.genre) || [];
  } catch (error) {
    console.error('Error getting preferred genres:', error);
    return [];
  }
};

// Perform semantic search using embeddings
export const semanticSearch = async (query: string): Promise<Movie[]> => {
  const userId = getUserId();
  
  try {
    const { data, error } = await supabase.functions.invoke('semantic-search', {
      body: { query, userId }
    });

    if (error) throw error;

    // Convert the results to Movie objects
    const movies: Movie[] = data.movies?.map((match: any) => ({
      id: match.movie_id,
      title: match.metadata?.title || match.title,
      director: match.metadata?.director || '',
      cast: '',
      genres: match.metadata?.genres || '',
      imdb_id: '',
      original_language: '',
      overview: match.content,
      popularity: 0,
      poster_path: match.metadata?.poster_path || '',
      release_date: match.metadata?.release_date || '',
      runtime: '',
      vote_average: match.metadata?.vote_average || 0,
      vote_count: 0,
    })) || [];

    return movies;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return [];
  }
};

// Process and store embeddings for movies (admin function)
export const processMovieEmbeddings = async (movies: Movie[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('process-movie-embeddings', {
      body: { movies }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error processing embeddings:', error);
    throw error;
  }
};