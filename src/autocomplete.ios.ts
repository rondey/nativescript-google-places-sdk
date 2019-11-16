import { ios } from 'tns-core-modules/application';
import * as utils from "tns-core-modules/utils/utils";
import { PlaceCoordinates, PlaceResult, PlaceViewport, PlaceAddressComponent, ShowOptions, CurrentPlaceResult } from './autocomplete.common';

function getPlaceResult(place: GMSPlace): PlaceResult {
  return {
    address: place.formattedAddress,
    id: place.placeID,
    latLng: this.locationCoordinateToPlaceCoordinates(place.coordinate),
    name: place.name,
    phoneNumber: place.phoneNumber,
    priceLevel: place.priceLevel,
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
    viewport: this.boundsToViewport(place.viewport),
    websiteUri: place.website ? place.website.absoluteString : null,
    types: place.types ? utils.ios.collections.nsArrayToJSArray(place.types) : null,
    addressComponents: this.addressComponentsToPlaceAddressComponents(place.addressComponents)
  };
}

class AutocompleteViewControllerDelegateImpl extends NSObject implements GMSAutocompleteViewControllerDelegate {
  static ObjCProtocols = [GMSAutocompleteViewControllerDelegate];

  resolve: (value?: PlaceResult) => void;
  reject: (reason?: any) => void;

  private boundsToViewport(bounds: GMSCoordinateBounds): PlaceViewport {
    if (!bounds) {
      return null;
    }

    return {
      southwest: bounds.southWest,
      northeast: bounds.northEast
    };
  }

  private locationCoordinateToPlaceCoordinates(coordinate: CLLocationCoordinate2D): PlaceCoordinates {
    if (!coordinate) {
      return null;
    }

    return {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };
  }

  private addressComponentsToPlaceAddressComponents(addressComponents: NSArray<GMSAddressComponent>): PlaceAddressComponent[] {
    if (!addressComponents) {
      return null;
    }

    const array: PlaceAddressComponent[] = [];
    for ( let i = 0; i < addressComponents.count; ++i) {
      array[i] = {
        name : addressComponents[i].name,
        shortName : addressComponents[i].shortName,
        types :  utils.ios.collections.nsArrayToJSArray(addressComponents[i].types)
      };
    }
    return array;
  }

  didRequestAutocompletePredictions(viewController: GMSAutocompleteViewController): void {
    UIApplication.sharedApplication.networkActivityIndicatorVisible = true;
  }

  didUpdateAutocompletePredictions(viewController: GMSAutocompleteViewController): void {
    UIApplication.sharedApplication.networkActivityIndicatorVisible = false;
  }

  viewControllerDidAutocompleteWithPlace(viewController: GMSAutocompleteViewController, place: GMSPlace): void {
    viewController.dismissViewControllerAnimatedCompletion(true, null);
    this.resolve(getPlaceResult(place));
  }

  viewControllerDidFailAutocompleteWithError(viewController: GMSAutocompleteViewController, error: NSError): void {
    this.reject(error.localizedDescription);
  }

  viewControllerDidSelectPrediction(viewController: GMSAutocompleteViewController, prediction: GMSAutocompletePrediction): boolean {
    return true;
  }

  wasCancelled(viewController: GMSAutocompleteViewController): void {
    viewController.dismissViewControllerAnimatedCompletion(true, null);
    this.resolve(null);
  }
}

export class PlaceAutocomplete {
  private static autocompleteControllerDelegate: AutocompleteViewControllerDelegateImpl;

  private static getSelectedFields(options: ShowOptions): GMSPlaceField {
      const placeFields: GMSPlaceField = GMSPlaceField.All;

      if (options) {
        if (options.fields && options.fields.length > 0) {
          const { fields } = options;
          let selectedFields: GMSPlaceField = null;

          if (fields.indexOf('address') > -1) {
            selectedFields |= GMSPlaceField.FormattedAddress;
          }

          if (fields.indexOf('id') > -1) {
            selectedFields |= GMSPlaceField.PlaceID;
          }

          if (fields.indexOf('lat_lng') > -1) {
            selectedFields |= GMSPlaceField.Coordinate;
          }

          if (fields.indexOf('name') > -1) {
            selectedFields |= GMSPlaceField.Name;
          }

          if (fields.indexOf('phone_number') > -1) {
            selectedFields |= GMSPlaceField.PhoneNumber;
          }

          if (fields.indexOf('price_level') > -1) {
            selectedFields |= GMSPlaceField.PriceLevel;
          }

          if (fields.indexOf('rating') > -1) {
            selectedFields |= GMSPlaceField.Rating;
          }

          if (fields.indexOf('user_ratings_total') > -1) {
            selectedFields |= GMSPlaceField.UserRatingsTotal;
          }

          if (fields.indexOf('viewport') > -1) {
            selectedFields |= GMSPlaceField.Viewport;
          }

          if (fields.indexOf('website_uri') > -1) {
            selectedFields |= GMSPlaceField.Website;
          }

          if (fields.indexOf('types') > -1) {
            selectedFields |= GMSPlaceField.Types;
          }

          if (fields.indexOf('address_components') > -1) {
            selectedFields |= GMSPlaceField.AddressComponents;
          }
          return selectedFields;
        }

      }
      return placeFields;
    }

  static show(options?: ShowOptions): Promise<PlaceResult> {
    return new Promise((resolve, reject) => {
      const autocompleteController = GMSAutocompleteViewController.new();

      this.autocompleteControllerDelegate = <AutocompleteViewControllerDelegateImpl>AutocompleteViewControllerDelegateImpl.new();
      this.autocompleteControllerDelegate.resolve = resolve;
      this.autocompleteControllerDelegate.reject = reject;
      autocompleteController.delegate = this.autocompleteControllerDelegate;
      const placeFields = this.getSelectedFields(options);

      if (options && options.locationBias) {
        const { locationBias } = options;

        autocompleteController.autocompleteBounds = GMSCoordinateBounds.alloc().initWithCoordinateCoordinate(
          {
            latitude: locationBias.southwest.latitude,
            longitude: locationBias.southwest.longitude
          },
          {
            latitude: locationBias.northeast.latitude,
            longitude: locationBias.northeast.longitude
          }
        );
      }
      autocompleteController.placeFields = placeFields;

      ios.rootController.presentViewControllerAnimatedCompletion(autocompleteController, true, null);
    });
  }

  static currentPlace(options?: ShowOptions): Promise<CurrentPlaceResult[]> {
    return new Promise((resolve, reject) => {
      const placesClient: GMSPlacesClient = GMSPlacesClient.sharedClient();
      placesClient.findPlaceLikelihoodsFromCurrentLocationWithPlaceFieldsCallback(this.getSelectedFields(options), (placeLikelihoodList, error) => {
        if (error) {
          reject(error.localizedDescription);
        }
        else {
          const array = [];
          for ( let i = 0; i < placeLikelihoodList.count; ++i) {
            array[i] = {
              likelihood: placeLikelihoodList[i].likelihood,
              place: getPlaceResult(placeLikelihoodList[i].place)
            };
          }
          resolve(array);
        }
      });

    });
  }

  static fetchPlace(id: string, options?: ShowOptions): Promise<PlaceResult> {
    return new Promise((resolve, reject) => {
      const fieldsSetting: GMSPlaceField = this.getSelectedFields(options);
      const placesClient: GMSPlacesClient = GMSPlacesClient.sharedClient();

      placesClient.fetchPlaceFromPlaceIDPlaceFieldsSessionTokenCallback(id, fieldsSetting, null, (place, error) => {
        if (error) {
          reject(error.localizedDescription);
        }
        else {
          resolve(getPlaceResult(place));
        }
      });
    });
  }
}
