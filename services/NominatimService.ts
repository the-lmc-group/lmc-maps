export interface NominatimAddress {
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
  highway?: string;
  road?: string;
  house_number?: string;
}

export interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  addresstype: "highway" | "road";
  class?: string;
  type?: string;
  address: NominatimAddress;
  boundingbox: string[];
}

export interface NominatimReverseResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  address: NominatimAddress;
}

export class NominatimService {
  private static readonly BASE_URL = "https://nominatim.openstreetmap.org";
  private static readonly DEFAULT_HEADERS = {
    "User-Agent": "LMC-Maps/3.0.0",
    Referer: "https://lmcgroup.xyz/",
  };

  static async search(
    query: string,
    options?: {
      limit?: number;
      countryCode?: string;
      bounded?: boolean;
      viewbox?: string;
      lat?: number;
      lon?: number;
    },
  ): Promise<NominatimSearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: (options?.limit || 5).toString(),
      });

      if (options?.countryCode) {
        params.append("countrycodes", options.countryCode);
      }

      if (options?.bounded) {
        params.append("bounded", "1");
      }

      if (options?.viewbox) {
        params.append("viewbox", options.viewbox);
      }
      if (
        typeof options?.lat === "number" &&
        typeof options?.lon === "number"
      ) {
        params.append("lat", options.lat.toString());
        params.append("lon", options.lon.toString());
      }

      const response = await fetch(
        `${this.BASE_URL}/search?${params.toString()}`,
        { headers: this.DEFAULT_HEADERS },
      );

      if (!response.ok) {
        throw new Error(`Nominatim search failed: ${response.status}`);
      }

      const results: NominatimSearchResult[] = await response.json();

      if (
        typeof options?.lat === "number" &&
        typeof options?.lon === "number"
      ) {
        const lat1 = options.lat;
        const lon1 = options.lon;

        const haversine = (
          aLat: number,
          aLon: number,
          bLat: number,
          bLon: number,
        ) => {
          const R = 6371e3;
          const φ1 = (aLat * Math.PI) / 180;
          const φ2 = (bLat * Math.PI) / 180;
          const Δφ = ((bLat - aLat) * Math.PI) / 180;
          const Δλ = ((bLon - aLon) * Math.PI) / 180;

          const aa =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
          return (R * c) / 1000;
        };

        results.forEach((r: any) => {
          try {
            r._distance = haversine(
              lat1,
              lon1,
              parseFloat(r.lat),
              parseFloat(r.lon),
            );
          } catch {
            r._distance = Number.POSITIVE_INFINITY;
          }
        });

        results.sort(
          (a: any, b: any) => (a._distance || 0) - (b._distance || 0),
        );
      }

      const normalize = (s: string | undefined) => {
        if (!s) return "";
        return String(s).toLowerCase().replace(/\d+/g, "").trim();
      };

      const grouped: Record<string, NominatimSearchResult> = {};
      for (const r of results) {
        const rawKey =
          r?.address?.highway || r?.address?.road || r?.display_name || "";
        const key = normalize(String(rawKey));

        if (!key) continue;

        if (!grouped[key]) {
          grouped[key] = r;
        } else {
          const existing = grouped[key] as any;
          const currentDist = (r as any)._distance ?? Number.POSITIVE_INFINITY;
          const existingDist = existing._distance ?? Number.POSITIVE_INFINITY;
          if (currentDist < existingDist) {
            grouped[key] = r;
          }
        }
      }

      const seen = new Set<string>();
      const deduped: NominatimSearchResult[] = [];
      for (const r of results) {
        const rawKey =
          r?.address?.highway || r?.address?.road || r?.display_name || "";
        const key = normalize(String(rawKey));
        if (!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push(grouped[key]);
      }

      return deduped.length > 0 ? deduped : results;
    } catch {
      return [];
    }
  }

  static async reverse(
    lat: number,
    lon: number,
    options?: {
      zoom?: number;
      addressDetails?: boolean;
    },
  ): Promise<NominatimReverseResult | null> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: "json",
        zoom: (options?.zoom || 18).toString(),
        addressdetails: options?.addressDetails !== false ? "1" : "0",
      });

      const response = await fetch(
        `${this.BASE_URL}/reverse?${params.toString()}`,
        { headers: this.DEFAULT_HEADERS },
      );

      if (!response.ok) {
        throw new Error(`Nominatim reverse failed: ${response.status}`);
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  static getAdaptiveZoom(address: NominatimAddress): number {
    if (address.road) {
      const road = address.road.toLowerCase();

      if (
        road.includes("autoroute") ||
        (road.startsWith("a") && /^\d+$/.test(road.slice(1))) ||
        road.includes("motorway")
      ) {
        return 10;
      }

      if (
        (road.startsWith("n") && /^\d+$/.test(road.slice(1))) ||
        road.includes("route nationale") ||
        road.includes("national road")
      ) {
        return 17;
      }

      if (
        (road.startsWith("d") && /^\d+$/.test(road.slice(1))) ||
        road.includes("route départementale") ||
        road.includes("departmental road")
      ) {
        return 18;
      }

      if (
        (road.startsWith("c") && /^\d+$/.test(road.slice(1))) ||
        road.includes("rue") ||
        road.includes("street") ||
        road.includes("chemin") ||
        road.includes("impasse") ||
        road.includes("alley") ||
        road.includes("lane")
      ) {
        return 19;
      }
    }

    if (address.city || address.town || address.municipality) {
      return 18;
    }

    if (address.village || address.hamlet || address.suburb) {
      return 17;
    }

    if (address.county || address.state) {
      return 16;
    }

    return 15;
  }

  static async getZoomForLocation(lat: number, lon: number): Promise<number> {
    const result = await this.reverse(lat, lon, { zoom: 10 });

    if (result?.address) {
      return this.getAdaptiveZoom(result.address);
    }

    return 14;
  }

  static async searchCoordinates(query: string): Promise<{
    latitude: number;
    longitude: number;
    displayName: string;
  } | null> {
    const results = await this.search(query, { limit: 1 });

    if (results.length > 0) {
      const result = results[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    return null;
  }

  static formatAddress(address: NominatimAddress): string {
    const parts: string[] = [];

    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village!);
    }

    if (address.postcode) {
      parts.push(address.postcode);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(", ");
  }
}
