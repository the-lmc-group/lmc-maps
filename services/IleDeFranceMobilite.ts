import type { IDFMRouteResponse } from "../types/IDFMRouteResponse";

const BASE = "http://fr1.orionhost.xyz:5004/api/v1";

type NextDeparture = { lineRef: string; destination: string; expectedTime: Date | null; minutesUntil: number | null; platform?: string | null; raw?: any, delay?: number; realtime?: boolean; lineColor?: string; lineTextColor?: string };
type NearbyStop = { stop_id: string; stop_name: string; lat?: number; lon?: number; distance?: number; id?: number | string; postal_region?: string | null; lines?: Array<{ mode?: string; route_id?: string; line_name?: string; operator_name?: string }>; raw?: any };
type DisruptionMessage = { id: string; severity: string; summary: string; detail?: string; affectedLines: string[]; affectedStops?: string[]; startTime?: Date; endTime?: Date; raw?: any };
type LineSearchResult = { id: string; name: string; mode?: string; publishedName?: string; operators?: string[]; raw?: any };
type LineDetail = { id: string; name: string; mode?: string; commercialName?: string; stops?: { id: string; name: string; coord?: { lat: number; lon: number } }[]; raw?: any };
type RouteSegment = { duration: number; distance?: number; mode?: string; from: { lat: number; lon: number; name?: string }; to: { lat: number; lon: number; name?: string }; displayInstructions?: string[]; raw?: any };
type RoutePlan = { duration: number; arrival: Date | null; departure: Date | null; segments: RouteSegment[]; raw?: any };

export default class PrimTransportService {
  private static async fetchJson(url: string, opts: RequestInit = {}) {
    try {
      const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}),  } });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  static async fetchStopsNear(lat: number, lon: number, radiusMeters = 500, limit = 50): Promise<NearbyStop[] | null> {
    try {
      const url = `${BASE}/transports/stops/near?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=${encodeURIComponent(radiusMeters)}&limit=${encodeURIComponent(limit)}`;
      const res = await PrimTransportService.fetchJson(url);
      const stops = res?.stops ?? res?.data ?? res ?? [];
      if (!Array.isArray(stops)) return null;
      return stops.map((s: any) => ({
        stop_id: s?.stop_id ?? s?.stopId ?? s?.id ?? '',
        stop_name: s?.stop_name ?? s?.name ?? s?.label ?? '',
        lat: s?.lat ?? s?.latitude ?? undefined,
        lon: s?.lon ?? s?.longitude ?? undefined,
        distance: s?.distance ?? undefined,
        id: s?.id ?? undefined,
        postal_region: s?.postal_region ?? s?.postalRegion ?? null,
        lines: Array.isArray(s?.lines) ? s.lines.map((l: any) => ({ mode: l?.mode, route_id: l?.route_id ?? l?.routeId ?? l?.id, line_name: l?.line_name ?? l?.name ?? l?.label, operator_name: l?.operator_name })) : undefined,
        raw: s,
      }));
    } catch (_) {
      return null;
    }
  }

  static async fetchDeparturesByCoords(lat: number, lon: number, radiusMeters = 200): Promise<NextDeparture[] | null> {
    try {
      const stops = await PrimTransportService.fetchStopsNear(lat, lon, radiusMeters, 6);
      if (!stops || stops.length === 0) return null;
      const all: NextDeparture[] = [];
      for (const s of stops) {
        const rawStop: any = s;
        const stopId = rawStop?.stop_id ?? rawStop?.stopId ?? rawStop?.id ?? rawStop?.MonitoringRef ?? rawStop?.code;
        if (!stopId) continue;
        const at = encodeURIComponent(new Date().toISOString());
        const deps = await PrimTransportService.fetchJson(`${BASE}/transports/departures/${encodeURIComponent(stopId)}?at=${at}`);
        const items = deps?.departures ?? deps?.data?.departures ?? deps?.data ?? deps ?? [];
        for (const d of items) {
          let expected: Date | null = null;
          const now = Date.now();
          const timeStr = d?.expected_departure_time ?? d?.expected_time ?? d?.departure_time ?? d?.expected ?? null;
          if (timeStr && typeof timeStr === 'string') {
            if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
              const parts = timeStr.split(':').map((p: string) => parseInt(p, 10));
              const dt = new Date();
              dt.setHours(parts[0], parts[1], parts[2] || 0, 0);
              if (dt.getTime() - now < -12 * 3600 * 1000) dt.setDate(dt.getDate() + 1);
              expected = dt;
            } else {
              const parsed = new Date(timeStr);
              if (!Number.isNaN(parsed.getTime())) expected = parsed;
            }
          }
          const delaySec = Number(d?.delay ?? 0) || 0;
          const minutes = expected ? Math.round((expected.getTime() + delaySec * 1000 - now) / 60000) : (d?.minutes ?? null);
          const lineLabel = (d?.line_name ?? d?.line_id ?? d?.line) || d?.lineRef || '';
          const lineInfo = d?.line_info;
          all.push({ 
            lineRef: lineLabel, 
            destination: d?.destination ?? d?.headsign ?? '', 
            expectedTime: expected, 
            minutesUntil: minutes, 
            platform: d?.platform ?? d?.quay ?? null, 
            raw: { stop: s, departure: d }, 
            delay: rawStop.delay || 0, 
            realtime: rawStop.realtime || false,
            lineColor: lineInfo?.color,
            lineTextColor: lineInfo?.text_color
          });
        }
      }
      return all;
    } catch (_) {
      return null;
    }
  }

  static async fetchNextDeparturesForStop(stopRef: string, lineRef?: string): Promise<NextDeparture[] | null> {
    try {
      const at = encodeURIComponent(new Date().toISOString());
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/departures/${encodeURIComponent(stopRef)}?at=${at}${lineRef ? `&line=${encodeURIComponent(lineRef)}` : ''}`);
      if (!res) return null;
      const items = res?.departures ?? res?.data?.departures ?? res?.data ?? res ?? [];
      const now = Date.now();
      return (items || []).map((d: any) => {
        const timeStr = d?.expected_departure_time ?? d?.expected_time ?? d?.departure_time ?? d?.expected ?? null;
        let expected: Date | null = null;
        if (timeStr && typeof timeStr === 'string') {
          if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            const parts = timeStr.split(':').map((p: string) => parseInt(p, 10));
            
            const dt = new Date();
            dt.setHours(parts[0], parts[1], parts[2] || 0, 0);
            
            const diffMs = dt.getTime() - now;
            if (diffMs < -12 * 3600 * 1000) {
              dt.setDate(dt.getDate() + 1);
            }
            
            expected = dt;
          } else {
            const parsed = new Date(timeStr);
            if (!Number.isNaN(parsed.getTime())) expected = parsed;
          }
        }
        const delaySec = Number(d?.delay ?? 0) || 0;
        const minutes = expected ? Math.round((expected.getTime() + delaySec * 1000 - now) / 60000) : (d?.minutes ?? null);
        const lineLabel = (d?.line_name ?? d?.line_id ?? d?.line) || d?.lineRef || '';
        const lineInfo = d?.line_info;
        const result = { 
          lineRef: lineLabel, 
          destination: d?.destination ?? d?.headsign ?? '', 
          expectedTime: expected, 
          minutesUntil: minutes, 
          platform: d?.platform ?? d?.quay ?? null, 
          realtime: d?.realtime ?? false,
          lineColor: lineInfo?.color,
          lineTextColor: lineInfo?.text_color,
          raw: d 
        } as NextDeparture;
        return result;
      });
    } catch (_) {
      return null;
    }
  }

  static async fetchStopById(stopRef: string, includeDepartures: boolean = false): Promise<any | null> {
    try {
      const params = new URLSearchParams();
      if (includeDepartures) {
        params.append('include_departures', 'true');
        params.append('at', new Date().toISOString());
      }
      const url = `${BASE}/transports/stops/${encodeURIComponent(stopRef)}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await PrimTransportService.fetchJson(url);
      if (!res) return null;
      return res;
    } catch (_) {
      return null;
    }
  }

  static async fetchDisruptionMessages(lineRef?: string, stopRef?: string): Promise<DisruptionMessage[] | null> {
    try {
      const params: string[] = [];
      if (lineRef) params.push(`line=${encodeURIComponent(lineRef)}`);
      if (stopRef) params.push(`stop=${encodeURIComponent(stopRef)}`);
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/disruptions${params.length ? '?' + params.join('&') : ''}`);
      if (!res) return null;
      const msgs = res?.messages ?? res?.data ?? res ?? [];
      return (msgs || []).map((m: any) => ({ id: m?.id ?? m?.messageId ?? String(Math.random()), severity: m?.severity ?? m?.level ?? 'info', summary: m?.summary ?? m?.title ?? '', detail: m?.detail ?? m?.description ?? m?.text ?? '', affectedLines: m?.lines ?? m?.affected_lines ?? [], affectedStops: m?.stops ?? m?.affected_stops ?? [], startTime: m?.start ? new Date(m.start) : undefined, endTime: m?.end ? new Date(m.end) : undefined, raw: m }));
    } catch (_) {
      return null;
    }
  }

  static async searchLines(query: string, mode?: string): Promise<LineSearchResult[] | null> {
    try {
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/lines?q=${encodeURIComponent(query)}${mode ? `&mode=${encodeURIComponent(mode)}` : ''}`);
      if (!res) return null;
      const items = res?.lines ?? res?.data ?? res ?? [];
      const mapped: LineSearchResult[] = (items || []).map((l: any) => ({
        id: l?.id ?? l?.LineRef ?? l?.code ?? "",
        name: l?.name ?? l?.label ?? l?.publishedName ?? "",
        mode: l?.mode ?? l?.transportMode ?? undefined,
        publishedName: l?.publishedName ?? l?.name ?? undefined,
        operators: l?.operators ?? l?.operator ? [l.operator] : [],
        raw: l,
      }));
      return mapped;
    } catch (_) {
      return null;
    }
  }

  static async getLineDetails(lineRef: string): Promise<LineDetail | null> {
    try {
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/lines/${encodeURIComponent(lineRef)}`);
      if (!res) return null;
      const l = res?.line ?? res?.data ?? res ?? {};
      const stopsRaw = l?.stops ?? l?.stopPoints ?? [];
      const stops = (stopsRaw || []).map((s: any) => ({ id: s?.id ?? s?.stopId ?? '', name: s?.name ?? s?.label ?? '', coord: s?.lat && s?.lon ? { lat: Number(s.lat), lon: Number(s.lon) } : s?.coord ? { lat: Number(s.coord.lat), lon: Number(s.coord.lon) } : undefined }));
      return { id: l?.id ?? lineRef, name: l?.name ?? l?.label ?? '', mode: l?.mode ?? undefined, commercialName: l?.commercialName ?? l?.publishedName ?? undefined, stops, raw: l };
    } catch (_) {
      return null;
    }
  }

  static async planRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }, options?: { datetimeISO?: string; optimize?: "fastest" | "least_transfers" | "walking" }): Promise<RoutePlan | null> {
    try {
      const params: string[] = [];
      params.push(`from=${encodeURIComponent(`${from.lat},${from.lon}`)}`);
      params.push(`to=${encodeURIComponent(`${to.lat},${to.lon}`)}`);
      if (options?.datetimeISO) params.push(`datetime=${encodeURIComponent(options.datetimeISO)}`);
      if (options?.optimize) params.push(`opt=${encodeURIComponent(options.optimize)}`);
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/route?${params.join('&')}`);
      if (!res) return null;
      const journey = res?.journey ?? res?.route ?? res?.data ?? null;
      if (!journey) return null;
      const segments: RouteSegment[] = (journey?.sections ?? journey?.legs ?? []).map((seg: any) => ({ duration: seg?.duration ?? 0, distance: seg?.distance ?? undefined, mode: seg?.mode ?? seg?.type ?? undefined, from: seg?.from?.coord ? { lat: seg.from.coord[0], lon: seg.from.coord[1], name: seg?.from?.name } : { lat: seg?.from?.lat ?? 0, lon: seg?.from?.lon ?? 0, name: seg?.from?.name }, to: seg?.to?.coord ? { lat: seg.to.coord[0], lon: seg.to.coord[1], name: seg?.to?.name } : { lat: seg?.to?.lat ?? 0, lon: seg?.to?.lon ?? 0, name: seg?.to?.name }, displayInstructions: seg?.display_informations ? [seg.display_informations.direction, seg.display_informations.label].filter(Boolean) : seg?.instruction ? [seg.instruction] : [], raw: seg }));
      return { duration: journey?.duration ?? 0, arrival: journey?.arrival ? new Date(journey.arrival) : null, departure: journey?.departure ? new Date(journey.departure) : null, segments, raw: journey };
    } catch (_) {
      return null;
    }
  }

  static async fetchIsochrones(coord: { lat: number; lon: number }, maxDurationSec = 1800): Promise<any | null> {
    try {
      const res = await PrimTransportService.fetchJson(`${BASE}/transports/isochrones?lat=${encodeURIComponent(coord.lat)}&lon=${encodeURIComponent(coord.lon)}&max_duration=${encodeURIComponent(String(maxDurationSec))}`);
      return res;
    } catch (_) {
      return null;
    }
  }

  static async fetchIdfmJourney(from: string, to: string, datetimeISO?: string): Promise<IDFMRouteResponse | null> {
    try {
      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);
      if (datetimeISO) params.append('datetime', datetimeISO);
      const url = `${BASE}/transports/route/idfm-journey?${params.toString()}`;
      const res = await PrimTransportService.fetchJson(url);
      if (!res) return null;
      return res as IDFMRouteResponse;
    } catch (_) {
      return null;
    }
  }
}