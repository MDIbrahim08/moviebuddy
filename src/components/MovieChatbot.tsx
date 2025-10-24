import React, { useState, useRef, useEffect } from 'react';
import { Movie, ChatMessage as ChatMessageType, MoodType } from '@/types/movie';
import { useMovies } from '@/contexts/MovieContext';
import { useChat } from '@/contexts/ChatContext';
import { searchMovies, getRandomMovie, getMoodBasedGenres, getMoviesByDecade, getRecommendations } from '@/utils/movieUtils';
import { ChatMessage } from './ChatMessage';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Dice6, Sparkles, Heart, Zap, Baby, Trash2, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { semanticSearch, trackMovieInteraction, getUserPreferredGenres } from '@/utils/embeddingUtils';

export const MovieChatbot = () => {
  const { movies, loading } = useMovies();
  const { messages, setMessages, addMessage, clearMessages, searchHistory, addToSearchHistory } = useChat();
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
    if (!loading && movies.length > 0 && messages.length === 0) {
      // Welcome message - only show if no messages exist
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        type: 'bot',
      content: "🤖 Welcome to MovieBot! I'm your AI movie assistant with an extensive collection of amazing films.\n\nI can help you with:\n📽️ Movie Discovery:\n• Mood (\"I'm feeling romantic\")\n• Genre, Director, or Actor\n• Year or Decade (\"2000s blockbusters\")\n• Language (Hindi, Tamil, Telugu, English)\n\n❓ Movie Questions:\n• \"Who directed Inception?\"\n• \"Who are the actors in Avengers?\"\n• \"What genre is Titanic?\"\n• \"When was Avatar released?\"\n• \"What is Interstellar about?\"\n• \"What's the rating of The Dark Knight?\"\n\n🎬 Plot Suggestions:\n• \"Suggest plot ideas for sci-fi\"\n• \"Give me thriller storylines\"\n\n🎲 Special Features:\n• \"Surprise me!\" for random picks\n• Ask me anything about movies!\n\nWhat would you like to know about movies today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [loading, movies, messages.length, setMessages]);

  const processUserMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsProcessing(true);

    try {
      const response = await generateBotResponse(userInput);
      addMessage(response);
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

    // Try semantic search first for better, personalized results
    if (!input.includes('plot') && !input.includes('director') && 
        !input.includes('cast') && !input.includes('genre of') && 
        !input.includes('when was') && !input.includes('what is') && 
        !input.includes('rating of') && !input.includes('surprise')) {
      try {
        console.log('Attempting semantic search with embeddings...');
        const semanticResults = await semanticSearch(userInput);
        
        if (semanticResults.length > 0) {
          // Get user's preferred genres for personalization
          const preferredGenres = await getUserPreferredGenres();
          
          let personalizedText = '';
          if (preferredGenres.length > 0) {
            personalizedText = `🎯 Personalized for you! I noticed you like ${preferredGenres.slice(0, 3).join(', ')}.\n\n`;
          }
          
          responseText = personalizedText + `🔍 Found ${semanticResults.length} movies that match your search perfectly:`;
          responseMovies = semanticResults.slice(0, 6);
          
          // Track the interaction
          if (semanticResults[0]) {
            const genres = semanticResults[0].genres.split(', ');
            await trackMovieInteraction(semanticResults[0].id, 'search', genres);
          }

          return {
            id: Date.now().toString(),
            type: 'bot',
            content: responseText,
            movies: responseMovies,
            timestamp: new Date(),
          };
        }
      } catch (error) {
        console.log('Semantic search not available, falling back to keyword search:', error);
      }
    }

    // Check if user is asking for plot suggestions
    if (input.includes('plot') && (input.includes('suggest') || input.includes('idea') || input.includes('storyline'))) {
      try {
        const { data, error } = await supabase.functions.invoke('movie-chat', {
          body: { 
            userMessage: userInput,
            requestType: 'plot-suggestion'
          }
        });

        if (error) throw error;
        
        responseText = data.message || "I'd be happy to suggest some plot ideas! Could you specify a genre or theme?";
      } catch (error) {
        console.error('Error getting plot suggestions:', error);
        responseText = "I'm having trouble generating plot suggestions right now. Please try again!";
      }

      return {
        id: Date.now().toString(),
        type: 'bot',
        content: responseText,
        timestamp: new Date(),
      };
    }

    // Question-based queries about specific movies
    if (input.includes('who is the director') || input.includes('who directed') || input.includes('director of')) {
      // Extract movie name from question
      const movieMatch = input.match(/(?:who (?:is the )?director|who directed|director) (?:of )?(?:the )?(.+?)(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          responseText = `🎬 "${movie.title}" was directed by ${movie.director}.`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie or browse my collection!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know the director of. For example: 'Who directed Inception?'";
      }
    }
    else if (input.includes('who are the actors') || input.includes('who stars') || input.includes('cast of') || input.includes('actors in')) {
      const movieMatch = input.match(/(?:who (?:are the )?(?:actors|stars)|cast|actors) (?:of |in )?(?:the )?(.+?)(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          responseText = `⭐ The cast of "${movie.title}" includes: ${movie.cast}`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know the cast of. For example: 'Who are the actors in Avengers?'";
      }
    }
    else if (input.includes('what genre') || input.includes('genre of') || input.includes('what type of movie')) {
      const movieMatch = input.match(/(?:what (?:genre|type)|genre) (?:of |is )?(?:the )?(.+?)(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          responseText = `🎭 "${movie.title}" is a ${movie.genres} movie.`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know the genre of. For example: 'What genre is Inception?'";
      }
    }
    else if (input.includes('when was') && (input.includes('released') || input.includes('made'))) {
      const movieMatch = input.match(/when was (?:the )?(.+?) (?:released|made)(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          const year = new Date(movie.release_date).getFullYear();
          responseText = `📅 "${movie.title}" was released in ${year}.`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know the release date of. For example: 'When was Titanic released?'";
      }
    }
    else if (input.includes('what is') && (input.includes('about') || input.includes('plot') || input.includes('story'))) {
      const movieMatch = input.match(/what is (?:the )?(.+?) about(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          responseText = `📖 "${movie.title}" is about: ${movie.overview}`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know about. For example: 'What is Inception about?'";
      }
    }
    else if (input.includes('rating of') || input.includes('how good is') || input.includes('movie rating')) {
      const movieMatch = input.match(/(?:rating of|how good is) (?:the )?(.+?)(?:\?|$)/);
      if (movieMatch && movieMatch[1]) {
        const movieName = movieMatch[1].trim();
        const foundMovies = searchMovies(movies, movieName);
        if (foundMovies.length > 0) {
          const movie = foundMovies[0];
          responseMovies = [movie];
          responseText = `⭐ "${movie.title}" has a rating of ${movie.vote_average}/10 based on ${movie.vote_count} votes.`;
        } else {
          responseText = `Sorry, I couldn't find a movie called "${movieName}" in my database. Try asking about a different movie!`;
        }
      } else {
        responseText = "Please specify which movie you'd like to know the rating of. For example: 'What's the rating of Inception?'";
      }
    }
    // Surprise me feature
    else if (input.includes('surprise me') || input.includes('random')) {
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
    else if (input.includes('2000s') || input.includes('2000') || input.includes('early 2000s')) {
      responseMovies = getMoviesByDecade(movies, '2000').slice(0, 8);
      responseText = "🎬 The 2000s brought us some incredible cinema! Check these out:";
    }
    else if (input.includes('2010s') || input.includes('2010') || input.includes('twenty tens')) {
      responseMovies = getMoviesByDecade(movies, '2010').slice(0, 8);
      responseText = "⭐ The 2010s decade of digital revolution in cinema:";
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
        addToSearchHistory(userInput);
        responseText = `🔍 Found ${responseMovies.length} movie(s) matching "${userInput}":`;
        
        // Add recommendations based on search
        const recommendations = getRecommendations(movies, [userInput, ...searchHistory]);
        if (recommendations.length > 0) {
          const recommendationText = `\n\n💡 You might also like these based on your search:`;
          const combinedMovies = [...responseMovies, ...recommendations.slice(0, 4)];
          responseMovies = Array.from(new Map(combinedMovies.map(m => [m.id, m])).values()).slice(0, 10);
          responseText += recommendationText;
        }
      } else {
        // If no movies found in local database, try AI assistant
        try {
          const conversationHistory = messages
            .slice(-4)
            .map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }));

          const { data, error } = await supabase.functions.invoke('movie-chat', {
            body: { 
              userMessage: userInput,
              conversationHistory,
              requestType: 'general'
            }
          });

          if (error) throw error;
          
          responseText = data.message || `Sorry, I couldn't find any movies matching "${userInput}". Try searching by genre, mood, language, or decade!`;
        } catch (error) {
          console.error('Error getting AI response:', error);
          responseText = `Sorry, I couldn't find any movies matching "${userInput}". Try searching by genre, mood, language, or decade!`;
        }
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
  ];

  const clearChat = () => {
    clearMessages();
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'bot',
      content: "🤖 Welcome to MovieBot! I'm your AI movie assistant with an extensive collection of amazing films.\n\nI can help you with:\n📽️ Movie Discovery:\n• Mood (\"I'm feeling romantic\")\n• Genre, Director, or Actor\n• Year or Decade (\"2000s blockbusters\")\n• Language (Hindi, Tamil, Telugu, English)\n\n❓ Movie Questions:\n• \"Who directed Inception?\"\n• \"Who are the actors in Avengers?\"\n• \"What genre is Titanic?\"\n• \"When was Avatar released?\"\n• \"What is Interstellar about?\"\n• \"What's the rating of The Dark Knight?\"\n\n🎬 Plot Suggestions:\n• \"Suggest plot ideas for sci-fi\"\n• \"Give me thriller storylines\"\n\n🎲 Special Features:\n• \"Surprise me!\" for random picks\n• Ask me anything about movies!\n\nWhat would you like to know about movies today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading MovieBot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card m-4 p-4 mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MovieBot</h1>
              <p className="text-sm text-muted-foreground">Your AI Movie Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="glass-hover text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
              title="Clear all messages"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1 professional-button"
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
                placeholder="Ask MovieBot anything... (e.g., 'Who directed Inception?', 'romantic movies', 'surprise me')"
                className="flex-1 bg-input"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="professional-button"
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