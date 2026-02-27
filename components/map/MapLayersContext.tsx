import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export type MapType = "standard" | "satellite" | "terrain";

interface MapLayersContextValue {
  layersOpen: boolean;
  openLayers: () => void;
  closeLayers: () => void;

  mapType: MapType;
  setMapType: (type: MapType) => void;

  traffic: boolean;
  setTraffic: (enabled: boolean) => void;

  publicTransport: boolean;
  setPublicTransport: (enabled: boolean) => void;

  buildings3d: boolean;
  setBuildings3d: (enabled: boolean) => void;

  darkTheme: boolean;
  setDarkTheme: (dark: boolean) => void;
}

export const MapLayersContext =
  React.createContext<MapLayersContextValue | null>(null);

export function useMapLayers() {
  const ctx = React.useContext(MapLayersContext);
  if (!ctx) {
    throw new Error("useMapLayers must be used within MapLayersProvider");
  }
  return ctx;
}

interface MapLayersProviderProps {
  children: React.ReactNode;
}

export function MapLayersProvider({ children }: MapLayersProviderProps) {
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [mapType, setMapType] = React.useState<MapType>("standard");
  const [traffic, setTraffic] = React.useState(false);
  const [publicTransport, setPublicTransport] = React.useState(false);
  const [buildings3d, setBuildings3d] = React.useState(true);
  const [darkTheme, setDarkTheme] = React.useState(true);
  const STORAGE_KEY = "map_layers_v1";

  React.useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (!mounted) return;
          if (parsed.mapType) setMapType(parsed.mapType);
          if (typeof parsed.traffic === "boolean") setTraffic(parsed.traffic);
          if (typeof parsed.publicTransport === "boolean")
            setPublicTransport(parsed.publicTransport);
          if (typeof parsed.buildings3d === "boolean")
            setBuildings3d(parsed.buildings3d);
          if (typeof parsed.darkTheme === "boolean")
            setDarkTheme(parsed.darkTheme);
        } catch {}
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const toSave = {
      mapType,
      traffic,
      publicTransport,
      buildings3d,
      darkTheme,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [mapType, traffic, publicTransport, buildings3d, darkTheme]);

  const value: MapLayersContextValue = React.useMemo(
    () => ({
      layersOpen,
      openLayers: () => setLayersOpen(true),
      closeLayers: () => setLayersOpen(false),
      mapType,
      setMapType,
      traffic,
      setTraffic,
      publicTransport,
      setPublicTransport,
      buildings3d,
      setBuildings3d,
      darkTheme,
      setDarkTheme,
    }),
    [layersOpen, mapType, traffic, publicTransport, buildings3d, darkTheme],
  );

  return (
    <MapLayersContext.Provider value={value}>
      {children}
    </MapLayersContext.Provider>
  );
}
