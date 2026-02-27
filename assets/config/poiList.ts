import { ReactNode } from "react";

type AmenityType =
  | "Sustenance"
  | "Education"
  | "Transportation"
  | "Finance"
  | "Healthcare"
  | "Entertainment"
  | "PublicService"
  | "Facilities"
  | "Waste"
  | "Other";

interface Amenity {
  label: string;
  value: string;
  description?: string;
  icon: ReactNode | null;
  type: AmenityType;
}

const OverPassAmenityList: Amenity[] = [
  // -------------------
  // |    Nouriture    |
  // -------------------
  {
    value: "bar",
    label: "Bar",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "biergarten",
    label: "Biergarten",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "cafe",
    label: "Café",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "fast_food",
    label: "Restauration Rapide",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "food_court",
    label: "Aire de restauration",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "ice_cream",
    label: "Glacier",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "pub",
    label: "Pub",
    icon: null,
    type: "Sustenance",
  },
  {
    value: "restaurant",
    label: "Restaurant",
    icon: null,
    type: "Sustenance",
  },

  // --------------------
  // |     Education    |
  // --------------------

  {
    value: "college",
    label: "Université",
    icon: null,
    type: "Education",
  },
  {
    value: "dancing_school",
    label: "École de danse",
    icon: null,
    type: "Education",
  },
  {
    value: "driving_school",
    label: "Auto-école",
    icon: null,
    type: "Education",
  },
  {
    value: "first_aid_school",
    label: "École de secourisme",
    icon: null,
    type: "Education",
  },
  {
    value: "kindergarten",
    label: "Jardin d'enfants",
    icon: null,
    type: "Education",
  },
  {
    value: "language_school",
    label: "École de langues",
    icon: null,
    type: "Education",
  },
  {
    value: "library",
    label: "Bibliothèque",
    icon: null,
    type: "Education",
  },
  {
    value: "surf_school",
    label: "École de surf",
    icon: null,
    type: "Education",
  },
  {
    value: "toy_library",
    label: "Bibliothèque de jouets",
    icon: null,
    type: "Education",
  },
  {
    value: "research_institute",
    label: "Laboratoire de recherche",
    icon: null,
    type: "Education",
  },

  // ------------------
  // | Transportation |
  // ------------------

  {
    value: "bicycle_parking",
    label: "Parking à vélos",
    icon: null,
    type: "Transportation",
  },
  {
    value: "bicycle_repair_station",
    label: "Station de réparation de vélos",
    icon: null,
    type: "Transportation",
  },
  {
    value: "bicycle_rental",
    label: "Location de vélos",
    icon: null,
    type: "Transportation",
  },
  {
    value: "bicycle_wash",
    label: "Nettoyage de vélos",
    icon: null,
    type: "Transportation",
  },
  {
    value: "boat_rental",
    label: "Location de bateaux",
    icon: null,
    type: "Transportation",
  },
  {
    value: "boat_sharing",
    label: "Partage de bateaux",
    icon: null,
    type: "Transportation",
  },
  {
    value: "bus_station",
    label: "Gare routière",
    icon: null,
    type: "Transportation",
  },
  {
    value: "car_rental",
    label: "Location de voiture",
    icon: null,
    type: "Transportation",
  },
  {
    value: "car_sharing",
    label: "Partage de voiture",
    icon: null,
    type: "Transportation",
  },
  {
    value: "car_wash",
    label: "Station de lavage de voiture",
    icon: null,
    type: "Transportation",
  },
  {
    value: "compressed_air",
    label: "Station de gonflage",
    icon: null,
    type: "Transportation",
  },
  {
    value: "vehicle_inspection",
    label: "Contrôle technique",
    icon: null,
    type: "Transportation",
  },
  {
    value: "charging_station",
    label: "Station de recharge",
    icon: null,
    type: "Transportation",
  },
  {
    value: "driver_training",
    label: "Formation de conducteurs",
    icon: null,
    type: "Transportation",
  },
  {
    value: "ferry_terminal",
    label: "Terminal de ferry",
    icon: null,
    type: "Transportation",
  },
  {
    value: "fuel",
    label: "Station-service",
    icon: null,
    type: "Transportation",
  },
  {
    value: "grit_bin",
    label: "Bac à sel",
    icon: null,
    type: "Transportation",
  },
  {
    value: "motorcycle_parking",
    label: "Parking pour motos",
    icon: null,
    type: "Transportation",
  },
  {
    value: "parking_entrance",
    label: "Parking",
    icon: null,
    type: "Transportation",
  },
  {
    value: "taxi",
    label: "Station de taxis",
    icon: null,
    type: "Transportation",
  },
  {
    value: "weighbridge",
    label: "Pont bascule",
    icon: null,
    type: "Transportation",
  },

  // -----------
  // | Finance |
  // -----------

  {
    value: "atm",
    label: "Distributeur automatique",
    icon: null,
    type: "Finance",
  },
  {
    value: "payment_terminal",
    label: "Terminal de paiement",
    icon: null,
    type: "Finance",
  },
  {
    value: "bank",
    label: "Banque",
    icon: null,
    type: "Finance",
  },
  {
    value: "bureau_de_change",
    label: "Bureau de change",
    icon: null,
    type: "Finance",
  },
  {
    value: "money_transfer",
    label: "Transfert d'argent",
    icon: null,
    type: "Finance",
  },
  {
    value: "payment_centre",
    label: "Centre de paiement",
    icon: null,
    type: "Finance",
  },

  // ----------------
  // | Soins/Santé |
  // ----------------

  {
    value: "baby_hatch",
    label: "Boîte à bébé",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "clinic",
    label: "Clinique",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "dentist",
    label: "Dentiste",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "doctors",
    label: "Médecin",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "hospital",
    label: "Hôpital",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "nursing_home",
    label: "Maison de retraite",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "pharmacy",
    label: "Pharmacie",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "social_facility",
    label: "Centre social",
    icon: null,
    type: "Healthcare",
  },
  {
    value: "veterinary",
    label: "Vétérinaire",
    icon: null,
    type: "Healthcare",
  },

  // --------------------
  // | Divertissement   |
  // --------------------

  {
    value: "arts_centre",
    label: "Centre artistique",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "brothel",
    label: "Maison close",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "casino",
    label: "Casino",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "cinema",
    label: "Cinéma",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "community_centre",
    label: "Centre communautaire",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "conference_centre",
    label: "Centre de conférences",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "events_venue",
    label: "Lieu d'événements",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "exhibition_centre",
    label: "Centre d'exposition",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "fountain",
    label: "Fontaine",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "gambling",
    label: "Jeux d'argent",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "love_hotel",
    label: "Hôtel de passe",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "music_venue",
    label: "Salle de concert",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "nightclub",
    label: "Boîte de nuit",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "planetarium",
    label: "Planétarium",
    icon: null,
    type: "Entertainment",
  },
  {
    value: "public_bookcase",
    label: "Boîte à livres",
    icon: null,
    type: "Entertainment",
  },

  // ----------------------
  // | Service Publique   |
  // ----------------------

  {
    value: "courthouse",
    label: "Tribunal",
    icon: null,
    type: "PublicService",
  },
  {
    value: "fire_station",
    label: "Caserne de pompiers",
    icon: null,
    type: "PublicService",
  },
  {
    value: "police",
    label: "Commissariat",
    icon: null,
    type: "PublicService",
  },
  {
    value: "post_box",
    label: "Boîte aux lettres",
    icon: null,
    type: "PublicService",
  },
  {
    value: "post_depot",
    label: "Dépôt postal",
    icon: null,
    type: "PublicService",
  },
  {
    value: "post_office",
    label: "Bureau de poste",
    icon: null,
    type: "PublicService",
  },
  {
    value: "prison",
    label: "Prison",
    icon: null,
    type: "PublicService",
  },
  {
    value: "ranger_station",
    label: "Poste de garde forestier",
    icon: null,
    type: "PublicService",
  },
  {
    value: "townhall",
    label: "Mairie",
    icon: null,
    type: "PublicService",
  },

  // ------------------
  // | Installations  |
  // ------------------

  {
    value: "bbq",
    label: "Barbecue",
    icon: null,
    type: "Facilities",
  },
  {
    value: "bench",
    label: "Banc",
    icon: null,
    type: "Facilities",
  },
  {
    value: "dog_toilet",
    label: "Toilettes pour chiens",
    icon: null,
    type: "Facilities",
  },
  {
    value: "dressing_room",
    label: "Vestiaire",
    icon: null,
    type: "Facilities",
  },
  {
    value: "drinking_water",
    label: "Fontaine à eau",
    icon: null,
    type: "Facilities",
  },
  {
    value: "give_box",
    label: "Boîte de dons",
    icon: null,
    type: "Facilities",
  },
  {
    value: "lounge",
    label: "Salon d'attente",
    icon: null,
    type: "Facilities",
  },
  {
    value: "mailroom",
    label: "Salle de courrier",
    icon: null,
    type: "Facilities",
  },
  {
    value: "parcel_locker",
    label: "Consigne à colis",
    icon: null,
    type: "Facilities",
  },
  {
    value: "shelter",
    label: "Abri",
    icon: null,
    type: "Facilities",
  },
  {
    value: "shower",
    label: "Douche",
    icon: null,
    type: "Facilities",
  },
  {
    value: "telephone",
    label: "Téléphone",
    icon: null,
    type: "Facilities",
  },
  {
    value: "toilets",
    label: "Toilettes",
    icon: null,
    type: "Facilities",
  },
  {
    value: "water_point",
    label: "Point d'eau",
    icon: null,
    type: "Facilities",
  },
  {
    value: "watering_place",
    label: "Abreuvoir",
    icon: null,
    type: "Facilities",
  },

  // -------------
  // | Déchets   |
  // -------------

  {
    value: "sanitary_dump_station",
    label: "Station de vidange sanitaire",
    icon: null,
    type: "Waste",
  },
  {
    value: "recycling",
    label: "Centre de recyclage",
    icon: null,
    type: "Waste",
  },
  {
    value: "waste_basket",
    label: "Poubelle",
    icon: null,
    type: "Waste",
  },
  {
    value: "waste_disposal",
    label: "Collecte des déchets",
    icon: null,
    type: "Waste",
  },
  {
    value: "waste_transfer_station",
    label: "Station de transfert des déchets",
    icon: null,
    type: "Waste",
  },

  // -----------
  // | Autres  |
  // -----------

  {
    value: "animal_boarding",
    label: "Pension pour animaux",
    icon: null,
    type: "Other",
  },
  {
    value: "animal_breeding",
    label: "Élevage d'animaux",
    icon: null,
    type: "Other",
  },
  {
    value: "animal_shelter",
    label: "Refuge pour animaux",
    icon: null,
    type: "Other",
  },
  {
    value: "animal_training",
    label: "Dressage d'animaux",
    icon: null,
    type: "Other",
  },
  {
    value: "baking_oven",
    label: "Four à pain",
    icon: null,
    type: "Other",
  },
  {
    value: "clock",
    label: "Horloge publique",
    icon: null,
    type: "Other",
  },
  {
    value: "crematorium",
    label: "Crématorium",
    icon: null,
    type: "Other",
  },
  {
    value: "dive_centre",
    label: "Centre de plongée",
    icon: null,
    type: "Other",
  },
  {
    value: "funeral_hall",
    label: "Funérarium",
    icon: null,
    type: "Other",
  },
  {
    value: "grave_yard",
    label: "Cimetière",
    icon: null,
    type: "Other",
  },
  {
    value: "hunting_stand",
    label: "Mirador de chasse",
    icon: null,
    type: "Other",
  },
  {
    value: "internet_cafe",
    label: "Cybercafé",
    icon: null,
    type: "Other",
  },
  {
    value: "kitchen",
    label: "Cuisine communautaire",
    icon: null,
    type: "Other",
  },
  {
    value: "kneipp_water_cure",
    label: "Cure Kneipp",
    icon: null,
    type: "Other",
  },
  {
    value: "lounger",
    label: "Chaise longue",
    icon: null,
    type: "Other",
  },
  {
    value: "marketplace",
    label: "Marché",
    icon: null,
    type: "Other",
  },
  {
    value: "monastery",
    label: "Monastère",
    icon: null,
    type: "Other",
  },
  {
    value: "mortuary",
    label: "Morgue",
    icon: null,
    type: "Other",
  },
  {
    value: "photo_booth",
    label: "Photomaton",
    icon: null,
    type: "Other",
  },
  {
    value: "place_of_mourning",
    label: "Lieu de recueillement",
    icon: null,
    type: "Other",
  },
  {
    value: "place_of_worship",
    label: "Lieu de culte",
    icon: null,
    type: "Other",
  },
  {
    value: "public_bath",
    label: "Bains publics",
    icon: null,
    type: "Other",
  },
  {
    value: "refugee_site",
    label: "Site de réfugiés",
    icon: null,
    type: "Other",
  },
  {
    value: "vending_machine",
    label: "Distributeur automatique",
    icon: null,
    type: "Other",
  },
];

export type { AmenityType };
export default OverPassAmenityList;
