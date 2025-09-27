import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  icon: string;
  searchUrl: string;
  color: string;
}

interface StreamingPlatformProps {
  platform: Platform;
}

export const StreamingPlatform = ({ platform }: StreamingPlatformProps) => {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto p-4 glass-hover hover:scale-105 transition-all duration-300"
    >
      <a
        href={platform.searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className={`w-12 h-12 rounded-full ${platform.color} flex items-center justify-center text-white text-xl shadow-lg`}>
          {platform.icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{platform.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <span>Search here</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </a>
    </Button>
  );
};