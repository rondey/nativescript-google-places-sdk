import * as app from 'tns-core-modules/application';
import { ad } from 'tns-core-modules/utils/utils';
import { PlaceCoordinates, PlaceResult, PlaceViewport, PlaceAddressComponent, ShowOptions, CurrentPlaceResult } from './autocomplete.common';
import LatLng = com.google.android.gms.maps.model.LatLng;
import Place = com.google.android.libraries.places.api.model.Place;
import Places = com.google.android.libraries.places.api.Places;
import Autocomplete = com.google.android.libraries.places.widget.Autocomplete;
import AutocompleteActivity = com.google.android.libraries.places.widget.AutocompleteActivity;
import FindCurrentPlaceRequest = com.google.android.libraries.places.api.net.FindCurrentPlaceRequest;
import FetchPlaceRequest = com.google.android.libraries.places.api.net.FetchPlaceRequest;

export class PlaceAutocomplete {
  private static readonly PLACE_AUTOCOMPLETE_REQUEST_CODE = 101;

  private static convertEnumArrayJavaToStringArrayJavascript(nativeArray: native.Array<any>) {
    const array = [];
    for ( let i = 0; i < nativeArray.length; ++i) {
      array[i] = nativeArray[i].toString();
    }
    return array;
  }

  private static latLngToPlaceCoordinates(coordinates: LatLng): PlaceCoordinates {
    if (!coordinates) {
      return null;
    }

    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    };
  }

  private static viewportToPlaceViewport(bounds: com.google.android.gms.maps.model.LatLngBounds): PlaceViewport {
    if (!bounds) {
      return null;
    }

    return {
      northeast: {
        latitude: bounds.northeast.latitude,
        longitude: bounds.northeast.longitude
      },
      southwest: {
        latitude: bounds.southwest.latitude,
        longitude: bounds.southwest.longitude
      }
    };
  }

  private static addressComponentsToPlaceAddressComponents(addressComponents: java.util.List<com.google.android.libraries.places.api.internal.impl.net.pablo.PlaceResult.AddressComponent>): PlaceAddressComponent[] {
    if (!addressComponents) {
      return null;
    }

    const array: PlaceAddressComponent[] = [];
    const addressComponentsArray = addressComponents.toArray();
    for ( let i = 0; i < addressComponentsArray.length; ++i) {
      array[i] = {
        name : addressComponentsArray[i].getName(),
        shortName : addressComponentsArray[i].getShortName(),
        types :  this.convertEnumArrayJavaToStringArrayJavascript(addressComponentsArray[i].getTypes().toArray())
      };
    }
    return array;
  }

  private static getSelectedFields(options: ShowOptions): java.util.List<Place.Field> {
    let fieldsSetting: java.util.List<Place.Field> = java.util.Arrays.asList([]);

    if (options && options.fields && options.fields.length > 0) {
      const { fields } = options;
      let selectedFields: Place.Field[] = [];

      if (fields.indexOf('address') > -1) {
        selectedFields = selectedFields.concat(Place.Field.ADDRESS);
      }

      if (fields.indexOf('id') > -1) {
        selectedFields = selectedFields.concat(Place.Field.ID);
      }

      if (fields.indexOf('lat_lng') > -1) {
        selectedFields = selectedFields.concat(Place.Field.LAT_LNG);
      }

      if (fields.indexOf('name') > -1) {
        selectedFields = selectedFields.concat(Place.Field.NAME);
      }

      if (fields.indexOf('phone_number') > -1) {
        selectedFields = selectedFields.concat(Place.Field.PHONE_NUMBER);
      }

      if (fields.indexOf('price_level') > -1) {
        selectedFields = selectedFields.concat(Place.Field.PRICE_LEVEL);
      }

      if (fields.indexOf('rating') > -1) {
        selectedFields = selectedFields.concat(Place.Field.RATING);
      }

      if (fields.indexOf('user_ratings_total') > -1) {
        selectedFields = selectedFields.concat(Place.Field.USER_RATINGS_TOTAL);
      }

      if (fields.indexOf('viewport') > -1) {
        selectedFields = selectedFields.concat(Place.Field.VIEWPORT);
      }

      if (fields.indexOf('website_uri') > -1) {
        selectedFields = selectedFields.concat(Place.Field.WEBSITE_URI);
      }

      if (fields.indexOf('types') > -1) {
        selectedFields = selectedFields.concat(Place.Field.TYPES);
      }

      if (fields.indexOf('utc_offset') > -1) {
        selectedFields = selectedFields.concat(Place.Field.UTC_OFFSET);
      }

      if (fields.indexOf('address_components') > -1) {
        selectedFields = selectedFields.concat(Place.Field.ADDRESS_COMPONENTS);
      }
      fieldsSetting = java.util.Arrays.asList(selectedFields);
    }

    return fieldsSetting;
  }

  private static getPlaceResult(place: Place): PlaceResult {
    return {
      address: place.getAddress(),
      id: place.getId(),
      latLng: this.latLngToPlaceCoordinates(place.getLatLng()),
      name: place.getName(),
      phoneNumber: place.getPhoneNumber(),
      priceLevel: place.getPriceLevel() ? place.getPriceLevel().intValue() : null,
      rating: place.getRating() ? place.getRating().doubleValue() : null,
      userRatingsTotal: place.getUserRatingsTotal() ? place.getUserRatingsTotal().intValue() : null,
      viewport: this.viewportToPlaceViewport(place.getViewport()),
      websiteUri: place.getWebsiteUri() ? place.getWebsiteUri().toString() : null,
      types: place.getTypes() ? this.convertEnumArrayJavaToStringArrayJavascript(place.getTypes().toArray()) : null,
      // utcOffset: place.getUtcOffsetMinutes().intValue(),
      addressComponents: place.getAddressComponents() ? this.addressComponentsToPlaceAddressComponents(place.getAddressComponents().asList()) : null
    };
  }

  static show(options?: ShowOptions): Promise<PlaceResult> {
    if (!Places.isInitialized()) {
      return Promise.reject('PlaceAutocomplete not initialised.');
    }

    return new Promise((resolve, reject) => {
      const fieldsSetting: java.util.List<Place.Field> = this.getSelectedFields(options);

      let intentBuilder = new Autocomplete.IntentBuilder(
        com.google.android.libraries.places.widget.model.AutocompleteActivityMode.FULLSCREEN,
        fieldsSetting
      );

      if (options && options.locationBias) {
        const { locationBias } = options;

        intentBuilder = intentBuilder.setLocationBias(
          com.google.android.libraries.places.api.model.RectangularBounds.newInstance(
            new LatLng(locationBias.southwest.latitude, locationBias.southwest.longitude),
            new LatLng(locationBias.northeast.latitude, locationBias.northeast.longitude)
          )
        );
      }

      const intent = intentBuilder.build(ad.getApplicationContext());

      app.android.on('activityResult', ({ intent, resultCode, requestCode }) => {
        if (requestCode === this.PLACE_AUTOCOMPLETE_REQUEST_CODE) {
          if (resultCode === android.app.Activity.RESULT_OK) {
            const place = Autocomplete.getPlaceFromIntent(intent);

            resolve(this.getPlaceResult(place));
          }
          else if (resultCode === AutocompleteActivity.RESULT_ERROR) {
            const status = Autocomplete.getStatusFromIntent(intent);

            reject(status.getStatusMessage());
          }
          else if (resultCode === android.app.Activity.RESULT_CANCELED) {
            resolve(null);
          }
        }
      });

      app.android.foregroundActivity.startActivityForResult(intent, this.PLACE_AUTOCOMPLETE_REQUEST_CODE);
    });
  }

  static currentPlace(options?: ShowOptions): Promise<CurrentPlaceResult[]> {
    if (!Places.isInitialized()) {
      return Promise.reject('PlaceAutocomplete not initialised.');
    }

    return new Promise((resolve, reject) => {
      const fieldsSetting: java.util.List<Place.Field> = this.getSelectedFields(options);

      const placesClient: com.google.android.libraries.places.api.net.PlacesClient = Places.createClient(ad.getApplicationContext());

      const request: FindCurrentPlaceRequest = FindCurrentPlaceRequest.newInstance(fieldsSetting);
      const placeResponse: com.google.android.gms.tasks.Task<com.google.android.libraries.places.api.net.FindCurrentPlaceResponse> = placesClient.findCurrentPlace(request);

      placeResponse.addOnCompleteListener(new (<any>com.google.android.gms).tasks.OnCompleteListener({
            onComplete: (task) => {
              if (task.isSuccessful()) {
                  const response: com.google.android.libraries.places.api.net.FindCurrentPlaceResponse = task.getResult();
                  const nativeArray = response.getPlaceLikelihoods().toArray();
                  const array = [];
                  for ( let i = 0; i < nativeArray.length; ++i) {
                    array[i] = {
                      likelihood: nativeArray[i].getLikelihood(),
                      place: this.getPlaceResult(nativeArray[i].getPlace())
                    };
                  }
                  resolve(array);
              } else {
                  const exception = task.getException();
                  reject(exception);
              }
            }
          }));
    });
  }

  static fetchPlace(id: string, options?: ShowOptions): Promise<PlaceResult> {
    if (!Places.isInitialized()) {
      return Promise.reject('PlaceAutocomplete not initialised.');
    }

    if (!id) {
      return Promise.reject('Id is not defined.');
    }

    return new Promise((resolve, reject) => {
      const fieldsSetting: java.util.List<Place.Field> = this.getSelectedFields(options);

      const placesClient: com.google.android.libraries.places.api.net.PlacesClient = Places.createClient(ad.getApplicationContext());

      const request: FetchPlaceRequest = FetchPlaceRequest.newInstance(id, fieldsSetting);

      placesClient.fetchPlace(request).addOnCompleteListener(new (<any>com.google.android.gms).tasks.OnCompleteListener({
            onComplete: (task) => {
              if (task.isSuccessful()) {
                  const response: com.google.android.libraries.places.api.net.FetchPlaceResponse = task.getResult();
                  resolve(this.getPlaceResult(response.getPlace()));
              } else {
                  const exception = task.getException();
                  reject(exception);
              }
            }
          }));
    });
  }
}