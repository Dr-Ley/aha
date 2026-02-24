"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { CURRENCIES, type CurrencyCode } from "@/lib/data"

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatPrice: (usdAmount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  const formatPrice = useCallback(
    (usdAmount: number) => {
      const curr = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]
      const converted = Math.round(usdAmount * curr.rate)
      return `${curr.symbol}${converted.toLocaleString()}`
    },
    [currency],
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}
