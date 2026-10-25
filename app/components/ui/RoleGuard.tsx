"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "@/lib/auth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ("picker" | "aggregator" | "recycler" | "producer")[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!data.session || !allowedRoles.includes(data.session.role)) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, allowedRoles]);

  return <>{children}</>;
}

export async function requireRole(
  allowedRoles: ("picker" | "aggregator" | "recycler" | "producer")[]
): Promise<{ session: { role: string; [key: string]: unknown } } | { redirect: string }> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { redirect: "/login" };
  const data = await res.json();
  if (!data.session || !allowedRoles.includes(data.session.role)) {
    return { redirect: "/login" };
  }
  return { session: data.session };
}