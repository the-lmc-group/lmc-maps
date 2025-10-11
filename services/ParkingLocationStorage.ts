import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedParkingLocation {
  name: string;
  coordinate: { latitude: number; longitude: number };
  savedAt: number;
}

const KEY = 'saved_parking_location';

export const ParkingLocationStorage = {
  async save(parking: SavedParkingLocation) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(parking));
    } catch {}
  },
  async load(): Promise<SavedParkingLocation | null> {
    try {
      const v = await AsyncStorage.getItem(KEY);
      if (!v) return null;
      return JSON.parse(v);
    } catch {
      return null;
    }
  },
  async clear() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  },
};
