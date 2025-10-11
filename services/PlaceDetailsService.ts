import { OPENTRIPMAP_API_KEY } from "../config/PlaceDetailsConfig";

type PlaceDetails = {
  id?: string;
  title?: string;
  description?: string;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  photos?: { url: string }[];
};

const OTM_BASE = "https://api.opentripmap.com/0.1/en/places";

const buildPhotoUrl = (x: any) => {
  if (!x) return null;
  if (x.preview && x.preview.source) return x.preview.source;
  if (x.preview && x.preview.url) return x.preview.url;
  return null;
};

export default class PlaceDetailsService {
  static async fetchByLatLon(lat: number, lon: number, radius = 50): Promise<PlaceDetails | null> {
    if (!OPENTRIPMAP_API_KEY) return null;
    try {
      const bboxRes = await fetch(`${OTM_BASE}/radius?radius=${radius}&lon=${lon}&lat=${lat}&limit=1&apikey=${OPENTRIPMAP_API_KEY}`);
      const list = await bboxRes.json();
      if (!Array.isArray(list) || list.length === 0) return null;
      const xid = list[0].xid;
      return await this.fetchByXid(xid);
    } catch (e) {
      return null;
    }
  }

  static async fetchByXid(xid: string): Promise<PlaceDetails | null> {
    if (!OPENTRIPMAP_API_KEY) return null;
    try {
      const res = await fetch(`${OTM_BASE}/xid/${encodeURIComponent(xid)}?apikey=${OPENTRIPMAP_API_KEY}`);
      const data = await res.json();
      const photos = [] as { url: string }[];
      if (data.preview) {
        const url = buildPhotoUrl(data);
        if (url) photos.push({ url });
      }
      if (Array.isArray(data.images)) {
        data.images.forEach((img: any) => {
          const u = buildPhotoUrl(img) || img.source || img.url;
          if (u) photos.push({ url: u });
        });
      }

      const details: PlaceDetails = {
        id: data.xid,
        title: data.name || data.address?.name || undefined,
        description: data.wikipedia_extracts?.text || data.info?.descr || data.kinds || undefined,
        phone: data.info?.phone || null,
        website: data.otm || data.info?.url || null,
        opening_hours: data.opening_hours || data.info?.opening_hours || null,
        photos,
      };

      return details;
    } catch (e) {
      return null;
    }
  }
}
