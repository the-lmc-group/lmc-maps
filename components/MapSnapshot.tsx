import ShadcnMap from "@/components/ShadcnMap";
import { MapLayersContext } from "@/components/map/MapLayersContext";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
}

export default function MapSnapshot({ lat, lng, zoom = 11 }: Props) {
  const ref = useRef<any>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const ctx = React.useContext(MapLayersContext);
  const layers =
    ctx ??
    ({
      mapType: "standard",
      darkTheme: false,
    } as any);

  const post = (obj: any) => {
    try {
      ref.current?.postMessage(JSON.stringify(obj));
    } catch {}
  };

  React.useEffect(() => {
    if (!mapReady) return;
    post({ type: "zoomTo", lat, lng, zoom, animate: false });
    post({ type: "setUserMarker", lat, lng, icon: "address" });
    const theme = layers && layers.darkTheme ? "dark" : "light";
    post({ type: "setBaseLayer", layer: layers.mapType, theme });
    post({ type: "zoomBy", delta: 0 });
  }, [mapReady, lat, lng, zoom, layers]);

  const handleMapMsg = React.useCallback((msg: any) => {
    if (msg?.type === "mapReady") setMapReady(true);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <ShadcnMap ref={ref} initialZoom={zoom} onMapMessage={handleMapMsg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#12202a",
  },
});
