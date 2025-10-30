-- Add trigger to auto-update updated_at on group_contexts changes for proper cache invalidation
CREATE OR REPLACE FUNCTION update_contexts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_contexts_update_timestamp
    BEFORE UPDATE ON group_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_contexts_timestamp();