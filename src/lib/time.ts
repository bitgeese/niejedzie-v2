const WARSAW_TZ = "Europe/Warsaw";

function warsawParts(now = new Date()): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function todayWarsaw(): string {
  const { year, month, day } = warsawParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function yesterdayWarsaw(): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 24);
  const { year, month, day } = warsawParts(d);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
