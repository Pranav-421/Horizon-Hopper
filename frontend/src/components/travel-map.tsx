"use client";

import dynamic from "next/dynamic";

const MapCanvas = dynamic(() => import("@/components/map-canvas"), {
  ssr: false,
});

export function TravelMap({
  map,
  transportMode,
}: {
  map: {
    center: { lat: number; lng: number };
    bounds: {
      southWest: { lat: number; lng: number };
      northEast: { lat: number; lng: number };
    };
    route: Array<{ lat: number; lng: number }>;
    markers: Array<{
      kind: string;
      label: string;
      area: string;
      lat: number;
      lng: number;
    }>;
  };
  transportMode?: string;
}) {
  return <MapCanvas map={map} transportMode={transportMode} />;
}
