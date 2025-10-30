-- Create helper function to extract wallet address from JWT
CREATE OR REPLACE FUNCTION public.get_jwt_wallet_address()
RETURNS TEXT AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json ->> 'sub');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if a wallet is linked to a Telegram user
CREATE OR REPLACE FUNCTION public.get_telegram_user_id_by_wallet(wallet_addr TEXT)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT telegram_user_id 
    FROM public.user_profiles 
    WHERE wallet_address = wallet_addr
    LIMIT 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update setup_sessions RLS policy to allow access by wallet address
DROP POLICY IF EXISTS "Users can access their own setup sessions" ON public.setup_sessions;

CREATE POLICY "Users can access their own setup sessions" ON public.setup_sessions
FOR ALL USING (
  -- Allow access if telegram_user_id matches JWT sub (existing behavior)
  (telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  OR
  -- Allow access if wallet address is linked to the telegram_user_id
  telegram_user_id = public.get_telegram_user_id_by_wallet(public.get_jwt_wallet_address())
);

-- Update user_profiles RLS policy to allow access by wallet address
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR ALL USING (
  -- Allow access if telegram_user_id matches JWT sub (existing behavior)
  (telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  OR
  -- Allow access if wallet address matches JWT sub
  wallet_address = public.get_jwt_wallet_address()
);

-- Update group_memberships RLS policy
DROP POLICY IF EXISTS "Users can view their group memberships" ON public.group_memberships;

CREATE POLICY "Users can view their group memberships" ON public.group_memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = group_memberships.user_id 
    AND (
      (up.telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
      OR
      up.wallet_address = public.get_jwt_wallet_address()
    )
  )
);

-- Update telegram_groups RLS policy
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.telegram_groups;

CREATE POLICY "Users can view groups they are members of" ON public.telegram_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships gm
    JOIN user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = telegram_groups.id 
    AND (
      (up.telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
      OR
      up.wallet_address = public.get_jwt_wallet_address()
    )
  )
);

-- Update group_contexts RLS policy
DROP POLICY IF EXISTS "Group admins can manage contexts" ON public.group_contexts;

CREATE POLICY "Group admins can manage contexts" ON public.group_contexts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM group_memberships gm
    JOIN user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = group_contexts.group_id 
    AND (
      (up.telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
      OR
      up.wallet_address = public.get_jwt_wallet_address()
    )
    AND ((gm.permissions ->> 'contexts')::boolean = true)
  )
);

-- Update conversation_messages RLS policy
DROP POLICY IF EXISTS "Group admins can view conversation history" ON public.conversation_messages;

CREATE POLICY "Group admins can view conversation history" ON public.conversation_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships gm
    JOIN user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = conversation_messages.group_id 
    AND (
      (up.telegram_user_id)::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')
      OR
      up.wallet_address = public.get_jwt_wallet_address()
    )
  )
);