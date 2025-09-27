import { ChatMessage as ChatMessageType } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 mb-6 animate-slide-up ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center neon-glow animate-pulse-glow">
            <Bot className="h-4 w-4 text-white animate-float" />
          </div>
        </div>
      )}
      
      <div className={`max-w-4xl ${message.type === 'user' ? 'order-1' : ''}`}>
        <div className={`glass-card p-4 futuristic-border ${message.type === 'user' ? 'bg-primary/20 neon-glow' : 'glass-hover'}`}>
          <p className="text-foreground whitespace-pre-wrap text-glow">{message.content}</p>
        </div>
        
        {message.movies && message.movies.length > 0 && (
          <div className="mt-4">
            {message.movies.length === 1 ? (
              <div className="flex justify-center">
                <MovieCard movie={message.movies[0]} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {message.movies.map((movie, index) => (
                  <MovieCard key={`${movie.id}-${index}`} movie={movie} />
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {message.type === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center neon-glow">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};