import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, LogOut, User } from "lucide-react";
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
  Flirty: "flirty",
  Sweet: "sweet",
  Rude: "rude",
  Caring: "caring",
  Shy: "shy",
  Bold: "bold",
};

const Home = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load characters");
      console.error(error);
      return;
    }

    setCharacters(data || []);
  };

  const handleCharacterClick = async (character: Character) => {
    if (character.age_restricted) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to interact with this character");
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_adult_confirmed")
        .eq("id", user.id)
        .single();

      if (!profile?.is_adult_confirmed) {
        setSelectedCharacter(character);
        setShowAgeGate(true);
        return;
      }
    }
    
    navigate(`/profile/${character.id}`);
  };

  const confirmAdult = async (isAdult: boolean) => {
    if (!isAdult) {
      setShowAgeGate(false);
      setSelectedCharacter(null);
      toast.error("You must be 18+ to view this character");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_adult_confirmed: true })
        .eq("id", user.id);

      setShowAgeGate(false);
      if (selectedCharacter) {
        navigate(`/profile/${selectedCharacter.id}`);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CallHub
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Chat. Call. Feel Closer.
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose your companion and enter a world of connection
          </p>
        </div>

        {/* Character grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characters.map((character) => (
            <div
              key={character.id}
              onClick={() => handleCharacterClick(character)}
              className="group cursor-pointer"
            >
              <div className="glass-card p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className={`w-48 h-48 mx-auto rounded-full overflow-hidden pulse-border border-4 border-${behaviorColors[character.behavior]}`}>
                    <img
                      src={character.image_url}
                      alt={character.name}
                      className="w-full h-full object-cover breathe-animation"
                    />
                    {/* Glass reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                  {character.age_restricted && (
                    <div className="absolute top-2 right-2 bg-bold text-white px-3 py-1 rounded-full text-sm font-bold">
                      18+
                    </div>
                  )}
                </div>

                {/* Character info */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">{character.name}</h3>
                  <div className={`inline-block px-4 py-1 rounded-full bg-${behaviorColors[character.behavior]}/20 text-${behaviorColors[character.behavior]} font-semibold`}>
                    {character.behavior}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {character.personality_summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Age gate modal */}
      {showAgeGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-8 max-w-md mx-4 space-y-6 animate-scale-in">
            <h2 className="text-2xl font-bold text-center">Age Verification</h2>
            <p className="text-center text-muted-foreground">
              This character contains content for mature audiences (18+).
              <br />
              Are you 18 years or older?
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => confirmAdult(true)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Yes, I'm 18+
              </Button>
              <Button
                onClick={() => confirmAdult(false)}
                variant="outline"
                className="flex-1"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <footer className="relative z-10 text-center py-6 text-sm text-muted-foreground">
        All characters and conversations are fictional. CallHub is a fantasy entertainment experience.
      </footer>
    </div>
  );
};

export default Home;