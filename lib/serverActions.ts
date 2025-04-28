"use server"

/**
 * Server-side formatDate function to be used in client components
 * Includes a cache to minimize repetitive formatting
 */
const dateFormatCache = new Map<string, string>();

export async function formatDateServer(date: Date | string): Promise<string> {
  const dateString = date.toString();
  
  // Return from cache if available
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!;
  }
  
  // Otherwise format and cache the result
  const d = new Date(date);
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  dateFormatCache.set(dateString, formatted);
  return formatted;
} 