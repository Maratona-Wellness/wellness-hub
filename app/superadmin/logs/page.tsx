"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * @deprecated Esta página foi removida. Redireciona para o dashboard.
 */
export default function DeprecatedLogsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
