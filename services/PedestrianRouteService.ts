import { useState } from "react";
import { Coordinate, NavigationData } from "./RouteService";

export interface PedestrianNavigationData {
  routeData: any;
  totalDuration: number;
  totalDistance: number;
  remainingDistance: number;
  remainingDuration: number;
  nextInstruction: string;
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    coordinates?: [number, number][];
    type?: string;
    modifier?: string;
  }>;
  routeCoords: Coordinate[];
}

export interface PedestrianRouteService {
  getPedestrianRoute: (
    start: Coordinate,
    end: Coordinate
  ) => Promise<PedestrianNavigationData | null>;
  isCalculating: boolean;
}

const ROUTING_HOSTS = ["https://routing.openstreetmap.de/routed-foot"];

export const usePedestrianRouteService = (): PedestrianRouteService => {
  const [isCalculating, setIsCalculating] = useState(false);

  const fetchFromOSRM = async (
    start: Coordinate,
    end: Coordinate,
    host: string
  ): Promise<any> => {
    const url = `${host}/route/v1/walking/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?steps=true&geometries=geojson&overview=full`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  };

  const parseOSRMResponse = (data: any): PedestrianNavigationData => {
    const route = data.routes[0];
    const legs = route.legs;

    let allSteps: any[] = [];
    legs.forEach((leg: any) => {
      allSteps = allSteps.concat(leg.steps);
    });

    const steps = allSteps.map((step: any) => ({
      instruction:
        step.maneuver?.instruction ||
        getInstructionFromType(step.maneuver?.type, step.maneuver?.modifier),
      distance: step.distance,
      duration: step.duration,
      coordinates: step.geometry?.coordinates,
      type: step.maneuver?.type,
      modifier: step.maneuver?.modifier,
    }));

    const routeCoords = (route.geometry.coordinates as [number, number][]).map(
      ([lon, lat]) => ({ latitude: lat, longitude: lon })
    );

    return {
      routeData: data,
      totalDuration: route.duration,
      totalDistance: route.distance,
      remainingDistance: route.distance,
      remainingDuration: route.duration,
      nextInstruction: steps[0]?.instruction || "Continuer tout droit",
      steps,
      routeCoords,
    };
  };

  const parseORSResponse = (data: any): PedestrianNavigationData => {
    const route = data.routes[0];
    const segments = route.segments;

    let allSteps: any[] = [];
    segments.forEach((segment: any) => {
      allSteps = allSteps.concat(segment.steps);
    });

    const steps = allSteps.map((step: any) => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
      coordinates: step.way_points
        ? route.geometry.coordinates.slice(
            step.way_points[0],
            step.way_points[1] + 1
          )
        : undefined,
      type: step.type,
    }));

    const routeCoords = (route.geometry.coordinates as [number, number][]).map(
      ([lon, lat]) => ({ latitude: lat, longitude: lon })
    );

    return {
      routeData: data,
      totalDuration: route.summary.duration,
      totalDistance: route.summary.distance,
      remainingDistance: route.summary.distance,
      remainingDuration: route.summary.duration,
      nextInstruction: steps[0]?.instruction || "Continuer tout droit",
      steps,
      routeCoords,
    };
  };

  const getInstructionFromType = (type?: string, modifier?: string): string => {
    const instructions: { [key: string]: string } = {
      depart: "Départ",
      arrive: "Arrivée",
      turn:
        modifier === "left"
          ? "Tourner à gauche"
          : modifier === "right"
          ? "Tourner à droite"
          : "Tourner",
      continue: "Continuer tout droit",
      "new name": "Continuer sur",
      merge: "Fusionner",
      "on ramp": "Prendre la bretelle",
      "off ramp": "Sortir",
      fork: "Prendre la bifurcation",
      "end of road": "Au bout de la rue",
      "use lane": "Utiliser la voie",
      rotary: "Prendre le rond-point",
      roundabout: "Prendre le rond-point",
      "exit rotary": "Sortir du rond-point",
      "exit roundabout": "Sortir du rond-point",
    };

    return instructions[type || "continue"] || "Continuer";
  };

  const getPedestrianRoute = async (
    start: Coordinate,
    end: Coordinate
  ): Promise<PedestrianNavigationData | null> => {
    setIsCalculating(true);

    try {
      for (const host of ROUTING_HOSTS) {
        try {
          let data;

          data = await fetchFromOSRM(start, end, host);

          if (data.routes && data.routes.length > 0) {
            const result = parseOSRMResponse(data);
            setIsCalculating(false);
            return result;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${host}:`, error);
          continue;
        }
      }

      console.error("All pedestrian routing services failed");
      setIsCalculating(false);
      return null;
    } catch (error) {
      console.error("Error getting pedestrian route:", error);
      setIsCalculating(false);
      return null;
    }
  };

  return {
    getPedestrianRoute,
    isCalculating,
  };
};
