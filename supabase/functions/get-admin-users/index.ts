import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserMetrics {
  id: string
  email: string
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
  transactions_count: number
  credit_cards_count: number
  savings_entries_count: number
}

interface AdminUsersResponse {
  users: UserMetrics[]
  metrics: {
    total_users: number
    active_7_days: number
    active_30_days: number
  }
  page: number
  per_page: number
  total_pages: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's JWT to verify admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate JWT and get user claims
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Claims error:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role in app_metadata
    const appMetadata = claimsData.claims.app_metadata as Record<string, unknown> | undefined
    if (appMetadata?.role !== 'admin') {
      console.log('User is not admin:', claimsData.claims.sub)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin access granted for user:', claimsData.claims.sub)

    // Parse query params for pagination
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '50')

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Fetch users from auth
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const users = usersData.users
    const totalUsers = usersData.total || users.length

    // Calculate active users metrics
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let active7Days = 0
    let active30Days = 0

    // Get all user IDs for batch queries
    const userIds = users.map(u => u.id)

    // Batch count queries for efficiency
    const [transactionsResult, creditCardsResult, savingsResult] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('user_id', { count: 'exact', head: false })
        .in('user_id', userIds),
      supabaseAdmin
        .from('credit_cards')
        .select('user_id', { count: 'exact', head: false })
        .in('user_id', userIds),
      supabaseAdmin
        .from('savings_entries')
        .select('user_id', { count: 'exact', head: false })
        .in('user_id', userIds),
    ])

    // Count per user
    const transactionCounts: Record<string, number> = {}
    const creditCardCounts: Record<string, number> = {}
    const savingsCounts: Record<string, number> = {}

    transactionsResult.data?.forEach((t: { user_id: string }) => {
      transactionCounts[t.user_id] = (transactionCounts[t.user_id] || 0) + 1
    })
    creditCardsResult.data?.forEach((c: { user_id: string }) => {
      creditCardCounts[c.user_id] = (creditCardCounts[c.user_id] || 0) + 1
    })
    savingsResult.data?.forEach((s: { user_id: string }) => {
      savingsCounts[s.user_id] = (savingsCounts[s.user_id] || 0) + 1
    })

    // Build user metrics
    const userMetrics: UserMetrics[] = users.map(user => {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
      
      if (lastSignIn) {
        if (lastSignIn >= sevenDaysAgo) active7Days++
        if (lastSignIn >= thirtyDaysAgo) active30Days++
      }

      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        transactions_count: transactionCounts[user.id] || 0,
        credit_cards_count: creditCardCounts[user.id] || 0,
        savings_entries_count: savingsCounts[user.id] || 0,
      }
    })

    const response: AdminUsersResponse = {
      users: userMetrics,
      metrics: {
        total_users: totalUsers,
        active_7_days: active7Days,
        active_30_days: active30Days,
      },
      page,
      per_page: perPage,
      total_pages: Math.ceil(totalUsers / perPage),
    }

    console.log(`Returning ${userMetrics.length} users, page ${page}`)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
