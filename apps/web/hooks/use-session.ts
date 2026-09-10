"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "../lib/auth";

export const SESSION_QUERY_KEY = ["session"] as const;

export function useSession() {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: query.data?.user,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.user,
    refetch: query.refetch,
  };
}
