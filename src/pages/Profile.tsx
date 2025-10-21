import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  behavior: string;
  age_restricted: boolean;
  image_url: string;
  personality_summary: string;
  age: number;
  quote: string;
}

const behaviorColors: Record<string, string> = {
  Flirty: "330 80% 65%",
  Sweet: "340 100% 85%",
  Rude: "30 80% 60%",
  Caring: "160 60% 70%",
  Shy: "280 60% 85%",
  Bold: "345 70% 55%",
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCharacter(id);
    }
  }, [id]);

  const fetchCharacter = async (characterId: string) => {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (error) {
      toast.error("Failed to load character");
      console.error(error);
      navigate("/");
      return;
    }

    setCharacter(data);
    setLoading(false);
  };

  if (loading || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  const glowColor = behaviorColors[character.behavior];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, hsl(${glowColor}), transparent 70%)`
        }}
      />

      {/* Back button */}
      <div className="relative z-10 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="glass-card p-12 space-y-8">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="w-64 h-64 rounded-full overflow-hidden border-4 pulse-border"
                style={{ borderColor: `hsl(${glowColor})` }}
              >
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="w-full h-full object-cover float-animation"
                />
              </div>
            </div>
          </div>

          {/* Character info */}
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-5xl font-bold mb-2">{character.name}</h1>
              <div 
                className="inline-block px-6 py-2 rounded-full text-lg font-semibold"
                style={{ 
                  backgroundColor: `hsl(${glowColor} / 0.2)`,
                  color: `hsl(${glowColor})`
                }}
              >
                {character.behavior} • Age {character.age}
              </div>
            </div>

            <p className="text-xl italic text-muted-foreground max-w-2xl mx-auto">
              {character.quote}
            </p>

            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3">About</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {character.personality_summary}
              </p>
            </div>

            {/* Mood meter (decorative) */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mood</span>
                <span>Happy</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 ease-out animate-pulse"
                  style={{ 
                    width: '85%',
                    background: `linear-gradient(90deg, hsl(${glowColor}), hsl(${glowColor} / 0.6))`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate(`/chat/${character.id}`)}
              className="gap-2 text-lg px-8 py-6 neon-glow"
              style={{ 
                backgroundColor: `hsl(${glowColor})`,
                color: 'white'
              }}
            >
              <MessageCircle className="w-6 h-6" />
              Chat Now
            </Button>
            <Button
              size="lg"
              onClick={() => navigate(`/call/${character.id}`)}
              variant="outline"
              className="gap-2 text-lg px-8 py-6"
              style={{ borderColor: `hsl(${glowColor})`, color: `hsl(${glowColor})` }}
            >
              <Phone className="w-6 h-6" />
              Call Now
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm text-muted-foreground">
        All characters and conversations are fictional. CallHub is a fantasy entertainment experience.
      </footer>
    </div>
  );
};

export default Profile;