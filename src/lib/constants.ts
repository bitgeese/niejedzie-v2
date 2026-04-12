export const PRICES = {
  ONETIME_GROSZ: 500,
  MONTHLY_GROSZ: 1500,
} as const;

export const TRAIN_OPERATORS: Record<string, { name: string; color: string }> = {
  IC: { name: "PKP Intercity", color: "red" },
  PR: { name: "PolRegio", color: "blue" },
  KD: { name: "Koleje Dolnośląskie", color: "blue" },
  KS: { name: "Koleje Śląskie", color: "blue" },
  KW: { name: "Koleje Wielkopolskie", color: "blue" },
  LKA: { name: "Łódzka Kolej Aglomeracyjna", color: "blue" },
  KML: { name: "Koleje Małopolskie", color: "blue" },
  KM: { name: "Koleje Mazowieckie", color: "green" },
  SKM: { name: "SKM Trójmiasto", color: "green" },
  SKMT: { name: "SKM Warszawa", color: "green" },
  WKD: { name: "WKD", color: "green" },
  AR: { name: "Arriva RP", color: "purple" },
  RJ: { name: "RegioJet", color: "purple" },
  LEO: { name: "Leo Express", color: "purple" },
  UNKNOWN: { name: "Nieznany przewoźnik", color: "gray" },
};

const SHORT_TO_CODE: Record<string, keyof typeof TRAIN_OPERATORS> = {
  IC: "IC", EIC: "IC", EIP: "IC", TLK: "IC",
  PR: "PR",
  KD: "KD", KS: "KS", KW: "KW",
  KM: "KM", "KMŁ": "KML",
  "ŁKA": "LKA",
  SKM: "SKM", SKMT: "SKMT", WKD: "WKD",
  AR: "AR", RJ: "RJ",
  LEO: "LEO", "LEO EXPRESS": "LEO",
};

export function carrierToCode(carrier?: string | null): keyof typeof TRAIN_OPERATORS {
  if (!carrier) return "UNKNOWN";
  const trimmed = carrier.trim();
  return SHORT_TO_CODE[trimmed.toUpperCase()] ?? SHORT_TO_CODE[trimmed] ?? "UNKNOWN";
}
