-- Create trusted hospitals table
CREATE TABLE public.trusted_hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_address TEXT,
  hospital_phone TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, priority)
);

-- Enable Row Level Security
ALTER TABLE public.trusted_hospitals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own hospitals" 
ON public.trusted_hospitals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hospitals" 
ON public.trusted_hospitals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hospitals" 
ON public.trusted_hospitals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hospitals" 
ON public.trusted_hospitals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trusted_hospitals_updated_at
BEFORE UPDATE ON public.trusted_hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();