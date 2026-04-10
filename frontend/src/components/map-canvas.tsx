"use client";

import { divIcon } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

const markerPalette: Record<string, string> = {
  source: "#0f766e",
  destination: "#1d3557",
  source_metro: "#d97706",
  destination_metro: "#7c3aed",
  highlight: "#f97316",
};

function FitBounds({
  bounds,
}: {
  bounds: {
    southWest: { lat: number; lng: number };
    northEast: { lat: number; lng: number };
  };
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [bounds.southWest.lat, bounds.southWest.lng],
        [bounds.northEast.lat, bounds.northEast.lng],
      ],
      { padding: [24, 24] },
    );
  }, [map, bounds]);
  return null;
}

function pin(color: string) {
  return divIcon({
    className: "custom-map-pin",
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapCanvas({
  map,
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
}) {
  return (
    <MapContainer
      key={`${map.center.lat}-${map.center.lng}`}
      center={[map.center.lat, map.center.lng]}
      zoom={11}
      scrollWheelZoom={false}
      className="map-shell"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds bounds={map.bounds} />
      <Polyline
        positions={map.route.map((point) => [point.lat, point.lng])}
        pathOptions={{ color: "#1d3557", dashArray: "8 10", weight: 4 }}
      />
      {map.markers.map((marker) => (
        <Marker
          key={`${marker.kind}-${marker.label}-${marker.lat}-${marker.lng}`}
          position={[marker.lat, marker.lng]}
          icon={pin(markerPalette[marker.kind] ?? "#1d3557")}
        >
          <Popup>
            <strong>{marker.label}</strong>
            <br />
            {marker.area}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
