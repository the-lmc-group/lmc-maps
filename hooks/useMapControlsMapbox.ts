import { useRef, useState, useCallback } from "react";
import { MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useMapView } from "../contexts/MapViewContext";

export function useMapControls() {
  const { mapRef, cameraRef } = useMapView();
  const [compassMode, setCompassMode] = useState<"north" | "heading">("north");
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const lastUpdateTime = useRef(0);
  const lastHeading = useRef(0);

  const recenterMap = async (location: Location.LocationObjectCoords) => {
    if (location && mapRef.current) {
      setIsFollowingUser(true);
      const heading = compassMode === "heading" ? lastHeading.current : 0;
      const cameraUpdate = { centerCoordinate: [location.longitude, location.latitude], zoomLevel: 16, heading, animationDuration: 600 };
      if (cameraRef && cameraRef.current && typeof cameraRef.current.setCamera === 'function') {
        cameraRef.current.setCamera(cameraUpdate);
      } else {
        (mapRef.current as any)?.setCamera(cameraUpdate);
      }
    }
  };

  const animateToCoordinate = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (mapRef.current) {
      const cameraUpdate = { centerCoordinate: [coordinate.longitude, coordinate.latitude], animationDuration: 600 };
      if (cameraRef && cameraRef.current && typeof cameraRef.current.setCamera === 'function') {
        cameraRef.current.setCamera(cameraUpdate);
      } else {
        (mapRef.current as any)?.setCamera(cameraUpdate);
      }
    }
  }, []);

  const toggleCompassMode = () => {
    setCompassMode(prev => {
      const newMode = prev === "north" ? "heading" : "north";
      const heading = newMode === "heading" ? lastHeading.current : 0;
      const cameraUpdate = { heading, animationDuration: 0 };
      if (cameraRef && cameraRef.current && typeof cameraRef.current.setCamera === 'function') {
        cameraRef.current.setCamera(cameraUpdate);
      } else {
        (mapRef.current as any)?.setCamera(cameraUpdate);
      }
      return newMode;
    });
  };

  const updateMapHeading = useCallback((heading: number) => {
    if (mapRef.current && compassMode === "heading") {
      const now = Date.now();
      if (now - lastUpdateTime.current > 500) {
        lastUpdateTime.current = now;
        lastHeading.current = heading;
        const cameraUpdate = { heading, animationDuration: 200 };
        if (cameraRef && cameraRef.current && typeof cameraRef.current.setCamera === 'function') {
          cameraRef.current.setCamera(cameraUpdate);
        } else {
          (mapRef.current as any)?.setCamera(cameraUpdate);
        }
      }
    }
  }, [compassMode]);

  const followUserLocation = useCallback((location: Location.LocationObjectCoords) => {
    if (mapRef.current && isFollowingUser) {
      const cameraUpdate = { centerCoordinate: [location.longitude, location.latitude], animationDuration: 500 };
      if (cameraRef && cameraRef.current && typeof cameraRef.current.setCamera === 'function') {
        cameraRef.current.setCamera(cameraUpdate);
      } else {
        (mapRef.current as any)?.setCamera(cameraUpdate);
      }
    }
  }, [isFollowingUser]);

  const handleMapPanDrag = () => {
    setIsFollowingUser(false);
  };

  return {
    mapRef,
    recenterMap,
    animateToCoordinate,
    compassMode,
    toggleCompassMode,
    updateMapHeading,
    isFollowingUser,
    followUserLocation,
    handleMapPanDrag,
  };
}
