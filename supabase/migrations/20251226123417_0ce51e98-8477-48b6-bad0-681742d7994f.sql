-- Add date_regex column to email_parsers table
ALTER TABLE public.email_parsers 
ADD COLUMN date_regex text DEFAULT NULL;