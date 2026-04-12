import { TRAIN_OPERATORS, carrierToCode } from "@/lib/constants";

export default function TrainOperator({ trainNumber, carrier }: { trainNumber: string; carrier?: string | null }) {
  const code = carrierToCode(carrier);
  const op = TRAIN_OPERATORS[code];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono font-semibold">{trainNumber}</span>
      <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium badge-${op.color}`} title={op.name}>
        {code === "UNKNOWN" ? "?" : code}
      </span>
    </span>
  );
}
