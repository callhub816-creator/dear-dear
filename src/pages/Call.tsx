import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  behavior: string;
  image_url: string;
  json_path: string;
}

interface PersonalityData {
  greetings: string[];
  casual: string[];
}

const Call = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [personalityData, setPersonalityData] = useState<PersonalityData | null>(null);
  const subtitleTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initCall();
    return () => {
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    };
  }, [id]);

  const initCall = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to call");
      navigate("/auth");
      return;
    }

    if (!id) return;

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

    // Start with greeting
    simulateSpeech(getRandomItem(data.greetings));
  };

  const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const simulateSpeech = (text: string) => {
    setIsSpeaking(true);
    setSubtitle(text);

    // Calculate duration based on text length (slower for call simulation)
    const duration = Math.max(3000, text.length * 80);

    subtitleTimerRef.current = setTimeout(() => {
      setIsSpeaking(false);
      
      // Queue next message after a pause
      setTimeout(() => {
        if (personalityData) {
          simulateSpeech(getRandomItem(personalityData.casual));
        }
      }, 2000);
    }, duration);
  };

  const handleEndCall = () => {
    if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    toast.success("Call ended");
    navigate(`/profile/${id}`);
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <div className="animate-pulse text-2xl">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/5 p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Character avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={`w-64 h-64 rounded-full overflow-hidden border-4 border-primary ${isSpeaking ? 'pulse-border' : ''}`}>
              <img
                src={character.image_url}
                alt={character.name}
                className={`w-full h-full object-cover ${isSpeaking ? 'breathe-animation' : ''}`}
              />
            </div>
            
            {/* Mouth animation overlay (simple) */}
            {isSpeaking && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-6 bg-primary/20 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <h2 className="text-3xl font-bold">{character.name}</h2>
          <p className="text-muted-foreground">{character.behavior}</p>
        </div>

        {/* Equalizer visualization */}
        {isSpeaking && (
          <div className="flex justify-center gap-2 h-20 items-end">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-3 bg-primary rounded-t-full animate-pulse"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.6s"
                }}
              />
            ))}
          </div>
        )}

        {/* Subtitles */}
        <div className="glass-card p-6 min-h-[100px] flex items-center justify-center">
          <p className="text-lg text-center transition-opacity duration-300">
            {subtitle}
          </p>
        </div>

        {/* End call button */}
        <div className="flex justify-center">
          <Button
            onClick={handleEndCall}
            size="lg"
            className="gap-2 bg-destructive hover:bg-destructive/90 neon-glow"
          >
            <PhoneOff className="w-5 h-5" />
            End Call
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
        Simulated call experience. No real audio capture.
      </footer>
    </div>
  );
};

export default Call;