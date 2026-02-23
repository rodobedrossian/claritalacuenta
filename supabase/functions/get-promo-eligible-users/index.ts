import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// --- Match logic (single place for reuse) ---

function normalizeText(s: string): string {
  if (!s || typeof s !== 'string') return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeBankForTerm(s: string): string {
  const n = normalizeText(s)
  return n
    .replace(/\b(banco|rio|argentina|sa|sau|s\.a\.?u?\.?|frances|francés)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

interface CardRow {
  user_id: string
  bank: string | null
  card_network: string | null
}

function buildUserTerms(cards: CardRow[]): Set<string> {
  const terms = new Set<string>()
  const hasVisa = cards.some(c => normalizeText(c.card_network || '') === 'visa')
  const hasMastercard = cards.some(c => normalizeText(c.card_network || '') === 'mastercard')
  for (const c of cards) {
    if (c.bank) {
      const normalized = normalizeText(c.bank)
      if (normalized) terms.add(normalized)
      const bankTerm = normalizeBankForTerm(c.bank)
      if (bankTerm) terms.add(bankTerm)
    }
    if (c.card_network) {
      const n = normalizeText(c.card_network)
      if (n) terms.add(n)
    }
  }
  if (hasVisa && hasMastercard) terms.add('visa / mastercard')
  return terms
}

type Payload = Record<string, unknown>

function buildPromoSearchableText(payload: Payload): string {
  const parts: string[] = []
  const pm = payload.payment_methods
  if (Array.isArray(pm)) {
    parts.push(pm.map(x => typeof x === 'string' ? x : String(x)).join(' '))
  } else if (pm != null && typeof pm === 'string') {
    parts.push(pm)
  }
  if (payload.subtitle != null) parts.push(String(payload.subtitle))
  if (payload.conditions != null) parts.push(String(payload.conditions))
  if (payload.benefit != null) parts.push(String(payload.benefit))
  return normalizeText(parts.join(' '))
}

function promoMatchesUserTerms(userTerms: Set<string>, payload: Payload): boolean {
  const text = buildPromoSearchableText(payload)
  if (!text) return false
  for (const term of userTerms) {
    if (!term) continue
    const normalizedTerm = normalizeText(term)
    if (!normalizedTerm) continue
    if (normalizedTerm.includes(' ')) {
      if (text.includes(normalizedTerm)) return true
    } else {
      const wordBoundary = new RegExp(`\\b${escapeRegex(normalizedTerm)}\\b`, 'i')
      if (wordBoundary.test(text)) return true
    }
  }
  return false
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// --- Response types ---

interface CardInfo {
  bank: string | null
  card_network: string | null
}

interface MatchedPromo {
  id: string
  entity: string
  day_of_week: number
  benefit: string | null
  subtitle: string | null
  bank_logo: string | null
}

interface EligibleUser {
  id: string
  email: string
  full_name: string | null
  cards: CardInfo[]
  matched_promos: MatchedPromo[]
}

interface EligibleUsersResponse {
  users: EligibleUser[]
  page: number
  per_page: number
  total_pages: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const appMetadata = claimsData.claims.app_metadata as Record<string, unknown> | undefined
    if (appMetadata?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '50')))
    const dayOfWeekParam = url.searchParams.get('day_of_week')
    const dayOfWeek = dayOfWeekParam ? parseInt(dayOfWeekParam, 10) : null

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })
    if (usersError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const users = usersData.users
    const totalUsers = 'total' in usersData ? usersData.total : users.length
    const totalPages = Math.ceil(totalUsers / perPage)
    const userIds = users.map(u => u.id)

    let creditCards: CardRow[] = []
    if (userIds.length > 0) {
      const { data: cardsData } = await supabaseAdmin
        .from('credit_cards')
        .select('user_id, bank, card_network')
        .in('user_id', userIds)
      creditCards = (cardsData || []) as CardRow[]
    }

    const cardsByUser: Record<string, CardRow[]> = {}
    for (const c of creditCards) {
      if (!cardsByUser[c.user_id]) cardsByUser[c.user_id] = []
      cardsByUser[c.user_id].push(c)
    }

    let promosQuery = supabaseAdmin
      .from('promotions')
      .select('id, entity, day_of_week, payload')
      .eq('is_active', true)
    if (dayOfWeek != null && dayOfWeek >= 1 && dayOfWeek <= 7) {
      promosQuery = promosQuery.eq('day_of_week', dayOfWeek)
    }
    const { data: promosRows } = await promosQuery
    const promos = promosRows || []

    const usersOut: EligibleUser[] = users.map(user => {
      const cards = cardsByUser[user.id] || []
      const userTerms = buildUserTerms(cards)
      const matched_promos: MatchedPromo[] = []
      for (const p of promos) {
        const payload = (p.payload || {}) as Payload
        if (!promoMatchesUserTerms(userTerms, payload)) continue
        matched_promos.push({
          id: p.id,
          entity: p.entity,
          day_of_week: p.day_of_week,
          benefit: (payload.benefit != null ? String(payload.benefit) : null) as string | null,
          subtitle: (payload.subtitle != null ? String(payload.subtitle) : null) as string | null,
          bank_logo: (payload.bank_logo != null && typeof payload.bank_logo === 'string' ? payload.bank_logo : null) as string | null,
        })
      }
      return {
        id: user.id,
        email: user.email || '',
        full_name: (user.user_metadata?.full_name as string) || null,
        cards: cards.map(c => ({ bank: c.bank, card_network: c.card_network })),
        matched_promos,
      }
    })

    const response: EligibleUsersResponse = {
      users: usersOut,
      page,
      per_page: perPage,
      total_pages: totalPages,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('get-promo-eligible-users error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
