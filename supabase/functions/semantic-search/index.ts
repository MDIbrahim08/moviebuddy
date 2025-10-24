import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Semantic search for query:", query);

    // Generate embedding for the query
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate query embedding");
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Get personalized preferences if user ID provided
    let preferredGenres: string[] = [];
    if (userId) {
      const { data: preferences } = await supabase
        .rpc('get_personalized_movies', { p_user_id: userId, p_limit: 5 });
      
      if (preferences && preferences.length > 0) {
        preferredGenres = preferences.map((p: any) => p.genre);
        console.log("User preferred genres:", preferredGenres);
      }
    }

    // Search for similar movies using vector similarity
    const { data: matches, error } = await supabase
      .rpc('match_movies', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10
      });

    if (error) {
      console.error("Error matching movies:", error);
      throw error;
    }

    console.log(`Found ${matches?.length || 0} similar movies`);

    // Track search in user preferences
    if (userId && matches && matches.length > 0) {
      const topMatch = matches[0];
      const genres = topMatch.metadata?.genres?.split(', ') || [];
      
      await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          movie_id: topMatch.movie_id,
          interaction_type: 'search',
          genres: genres
        });
    }

    return new Response(
      JSON.stringify({ 
        movies: matches,
        preferredGenres: preferredGenres 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in semantic-search function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});