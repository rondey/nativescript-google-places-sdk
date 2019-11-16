import { PlaceResult, ShowOptions } from './autocomplete.common';

export * from './autocomplete.common';

export declare class PlaceAutocomplete {
  /**
   * Show Place Autocomplete UI
   *
   * @param options (optional)
   * @param options.fields (optional)
   * @param options.locationBias (optional)
   * @param options.locationBias.southwest
   * @param options.locationBias.northeast
   */
  static show(options?: ShowOptions): Promise<PlaceResult>;

  /**
   * Get an array of possible current place
   *
   * @param options (optional)
   * @param options.fields (optional)
   */
  static currentPlace(options?: ShowOptions): Promise<CurrentPlaceResult[]>;

  /**
   * Get details of a place
   *
   * @param id
   * @param options (optional)
   * @param options.fields (optional)
   */
  static fetchPlace(id: string, options?: ShowOptions): Promise<PlaceResult>;
}

export declare class Place {
  /**
   * Initialize Place SDK
   * @param apiKey Google Place API key
   */
  static initialize(apiKey: string): void;
}
