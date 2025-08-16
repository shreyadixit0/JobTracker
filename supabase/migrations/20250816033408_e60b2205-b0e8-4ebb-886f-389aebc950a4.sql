-- Create mail_accounts table for storing OAuth tokens
CREATE TABLE public.mail_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('GMAIL', 'OUTLOOK')),
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, email_address)
);

-- Create mail_messages table for caching processed emails
CREATE TABLE public.mail_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mail_account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  provider_message_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  parsed_status TEXT,
  parsed_company TEXT,
  parsed_position TEXT,
  linked_application_id UUID REFERENCES public.applications(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mail_account_id, provider_message_id)
);

-- Add new columns to applications table for email integration
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS portal TEXT CHECK (portal IN ('LINKEDIN', 'NAUKRI', 'INDEED', 'GLASSDOOR', 'GREENHOUSE', 'LEVER', 'WORKDAY', 'OTHER')) DEFAULT 'OTHER',
ADD COLUMN IF NOT EXISTS external_ref TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'EMAIL'));

-- Update applications status enum to include all required statuses
ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('SAVED', 'APPLIED', 'PENDING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'));

-- Enable RLS on new tables
ALTER TABLE public.mail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mail_accounts
CREATE POLICY "Users can view their own mail accounts" 
ON public.mail_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mail accounts" 
ON public.mail_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mail accounts" 
ON public.mail_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mail accounts" 
ON public.mail_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for mail_messages
CREATE POLICY "Users can view their own mail messages" 
ON public.mail_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mail messages" 
ON public.mail_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mail messages" 
ON public.mail_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mail messages" 
ON public.mail_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_mail_accounts_user_provider ON public.mail_accounts(user_id, provider);
CREATE INDEX idx_mail_messages_user_account ON public.mail_messages(user_id, mail_account_id);
CREATE INDEX idx_mail_messages_timestamp ON public.mail_messages(timestamp DESC);
CREATE INDEX idx_applications_user_company_position ON public.applications(user_id, company, position);
CREATE INDEX idx_applications_external_ref ON public.applications(external_ref) WHERE external_ref IS NOT NULL;

-- Create updated_at trigger for mail_accounts
CREATE TRIGGER update_mail_accounts_updated_at
BEFORE UPDATE ON public.mail_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to encrypt sensitive data (tokens)
CREATE OR REPLACE FUNCTION public.encrypt_token(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple base64 encoding for demo - in production use proper encryption
  RETURN encode(plain_text::bytea, 'base64');
END;
$$;

-- Create a function to decrypt sensitive data (tokens)
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple base64 decoding for demo - in production use proper decryption
  RETURN convert_from(decode(encrypted_text, 'base64'), 'UTF8');
END;
$$;