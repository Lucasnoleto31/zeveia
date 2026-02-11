import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const cutoffDate = fifteenDaysAgo.toISOString();

    // Get or create loss reason
    const { data: existingReason } = await supabase
      .from("loss_reasons")
      .select("id")
      .eq("name", "Sem interação por 15 dias")
      .maybeSingle();

    let lossReasonId: string;
    if (existingReason) {
      lossReasonId = existingReason.id;
    } else {
      const { data: newReason, error: reasonError } = await supabase
        .from("loss_reasons")
        .insert({ name: "Sem interação por 15 dias", active: true })
        .select("id")
        .single();
      if (reasonError) throw reasonError;
      lossReasonId = newReason.id;
    }

    // Get active leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, updated_at")
      .in("status", ["novo", "em_contato", "troca_assessoria"]);

    if (leadsError) throw leadsError;
    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active leads found", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadIds = leads.map((l) => l.id);

    // Get latest interaction per lead
    const { data: interactions, error: intError } = await supabase
      .from("interactions")
      .select("lead_id, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    if (intError) throw intError;

    // Build map of latest interaction per lead
    const latestInteraction = new Map<string, string>();
    for (const i of interactions || []) {
      if (i.lead_id && !latestInteraction.has(i.lead_id)) {
        latestInteraction.set(i.lead_id, i.created_at);
      }
    }

    // Determine which leads to mark as lost
    const leadsToUpdate: string[] = [];
    for (const lead of leads) {
      const lastActivity =
        latestInteraction.get(lead.id) || lead.updated_at;
      if (lastActivity < cutoffDate) {
        leadsToUpdate.push(lead.id);
      }
    }

    if (leadsToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inactive leads found", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update leads in batches of 100
    let totalUpdated = 0;
    for (let i = 0; i < leadsToUpdate.length; i += 100) {
      const batch = leadsToUpdate.slice(i, i + 100);
      const { error: updateError, count } = await supabase
        .from("leads")
        .update({
          status: "perdido",
          lost_at: new Date().toISOString(),
          loss_reason_id: lossReasonId,
        })
        .in("id", batch);

      if (updateError) throw updateError;
      totalUpdated += count || batch.length;
    }

    console.log(`Auto-marked ${totalUpdated} leads as lost`);

    return new Response(
      JSON.stringify({
        message: `${totalUpdated} leads marked as lost`,
        updated: totalUpdated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-mark-lost-leads:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
