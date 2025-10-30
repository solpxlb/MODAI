-- Create telegram groups table to store each Telegram group's information
CREATE TABLE public.telegram_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  group_name TEXT,
  group_title TEXT,
  group_type TEXT DEFAULT 'group',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table for wallet + telegram integration
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  wallet_address TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create setup sessions for secure web authentication
CREATE TABLE public.setup_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  telegram_user_id BIGINT NOT NULL,
  group_chat_id BIGINT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group memberships to link users to groups they admin
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{"contexts": true, "settings": true}'::jsonb,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Create context types enum
CREATE TYPE public.context_type AS ENUM ('project_description', 'documentation', 'rules', 'faq', 'custom');

-- Create group contexts table for AI knowledge base per group
CREATE TABLE public.group_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  context_type public.context_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation messages for chat history per group
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  telegram_message_id BIGINT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  username TEXT,
  message_text TEXT,
  bot_response TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, telegram_message_id)
);

-- Enable Row Level Security
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for telegram_groups
CREATE POLICY "Users can view groups they are members of" 
ON public.telegram_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships gm
    JOIN public.user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = telegram_groups.id 
    AND up.telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  )
);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR ALL
USING (telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text);

-- Create RLS policies for group_memberships
CREATE POLICY "Users can view their group memberships" 
ON public.group_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = group_memberships.user_id 
    AND up.telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  )
);

-- Create RLS policies for group_contexts
CREATE POLICY "Group admins can manage contexts" 
ON public.group_contexts 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships gm
    JOIN public.user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = group_contexts.group_id 
    AND up.telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text
    AND (gm.permissions->>'contexts')::boolean = true
  )
);

-- Create RLS policies for conversation_messages
CREATE POLICY "Group admins can view conversation history" 
ON public.conversation_messages 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships gm
    JOIN public.user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = conversation_messages.group_id 
    AND up.telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_telegram_groups_updated_at
  BEFORE UPDATE ON public.telegram_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_contexts_updated_at
  BEFORE UPDATE ON public.group_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_telegram_groups_chat_id ON public.telegram_groups(chat_id);
CREATE INDEX idx_user_profiles_telegram_user_id ON public.user_profiles(telegram_user_id);
CREATE INDEX idx_setup_sessions_token ON public.setup_sessions(token);
CREATE INDEX idx_setup_sessions_expires_at ON public.setup_sessions(expires_at);
CREATE INDEX idx_group_memberships_user_group ON public.group_memberships(user_id, group_id);
CREATE INDEX idx_group_contexts_group_id ON public.group_contexts(group_id);
CREATE INDEX idx_conversation_messages_group_id ON public.conversation_messages(group_id);
CREATE INDEX idx_conversation_messages_telegram_id ON public.conversation_messages(group_id, telegram_message_id);