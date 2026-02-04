-- Add allergies column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN allergies text NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.allergies IS 'Comma-separated list of user allergies for personalized remedy suggestions';
