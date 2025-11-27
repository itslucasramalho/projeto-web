import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = "citizen" | "admin" | "verified";

export const isAdminRole = (role?: UserRole | null) => role === "admin";

export const isVerifiedRole = (role?: UserRole | null) => role === "verified";

export const canManageLaws = (role?: UserRole | null) =>
  isAdminRole(role) || isVerifiedRole(role);

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
