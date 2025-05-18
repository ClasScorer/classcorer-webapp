import { redis } from './prisma';

const CACHE_TTL = 60 * 5; // 5 minute cache

export interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
}

/**
 * Generates a cache key based on the query parameters
 */
export function generateStudentsCacheKey(params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `students:${sortedParams}`;
}

/**
 * Gets data from cache if available, otherwise fetches it and caches the result
 */
export async function getCachedData<T>(
  cacheKey: string, 
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = CACHE_TTL, skipCache = false } = options;
  
  // Skip cache if requested or redis is not available
  if (skipCache || !redis) {
    return fetchFn();
  }
  
  try {
    // Try to get from cache
    const cachedData = await redis.get<T>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch data
    const data = await fetchFn();
    
    // Cache the result
    await redis.set(cacheKey, data, { ex: ttl });
    
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct fetch if cache fails
    return fetchFn();
  }
}

/**
 * Invalidates cache entries related to students
 */
export async function invalidateStudentsCache(studentId?: string): Promise<void> {
  if (!redis) return;
  
  try {
    if (studentId) {
      // Invalidate specific student cache
      await redis.del(`student:${studentId}`);
      
      // Get keys matching the pattern and delete them
      const keys = await redis.keys('students:*');
      if (keys.length > 0) {
        // Delete each key individually
        for (const key of keys) {
          await redis.del(key);
        }
      }
    } else {
      // Invalidate all student-related caches
      const keys = await redis.keys('students:*');
      if (keys.length > 0) {
        // Delete each key individually
        for (const key of keys) {
          await redis.del(key);
        }
      }
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Caches a specific student by ID
 */
export async function cacheStudent(studentId: string, data: any, options: CacheOptions = {}): Promise<void> {
  if (!redis) return;
  
  const { ttl = CACHE_TTL } = options;
  
  try {
    await redis.set(`student:${studentId}`, data, { ex: ttl });
  } catch (error) {
    console.error('Error caching student:', error);
  }
}

/**
 * Gets a cached student by ID
 */
export async function getCachedStudent(studentId: string): Promise<any | null> {
  if (!redis) return null;
  
  try {
    return await redis.get(`student:${studentId}`);
  } catch (error) {
    console.error('Error getting cached student:', error);
    return null;
  }
} 