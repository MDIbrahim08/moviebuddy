import { useState } from 'react';
import { useMovies } from '@/contexts/MovieContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processMovieEmbeddings } from '@/utils/embeddingUtils';
import { Sparkles, Database } from 'lucide-react';

export default function ProcessEmbeddings() {
  const { movies } = useMovies();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProcessEmbeddings = async () => {
    if (movies.length === 0) {
      toast({
        title: "No Movies Found",
        description: "Please wait for movies to load first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Process in batches to avoid overwhelming the API
      const batchSize = 50;
      const totalBatches = Math.ceil(movies.length / batchSize);

      for (let i = 0; i < movies.length; i += batchSize) {
        const batch = movies.slice(i, i + batchSize);
        await processMovieEmbeddings(batch);
        
        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress((currentBatch / totalBatches) * 100);
        
        toast({
          title: `Batch ${currentBatch}/${totalBatches} Completed`,
          description: `Processed ${Math.min(i + batchSize, movies.length)} of ${movies.length} movies`,
        });
      }

      toast({
        title: "Success! 🎉",
        description: `All ${movies.length} movies have been processed and stored in the vector database.`,
      });
    } catch (error) {
      console.error('Error processing embeddings:', error);
      toast({
        title: "Error",
        description: "Failed to process embeddings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Database className="h-16 w-16 text-primary" />
              <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            Process Movie Embeddings
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Generate AI embeddings for semantic search and personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg space-y-3">
            <h3 className="font-semibold text-lg">What is this?</h3>
            <p className="text-sm text-muted-foreground">
              This process converts all movies into AI embeddings (numerical representations) 
              that enable:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Semantic Search:</strong> Find movies by meaning, not just keywords</li>
              <li><strong>Smart Chunking:</strong> Break down movie data into meaningful pieces</li>
              <li><strong>Vector Database:</strong> Store embeddings for lightning-fast similarity search</li>
              <li><strong>Personalization:</strong> Track your preferences for better recommendations</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Total Movies:</span>
              <span className="font-bold">{movies.length}</span>
            </div>
            
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processing... {Math.round(progress)}%
                </p>
              </div>
            )}

            <Button
              onClick={handleProcessEmbeddings}
              disabled={isProcessing || movies.length === 0}
              className="w-full professional-button"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Processing Embeddings...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-5 w-5" />
                  Start Processing
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">
            ⚠️ This process may take several minutes. Please don't close this page.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}