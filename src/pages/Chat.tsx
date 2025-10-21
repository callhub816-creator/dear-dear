import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Smile, Heart, Sparkles, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  behavior: string;
  image_url: string;
  json_path: string;
}

interface Message {
  id: string;
  sender: "user" | "character";
  message: string;
  created_at: string;
}

interface PersonalityData {
  greetings: string[];
  casual: string[];
  compliments: string[];
  love_responses: string[];
  idle_messages: string[];
  goodbye: string[];
}

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [personalityData, setPersonalityData] = useState<PersonalityData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initChat();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [messages]);

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to chat");
      navigate("/auth");
      return;
    }

    setUserId(user.id);

    if (!id) return;

    // Fetch character
    const { data: charData, error: charError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single();

    if (charError || !charData) {
      toast.error("Failed to load character");
      navigate("/");
      return;
    }

    setCharacter(charData);

    // Load personality data
    const response = await fetch(charData.json_path);
    const data = await response.json();
    setPersonalityData(data);

    // Load chat history
    const { data: history } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("character_id", id)
      .order("created_at");

    if (history && history.length > 0) {
      setMessages(history as Message[]);
    } else {
      // Send greeting
      sendCharacterMessage(getRandomItem(data.greetings));
    }
  };

  const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const getRandomDelay = () => Math.random() * (3800 - 1200) + 1200;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    idleTimerRef.current = setTimeout(() => {
      if (personalityData && character) {
        sendCharacterMessage(getRandomItem(personalityData.idle_messages));
      }
    }, 60000); // 60 seconds
  };

  const sendCharacterMessage = async (message: string) => {
    if (!userId || !id) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: "character",
      message,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Save to Supabase
    await supabase.from("chat_history").insert({
      user_id: userId,
      character_id: id,
      sender: "character",
      message,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || !id || !personalityData || !character) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      message: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message
    await supabase.from("chat_history").insert({
      user_id: userId,
      character_id: id,
      sender: "user",
      message: input,
    });

    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    const delay = getRandomDelay();
    
    setTimeout(async () => {
      // Simple keyword-based response selection
      const lowerInput = input.toLowerCase();
      let response: string;

      if (lowerInput.includes("love") || lowerInput.includes("adore")) {
        response = getRandomItem(personalityData.love_responses);
      } else if (lowerInput.includes("beautiful") || lowerInput.includes("amazing") || lowerInput.includes("great")) {
        response = getRandomItem(personalityData.compliments);
      } else if (lowerInput.includes("bye") || lowerInput.includes("goodbye")) {
        response = getRandomItem(personalityData.goodbye);
      } else {
        response = getRandomItem(personalityData.casual);
      }

      await sendCharacterMessage(response);
      setIsTyping(false);
    }, delay);
  };

  const handleReaction = (reaction: string) => {
    toast.success(`${character?.name} reacted with ${reaction}!`);
    // In a full implementation, this would trigger an avatar animation
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-card p-4 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
          <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{character.name}</h2>
          <p className="text-sm text-muted-foreground">{character.behavior}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] p-4 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "glass-card"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2">
              <span className="text-muted-foreground">{character.name} is typing</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reaction bar */}
      <div className="p-4 border-t flex justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => handleReaction("blush")}>
          <Smile className="w-5 h-5 text-sweet" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleReaction("heart")}>
          <Heart className="w-5 h-5 text-flirty" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleReaction("sparkle")}>
          <Sparkles className="w-5 h-5 text-caring" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleReaction("sad")}>
          <Frown className="w-5 h-5 text-shy" />
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Message ${character.name}...`}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim()} className="neon-glow">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;