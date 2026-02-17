import { type ClassValue, clsx } from "clsx";

/**
 * Utility para combinar classes CSS condicionalmente
 * Wrapper do clsx para consistência
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
