import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment configuration with feature flags
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const telegramToken = Deno.env.get('TG_HTTP_API')!;
const openRouterApiKey = Deno.env.get('OPENROUTER_API')!;

// Feature flags - ENABLE PERFORMANCE OPTIMIZATIONS
const STREAMING_ENABLED = Deno.env.get('STREAMING_ENABLED') === 'true'; // Keep OFF for now
const CACHE_ENABLED = Deno.env.get('CACHE_ENABLED') !== 'false'; // Default ON
const ROUTER_ENABLED = Deno.env.get('ROUTER_ENABLED') !== 'false'; // Default ON
const DEBUG_METRICS = Deno.env.get('DEBUG_METRICS') !== 'false'; // Default ON

// Model routing configuration - optimized for speed
const COMPLEXITY_THRESHOLD = parseInt(Deno.env.get('COMPLEXITY_THRESHOLD') || '1500'); // Lowered from 2000

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_API_URL = `https://api.telegram.org/bot${telegramToken}`;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Autonomous message detection patterns
const QUESTION_PATTERNS = [
  /\?$/,  // Ends with question mark
  /^(what|when|where|why|how|which|who|can|could|would|should|is|are|am|do|does|did)\b/i,  // WH-words at start
  /\b(anyone|somebody|help|assist|support)\b.*\?/i,  // Help requests with questions
  /\b(know|think|believe|understand)\b.*\?/i,  // Knowledge questions
];

const TRIGGER_PATTERNS = [
  /\b(admin|dev|moderator|mod|developer|maintainer)\b/i,  // Role mentions
  /\b(help|assist|support|guidance|advice)\b/i,  // Help requests
  /\b(issue|bug|problem|error|broken|stuck|confused)\b/i,  // Problem indicators
  /\b(question|query|unclear|don't understand|wtf)\b/i,  // Direct question indicators
  /\b(update|status|progress|news|info)\b/i,  // Information requests
];

const DIRECT_MENTION_REGEX = /@modfi_bot|\/\w+@modfi_bot/i;  // Keep for direct mentions

// LRU Cache for group contexts
interface CacheEntry {
  contexts: string;
  contextsVersion: number;
  timestamp: number;
}

class GroupContextCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_SIZE = 500;
  private readonly TTL_MS = 90000; // 90 seconds
  
  get(groupId: string, currentVersion: number): string | null {
    if (!CACHE_ENABLED) return null;
    
    const entry = this.cache.get(groupId);
    if (!entry || Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(groupId);
      return null;
    }
    
    // Version-based invalidation
    if (entry.contextsVersion !== currentVersion) {
      this.cache.delete(groupId);
      return null;
    }
    
    // LRU: Move to end by re-inserting
    this.cache.delete(groupId);
    this.cache.set(groupId, entry);
    
    return entry.contexts;
  }
  
  set(groupId: string, contexts: string, version: number): void {
    if (!CACHE_ENABLED) return;
    
    // Implement LRU eviction
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(groupId, {
      contexts,
      contextsVersion: version,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      enabled: CACHE_ENABLED
    };
  }
}

const contextCache = new GroupContextCache();

// Enhanced rate limiting and conversation etiquette
class ResponseController {
  private lastResponse = new Map<number, number>();
  private responseCount = new Map<number, number>();
  private lastHumanResponse = new Map<number, number>();
  private readonly MIN_INTERVAL_MS = 3000; // 3 seconds minimum between responses
  private readonly MAX_RESPONSES_PER_MINUTE = 8; // Max responses per minute
  private readonly HUMAN_PRIORITY_DELAY = 5000; // Wait 5 seconds after human response

  canRespond(chatId: number, isPriority: boolean = false): boolean {
    const now = Date.now();

    // Initialize counters for new chat
    if (!this.responseCount.has(chatId)) {
      this.responseCount.set(chatId, 0);
      this.lastResponse.set(chatId, 0);
      this.lastHumanResponse.set(chatId, 0);
    }

    // Get current values
    const lastResponseTime = this.lastResponse.get(chatId) || 0;
    const responseCount = this.responseCount.get(chatId) || 0;
    const lastHumanTime = this.lastHumanResponse.get(chatId) || 0;

    // Priority messages (direct mentions) get faster response times
    const minInterval = isPriority ? this.MIN_INTERVAL_MS / 2 : this.MIN_INTERVAL_MS;

    // Check if enough time has passed since last response
    if (now - lastResponseTime < minInterval) {
      return false;
    }

    // Check if we should let humans respond first
    if (now - lastHumanTime < this.HUMAN_PRIORITY_DELAY && !isPriority) {
      return false;
    }

    // Simple rate limiting: reset counter every minute
    if (now - lastResponseTime > 60000) {
      this.responseCount.set(chatId, 1);
      return true;
    }

    // Check if we've exceeded max responses per minute
    if (responseCount >= this.MAX_RESPONSES_PER_MINUTE) {
      return false;
    }

    return true;
  }

  recordResponse(chatId: number): void {
    const now = Date.now();
    this.lastResponse.set(chatId, now);
    const count = this.responseCount.get(chatId) || 0;
    this.responseCount.set(chatId, count + 1);
  }

  recordHumanResponse(chatId: number): void {
    this.lastHumanResponse.set(chatId, Date.now());
  }

  shouldRespondImmediately(message: string): boolean {
    // Direct mentions get immediate response
    return isDirectMention(message);
  }
}

const responseController = new ResponseController();

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any, replyToMessageId?: number) {
  const body: any = {
    chat_id: chatId,
    text: text,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  };
  
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId;
  }
  
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    console.error('Failed to send Telegram message:', await response.text());
  }
  
  return response;
}

async function sendTypingAction(chatId: number) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing'
      })
    });
  } catch (error) {
    if (DEBUG_METRICS) {
      console.error('Failed to send typing action:', error);
    }
  }
}

// Continuous typing indicator manager
class TypingIndicatorManager {
  private interval: number | null = null;
  private isActive = false;

  start(chatId: number, intervalMs = 4000) {
    if (this.isActive) return;
    
    this.isActive = true;
    // Send initial typing action
    sendTypingAction(chatId);
    
    // Continue sending typing actions every 4 seconds
    this.interval = setInterval(() => {
      if (this.isActive) {
        sendTypingAction(chatId);
      }
    }, intervalMs);
  }

  stop() {
    this.isActive = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

async function editMessageText(chatId: number, messageId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return response;
  } catch (error) {
    if (DEBUG_METRICS) {
      console.error('Failed to edit message:', error);
    }
    return null;
  }
}

async function getChatMember(chatId: number, userId: number) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
  } catch (error) {
    console.error('Error getting chat member:', error);
  }
  return null;
}

async function generateSetupToken(telegramUserId: number, groupChatId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const { error } = await supabase
    .from('setup_sessions')
    .insert({
      token,
      telegram_user_id: telegramUserId,
      group_chat_id: groupChatId,
      expires_at: expiresAt.toISOString()
    });
    
  if (error) {
    console.error('Error creating setup session:', error);
    throw error;
  }
  
  return token;
}

async function ensureGroupExists(chatId: number, groupTitle?: string, groupType?: string) {
  // Optimized upsert: single query instead of select-then-insert
  const { data: group, error } = await supabase
    .from('telegram_groups')
    .upsert({
      chat_id: chatId,
      group_title: groupTitle,
      group_type: groupType || 'group',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'chat_id',
      ignoreDuplicates: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting group:', error);
    throw error;
  }
  
  return group;
}

async function ensureUserProfile(telegramUserId: number, username?: string, firstName?: string, lastName?: string) {
  // Optimized upsert: single query instead of select-then-insert
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .upsert({
      telegram_user_id: telegramUserId,
      username,
      first_name: firstName,
      last_name: lastName,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'telegram_user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
  
  return profile;
}

// New unified function using RPC for faster single-query data retrieval
async function getGroupReplyData(groupId: string): Promise<{
  contexts: string;
  messages: string; 
  contextsVersion: number;
}> {
  try {
    const { data, error } = await supabase.rpc('get_group_reply_data', {
      p_group_id: groupId
    });
    
    if (error) {
      console.error('Error fetching group reply data:', error);
      return { contexts: '', messages: '', contextsVersion: 0 };
    }
    
    if (!data) {
      return { contexts: '', messages: '', contextsVersion: 0 };
    }
    
    // Check cache first
    const cachedContexts = contextCache.get(groupId, data.contexts_version);
    let contextsString = '';
    
    if (cachedContexts) {
      contextsString = cachedContexts;
      if (DEBUG_METRICS) {
        console.log(`[Cache] Hit for group ${groupId}`);
      }
    } else {
      // Build contexts string and cache it
      if (data.contexts && data.contexts.length > 0) {
        contextsString = data.contexts
          .map((ctx: any) => `**${ctx.title}**\n${ctx.content}`)
          .join('\n\n');
        contextCache.set(groupId, contextsString, data.contexts_version);
        if (DEBUG_METRICS) {
          console.log(`[Cache] Miss for group ${groupId} - cached new version ${data.contexts_version}`);
        }
      }
    }
    
    // Build messages string
    let messagesString = '';
    if (data.messages && data.messages.length > 0) {
      messagesString = data.messages
        .reverse()
        .map((msg: any) => `${msg.username || 'User'}: ${msg.message_text}`)
        .join('\n');
    }
    
    return {
      contexts: contextsString,
      messages: messagesString,
      contextsVersion: data.contexts_version
    };
  } catch (error) {
    console.error('Error in getGroupReplyData:', error);
    return { contexts: '', messages: '', contextsVersion: 0 };
  }
}

// Intelligent message detection for autonomous responses
function isQuestion(message: string): boolean {
  const cleanMessage = message.trim().toLowerCase();
  return QUESTION_PATTERNS.some(pattern => pattern.test(cleanMessage));
}

function hasTriggers(message: string): boolean {
  const cleanMessage = message.trim().toLowerCase();
  return TRIGGER_PATTERNS.some(pattern => pattern.test(cleanMessage));
}

function isDirectMention(message: string): boolean {
  return DIRECT_MENTION_REGEX.test(message);
}

function shouldRespondToMessage(message: string): boolean {
  // Priority 1: Direct mentions (always respond)
  if (isDirectMention(message)) return true;

  // Priority 2: Clear questions
  if (isQuestion(message)) return true;

  // Priority 3: Trigger words with questions
  if (hasTriggers(message)) return true;

  return false;
}

// Simple greeting detection for instant responses (no AI needed)
function isSimpleGreeting(message: string): boolean {
  const greetings = /^(hi|hello|hey|good morning|good afternoon|good evening|gm|gn)[\s\.,!]*$/i;
  return greetings.test(message.trim());
}

// Smart model selection optimized for speed/quality balance
function selectModel(userMessage: string, contextLength: number): string {
  if (!ROUTER_ENABLED) {
    return 'x-ai/grok-4-fast'; // Use Grok 4 Fast as default
  }

  const messageLength = userMessage.length;
  const hasComplexPatterns = /\b(explain|analyze|detail|complex|algorithm|code|technical|help|how|why|what)\b/i.test(userMessage);

  // Use Grok 4 Fast for all queries - better performance and quality
  return 'x-ai/grok-4-fast';
}

// Streaming response generation (conservative UX - final message only)
async function generateStreamingResponse(model: string, systemPrompt: string, userMessage: string, chatId: number, messageId: number): Promise<string> {
  try {
    const requestBody: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true
    };
    
    // Add parameters for x-ai/grok model
  requestBody.temperature = 0.7;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Conservative streaming: buffer all chunks and send final message
    let fullResponse = '';
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
    
    return fullResponse.trim() || 'Sorry, I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Streaming error:', error);
    return 'Sorry, I encountered an error. Please try again later.';
  }
}

async function generateAIResponse(
  groupId: string, 
  userMessage: string, 
  chatId?: number, 
  messageId?: number,
  typingManager?: TypingIndicatorManager
): Promise<string> {
  try {
    const startTime = Date.now();
    
    if (DEBUG_METRICS) {
      console.log(`[Performance] Starting AI response generation for group ${groupId}`);
    }
    
    // Check for simple greetings that don't need AI
    if (isSimpleGreeting(userMessage)) {
      return "Hello! How can I help you with our project today?";
    }
    
    // Single RPC call instead of multiple queries
    const replyData = await getGroupReplyData(groupId);
    
    const dbFetchTime = Date.now() - startTime;
    if (DEBUG_METRICS) {
      console.log(`[Performance] Database fetch completed in ${dbFetchTime}ms`);
    }
    
    // Select model based on complexity
    const selectedModel = selectModel(userMessage, replyData.contexts.length);
    
    // Optimized system prompt (compressed format)
    const systemPrompt = `ModFi Bot - AI assistant for this Telegram group. ONLY respond to project-related queries.

PROJECT CONTEXT:
${replyData.contexts || 'No context configured - ask admin to use /settings@modfi_bot'}

RULES: Only answer project questions | Decline unrelated queries | Keep responses concise | Be professional yet conversational

RECENT CHAT:
${replyData.messages || 'No recent history'}`;

    const aiStartTime = Date.now();
    if (DEBUG_METRICS) {
      console.log(`[Performance] Starting AI API call with model: ${selectedModel}`);
    }
    
    // Handle streaming vs non-streaming with continuous typing
    if (STREAMING_ENABLED && chatId && messageId && typingManager) {
      typingManager.start(chatId);
      try {
        const result = await generateStreamingResponse(selectedModel, systemPrompt, userMessage, chatId, messageId);
        typingManager.stop();
        return result;
      } catch (error) {
        typingManager.stop();
        throw error;
      }
    }
    
    const requestBody: any = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    };
    
    // Add parameters for x-ai/grok model
  requestBody.temperature = 0.7;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return 'Sorry, I encountered an error processing your request. Please try again later.';
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    const aiResponseTime = Date.now() - aiStartTime;
    if (DEBUG_METRICS) {
      console.log(`[Performance] AI API call completed in ${aiResponseTime}ms`);
    }
    
    if (!aiResponse) {
      console.error('No AI response received:', JSON.stringify(data));
      return 'Sorry, I couldn\'t generate a response. Please try again.';
    }
    
    const totalTime = Date.now() - startTime;
    if (DEBUG_METRICS) {
      console.log(`[Performance] Total AI response generation completed in ${totalTime}ms (Cache: ${CACHE_ENABLED ? 'ON' : 'OFF'}, Model: ${selectedModel})`);
    }
    
    return aiResponse.trim();
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Sorry, I encountered an error. Please try again later.';
  }
}

async function handleStartCommand(message: any) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  // Check if this is a setup redirect from a group
  const setupMatch = text.match(/\/start setup_(.+)/);
  if (setupMatch) {
    const token = setupMatch[1];
    
    // Verify the setup token exists and get group info
    const { data: setupSession } = await supabase
      .from('setup_sessions')
      .select(`
        *
      `)
      .eq('token', token)
      .eq('is_used', false)
      .single();
      
    let groupInfo = null;
    if (setupSession) {
      const { data: group } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('chat_id', setupSession.group_chat_id)
        .single();
      groupInfo = group;
    }
    
    if (setupSession && groupInfo && new Date(setupSession.expires_at) > new Date()) {
      const setupUrl = `https://modfi.ai/setup?token=${token}`;
      
      const setupMessage = `
🔧 <b>Setup Link for ${groupInfo.group_title}</b>

Perfect! Here's your secure setup link:
${setupUrl}

⚠️ <i>Link expires in 24 hours</i>

Complete the setup to configure your group's AI context and start using intelligent responses.
      `;
      
      await sendTelegramMessage(chatId, setupMessage);
      return;
    } else {
      const expiredMessage = `
❌ <b>Setup Link Expired</b>

This setup link has expired or already been used.

Please go back to your group and run /settings@modfi_bot again to get a new setup link.
      `;
      
      await sendTelegramMessage(chatId, expiredMessage);
      return;
    }
  }
  
  const welcomeText = `
🤖 <b>Welcome to ModFi Bot!</b>

I'm an AI assistant that helps manage your Telegram groups with custom context and intelligent responses.

<b>How it works:</b>
1️⃣ Add me to your group chat
2️⃣ Use /settings@modfi_bot in the group
3️⃣ Complete setup on our website
4️⃣ I'll respond intelligently using your group's context

<b>Ready to get started?</b>
Add me to your group and run /settings@modfi_bot to begin!
  `;
  
  const addToGroupKeyboard = {
    inline_keyboard: [[
      {
        text: "➕ Add to Group",
        url: "https://t.me/modfi_bot?startgroup=true"
      }
    ]]
  };
  
  await sendTelegramMessage(chatId, welcomeText, addToGroupKeyboard);
}

async function handleSettingsCommand(message: any) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const chatType = message.chat.type;
  
  if (chatType === 'private') {
    const responseText = `
❌ <b>Settings command must be used in a group!</b>

Please:
1️⃣ Add me to your group chat
2️⃣ Run /settings@modfi_bot in the group
3️⃣ I'll guide you through the setup process
    `;
    
    await sendTelegramMessage(chatId, responseText);
    return;
  }
  
  // Check if user is admin
  const memberInfo = await getChatMember(chatId, userId);
  const isAdmin = memberInfo && (memberInfo.status === 'creator' || memberInfo.status === 'administrator');
  
  if (!isAdmin) {
    const responseText = `
❌ <b>Only group administrators can configure settings!</b>

Please ask a group admin to run this command.
    `;
    
    await sendTelegramMessage(chatId, responseText);
    return;
  }
  
  try {
    // Ensure group and user exist in database
    const group = await ensureGroupExists(chatId, message.chat.title, chatType);
    const userProfile = await ensureUserProfile(
      userId, 
      message.from.username, 
      message.from.first_name, 
      message.from.last_name
    );
    
    // Create setup session token
    const token = await generateSetupToken(userId, chatId);
    
    // Create setup URL - using the published URL
    const setupUrl = `https://modfi.ai/setup?token=${token}`;
    
    // Always show "Continue in Private Chat" button for consistent user experience
    const groupResponseText = `
🔧 <b>Group Setup</b>

@${message.from.username || message.from.first_name}, let's configure your group's AI context!

For security, I'll provide the setup link in our private chat. Click the button below to continue.

⚠️ <i>Setup link expires in 24 hours</i>
    `;
    
    const privateKeyboard = {
      inline_keyboard: [[
        {
          text: "💬 Continue in Private Chat",
          url: `https://t.me/modfi_bot?start=setup_${token}`
        }
      ]]
    };
    
    await sendTelegramMessage(chatId, groupResponseText, privateKeyboard);
    
  } catch (error) {
    console.error('Error handling settings command:', error);
    
    const errorText = `
❌ <b>Setup Error</b>

There was an error setting up your group. Please try again later or contact support.
    `;
    
    await sendTelegramMessage(chatId, errorText);
  }
}

async function storeConversationMessage(message: any, botResponse?: string) {
  try {
    const chatId = message.chat.id;
    
    // Ensure group exists
    const group = await ensureGroupExists(chatId, message.chat.title, message.chat.type);
    
    const { error } = await supabase
      .from('conversation_messages')
      .insert({
        group_id: group.id,
        telegram_message_id: message.message_id,
        telegram_user_id: message.from.id,
        username: message.from.username,
        message_text: message.text,
        bot_response: botResponse,
        processed_at: botResponse ? new Date().toISOString() : null
      });
      
    if (error) {
      console.error('Error storing conversation message:', error);
    }
  } catch (error) {
    console.error('Error in storeConversationMessage:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStartTime = Date.now();

  try {
    const body = await req.json();
    const message = body.message;
    
    // OPTIMIZATION 1: Hot-path hygiene - immediate bail for non-messages
    if (!message || !message.text) {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const {
      message_id,
      chat: { id: chat_id, type: chat_type, title: chat_title },
      from: { id: user_id, username, first_name, last_name },
      text,
    } = message;

    // INTELLIGENT MESSAGE PROCESSING: Check if we should respond
    const shouldRespond = shouldRespondToMessage(text);
    const isDirectMentionMsg = isDirectMention(text);
    const isPriority = isDirectMentionMsg;

    // Handle commands that don't require response analysis
    if (text.startsWith('/start')) {
      await handleStartCommand(message);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    if (!shouldRespond) {
      // Still store the message for context but don't respond
      try {
        await ensureGroupExists(chat_id, chat_title, chat_type);
        await ensureUserProfile(user_id, username, first_name, last_name);
        storeConversationMessage(message).catch(error =>
          console.error('Background storage error:', error)
        );
      } catch (error) {
        console.error('Error storing context message:', error);
      }
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Check rate limiting and etiquette
    if (!responseController.canRespond(chat_id, isPriority)) {
      if (DEBUG_METRICS) {
        console.log(`[RateLimit] Skipping response for chat ${chat_id} - rate limited or etiquette check`);
      }
      // Store message for context but don't respond
      storeConversationMessage(message).catch(error =>
        console.error('Background storage error:', error)
      );
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // OPTIMIZATION 1: Send typing indicator immediately + start continuous typing
    const typingManager = new TypingIndicatorManager();
    typingManager.start(chat_id);
    
    
    if (DEBUG_METRICS) {
      console.log(`[Performance] Mention detected in ${Date.now() - requestStartTime}ms`);
    }

    // Handle settings command
    if (text.includes('/settings') && text.includes('@modfi_bot')) {
      typingManager.stop();
      responseController.recordResponse(chat_id);
      await handleSettingsCommand(message);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    try {
      // OPTIMIZATION 2: Upsert operations for group and user
      const [group] = await Promise.all([
        ensureGroupExists(chat_id, chat_title, chat_type),
        ensureUserProfile(user_id, username, first_name, last_name)
      ]);
      
      // Clean the message text for autonomous processing
      let cleanMessage = text
        .replace(/@modfi_bot/g, '')
        .replace(/\/\w+@modfi_bot/g, '')
        .trim();

      // Handle empty messages after cleaning (only direct mentions)
      if (!cleanMessage && isDirectMentionMsg) {
        typingManager.stop();
        responseController.recordResponse(chat_id);
        const helpText = `🤖 <b>How can I help?</b>\n\nI can now answer questions automatically! Ask me anything about our project, or I'll jump in when I see questions or mentions of admin/dev/mod topics.\n\nUse /settings@modfi_bot to configure my knowledge base.`;
        await sendTelegramMessage(chat_id, helpText);

        // OPTIMIZATION 5: Background storage (fire-and-forget)
        storeConversationMessage(message, helpText).catch(error =>
          console.error('Background storage error:', error)
        );
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // OPTIMIZATION 3: Proactive placeholder system (send immediately if predicted >1.5s)
      let placeholderMessageId: number | null = null;
      const complexityScore = cleanMessage.length + (cleanMessage.includes('?') ? 200 : 0);
      
      if (complexityScore > 1500) {
        const placeholder = "🤔 Analyzing your question...";
        const placeholderResponse = await sendTelegramMessage(chat_id, placeholder);
        if (placeholderResponse.ok) {
          const placeholderData = await placeholderResponse.json();
          placeholderMessageId = placeholderData.result.message_id;
        }
      }

      // Generate AI response with continuous typing
      const aiStartTime = Date.now();
      let aiResponse: string;
      
      try {
        aiResponse = await generateAIResponse(group.id, cleanMessage, chat_id, message_id, typingManager);
      } finally {
        // Always stop typing when AI response is done
        typingManager.stop();
      }
      
      const aiTotalTime = Date.now() - aiStartTime;
      
      // Record our response and send
      responseController.recordResponse(chat_id);

      // Send or edit response
      if (placeholderMessageId) {
        await editMessageText(chat_id, placeholderMessageId, aiResponse);
      } else {
        await sendTelegramMessage(chat_id, aiResponse);
      }

      // OPTIMIZATION 5: Background conversation storage
      storeConversationMessage(message, aiResponse).catch(error =>
        console.error('Background storage error:', error)
      );

      // Performance logging
      const totalTime = Date.now() - requestStartTime;
      if (DEBUG_METRICS) {
        console.log(`[Performance] Total request completed in ${totalTime}ms | AI: ${aiTotalTime}ms | Cache stats:`, contextCache.getStats());
      }

    } catch (error) {
      // Always stop typing on error
      typingManager.stop();
      console.error('Error processing mention:', error);
      await sendTelegramMessage(chat_id, 'Sorry, I encountered an error. Please try again later.');
    }
    
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Always return 200 to Telegram to avoid webhook retries
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});