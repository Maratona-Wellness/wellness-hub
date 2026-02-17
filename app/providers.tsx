"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper de providers globais da aplicação
 * Inclui SessionProvider do NextAuth para gerenciamento de sessão
 */
export function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
