"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L, { type Map as LeafletMap } from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import { LocateFixed, Loader2, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface MapRef {
  resize: () => void;
  flyTo: (options: {
    center: [number, number];
    duration?: number;
    zoom?: number;
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
  }) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: {
      padding?: { top?: number; right?: number; bottom?: number; left?: number };
      duration?: number;
      maxZoom?: number;
    },
  ) => void;
}

export interface MapboxProps {
  id?: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  markers?: Array<{
    id: string;
    longitude: number;
    latitude: number;
    popupContent?: React.ReactNode;
    element?: React.ReactNode;
    onClick?: () => void;
  }>;
  geoJsonData?: GeoJSON.FeatureCollection;
  onMarkerDragEnd?: (
    markerId: string,
    lngLat: { lng: number; lat: number },
  ) => void;
  onGeoJsonClick?: (feature: GeoJSON.Feature) => void;
  onMapClick?: () => void;
  onMove?: (viewState: {
    zoom: number;
    latitude: number;
    longitude: number;
  }) => void;
  draggableMarker?: boolean;
  showGeocoder?: boolean;
  showControls?: boolean;
  scrollZoom?: boolean;
  doubleClickZoom?: boolean;
  boxZoom?: boolean;
  dragRotate?: boolean;
  dragPan?: boolean;
}

const DEFAULT_CENTER: [number, number] = [24, 108];

const MapEvents = ({
  onReady,
  onMove,
  onMapClick,
}: {
  onReady: (map: LeafletMap) => void;
  onMove?: MapboxProps["onMove"];
  onMapClick?: MapboxProps["onMapClick"];
}) => {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  useMapEvents({
    moveend: () => {
      onMove?.({
        zoom: map.getZoom(),
        latitude: map.getCenter().lat,
        longitude: map.getCenter().lng,
      });
    },
    click: () => onMapClick?.(),
  });

  return null;
};

const LocateButton = () => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.flyTo([coords.latitude, coords.longitude], Math.max(map.getZoom(), 12), {
          duration: 1.2,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <button
      type="button"
      aria-label="定位到当前位置"
      title="定位到当前位置"
      onClick={locate}
      className="leaflet-control leaflet-bar flex size-8 items-center justify-center bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      {isLocating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
    </button>
  );
};

const SearchControl = () => {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=zh-CN&q=${encodeURIComponent(query.trim())}`,
      );
      if (!response.ok) throw new Error("搜索失败");
      setResults(await response.json());
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute left-3 top-3 z-[1000] w-[min(320px,calc(100%-24px))]">
      <form onSubmit={search} className="flex overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur">
        <input
          aria-label="搜索地点"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索地点（OpenStreetMap）"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button type="submit" aria-label="搜索" className="flex size-10 items-center justify-center border-l hover:bg-muted">
          {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </form>
      {results.length > 0 && (
        <div className="mt-1 overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.lat}-${result.lon}`}
              className="block w-full truncate border-b px-3 py-2 text-left text-xs last:border-0 hover:bg-muted"
              onClick={() => {
                map.flyTo([Number(result.lat), Number(result.lon)], 14, { duration: 1 });
                setResults([]);
                setQuery(result.display_name);
              }}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MarkerItem = ({
  marker,
  draggable,
  onDragEnd,
}: {
  marker: NonNullable<MapboxProps["markers"]>[number];
  draggable: boolean;
  onDragEnd?: MapboxProps["onMarkerDragEnd"];
}) => {
  const icon = useMemo(() => {
    let html = '<div class="flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-primary-foreground shadow-lg">●</div>';
    if (marker.element) {
      try {
        html = renderToStaticMarkup(marker.element as React.ReactElement);
      } catch {
        // Fall back to a simple accessible marker when custom HTML cannot be serialized.
      }
    }

    return L.divIcon({
      className: "leaflet-photo-marker",
      html,
      iconSize: [80, 88],
      iconAnchor: [40, 88],
    });
  }, [marker.element]);

  return (
    <Marker
      position={[marker.latitude, marker.longitude]}
      icon={icon}
      draggable={draggable}
      eventHandlers={{
        click: () => marker.onClick?.(),
        dragend: (event) => {
          const position = event.target.getLatLng();
          onDragEnd?.(marker.id, { lng: position.lng, lat: position.lat });
        },
      }}
    >
      {marker.popupContent && <Popup>{marker.popupContent}</Popup>}
    </Marker>
  );
};

const Mapbox = forwardRef<MapRef, MapboxProps>(
  (
    {
      id,
      initialViewState = { longitude: DEFAULT_CENTER[1], latitude: DEFAULT_CENTER[0], zoom: 3 },
      markers = [],
      geoJsonData,
      onMarkerDragEnd,
      onGeoJsonClick,
      onMapClick,
      onMove,
      draggableMarker = false,
      showGeocoder = false,
      showControls = true,
      scrollZoom = true,
      doubleClickZoom = true,
      boxZoom = true,
      dragPan = true,
    },
    ref,
  ) => {
    const mapRef = useRef<LeafletMap | null>(null);

    useImperativeHandle(ref, () => ({
      resize: () => mapRef.current?.invalidateSize(),
      flyTo: ({ center, duration = 1.2, zoom }) => {
        mapRef.current?.flyTo(center, zoom ?? mapRef.current.getZoom(), {
          duration,
        });
      },
      fitBounds: (bounds, options) => {
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;
        mapRef.current?.fitBounds(
          [[minLat, minLng], [maxLat, maxLng]],
          {
            maxZoom: options?.maxZoom,
            animate: true,
            duration: options?.duration,
            paddingTopLeft: options?.padding ? [options.padding.left ?? 0, options.padding.top ?? 0] : undefined,
            paddingBottomRight: options?.padding ? [options.padding.right ?? 0, options.padding.bottom ?? 0] : undefined,
          },
        );
      },
    }), []);

    const geoJsonStyle = (feature?: GeoJSON.Feature) => {
      const visited = Boolean(feature?.properties?.visited);
      return {
        color: visited ? "#2563eb" : "#94a3b8",
        weight: visited ? 2 : 1,
        fillColor: visited ? "#60a5fa" : "#cbd5e1",
        fillOpacity: visited ? 0.55 : 0.12,
      };
    };

    return (
      <div id={id} className="relative size-full min-h-0 overflow-hidden">
        <MapContainer
          center={[initialViewState.latitude, initialViewState.longitude]}
          zoom={initialViewState.zoom}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={scrollZoom}
          doubleClickZoom={doubleClickZoom}
          boxZoom={boxZoom}
          dragging={dragPan}
          zoomControl={false}
          attributionControl
          minZoom={2}
          maxBounds={[
            [-85, -180],
            [85, 180],
          ]}
          maxBoundsViscosity={1}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap
            bounds={[
              [-85, -180],
              [85, 180],
            ]}
          />
          <MapEvents onReady={(map) => { mapRef.current = map; }} onMove={onMove} onMapClick={onMapClick} />
          {showControls && <ZoomControl position="bottomleft" />}
          {showControls && <LocateButton />}
          {showGeocoder && <SearchControl />}
          {markers.map((marker) => (
            <MarkerItem key={marker.id} marker={marker} draggable={draggableMarker} onDragEnd={onMarkerDragEnd} />
          ))}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={(feature, layer) => {
                layer.on("click", () => onGeoJsonClick?.(feature as GeoJSON.Feature));
              }}
            />
          )}
        </MapContainer>
      </div>
    );
  },
);

Mapbox.displayName = "OpenStreetMap";

export default Mapbox;