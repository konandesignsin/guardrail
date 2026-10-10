CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft'
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update users"
ON public.users
FOR UPDATE
WITH CHECK (true);

INSERT INTO storage.buckets (id, public)
VALUES ('uploads', true);
