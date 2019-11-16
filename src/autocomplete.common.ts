type PlaceFields =
  'address' |
  'id' |
  'lat_lng' |
  'name' |
  'phone_number' |
  'price_level' |
  'rating' |
  'user_ratings_total' |
  'viewport' |
  'website_uri' |
  'types' |
  "utc_offset" |
  "address_components";

export interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceViewport {
  southwest: PlaceCoordinates;
  northeast: PlaceCoordinates;
}

export interface PlaceAddressComponent {
  name: string;
  shortName: string;
  types: string[];
}

export interface PlaceResult {
  address?: string;
  id?: string;
  latLng?: PlaceCoordinates;
  name?: string;
  phoneNumber?: string;
  priceLevel?: number;
  rating?: number;
  userRatingsTotal?: number;
  viewport?: PlaceViewport;
  websiteUri?: string;
  types?: string[];
  utcOffset?: number;
  addressComponents?: PlaceAddressComponent[];
}

export interface CurrentPlaceResult {
  likelihood: number;
  place: PlaceResult;
}

export interface ShowOptions {
  fields?: PlaceFields[];
  locationBias?: {
    southwest: PlaceCoordinates,
    northeast: PlaceCoordinates
  };
}
