import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single string, resolving Tailwind CSS conflicts
 * 
 * @example
 * cn("text-red-500", "text-lg", isActive && "bg-blue-500")
 * // => "text-red-500 text-lg bg-blue-500" (if isActive is true)
 * 
 * @param inputs - Class values to merge
 * @returns A merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 