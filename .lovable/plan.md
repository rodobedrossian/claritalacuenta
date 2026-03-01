

## Plan: Fix Financial Chat Data Issues + Add Persistence

### Problems Identified

1. **Category field is mixed UUIDs and text names**: The `transactions.category` column contains both UUIDs (referencing `categories.id`) and plain text names. The tools filter with `ilike` on the category text, which misses UUID-based entries. The `get_category_breakdown` and `get_monthly_summary` tools also don't resolve category IDs to names, so the AI gets unreadable data.

2. **`getClaims` may not work reliably**: Other functions use `getUser()` instead. Should switch to the same pattern for consistency.

3. **System prompt lacks guidance for general questions**: When user asks "¿En qué gasto más?", the AI should default to querying the last 3 months across all categories/payment methods. The system prompt should instruct the AI to use broader defaults for general questions.

4. **No persistence tables for chat history or tool usage tracking**.

### Changes

#### 1. Edge Function `financial-chat/index.ts` Fixes

**Auth**: Replace `getClaims` with `getUser()` (consistent with all other functions).

**Category resolution**: In every tool that reads `transactions`, fetch the `categories` table and build a UUID-to-name map. When returning data, resolve category IDs to names. When filtering by category name, also match UUIDs that map to that name.

**System prompt enhancement**: Add instructions that for general/broad questions, the AI should default to `get_monthly_summary(months=3)` + `get_category_breakdown` for the last 3 months with `source=all`.

**Token tracking per tool call**: Track usage from each AI gateway call (not just the final one). Accumulate `prompt_tokens`, `completion_tokens`, and `total_tokens` across all iterations and log them.

#### 2. New DB Table: `chat_conversations`

Stores conversation metadata per user.

```sql
CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: workspace members can CRUD their own conversations
```

#### 3. New DB Table: `chat_messages`

Stores each message (user + assistant), tool calls, and visualizations.

```sql
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user', 'assistant', 'tool'
  content text,
  tool_calls jsonb, -- array of {name, args, result} for tool messages
  visualization_type text, -- 'chart', 'kpi', 'table' or null
  created_at timestamptz DEFAULT now(),
  -- Token usage for this specific AI call
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  model text
);
-- RLS: user can access messages of their conversations
```

#### 4. Update Edge Function to Persist

- On first message of a conversation, create a `chat_conversations` row (using service role to bypass RLS for insert) or receive `conversation_id` from the client.
- After each AI response, insert both user and assistant messages into `chat_messages`.
- Track tokens per iteration of the tool-calling loop.

#### 5. Update Frontend

- `useFinancialChat.ts`: Send/receive `conversation_id`, persist messages, load previous conversations.
- `Chat.tsx`: Add conversation list/history sidebar or selector (optional, can be a follow-up).

### Files to Create/Edit

| Action | File |
|--------|------|
| Edit | `supabase/functions/financial-chat/index.ts` (auth fix, category resolution, system prompt, persistence, token tracking) |
| Edit | `src/hooks/useFinancialChat.ts` (conversation_id support) |
| Edit | `src/pages/Chat.tsx` (minor: pass conversation_id) |
| Migration | Create `chat_conversations` and `chat_messages` tables with RLS |

