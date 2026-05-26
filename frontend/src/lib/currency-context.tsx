"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react"
import {
  CURRENCIES,
  type CurrencyCode,
  amountInCurrencyToUsdFloat,
  formatUsdForDisplay,
  getCurrencyByCode,
} from "@/lib/data"

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  /** `usdAmount` is stored canonical USD (same unit as tour prices in `data.ts`). */
  formatPrice: (usdAmount: number) => string
  /** Format a value that was stored in `originalCurrency` into the viewer's selected currency. */
  formatMoney: (amount: number, originalCurrency: string) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  const formatPrice = useCallback(
    (usdAmount: number) => formatUsdForDisplay(usdAmount, currency),
    [currency]
  )

  const formatMoney = useCallback(
    (amount: number, originalCurrency: string) => {
      const orig = getCurrencyByCode(originalCurrency)
      if (!Number.isFinite(amount)) return `${orig.symbol}0`
      /** Avoid KES→USD→KES round-trip when viewer currency matches stored currency (fixes ~tens of KES drift). */
      if (currency === orig.code) {
        return `${orig.symbol}${Math.round(amount).toLocaleString()}`
      }
      const usd = amountInCurrencyToUsdFloat(amount, originalCurrency)
      return formatUsdForDisplay(usd, currency)
    },
    [currency],
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}

type CurrencyFormSelectProps = {
  id?: string
  value: CurrencyCode
  onChange: (code: CurrencyCode) => void
  className?: string
  style?: CSSProperties
  "aria-label"?: string
}

/** Compact select for forms (dashboard and elsewhere). */
export function CurrencyFormSelect({
  id,
  value,
  onChange,
  className = "select select-bordered select-sm",
  style,
  "aria-label": ariaLabel = "Currency",
}: CurrencyFormSelectProps) {
  return (
    <select
      id={id}
      className={className}
      style={style}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code}
        </option>
      ))}
    </select>
  )
}
