import olcLib from 'open-location-code';

const OpenLocationCodeCtor = (olcLib as any).OpenLocationCode;
const OLC = new OpenLocationCodeCtor();

export interface DecodedPlusCode {
  latitude: number;
  longitude: number;
  code: string;
  isShort: boolean;
}

export class PlusCodeService {
  static isValid(code: string): boolean {
    try {
      return OLC.isValid(code.trim());
    } catch {
      return false;
    }
  }

  static isShort(code: string): boolean {
    try {
      return OLC.isShort(code.trim());
    } catch {
      return false;
    }
  }

  static encode(lat: number, lon: number, codeLength: number = 10): string {
    return OLC.encode(lat, lon, codeLength);
  }

  static shorten(fullCode: string, refLat: number, refLon: number): string {
    return OLC.shorten(fullCode, refLat, refLon);
  }

  static decodeToCenter(code: string, ref?: { latitude: number; longitude: number }): DecodedPlusCode | null {
    try {
      let full = code.trim();
      const short = OLC.isShort(full);
      if (short) {
        if (!ref) return null;
        full = OLC.recoverNearest(full, ref.latitude, ref.longitude);
      }
      if (!OLC.isFull(full)) return null;
      const d = OLC.decode(full);
      return {
        latitude: d.latitudeCenter,
        longitude: d.longitudeCenter,
        code: full,
        isShort: short,
      };
    } catch {
      return null;
    }
  }

  static formatDisplay(lat: number, lon: number, options?: {
    reference?: { latitude: number; longitude: number };
    locality?: string;
    codeLength?: number;
  }): string {
    const code = OLC.encode(lat, lon, options?.codeLength ?? 10);
    const display = options?.reference ? OLC.shorten(code, options.reference.latitude, options.reference.longitude) : code;
    return options?.locality ? `${display} ${options.locality}` : display;
  }

  static tryDecode(query: string, reference?: { latitude: number; longitude: number }): { latitude: number; longitude: number; fullCode: string } | null {
    const trimmed = query.trim();
    if (!this.isValid(trimmed)) return null;
    const decoded = this.decodeToCenter(trimmed, reference);
    if (!decoded) return null;
    return { latitude: decoded.latitude, longitude: decoded.longitude, fullCode: decoded.code };
  }
}

export default PlusCodeService;
