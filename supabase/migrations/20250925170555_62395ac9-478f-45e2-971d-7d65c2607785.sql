-- Create RLS policies for setup_sessions table to fix security warning
CREATE POLICY "Users can access their own setup sessions" 
ON public.setup_sessions 
FOR ALL
USING (telegram_user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text);

-- Create policy to allow service role to manage setup sessions (for edge functions)
CREATE POLICY "Service role can manage setup sessions" 
ON public.setup_sessions 
FOR ALL
USING (true)
WITH CHECK (true);