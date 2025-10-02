import { ChatMessage as ChatMessageType } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 mb-6 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={`w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl ${message.type === 'user' ? 'order-1' : ''}`}>
        <div className={`glass-card p-3 sm:p-4 ${message.type === 'user' ? 'bg-primary/10' : ''}`}>
          <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
        </div>
        
        {message.movies && message.movies.length > 0 && (
          <div className="mt-3 sm:mt-4 w-full overflow-x-hidden">
            {message.movies.length === 1 ? (
              <div className="flex justify-center w-full">
                <MovieCard movie={message.movies[0]} className="w-full sm:w-auto" />
              </div>
            ) : (
              <>
                <div className="sm:hidden w-full overflow-x-auto -mx-1 px-1">
                  <div className="flex gap-3 w-full snap-x snap-mandatory">
                    {message.movies.map((movie, index) => (
                      <MovieCard key={`${movie.id}-${index}`} movie={movie} className="min-w-[85%] snap-center" />
                    ))}
                  </div>
                </div>
                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
                  {message.movies.map((movie, index) => (
                    <MovieCard key={`${movie.id}-${index}`} movie={movie} className="w-full" />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2">
          {(() => {
            const d = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp as any);
            return isNaN(d.getTime()) ? null : d.toLocaleTimeString();
          })()}
        </div>
      </div>

      {message.type === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};