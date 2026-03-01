import { Coordinate } from "./RouteService";

const MAX_ENTRIES = 30;
const TTL_MS = 60 * 60 * 1000;

export interface CachedRouteEntry {
  routeData: any;
  alternatives?: {
    coords: Coordinate[];
    duration: number;
    distance: number;
  }[];
  timestamp: number;
}

const store = new Map<string, CachedRouteEntry>();

function evictIfFull(): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
}

function isExpired(entry: CachedRouteEntry): boolean {
  return Date.now() - entry.timestamp > TTL_MS;
}

export const RouteCacheService = {
  generateCacheKey(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    mode: string,
    options?: {
      alternatives?: number;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    },
  ): string {
    const r = (n: number) => n.toFixed(5);
    let key = `${r(startLat)},${r(startLng)}->${r(endLat)},${r(endLng)}|${mode}`;
    if (options) {
      if (options.avoidTolls) key += "|notoll";
      if (options.avoidHighways) key += "|nohwy";
      if (options.alternatives) key += `|alt${options.alternatives}`;
    }
    return key;
  },

  async getCachedRoute(key: string): Promise<CachedRouteEntry | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(key);
      return null;
    }

    store.delete(key);
    store.set(key, entry);
    return entry;
  },

  async setCachedRoute(
    key: string,
    routeData: any,
    alternatives?: {
      coords: Coordinate[];
      duration: number;
      distance: number;
    }[],
  ): Promise<void> {
    store.delete(key);
    evictIfFull();
    store.set(key, {
      routeData,
      alternatives,
      timestamp: Date.now(),
    });
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  clear(): void {
    store.clear();
  },

  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: store.size, maxSize: MAX_ENTRIES, ttlMs: TTL_MS };
  },
};
