import { useState, useEffect } from "react";
import {
  reverseGeocodeOpenStreetMap,
  type AddressData,
} from "@/modules/mapbox/lib/openstreetmap";
export type { AddressData } from "@/modules/mapbox/lib/openstreetmap";

export type MapboxFeature = NonNullable<AddressData>["features"][number];
export type MapboxReverseGeocodingResponse = AddressData;

interface UseGetLocationProps {
  lat: number;
  lng: number;
}

type LocationState = {
  data: AddressData | null;
  isLoading: boolean;
  error: string | null;
};

export const useGetAddress = ({ lat, lng }: UseGetLocationProps) => {
  const [state, setState] = useState<LocationState>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!lat && !lng) return;

    let cancelled = false;
    const fetchLocation = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await reverseGeocodeOpenStreetMap({ lat, lng });
        if (!cancelled) setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "地址解析失败",
          });
        }
      }
    };

    fetchLocation();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return state;
};