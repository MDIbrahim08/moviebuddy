import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Film } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="mb-6">
          <Film className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <p className="text-xl text-muted-foreground">This page seems to be missing from our database!</p>
        </div>
        
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist. But don't worry, there are plenty of great movies to discover!
        </p>
        
        <Button asChild className="professional-button">
          <a href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to MovieBot
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
