"use client";

import { divIcon } from "leaflet";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

const markerPalette: Record<string, string> = {
  source: "#0f766e",
  destination: "#1d3557",
  source_metro: "#d97706",
  destination_metro: "#7c3aed",
  highlight: "#f97316",
};

/* ══════════════════════════════════════════════
   ROUTE STYLES per transport mode
   ══════════════════════════════════════════════ */
const MODE_ROUTE_STYLES: Record<string, { color: string; dashArray?: string; weight: number }> = {
  bus: { color: "#2563eb", weight: 5 },
  train: { color: "#7c3aed", weight: 5, dashArray: "12 8" },
  metro: { color: "#d97706", weight: 5, dashArray: "4 6" },
  cab: { color: "#059669", weight: 4 },
  bike: { color: "#e11d48", weight: 4, dashArray: "6 4" },
  default: { color: "#1d3557", weight: 4, dashArray: "8 10" },
};

type ModeKey = "bus" | "train" | "metro" | "cab" | "bike" | "default";

function classifyMode(mode: string): ModeKey {
  const l = (mode || "").toLowerCase();
  if (l.includes("train") || l.includes("suburban") || l.includes("rail")) return "train";
  if (l.includes("metro") || l.includes("subway")) return "metro";
  if (l.includes("bus") || l.includes("mtc")) return "bus";
  if (l.includes("cab") || l.includes("auto") || l.includes("car") || l.includes("ola") || l.includes("uber") || l.includes("rental")) return "cab";
  if (l.includes("bike") || l.includes("rapido")) return "bike";
  return "default";
}

/* ══════════════════════════════════════════════
   TAMIL NADU RAILWAY NETWORK
   Real junction coordinates & adjacency graph
   ══════════════════════════════════════════════ */
interface RailJunction {
  name: string;
  lat: number;
  lng: number;
  neighbors: string[];   // adjacent junction names
}

const RAIL_NETWORK: Record<string, RailJunction> = {
  "chennai":        { name: "Chennai Central",    lat: 13.0827, lng: 80.2707, neighbors: ["tambaram", "arakkonam"] },
  "tambaram":       { name: "Tambaram",           lat: 12.9249, lng: 80.1278, neighbors: ["chennai", "chengalpattu"] },
  "chengalpattu":   { name: "Chengalpattu",       lat: 12.6939, lng: 79.9757, neighbors: ["tambaram", "villupuram", "kanchipuram"] },
  "kanchipuram":    { name: "Kanchipuram",        lat: 12.8342, lng: 79.7036, neighbors: ["chengalpattu", "arakkonam"] },
  "arakkonam":      { name: "Arakkonam",          lat: 13.0827, lng: 79.6712, neighbors: ["chennai", "kanchipuram", "ranipet"] },
  "ranipet":        { name: "Ranipet",            lat: 12.9272, lng: 79.3323, neighbors: ["arakkonam", "katpadi"] },
  "katpadi":        { name: "Katpadi (Vellore)",  lat: 12.9693, lng: 79.1451, neighbors: ["ranipet", "jolarpettai", "tiruvannamalai"] },
  "tiruvannamalai": { name: "Tiruvannamalai",     lat: 12.2253, lng: 79.0747, neighbors: ["katpadi", "villupuram"] },
  "villupuram":     { name: "Villupuram Jn",      lat: 11.9401, lng: 79.4861, neighbors: ["chengalpattu", "tiruvannamalai", "trichy", "cuddalore"] },
  "cuddalore":      { name: "Cuddalore",          lat: 11.7480, lng: 79.7714, neighbors: ["villupuram", "mayiladuthurai"] },
  "mayiladuthurai": { name: "Mayiladuthurai",     lat: 11.1018, lng: 79.6526, neighbors: ["cuddalore", "thanjavur", "kumbakonam"] },
  "kumbakonam":     { name: "Kumbakonam",         lat: 10.9617, lng: 79.3881, neighbors: ["mayiladuthurai", "thanjavur"] },
  "jolarpettai":    { name: "Jolarpettai Jn",     lat: 12.5836, lng: 78.5731, neighbors: ["katpadi", "salem"] },
  "salem":          { name: "Salem Jn",           lat: 11.6643, lng: 78.1460, neighbors: ["jolarpettai", "erode"] },
  "erode":          { name: "Erode Jn",           lat: 11.3410, lng: 77.7172, neighbors: ["salem", "coimbatore", "tiruppur", "karur"] },
  "coimbatore":     { name: "Coimbatore Jn",      lat: 11.0168, lng: 76.9558, neighbors: ["tiruppur", "palakkad", "mettupalayam"] },
  "tiruppur":       { name: "Tiruppur",           lat: 11.1085, lng: 77.3411, neighbors: ["erode", "coimbatore"] },
  "palakkad":       { name: "Palakkad Jn",        lat: 10.7867, lng: 76.6548, neighbors: ["coimbatore"] },
  "mettupalayam":   { name: "Mettupalayam",       lat: 11.2993, lng: 76.9378, neighbors: ["coimbatore"] },
  "karur":          { name: "Karur",              lat: 10.9601, lng: 78.0766, neighbors: ["erode", "trichy", "dindigul"] },
  "trichy":         { name: "Tiruchirappalli Jn", lat: 10.7905, lng: 78.7047, neighbors: ["villupuram", "karur", "thanjavur", "dindigul", "madurai"] },
  "thanjavur":      { name: "Thanjavur Jn",       lat: 10.7870, lng: 79.1378, neighbors: ["trichy", "kumbakonam", "mayiladuthurai"] },
  "dindigul":       { name: "Dindigul Jn",        lat: 10.3673, lng: 77.9803, neighbors: ["trichy", "karur", "madurai"] },
  "madurai":        { name: "Madurai Jn",         lat: 9.9252,  lng: 78.1198, neighbors: ["trichy", "dindigul", "virudhunagar"] },
  "virudhunagar":   { name: "Virudhunagar",       lat: 9.5851,  lng: 77.9624, neighbors: ["madurai", "tirunelveli", "manamadurai"] },
  "manamadurai":    { name: "Manamadurai Jn",     lat: 9.6826,  lng: 78.4667, neighbors: ["virudhunagar", "rameswaram"] },
  "rameswaram":     { name: "Rameswaram",         lat: 9.2876,  lng: 79.3129, neighbors: ["manamadurai"] },
  "tirunelveli":    { name: "Tirunelveli Jn",     lat: 8.7139,  lng: 77.7567, neighbors: ["virudhunagar", "nagercoil", "thoothukudi"] },
  "thoothukudi":    { name: "Thoothukudi",        lat: 8.7642,  lng: 78.1348, neighbors: ["tirunelveli"] },
  "nagercoil":      { name: "Nagercoil Jn",       lat: 8.1833,  lng: 77.4119, neighbors: ["tirunelveli", "kanyakumari"] },
  "kanyakumari":    { name: "Kanyakumari",        lat: 8.0883,  lng: 77.5385, neighbors: ["nagercoil"] },
  // Alias nodes for cities that aren't directly junction names but map to nearby ones
  "vellore":        { name: "Vellore (Katpadi)",  lat: 12.9165, lng: 79.1325, neighbors: ["katpadi"] },
  "mahabalipuram":  { name: "Mahabalipuram",      lat: 12.6269, lng: 80.1927, neighbors: ["chengalpattu"] },
  "ooty":           { name: "Ooty (NMR)",         lat: 11.4100, lng: 76.6950, neighbors: ["mettupalayam"] },
  "kodaikanal":     { name: "Kodaikanal Road",    lat: 10.1393, lng: 77.4812, neighbors: ["dindigul"] },
};

/* ── BFS shortest path through railway network ── */
function findRailPath(
  srcLat: number, srcLng: number,
  dstLat: number, dstLng: number,
): Array<[number, number]> | null {
  const junctions = Object.values(RAIL_NETWORK);

  // Find nearest junction to src and dst
  function nearest(lat: number, lng: number): string | null {
    let best = "";
    let bestDist = Infinity;
    for (const [key, jn] of Object.entries(RAIL_NETWORK)) {
      const d = Math.hypot(jn.lat - lat, jn.lng - lng);
      if (d < bestDist) {
        bestDist = d;
        best = key;
      }
    }
    return bestDist < 2.0 ? best : null;  // within ~200km range
  }

  const srcKey = nearest(srcLat, srcLng);
  const dstKey = nearest(dstLat, dstLng);
  if (!srcKey || !dstKey) return null;
  if (srcKey === dstKey) {
    const jn = RAIL_NETWORK[srcKey];
    return [[jn.lat, jn.lng]];
  }

  // BFS
  const queue: string[][] = [[srcKey]];
  const visited = new Set<string>([srcKey]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const node = RAIL_NETWORK[current];
    if (!node) continue;

    for (const neighborKey of node.neighbors) {
      if (visited.has(neighborKey)) continue;
      const newPath = [...path, neighborKey];
      if (neighborKey === dstKey) {
        // Build coordinate path: src → junctions → dst
        const coords: Array<[number, number]> = [[srcLat, srcLng]];
        for (const key of newPath) {
          const jn = RAIL_NETWORK[key];
          if (jn) coords.push([jn.lat, jn.lng]);
        }
        coords.push([dstLat, dstLng]);
        return coords;
      }
      visited.add(neighborKey);
      queue.push(newPath);
    }
  }

  return null;  // no rail path found
}

/* ══════════════════════════════════════════════
   OSRM — fetch real road route (for cars, buses, bikes)
   ══════════════════════════════════════════════ */
async function fetchOSRMRoute(
  srcLat: number, srcLng: number,
  dstLat: number, dstLng: number,
): Promise<Array<[number, number]> | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${srcLng},${srcLat};${dstLng},${dstLat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords: Array<[number, number]> = data?.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════
   ROUTE RESOLVER — picks the right routing method
   ══════════════════════════════════════════════ */
async function resolveRoute(
  srcLat: number, srcLng: number,
  dstLat: number, dstLng: number,
  modeKey: ModeKey,
): Promise<{ route: Array<[number, number]>; junctions?: Array<{ name: string; lat: number; lng: number }> }> {
  if (modeKey === "train" || modeKey === "metro") {
    // Use railway network
    const railRoute = findRailPath(srcLat, srcLng, dstLat, dstLng);
    if (railRoute && railRoute.length > 1) {
      // Collect junction names for markers
      const pathJunctions: Array<{ name: string; lat: number; lng: number }> = [];
      for (const jn of Object.values(RAIL_NETWORK)) {
        for (const pt of railRoute) {
          if (Math.abs(jn.lat - pt[0]) < 0.01 && Math.abs(jn.lng - pt[1]) < 0.01) {
            pathJunctions.push({ name: jn.name, lat: jn.lat, lng: jn.lng });
            break;
          }
        }
      }
      return { route: railRoute, junctions: pathJunctions };
    }
    // fallback to OSRM if no rail path found
  }

  // Road-based modes: use OSRM
  const osrm = await fetchOSRMRoute(srcLat, srcLng, dstLat, dstLng);
  if (osrm) return { route: osrm };

  // Ultimate fallback: straight line
  return { route: [[srcLat, srcLng], [dstLat, dstLng]] };
}

/* ══════════════════════════════════════════════
   LEAFLET HELPERS
   ══════════════════════════════════════════════ */
function FitBounds({ bounds }: {
  bounds: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } };
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [[bounds.southWest.lat, bounds.southWest.lng], [bounds.northEast.lat, bounds.northEast.lng]],
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

/* ══════════════════════════════════════════════
   MAP CANVAS COMPONENT
   ══════════════════════════════════════════════ */
export default function MapCanvas({
  map,
  transportMode,
}: {
  map: {
    center: { lat: number; lng: number };
    bounds: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } };
    route: Array<{ lat: number; lng: number }>;
    markers: Array<{ kind: string; label: string; area: string; lat: number; lng: number }>;
  };
  transportMode?: string;
}) {
  const [routeData, setRouteData] = useState<{
    route: Array<[number, number]>;
    junctions?: Array<{ name: string; lat: number; lng: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const srcMarker = map.markers.find((m) => m.kind === "source");
  const dstMarker = map.markers.find((m) => m.kind === "destination");
  const modeKey = classifyMode(transportMode || "");

  useEffect(() => {
    setLoading(true);
    setRouteData(null);

    if (srcMarker && dstMarker) {
      resolveRoute(srcMarker.lat, srcMarker.lng, dstMarker.lat, dstMarker.lng, modeKey)
        .then((data) => {
          setRouteData(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [srcMarker?.lat, srcMarker?.lng, dstMarker?.lat, dstMarker?.lng, modeKey]);

  const routePositions: Array<[number, number]> = routeData?.route
    ?? map.route.map((p) => [p.lat, p.lng]);

  const style = MODE_ROUTE_STYLES[modeKey] ?? MODE_ROUTE_STYLES.default;

  // Compute bounds from the route itself
  const allLats = routePositions.map((p) => p[0]);
  const allLngs = routePositions.map((p) => p[1]);
  const routeBounds = routePositions.length > 1
    ? {
        southWest: { lat: Math.min(...allLats) - 0.08, lng: Math.min(...allLngs) - 0.08 },
        northEast: { lat: Math.max(...allLats) + 0.08, lng: Math.max(...allLngs) + 0.08 },
      }
    : map.bounds;

  const isRailMode = modeKey === "train" || modeKey === "metro";

  return (
    <div style={{ position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "8px 0", background: "rgba(253,251,247,0.9)", backdropFilter: "blur(4px)",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase" as const, color: "var(--secondary)", gap: 8,
        }}>
          <span className="animate-pulse-soft">
            {isRailMode ? "Mapping railway route…" : "Loading road route…"}
          </span>
        </div>
      )}
      <MapContainer
        key={`${map.center.lat}-${map.center.lng}-${modeKey}`}
        center={[map.center.lat, map.center.lng]}
        zoom={11}
        scrollWheelZoom={false}
        className="map-shell"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={routeBounds} />

        {/* Main route polyline */}
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: style.color,
            dashArray: style.dashArray,
            weight: style.weight,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Railway junction dots (only for train/metro) */}
        {isRailMode && routeData?.junctions?.map((jn) => (
          <CircleMarker
            key={`jn-${jn.name}`}
            center={[jn.lat, jn.lng]}
            radius={5}
            pathOptions={{
              color: "#fff",
              fillColor: style.color,
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              permanent={false}
            >
              <span style={{ fontWeight: 700, fontSize: "0.75rem" }}>🚉 {jn.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Source & Destination markers */}
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
    </div>
  );
}
