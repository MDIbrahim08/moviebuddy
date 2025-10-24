-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store movie embeddings
CREATE TABLE IF NOT EXISTS public.movie_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS movie_embeddings_embedding_idx 
ON public.movie_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Table to store user preferences and interaction history
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  movie_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'watched', 'search')),
  genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_preferences_created_at_idx ON public.user_preferences(created_at DESC);

-- Function to search similar movies using vector similarity
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

-- Function to get personalized recommendations based on user history
CREATE OR REPLACE FUNCTION get_personalized_movies(
  p_user_id TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  genres TEXT[],
  interaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(up.genres) as genre,
    COUNT(*) as interaction_count
  FROM user_preferences up
  WHERE up.user_id = p_user_id
    AND up.interaction_type IN ('like', 'watched')
    AND up.created_at > NOW() - INTERVAL '30 days'
  GROUP BY unnest(up.genres)
  ORDER BY interaction_count DESC
  LIMIT p_limit;
END;
$$;