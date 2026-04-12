import webpush from "web-push";

let _configured = false;

function configure(): boolean {
  if (_configured) return true;
  const PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const SUBJECT = process.env.VAPID_SUBJECT || "mailto:kontakt@niejedzie.pl";
  if (!PUBLIC || !PRIVATE) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  _configured = true;
  return true;
}

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string },
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  if (!configure()) return { ok: false, error: "VAPID keys not configured" };
  try {
    const res = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, statusCode: res.statusCode };
  } catch (err: any) {
    return { ok: false, statusCode: err.statusCode, error: err.message };
  }
}
