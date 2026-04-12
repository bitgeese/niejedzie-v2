import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verify failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const sessionId = session.metadata?.sessionId ?? session.client_reference_id;
      if (!sessionId) break;
      db().prepare(
        `UPDATE monitoring_sessions SET payment_status = 'paid', status = 'active' WHERE id = ?`
      ).run(sessionId);
      console.log(`[stripe webhook] session ${sessionId} -> active`);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const stripeSession = await stripe().checkout.sessions.list({ subscription: sub.id, limit: 1 });
      const refId = stripeSession.data[0]?.client_reference_id;
      if (refId) {
        db().prepare(`UPDATE monitoring_sessions SET status = 'expired' WHERE id = ?`).run(refId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
