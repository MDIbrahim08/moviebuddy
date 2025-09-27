import React, { useState, useRef, useEffect } from 'react';
import { Movie, ChatMessage as ChatMessageType, MoodType } from '@/types/movie';
import { useMovies } from '@/contexts/MovieContext';
import { searchMovies, getRandomMovie, getMoodBasedGenres, getMoviesByDecade } from '@/utils/movieUtils';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Dice6, Sparkles, Heart, Zap, Baby, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MovieChatbot = () => {
  const { movies, loading } = useMovies();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && movies.length > 0) {
      // Welcome message
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        type: 'bot',
        content: "🎬 Welcome to CinemaBot! I'm your personal movie assistant with a curated collection of amazing films.\n\nI can help you find movies by:\n• Mood (\"I'm feeling romantic\")\n• Genre, Director, or Actor\n• Year or Decade (\"90s Bollywood classics\")\n• Language (Hindi, Tamil, Telugu, English)\n• Special features like \"Surprise me!\" or trivia\n\nWhat kind of movie are you in the mood for today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [loading, movies]);

  const processUserMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await generateBotResponse(userInput);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Sorry, I encountered an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBotResponse = async (userInput: string): Promise<ChatMessageType> => {
    const input = userInput.toLowerCase();
    let responseMovies: Movie[] = [];
    let responseText = '';

    // Surprise me feature
    if (input.includes('surprise me') || input.includes('random')) {
      const randomMovie = getRandomMovie(movies);
      if (randomMovie) {
        responseMovies = [randomMovie];
        responseText = "🎲 Here's a surprise pick for you! This hidden gem might be exactly what you need:";
      } else {
        responseText = "Sorry, I couldn't find any movies to surprise you with.";
      }
    }
    // Mood-based recommendations
    else if (input.includes('bored')) {
      responseMovies = searchMovies(movies, '', { mood: 'bored' }).slice(0, 6);
      responseText = "😴 Feeling bored? Here are some entertaining picks to lift your spirits:";
    }
    else if (input.includes('sad') || input.includes('down') || input.includes('depressed')) {
      responseMovies = searchMovies(movies, '', { mood: 'sad' }).slice(0, 6);
      responseText = "💙 When you're feeling down, these uplifting movies can help:";
    }
    else if (input.includes('excited') || input.includes('pumped') || input.includes('energetic')) {
      responseMovies = searchMovies(movies, '', { mood: 'excited' }).slice(0, 6);
      responseText = "⚡ Ready for some high-energy entertainment? These will keep you on the edge of your seat:";
    }
    else if (input.includes('romantic') || input.includes('love') || input.includes('romance')) {
      responseMovies = searchMovies(movies, '', { mood: 'romantic' }).slice(0, 6);
      responseText = "💕 In the mood for romance? These beautiful love stories will warm your heart:";
    }
    else if (input.includes('family') || input.includes('kids')) {
      responseMovies = searchMovies(movies, '', { mood: 'family' }).slice(0, 6);
      responseText = "👨‍👩‍👧‍👦 Perfect for family movie night! These films are great for all ages:";
    }
    // Decade searches
    else if (input.includes('90s') || input.includes('1990s') || input.includes('nineties')) {
      responseMovies = getMoviesByDecade(movies, '1990').slice(0, 8);
      responseText = "📼 Ah, the golden 90s! Here are some classics from that amazing decade:";
    }
    else if (input.includes('2000s') || input.includes('2000') || input.includes('early 2000s')) {
      responseMovies = getMoviesByDecade(movies, '2000').slice(0, 8);
      responseText = "🎬 The 2000s brought us some incredible cinema! Check these out:";
    }
    else if (input.includes('80s') || input.includes('1980s') || input.includes('eighties')) {
      responseMovies = getMoviesByDecade(movies, '1980').slice(0, 8);
      responseText = "🕺 The iconic 80s! Here are some legendary films from that era:";
    }
    // Language filters
    else if (input.includes('bollywood') || input.includes('hindi')) {
      responseMovies = searchMovies(movies, '', { language: 'hi' }).slice(0, 8);
      responseText = "🇮🇳 Bollywood magic! Here are some fantastic Hindi films:";
    }
    else if (input.includes('hollywood') || input.includes('english')) {
      responseMovies = searchMovies(movies, '', { language: 'en' }).slice(0, 8);
      responseText = "🎭 Hollywood blockbusters! Here are some great English films:";
    }
    else if (input.includes('tamil')) {
      responseMovies = searchMovies(movies, '', { language: 'ta' }).slice(0, 8);
      responseText = "🌟 Tamil cinema excellence! Here are some brilliant Tamil films:";
    }
    else if (input.includes('telugu')) {
      responseMovies = searchMovies(movies, '', { language: 'te' }).slice(0, 8);
      responseText = "⭐ Telugu movie magic! Here are some amazing Telugu films:";
    }
    // Genre searches
    else if (input.includes('action')) {
      responseMovies = searchMovies(movies, '', { genre: 'action' }).slice(0, 6);
      responseText = "💥 Action-packed adventures coming right up:";
    }
    else if (input.includes('comedy')) {
      responseMovies = searchMovies(movies, '', { genre: 'comedy' }).slice(0, 6);
      responseText = "😂 Time for some laughs! These comedies will brighten your day:";
    }
    else if (input.includes('drama')) {
      responseMovies = searchMovies(movies, '', { genre: 'drama' }).slice(0, 6);
      responseText = "🎭 Powerful dramas that will move you:";
    }
    else if (input.includes('thriller')) {
      responseMovies = searchMovies(movies, '', { genre: 'thriller' }).slice(0, 6);
      responseText = "🔥 Edge-of-your-seat thrillers:";
    }
    // General search
    else {
      responseMovies = searchMovies(movies, userInput).slice(0, 8);
      if (responseMovies.length > 0) {
        responseText = `🔍 Found ${responseMovies.length} movie(s) matching "${userInput}":`;
      } else {
        responseText = `Sorry, I couldn't find any movies matching "${userInput}". Try searching by genre, mood, language, or decade!`;
      }
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: responseText,
      movies: responseMovies,
      timestamp: new Date(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processUserMessage(inputValue);
    setInputValue('');
  };

  const quickActions = [
    { label: 'Surprise Me', icon: Dice6, action: () => processUserMessage('surprise me') },
    { label: 'Romantic', icon: Heart, action: () => processUserMessage('romantic movies') },
    { label: 'Action', icon: Zap, action: () => processUserMessage('action movies') },
    { label: 'Comedy', icon: Sparkles, action: () => processUserMessage('comedy movies') },
    { label: 'Family', icon: Baby, action: () => processUserMessage('family movies') },
    { label: '90s Classics', icon: Clock, action: () => processUserMessage('90s classics') },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading movie database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card m-4 p-4 mb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center netflix-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CinemaBot</h1>
            <p className="text-sm text-muted-foreground">Your AI Movie Companion</p>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="mx-4 mb-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-3">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
                onClick={action.action}
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isProcessing && (
            <div className="flex justify-start mb-6">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Searching movies...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="glass-card p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about movies... (e.g., 'romantic movies', 'surprise me', '90s Bollywood')"
                className="flex-1 bg-input"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="netflix-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};