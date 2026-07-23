import type { FeatureCollection, Point } from "geojson";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

type NominatimAddress = Record<string, string | undefined>;
type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: NominatimAddress;
};

export interface SearchResult {
  properties: {
    name: string;
    place_formatted: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

export interface AddressFeature {
  type: "Feature";
  geometry: Point;
  properties: {
    full_address: string;
    name: string;
    place_formatted: string;
    context: {
      country: { country_code: string; name: string };
      locality: { name: string } | null;
      place: { name: string } | null;
      region: { name: string } | null;
    };
  };
}

export type AddressResponse = FeatureCollection<Point, AddressFeature["properties"]> & {
  features: AddressFeature[];
  query: [number, number];
};

export type AddressData = AddressResponse | null;

const firstDefined = (...values: Array<string | undefined>) =>
  values.find((value) => Boolean(value));

const toAddressFeature = (result: NominatimResult): AddressFeature => {
  const address = result.address ?? {};
  const countryName = address.country ?? result.display_name;
  const countryCode = (address.country_code ?? "").toUpperCase();
  const regionName = firstDefined(address.state, address.region, address.county);
  const placeName = firstDefined(
    address.city,
    address.town,
    address.village,
    address.municipality,
  );
  const localityName = firstDefined(
    address.suburb,
    address.neighbourhood,
    address.quarter,
  );

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [Number(result.lon), Number(result.lat)],
    },
    properties: {
      full_address: result.display_name,
      name: result.name || countryName,
      place_formatted: result.display_name,
      context: {
        country: { country_code: countryCode, name: countryName },
        locality: localityName ? { name: localityName } : null,
        place: placeName ? { name: placeName } : null,
        region: regionName ? { name: regionName } : null,
      },
    },
  };
};

export const searchOpenStreetMap = async (query: string): Promise<SearchResult[]> => {
  const response = await fetch(
    `${NOMINATIM_URL}/search?format=jsonv2&limit=10&accept-language=zh-CN&q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error("地点搜索失败");

  const results = (await response.json()) as NominatimResult[];
  return results.map((result) => ({
    properties: {
      name: result.name || result.display_name,
      place_formatted: result.display_name,
    },
    geometry: {
      coordinates: [Number(result.lon), Number(result.lat)],
    },
  }));
};

export const reverseGeocodeOpenStreetMap = async ({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}): Promise<AddressResponse> => {
  const response = await fetch(
    `${NOMINATIM_URL}/reverse?format=jsonv2&zoom=18&accept-language=zh-CN&lat=${lat}&lon=${lng}`,
  );
  if (!response.ok) throw new Error("地址解析失败");

  const result = (await response.json()) as NominatimResult;
  const feature = toAddressFeature(result);
  return {
    type: "FeatureCollection",
    features: [feature],
    query: [lng, lat],
  };
};