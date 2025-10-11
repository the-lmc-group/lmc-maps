import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedRoute {
  routeData: any;
  alternatives?: Array<{ coords: any[]; duration: number; distance: number }>;
  timestamp: number;
  cacheKey: string;
}

const CACHE_PREFIX = 'route_cache_';
const CACHE_DURATION_MS = 48 * 60 * 60 * 1000;

export class RouteCacheService {
  static generateCacheKey(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    mode: string,
    options?: { alternatives?: number; avoidTolls?: boolean; avoidHighways?: boolean }
  ): string {
    const roundedStartLat = startLat.toFixed(4);
    const roundedStartLon = startLon.toFixed(4);
    const roundedEndLat = endLat.toFixed(4);
    const roundedEndLon = endLon.toFixed(4);
    
    const opts = options
      ? `_alt${options.alternatives || 1}_tolls${options.avoidTolls ? 1 : 0}_hw${options.avoidHighways ? 1 : 0}`
      : '';
    
    return `${CACHE_PREFIX}${mode}_${roundedStartLat}_${roundedStartLon}_${roundedEndLat}_${roundedEndLon}${opts}`;
  }

  static async getCachedRoute(cacheKey: string): Promise<CachedRoute | null> {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      const cachedRoute: CachedRoute = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cachedRoute.timestamp > CACHE_DURATION_MS) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cachedRoute;
    } catch (error) {
      console.error('[RouteCacheService] Error reading cache:', error);
      return null;
    }
  }

  static async setCachedRoute(
    cacheKey: string,
    routeData: any,
    alternatives?: Array<{ coords: any[]; duration: number; distance: number }>
  ): Promise<void> {
    try {
      const cachedRoute: CachedRoute = {
        routeData,
        alternatives,
        timestamp: Date.now(),
        cacheKey,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedRoute));
    } catch (error) {
      console.error('[RouteCacheService] Error writing cache:', error);
    }
  }

  static async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const routeCacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (const key of routeCacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const cachedRoute: CachedRoute = JSON.parse(cached);
            if (now - cachedRoute.timestamp > CACHE_DURATION_MS) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('[RouteCacheService] Error clearing expired cache:', error);
    }
  }

  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const routeCacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (routeCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(routeCacheKeys);
      }
    } catch (error) {
      console.error('[RouteCacheService] Error clearing all cache:', error);
    }
  }
}
