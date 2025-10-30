-- Create unified RPC function for fast group data retrieval
CREATE OR REPLACE FUNCTION get_group_reply_data(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'contexts', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'title', title,
                    'content', content,
                    'priority', priority
                )
                ORDER BY priority DESC
            )
            FROM group_contexts 
            WHERE group_id = p_group_id AND is_active = true), 
            '[]'::json
        ),
        'messages', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'username', COALESCE(username, 'User'),
                    'message_text', message_text,
                    'created_at', created_at
                )
                ORDER BY created_at DESC
            )
            FROM (
                SELECT username, message_text, created_at
                FROM conversation_messages 
                WHERE group_id = p_group_id 
                ORDER BY created_at DESC 
                LIMIT 5
            ) recent_msgs),
            '[]'::json
        ),
        'contexts_version', COALESCE(
            (SELECT EXTRACT(epoch FROM MAX(updated_at))::integer 
             FROM group_contexts 
             WHERE group_id = p_group_id AND is_active = true),
            0
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_group_created 
ON conversation_messages (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_contexts_group_active_priority 
ON group_contexts (group_id, is_active, priority DESC) 
WHERE is_active = true;

-- Verify existing unique indexes exist for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_groups_chat_id 
ON telegram_groups (chat_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_telegram_user_id 
ON user_profiles (telegram_user_id);