-- Fix security issues

-- Drop and recreate functions with proper search_path
DROP FUNCTION IF EXISTS match_movies(vector, float, int);
DROP FUNCTION IF EXISTS get_personalized_movies(TEXT, INT);

-- Recreate match_movies with search_path set
CREATE OR REPLACE FUNCTION match_movies(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  movie_id TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    movie_embeddings.movie_id,
    movie_embeddings.title,
    movie_embeddings.content,
    movie_embeddings.metadata,
    1 - (movie_embeddings.embedding <=> query_embedding) as similarity
  FROM movie_embeddings
  WHERE 1 - (movie_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY movie_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Recreate get_personalized_movies with search_path set
CREATE OR REPLACE FUNCTION get_personalized_movies(
  p_user_id TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  genre TEXT,
  interaction_count BIGINT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(up.genres) as genre_item,
    COUNT(*) as count_item
  FROM user_preferences up
  WHERE up.user_id = p_user_id
    AND up.interaction_type IN ('like', 'watched')
    AND up.created_at > NOW() - INTERVAL '30 days'
  GROUP BY genre_item
  ORDER BY count_item DESC
  LIMIT p_limit;
END;
$$;

-- Enable RLS on tables
ALTER TABLE public.movie_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for movie_embeddings (public read access)
CREATE POLICY "Anyone can read movie embeddings"
  ON public.movie_embeddings
  FOR SELECT
  USING (true);

-- Policies for user_preferences (users can only access their own data)
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  USING (true);