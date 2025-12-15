import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/forge/cost
 * Get cumulative cost for the authenticated user
 * Optional query params:
 *   - period: 'all' | 'month' | 'week' | 'day' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get('period') || 'all';

    // Calculate date filter based on period
    let dateFilter: string | null = null;
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        dateFilter = null;
    }

    // Build query
    let query = supabase
      .from('forge_costs')
      .select('amount_cents, model, created_at')
      .eq('user_id', user.id);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: costs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching costs:', error);
      return NextResponse.json({ error: 'Failed to fetch costs' }, { status: 500 });
    }

    // Calculate totals
    const totalCents = costs?.reduce((sum, cost) => sum + cost.amount_cents, 0) || 0;
    const totalDollars = totalCents / 100;

    // Group by model
    const byModel: Record<string, number> = {};
    costs?.forEach(cost => {
      byModel[cost.model] = (byModel[cost.model] || 0) + cost.amount_cents;
    });

    // Convert model totals to dollars
    const byModelDollars: Record<string, number> = {};
    Object.entries(byModel).forEach(([model, cents]) => {
      byModelDollars[model] = cents / 100;
    });

    return NextResponse.json({
      total_cents: totalCents,
      total_dollars: totalDollars,
      by_model: byModelDollars,
      period,
      generation_count: costs?.length || 0,
    });

  } catch (error) {
    console.error('Cost GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
