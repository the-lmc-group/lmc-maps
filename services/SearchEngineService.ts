export interface PhotonGeometry {
  type: "Point";
  coordinates: [number, number];
}

export interface PhotonProperties {
  osm_type: string;
  osm_id: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  postcode?: string;
  countrycode?: string;
  name?: string;
  street?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  extent?: number[];
  housenumber?: string;
}

export interface PhotonFeature {
  type: "Feature";
  properties: PhotonProperties;
  geometry: PhotonGeometry;
}

export interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

export class SearchEngineService {
  private static readonly BASE_URL = "https://photon.komoot.io/api";

  static async photonSearch(
    query: string,
    options?: {
      limit?: number;
      lat?: number;
      lon?: number;
    },
  ): Promise<PhotonFeature[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: (options?.limit || 5).toString(),
      });

      if (
        typeof options?.lat === "number" &&
        typeof options?.lon === "number"
      ) {
        params.append("lat", options.lat.toString());
        params.append("lon", options.lon.toString());
      }

      const url = `${this.BASE_URL}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Photon search failed: ${response.status}`);
      }

      const data: PhotonResponse = await response.json();
      const results = data.features || [];

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
            const [lon, lat] = r.geometry.coordinates;
            r._distance = haversine(lat1, lon1, lat, lon);
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
        return String(s)
          .toLowerCase()
          .replace(/[\d]+/g, "")
          .replace(/[\p{Diacritic}]/gu, "")
          .replace(/[\-_,()\/]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      };

      const stationCandidates: Record<string, PhotonFeature> = {};
      const otherCandidates: Record<string, PhotonFeature> = {};

      const tokenStationish = (
        name?: string,
        street?: string,
        osmVal?: string,
      ) => {
        if (!name && !street && !osmVal) return false;
        if (name && /\b(gare|station|routi\w*|gare routi\w*)\b/i.test(name))
          return true;
        if (street && /\b(quai|platform|platforme|voie)\b/i.test(street))
          return true;
        const v = (osmVal || "").toLowerCase();
        return [
          "train_station",
          "train_station_entrance",
          "bus_station",
          "bus_stop",
          "platform",
        ].includes(v);
      };

      const stationKeyFor = (props: any) => {
        const name = props.name || "";
        const city = props.city || "";
        let base = name;
        base = base.replace(
          /\b(sud|north|sud|east|ouest|centre|center|central)\b/gi,
          "",
        );
        base = base.replace(/\b(de|du|la|le|l|the|a|an)\b/gi, "");
        base = base.replace(
          /\b(quai|platform|platforme|plateforme|voie|gare routière|gare)\b/gi,
          "gare",
        );
        base = base
          .replace(/[\-_,()\/]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return normalize(base) + "|" + (normalize(city) || "");
      };

      const otherKeyFor = (props: any) => {
        return normalize(props.name || props.street || props.city || "");
      };

      for (const r of results) {
        const props: any = r.properties || {};

        if (props.housenumber) {
          const k = `address:${normalize(props.housenumber + " " + (props.street || props.name || ""))}|${normalize(props.city || "")}`;
          if (!otherCandidates[k]) otherCandidates[k] = r;
          else {
            const existing = otherCandidates[k] as any;
            const curr = (r as any)._distance ?? Number.POSITIVE_INFINITY;
            const ex = existing._distance ?? Number.POSITIVE_INFINITY;
            if (curr < ex) otherCandidates[k] = r;
          }
          continue;
        }

        const looksLikeStation = tokenStationish(
          props.name,
          props.street,
          props.osm_value,
        );

        if (looksLikeStation) {
          const key = stationKeyFor(props);
          if (!key) continue;
          if (!stationCandidates[key]) stationCandidates[key] = r;
          else {
            const existing = stationCandidates[key] as any;
            const curr = (r as any)._distance ?? Number.POSITIVE_INFINITY;
            const ex = existing._distance ?? Number.POSITIVE_INFINITY;
            if (curr < ex) stationCandidates[key] = r;
          }
        } else {
          const key = otherKeyFor(props);
          if (!key) continue;
          if (!otherCandidates[key]) otherCandidates[key] = r;
          else {
            const existing = otherCandidates[key] as any;
            const curr = (r as any)._distance ?? Number.POSITIVE_INFINITY;
            const ex = existing._distance ?? Number.POSITIVE_INFINITY;
            if (curr < ex) otherCandidates[key] = r;
          }
        }
      }

      const used = new Set<string>();
      const output: PhotonFeature[] = [];

      for (const r of results) {
        const props: any = r.properties || {};
        let pickKey = "";

        if (props.housenumber) {
          pickKey = `address:${normalize(props.housenumber + " " + (props.street || props.name || ""))}|${normalize(props.city || "")}`;
          if (used.has(pickKey)) continue;
          used.add(pickKey);
          output.push(otherCandidates[pickKey]);
          continue;
        }

        if (tokenStationish(props.name, props.street, props.osm_value)) {
          const sk = stationKeyFor(props);
          if (!sk || used.has(`station:${sk}`)) continue;
          used.add(`station:${sk}`);
          output.push(stationCandidates[sk]);
          continue;
        }

        const ok = otherKeyFor(props);
        if (!ok || used.has(`other:${ok}`)) continue;
        used.add(`other:${ok}`);
        output.push(otherCandidates[ok]);
      }

      return output.length > 0 ? output : results;
    } catch {
      return [];
    }
  }
}
