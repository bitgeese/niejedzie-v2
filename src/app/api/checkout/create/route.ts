import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { PRICES } from "@/lib/constants";
import { todayWarsaw } from "@/lib/time";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const mode = formData.get("mode") as "onetime" | "subscription";
  const trainNumber = (formData.get("trainNumber") as string)?.trim();
  const destination = (formData.get("destination") as string)?.trim();

  if (!mode || !trainNumber || !destination) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const sessionId = crypto.randomBytes(16).toString("hex");
  const origin = new URL(req.url).origin;

  db().prepare(
    `INSERT INTO monitoring_sessions (id, train_number, destination, payment_type, status, operating_date)
     VALUES (?, ?, ?, ?, 'pending', ?)`
  ).run(sessionId, trainNumber, destination, mode, todayWarsaw());

  const checkout = await stripe().checkout.sessions.create({
    mode: mode === "subscription" ? "subscription" : "payment",
    payment_method_types: ["card", "blik"],
    line_items: mode === "subscription"
      ? [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }]
      : [{
          price_data: {
            currency: "pln",
            unit_amount: PRICES.ONETIME_GROSZ,
            product_data: { name: `Monitoring przesiadki: ${trainNumber} → ${destination}` },
          },
          quantity: 1,
        }],
    client_reference_id: sessionId,
    metadata: { sessionId, trainNumber, destination, mode },
    success_url: `${origin}/sukces?session_id=${sessionId}`,
    cancel_url: `${origin}/wynik?train=${encodeURIComponent(trainNumber)}&destination=${encodeURIComponent(destination)}`,
  });

  db().prepare(`UPDATE monitoring_sessions SET stripe_session_id = ? WHERE id = ?`).run(checkout.id, sessionId);

  return NextResponse.redirect(checkout.url!, 303);
}
