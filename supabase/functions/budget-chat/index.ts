import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseSettings(rows: { key: string; value: string }[]) {
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return {
    fx_rate: parseFloat(map.fx_rate || '26.5'),
    internship_start: map.internship_start || '2026-03-07',
    internship_end: map.internship_end || '2026-08-17',
    sg_break_start: map.sg_break_start || '2026-05-26',
    sg_break_days: parseInt(map.sg_break_days || '17'),
    monthly_rent_thb: parseFloat(map.monthly_rent_thb || '15500'),
    school_funding_sgd: parseFloat(map.school_funding_sgd || '10000'),
    salary_thb: parseFloat(map.salary_thb || '7000'),
    daily_lunch: parseFloat(map.daily_lunch || '80'),
    daily_dinner: parseFloat(map.daily_dinner || '100'),
    daily_other_food: parseFloat(map.daily_other_food || '40'),
    daily_transport: parseFloat(map.daily_transport || '40'),
    daily_misc: parseFloat(map.daily_misc || '20'),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [txRes, dailyRes, fundingRes, settingsRes, rentRes] = await Promise.all([
      adminClient.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(200),
      adminClient.from("daily_log").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      adminClient.from("funding").select("*").eq("user_id", userId),
      adminClient.from("settings").select("*").eq("user_id", userId),
      adminClient.from("rent_payments").select("*").eq("user_id", userId),
    ]);

    const transactions = txRes.data || [];
    const dailyLogs = dailyRes.data || [];
    const funding = fundingRes.data || [];
    const settingsRows = settingsRes.data || [];
    const rent = rentRes.data || [];

    // Parse settings into structured budget parameters
    const s = parseSettings(settingsRows as any[]);
    const dailyBudgetBkk = s.daily_lunch + s.daily_dinner + s.daily_other_food + s.daily_transport + s.daily_misc;
    const totalFundingSGD = s.school_funding_sgd;
    const totalFundingTHB = totalFundingSGD * s.fx_rate;

    // Date calculations
    const today = new Date();
    const internEnd = new Date(s.internship_end);
    const internStart = new Date(s.internship_start);
    const daysRemaining = Math.max(0, Math.ceil((internEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - internStart.getTime()) / (1000 * 60 * 60 * 24)));

    // Spending totals
    const totalTxSpend = transactions.reduce((sum: number, t: any) => sum + Number(t.amount_thb), 0);
    const totalDailySpend = dailyLogs.reduce((sum: number, d: any) =>
      sum + (Number(d.lunch_thb) || 0) + (Number(d.dinner_thb) || 0) + (Number(d.other_food_thb) || 0) + (Number(d.transport_thb) || 0) + (Number(d.misc_thb) || 0), 0);
    const totalFundingReceived = funding.filter((f: any) => f.is_received).reduce((sum: number, f: any) => sum + Number(f.amount_thb), 0);
    const totalFundingExpected = funding.filter((f: any) => !f.is_received).reduce((sum: number, f: any) => sum + Number(f.amount_thb), 0);
    const totalSpend = totalTxSpend + totalDailySpend;
    const remainingBalance = totalFundingReceived - totalSpend;
    const rentPaid = rent.filter((r: any) => r.is_paid).length;
    const rentTotal = rent.length;

    // Category breakdown
    const catMap: Record<string, number> = {};
    transactions.forEach((t: any) => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount_thb); });
    const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `${cat}: ฿${amt.toLocaleString()}`).join("\n");

    // Daily spending averages
    const avgDailySpend = daysElapsed > 0 ? totalSpend / daysElapsed : 0;
    const projectedTotal = avgDailySpend * (daysElapsed + daysRemaining);

    // Daily log averages by category
    const logCount = dailyLogs.length || 1;
    const avgLunch = dailyLogs.reduce((s: number, d: any) => s + (Number(d.lunch_thb) || 0), 0) / logCount;
    const avgDinner = dailyLogs.reduce((s: number, d: any) => s + (Number(d.dinner_thb) || 0), 0) / logCount;
    const avgFood = dailyLogs.reduce((s: number, d: any) => s + (Number(d.other_food_thb) || 0), 0) / logCount;
    const avgTransport = dailyLogs.reduce((s: number, d: any) => s + (Number(d.transport_thb) || 0), 0) / logCount;
    const avgMisc = dailyLogs.reduce((s: number, d: any) => s + (Number(d.misc_thb) || 0), 0) / logCount;

    const dataContext = `
USER'S FINANCIAL DATA (all in Thai Baht ฿ unless stated):

═══ BUDGET TARGETS (from Settings) ═══
FX Rate: ${s.fx_rate} THB/SGD
Internship: ${s.internship_start} → ${s.internship_end} (${daysElapsed} days elapsed, ${daysRemaining} days remaining)
SG Break: ${s.sg_break_start} for ${s.sg_break_days} days
Monthly Rent: ฿${s.monthly_rent_thb.toLocaleString()}
School Funding: S$${totalFundingSGD.toLocaleString()} (≈ ฿${totalFundingTHB.toLocaleString()})
Salary: ฿${s.salary_thb.toLocaleString()}/month

Daily Budget Targets (Bangkok):
  Lunch: ฿${s.daily_lunch} | Dinner: ฿${s.daily_dinner} | Other Food: ฿${s.daily_other_food}
  Transport: ฿${s.daily_transport} | Misc: ฿${s.daily_misc}
  TOTAL DAILY TARGET: ฿${dailyBudgetBkk}/day

═══ ACTUAL SPENDING ═══
Total spending (transactions): ฿${totalTxSpend.toLocaleString()}
Total spending (daily logs): ฿${totalDailySpend.toLocaleString()}
Combined total: ฿${totalSpend.toLocaleString()}
Average daily spend: ฿${avgDailySpend.toFixed(0)}/day ${avgDailySpend > dailyBudgetBkk ? '⚠️ OVER daily target' : '✅ within target'}

Daily Log Averages vs Targets:
  Lunch: ฿${avgLunch.toFixed(0)}/day (target: ฿${s.daily_lunch}) ${avgLunch > s.daily_lunch ? '⚠️ over' : '✅'}
  Dinner: ฿${avgDinner.toFixed(0)}/day (target: ฿${s.daily_dinner}) ${avgDinner > s.daily_dinner ? '⚠️ over' : '✅'}
  Other Food: ฿${avgFood.toFixed(0)}/day (target: ฿${s.daily_other_food}) ${avgFood > s.daily_other_food ? '⚠️ over' : '✅'}
  Transport: ฿${avgTransport.toFixed(0)}/day (target: ฿${s.daily_transport}) ${avgTransport > s.daily_transport ? '⚠️ over' : '✅'}
  Misc: ฿${avgMisc.toFixed(0)}/day (target: ฿${s.daily_misc}) ${avgMisc > s.daily_misc ? '⚠️ over' : '✅'}

═══ BALANCE ═══
Funding received: ฿${totalFundingReceived.toLocaleString()}
Funding expected (not yet received): ฿${totalFundingExpected.toLocaleString()}
Remaining balance: ฿${remainingBalance.toLocaleString()} (S$${(remainingBalance / s.fx_rate).toFixed(2)})
Projected total spend (at current pace): ฿${projectedTotal.toFixed(0)}
${daysRemaining > 0 ? `Budget per remaining day: ฿${(remainingBalance / daysRemaining).toFixed(0)}/day` : ''}

═══ SPENDING BY CATEGORY ═══
${catBreakdown || "No transactions yet"}

═══ RENT ═══
${rentPaid}/${rentTotal} months paid (฿${s.monthly_rent_thb.toLocaleString()}/month)

═══ RECENT TRANSACTIONS (last 20) ═══
${transactions.slice(0, 20).map((t: any) => `${t.date} | ${t.category} | ฿${t.amount_thb} | ${t.description || ''}`).join("\n") || "None"}

═══ RECENT DAILY LOGS (last 10) ═══
${dailyLogs.slice(0, 10).map((d: any) => `${d.date} | L:฿${d.lunch_thb} D:฿${d.dinner_thb} F:฿${d.other_food_thb} T:฿${d.transport_thb} M:฿${d.misc_thb}`).join("\n") || "None"}
`.trim();

    const body = await req.json();
    const rawMessages = body?.messages;

    // Validate and sanitize messages to prevent cost amplification and role injection
    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_MESSAGES = 50;
    const MAX_CONTENT_LENGTH = 4000;
    const messages = rawMessages
      .slice(0, MAX_MESSAGES)
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant'))
      .map((m: any) => ({
        role: m.role as string,
        content: String(m.content || '').slice(0, MAX_CONTENT_LENGTH),
      }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a smart, friendly Bangkok budget assistant for an intern tracking spending in Thailand. You have full access to their financial data below.

INSTRUCTIONS:
1. Always compare ACTUAL spending against BUDGET TARGETS. Flag overspending proactively.
2. Use ฿ for Thai Baht and S$ for Singapore Dollars. Convert between them using the FX rate when helpful.
3. When discussing daily spending, compare against the daily budget target (฿${dailyBudgetBkk}/day).
4. For forecasting, use the "days remaining" and "average daily spend" to project forward.
5. If the user asks about a category, show both the total AND what % of overall spending it represents.
6. When asked "am I on track", compare: remaining balance ÷ remaining days vs daily budget target.
7. For monthly comparisons, group transactions by month.
8. Keep answers concise but show key numbers. Use bullet points and bold for emphasis.
9. If you do calculations, briefly show your math.
10. Proactively mention if any daily category is consistently over budget.

${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("budget-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
