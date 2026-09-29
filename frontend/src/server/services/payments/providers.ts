export const PAYMENT_PROVIDERS = ["manual", "cash", "bank", "card", "m-pesa"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_METHODS = ["M-Pesa", "Cash", "Card", "Bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "completed", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type RecordPaymentInput = {
  companyId: string;
  amount: number;
  currency?: string;
  provider?: PaymentProvider | null;
  method?: string | null;
  status?: PaymentStatus;
  notes?: string | null;
  bookingId?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
  idempotencyKey?: string | null;
  recordedAt?: Date | null;
};

export type PaymentProviderAdapter = {
  id: PaymentProvider;
  displayMethod: string;
  /** Architecture only — no live card/M-Pesa capture. */
  prepare(input: RecordPaymentInput): RecordPaymentInput;
};

function passthrough(id: PaymentProvider, displayMethod: string): PaymentProviderAdapter {
  return {
    id,
    displayMethod,
    prepare(input) {
      return { ...input, provider: id, method: input.method ?? displayMethod };
    },
  };
}

const adapters: Record<PaymentProvider, PaymentProviderAdapter> = {
  manual: passthrough("manual", "Manual"),
  cash: passthrough("cash", "Cash"),
  bank: passthrough("bank", "Bank"),
  card: passthrough("card", "Card"),
  "m-pesa": passthrough("m-pesa", "M-Pesa"),
};

export function isPaymentProvider(value: string | null | undefined): value is PaymentProvider {
  return PAYMENT_PROVIDERS.includes(value as PaymentProvider);
}

export function providerFromMethod(method?: string | null): PaymentProvider {
  const m = String(method ?? "").trim().toLowerCase();
  if (m.includes("pesa")) return "m-pesa";
  if (m === "cash") return "cash";
  if (m === "bank") return "bank";
  if (m === "card") return "card";
  return "manual";
}

export function getPaymentProvider(id?: string | null, method?: string | null): PaymentProviderAdapter {
  const key = isPaymentProvider(id) ? id : providerFromMethod(method);
  return adapters[key];
}
