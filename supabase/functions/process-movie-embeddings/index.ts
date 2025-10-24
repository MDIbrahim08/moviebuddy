import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to chunk movie data
function chunkMovieData(movie: any): string {
  // Create a comprehensive text representation of the movie
  const chunks = [
    `Title: ${movie.title}`,
    `Director: ${movie.director}`,
    `Cast: ${movie.cast}`,
    `Genres: ${movie.genres}`,
    `Overview: ${movie.overview}`,
    `Release Date: ${movie.release_date}`,
    `Language: ${movie.original_language}`,
    `Rating: ${movie.vote_average}/10`,
  ];
  
  return chunks.join(". ");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { movies } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing ${movies.length} movies for embeddings`);

    // Process movies in batches
    const batchSize = 10;
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      for (const movie of batch) {
        // Create chunked content
        const content = chunkMovieData(movie);
        
        // Generate embedding
        const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: content,
          }),
        });

        if (!embeddingResponse.ok) {
          console.error(`Failed to generate embedding for ${movie.title}`);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store in database
        const { error } = await supabase
          .from('movie_embeddings')
          .upsert({
            movie_id: movie.id,
            title: movie.title,
            content: content,
            embedding: embedding,
            metadata: {
              director: movie.director,
              genres: movie.genres,
              release_date: movie.release_date,
              vote_average: movie.vote_average,
              poster_path: movie.poster_path,
            }
          }, {
            onConflict: 'movie_id'
          });

        if (error) {
          console.error(`Error storing embedding for ${movie.title}:`, error);
        } else {
          console.log(`Successfully processed ${movie.title}`);
        }
      }
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: movies.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-movie-embeddings function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});