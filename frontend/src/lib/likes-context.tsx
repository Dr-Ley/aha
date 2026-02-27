"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR from "swr";
import { useAuth } from "./auth-context";

interface Like {
  id: number;
  tourId?: number;
  accommodationId?: number;
  createdAt: string;
}

interface LikesContextType {
  likes: Like[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch likes');
  return res.json();
};

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Only fetch when user is logged in
  const { data, error, isLoading, mutate } = useSWR(
    user ? '/api/likes' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: false,
      dedupingInterval: 100, // 5 seconds
      refreshInterval: 0, // 
      fallbackData: { likes: [] },
    }
  );

  return (
    <LikesContext.Provider 
      value={{ 
        likes: data?.likes || [], 
        isLoading, 
        error, 
        mutate 
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) throw new Error("useLikes must be used within LikesProvider");
  return context;
}