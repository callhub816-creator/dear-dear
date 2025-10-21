-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  behavior TEXT NOT NULL CHECK (behavior IN ('Flirty', 'Sweet', 'Rude', 'Caring', 'Shy', 'Bold')),
  age_restricted BOOLEAN DEFAULT FALSE,
  image_url TEXT NOT NULL,
  json_path TEXT NOT NULL,
  personality_summary TEXT NOT NULL,
  age INTEGER NOT NULL,
  quote TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on characters (publicly readable)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters are viewable by everyone"
ON public.characters FOR SELECT
USING (true);

-- Users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits INTEGER DEFAULT 100,
  is_adult_confirmed BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Chat history table
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'character')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
ON public.chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
ON public.chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
ON public.chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, credits)
  VALUES (NEW.id, NEW.email, 100);
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default characters
INSERT INTO public.characters (name, behavior, age_restricted, image_url, json_path, personality_summary, age, quote) VALUES
('Aiko', 'Flirty', false, '/avatars/aiko.png', '/data/flirty.json', 'Playful and teasing, Aiko loves making you smile with her witty charm and heartfelt compliments.', 22, '"Life is too short not to have a little fun, don''t you think? 💕"'),
('Hana', 'Sweet', false, '/avatars/hana.png', '/data/sweet.json', 'Warm and encouraging, Hana is the friend who always knows how to brighten your day.', 20, '"You make the world a better place just by being in it! 🌸"'),
('Rin', 'Rude', false, '/avatars/rin.png', '/data/rude.json', 'Sarcastic and sassy, Rin keeps things interesting with her sharp wit and comedic edge.', 23, '"Oh great, another human. Just what I needed today. 🙄"'),
('Yuki', 'Caring', false, '/avatars/yuki.png', '/data/caring.json', 'Supportive and empathetic, Yuki is always there to listen and comfort you.', 24, '"I''m here for you, always. Whatever you need. 💙"'),
('Mei', 'Shy', false, '/avatars/mei.png', '/data/shy.json', 'Hesitant and adorable, Mei takes time to open up but her sweetness is worth the wait.', 19, '"Um... h-hi there... I hope we can be friends... >///<"'),
('Sakura', 'Bold', true, '/avatars/sakura.png', '/data/bold.json', 'Confident and mature, Sakura knows what she wants and isn''t afraid to show it.', 25, '"Confidence is everything. Life''s better when you take charge. 🌹"');