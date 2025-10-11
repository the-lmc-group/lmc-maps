/**
 * @fileoverview Schéma TypeScript pour la réponse de l'API IDFM (Île-de-France Mobilités) de calcul d'itinéraire.
 */

export interface Coord {
  lon: string;
  lat: string;
}

export interface AdministrativeRegion {
  id: string;
  insee: string;
  name: string;
  label: string;
  level: number;
  coord: Coord;
  zip_code: string | null;
}

export interface Address {
  id: string;
  coord: Coord;
  house_number: number;
  label: string;
  name: string;
  administrative_regions: AdministrativeRegion[];
}

export interface StopPointCode {
  type: string;
  value: string;
}

export interface FareZone {
  name: string;
}

export interface StopArea {
  id: string;
  name: string;
  codes: StopPointCode[];
  timezone: string;
  label: string;
  coord: Coord;
  links: any[];
}

export interface StopPoint {
  id: string;
  name: string;
  codes: StopPointCode[];
  label: string;
  coord: Coord;
  links: any[];
  administrative_regions: AdministrativeRegion[];
  stop_area: StopArea;
  equipments: string[];
  address: Address;
  fare_zone: FareZone;
}

export interface EmbeddedAddress {
  id: string;
  name: string;
  quality: number;
  embedded_type: 'address';
  address: Address;
}

export interface EmbeddedStopPoint {
  id: string;
  name: string;
  quality: number;
  embedded_type: 'stop_point';
  stop_point: StopPoint;
}

export type Place = EmbeddedAddress | EmbeddedStopPoint;

export interface GeoJSONProperty {
  length: number;
}

export interface GeoJSON {
  type: 'LineString';
  coordinates: number[][];
  properties: GeoJSONProperty[];
}

export interface PathInstruction {
  length: number;
  name: string;
  duration: number;
  direction: number;
  instruction: string;
  instruction_start_coordinate: Coord;
}

export interface Link {
  templated: boolean;
  rel: string;
  internal: boolean;
  type: string;
  id: string;
}

export interface DisplayInformations {
  commercial_mode: string;
  network: string;
  direction: string;
  label: string;
  color: string;
  code: string;
  headsign: string;
  name: string;
  links: Link[];
  text_color: string;
  trip_short_name: string;
  company: string;
  description: string;
  physical_mode: string;
  equipments: string[];
}

export interface StreetNetworkSection {
  type: 'street_network';
  mode: 'walking';
  from: Place;
  to: Place;
  departure_date_time: string;
  arrival_date_time: string;
  duration: number;
  geojson: GeoJSON;
  path: PathInstruction[];
}

export interface PublicTransportSection {
  type: 'public_transport';
  from: Place;
  to: Place;
  departure_date_time: string;
  arrival_date_time: string;
  duration: number;
  display_informations: DisplayInformations;
  geojson: GeoJSON;
}

export interface TransferSection {
  type: 'transfer';
  mode: 'walking';
  from: Place;
  to: Place;
  departure_date_time: string;
  arrival_date_time: string;
  duration: number;
  geojson: GeoJSON;
  path: PathInstruction[];
}

export interface WaitingSection {
  type: 'waiting';
  departure_date_time: string;
  arrival_date_time: string;
  duration: number;
}

export type Section = StreetNetworkSection | PublicTransportSection | TransferSection | WaitingSection;

export interface Fare {
  total: Record<string, unknown>;
  found: boolean;
}

export interface Journey {
  departure_date_time: string;
  arrival_date_time: string;
  duration: number;
  nb_transfers: number;
  walking_distance: number;
  walking_time: number;
  sections: Section[];
  fare: Fare;
}

export interface IDFMRouteResponse {
  journeys: Journey[];
}
