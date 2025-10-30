-- Fix function search path security issue by recreating properly
DROP TRIGGER IF EXISTS group_contexts_update_timestamp ON group_contexts;
DROP FUNCTION IF EXISTS update_contexts_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_contexts_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER group_contexts_update_timestamp
    BEFORE UPDATE ON group_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_contexts_timestamp();