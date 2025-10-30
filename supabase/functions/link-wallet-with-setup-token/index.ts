import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Link wallet with setup token function called');

    const { setupToken, walletAddress } = await req.json();

    if (!setupToken || !walletAddress) {
      console.error('Missing required parameters:', { setupToken: !!setupToken, walletAddress: !!walletAddress });
      return new Response(
        JSON.stringify({ error: 'Setup token and wallet address are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Finding setup session with token:', setupToken);

    // Find the setup session
    const { data: session, error: sessionError } = await supabase
      .from('setup_sessions')
      .select('*')
      .eq('token', setupToken)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.error('Setup session not found or expired:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired setup session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found setup session:', { 
      telegramUserId: session.telegram_user_id, 
      groupChatId: session.group_chat_id 
    });

    // Check if a user profile already exists for this Telegram user
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('telegram_user_id', session.telegram_user_id)
      .maybeSingle();

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error checking user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let profileId: string;

    if (existingProfile) {
      console.log('Updating existing profile with wallet address');
      
      // Update existing profile with wallet address
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profileId = updatedProfile.id;
    } else {
      console.log('Creating new profile for Telegram user');
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          telegram_user_id: session.telegram_user_id,
          wallet_address: walletAddress,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profileId = newProfile.id;
    }

    // Find the telegram group
    const { data: telegramGroup, error: groupError } = await supabase
      .from('telegram_groups')
      .select('*')
      .eq('chat_id', session.group_chat_id)
      .single();

    if (groupError || !telegramGroup) {
      console.error('Telegram group not found:', groupError);
      return new Response(
        JSON.stringify({ error: 'Telegram group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found telegram group:', telegramGroup.id);

    // Check if group membership already exists
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('user_id', profileId)
      .eq('group_id', telegramGroup.id)
      .maybeSingle();

    if (membershipCheckError) {
      console.error('Error checking group membership:', membershipCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error checking group membership' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!existingMembership) {
      console.log('Creating group membership');
      
      // Create group membership
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          user_id: profileId,
          group_id: telegramGroup.id,
          role: 'admin',
          permissions: { contexts: true, settings: true }
        });

      if (membershipError) {
        console.error('Error creating group membership:', membershipError);
        return new Response(
          JSON.stringify({ error: 'Failed to create group membership' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Group membership already exists');
    }

    // Note: Setup session will be marked as used when completing the setup wizard

    console.log('Successfully linked wallet to Telegram user and group');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallet successfully linked to Telegram user and group',
        profileId,
        groupId: telegramGroup.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in link-wallet-with-setup-token function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});