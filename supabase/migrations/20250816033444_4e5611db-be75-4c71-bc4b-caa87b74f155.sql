-- Fix function search path security warnings by adding SET search_path to functions
CREATE OR REPLACE FUNCTION public.encrypt_token(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Simple base64 encoding for demo - in production use proper encryption
  RETURN encode(plain_text::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Simple base64 decoding for demo - in production use proper decryption
  RETURN convert_from(decode(encrypted_text, 'base64'), 'UTF8');
END;
$$;