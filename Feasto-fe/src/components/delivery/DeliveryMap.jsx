import L from "leaflet";
import "leaflet-routing-machine";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Bike, House } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const RoutingControl = ({ origin, destination }) => {
  const map = useMap();
  const controlRef = useRef(null);

  const waypoints = useMemo(() => {
    if (!origin || !destination) return [];
    return [L.latLng(origin.lat, origin.lng), L.latLng(destination.lat, destination.lng)];
  }, [origin, destination]);

  useEffect(() => {
    if (!map || waypoints.length !== 2) return;
    if (controlRef.current) {
      map.removeControl(controlRef.current);
      controlRef.current = null;
    }
    const control = L.Routing.control({
      waypoints,
      lineOptions: { addWaypoints: false, styles: [{ color: "#2563eb", weight: 5 }] },
      show: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1", profile: "bike" }),
      createMarker: () => null,
    });
    control.addTo(map);
    // ensure the control computes the route and fit map when routes found
    try {
      // set waypoints explicitly to force a route computation
      control.setWaypoints(waypoints);
    } catch {
      // some builds may not expose setWaypoints; ignore safely
    }

    const onRoutesFound = (e) => {
      try {
        const routes = e.routes || [];
        if (routes.length > 0) {
          const bounds = routes[0].bounds || L.latLngBounds(routes[0].coordinates.map((c) => [c.lat, c.lng]));
          if (bounds && map) map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch {
        // ignore fit errors
      }
    };

    control.on("routesfound", onRoutesFound);

    // hide the control UI container (it can show a small square on some layouts)
    try {
      if (control._container) control._container.style.display = "none";
    } catch {
      /* ignore */
    }

    controlRef.current = control;
    return () => {
        if (controlRef.current) {
          try {
            controlRef.current.off("routesfound", onRoutesFound);
          } catch {
            // ignore
          }
          map.removeControl(controlRef.current);
          controlRef.current = null;
        }
    };
  }, [map, waypoints]);

  return null;
};

const DeliveryMap = ({ origin, destination, height = 220 }) => {
  // Fix default marker icons in many bundlers
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
  // create lucide-react SVG markup for bike and home, then use as divIcon HTML
  // renderToStaticMarkup converts the React icon components into an inline SVG string
  const bikeSvg = renderToStaticMarkup(<Bike size={36} strokeWidth={1.8} color="#f97316" />);
  const homeSvg = renderToStaticMarkup(<House size={36} color="#27d51a" strokeWidth={1.8} />);

  // wrap in a container DIV to ensure consistent sizing/display
  const bikeHtml = `<div style="display:inline-block;line-height:0">${bikeSvg}</div>`;
  const homeHtml = `<div style="display:inline-block;line-height:0">${homeSvg}</div>`;

  const bikeIcon = L.divIcon({ html: bikeHtml, className: "custom-div-icon bike-icon", iconSize: [36, 36], iconAnchor: [18, 34] });
  const homeIcon = L.divIcon({ html: homeHtml, className: "custom-div-icon home-icon", iconSize: [36, 36], iconAnchor: [18, 34] });

  const center = origin || destination || { lat: 0, lng: 0 };
  const originMarker = origin ? (
    <Marker position={[origin.lat, origin.lng]} icon={bikeIcon} />
  ) : null;
  const destMarker = destination ? (
    <Marker position={[destination.lat, destination.lng]} icon={homeIcon} />
  ) : null;

  // next maneuver state (modifier: left/right/straight, name, distance)
  const [nextManeuver, setNextManeuver] = useState(null);
  const [stepsList, setStepsList] = useState([]);
  const [showFullMap, setShowFullMap] = useState(false);

  useEffect(() => {
    if (!origin || !destination) {
      setNextManeuver(null);
      return;
    }
    const controller = new AbortController();
    const lon1 = origin.lng;
    const lat1 = origin.lat;
    const lon2 = destination.lng;
    const lat2 = destination.lat;
    // request steps from OSRM directly to get maneuver/modifier info
    const url = `https://router.project-osrm.org/route/v1/bike/${lon1},${lat1};${lon2},${lat2}?overview=false&steps=true&geometries=geojson&alternatives=false`;
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        try {
          if (data && (data.code === "Ok" || data.code === "OK") && data.routes && data.routes.length) {
            const legs = data.routes[0].legs || [];
            if (legs.length > 0) {
              const steps = legs[0].steps || [];
              if (steps.length > 0) {
                // find first non-depart maneuver if possible
                  const step = steps.find((s) => s.maneuver && s.maneuver.type !== "depart") || steps[0];
                  const maneuver = step.maneuver || {};
                  const modifier = maneuver.modifier || maneuver.type || null;
                  const name = step.name || step.ref || "";
                  const distance = typeof step.distance === "number" ? step.distance : null;
                  setNextManeuver({ modifier, name, distance });
                  // store full steps for turn-by-turn display
                  setStepsList(steps.map((s) => ({ maneuver: s.maneuver || {}, name: s.name || s.ref || "", distance: s.distance || 0 })));
                  return;
              }
            }
          }
        } catch {
          // ignore parsing errors
        }
  setNextManeuver(null);
  setStepsList([]);
      })
      .catch(() => {
        setNextManeuver(null);
        setStepsList([]);
      });
    return () => controller.abort();
  }, [origin, destination]);

  const formatDistance = (m) => {
    if (m == null) return "";
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  const renderManeuverText = (m) => {
    if (!m) return null;
    const dir = (m.modifier || "").toLowerCase();
    if (dir.includes("left")) return `Turn left ${m.name ? `onto ${m.name}` : ""} — ${formatDistance(m.distance)}`;
    if (dir.includes("right")) return `Turn right ${m.name ? `onto ${m.name}` : ""} — ${formatDistance(m.distance)}`;
    if (dir.includes("uturn")) return `Make a U-turn ${m.name ? `onto ${m.name}` : ""} — ${formatDistance(m.distance)}`;
    return `${m.name ? `${m.name}` : "Continue"} — ${formatDistance(m.distance)}`;
  };

  // mobile-first: small embedded map with a "Show map" button that opens a full-screen modal
  return (
    <div style={{ height, position: "relative" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {originMarker}
        {destMarker}
        {origin && destination && <RoutingControl origin={origin} destination={destination} />}
      </MapContainer>

      {/* small overlay showing next maneuver + show map control */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 1000,
          background: "rgba(255,255,255,0.95)",
          padding: "8px 12px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          fontSize: 13,
          minWidth: 160,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600 }}>Next</div>
        <div style={{ color: "#111827", marginBottom: 4 }}>{renderManeuverText(nextManeuver) || "Calculating route..."}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowFullMap(true)}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Show map
          </button>
          <button
            onClick={() => alert(renderManeuverText(nextManeuver) || "No directions yet")}
            style={{
              background: "#f3f4f6",
              color: "#111827",
              border: "1px solid #e5e7eb",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            All directions
          </button>
        </div>
      </div>

      {/* Full screen modal for map + directions */}
      {showFullMap && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 12,
          }}
          onClick={() => setShowFullMap(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 960,
              height: "100%",
              maxHeight: "100%",
              background: "white",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: window.innerWidth <= 640 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1, minHeight: 200 }}>
              <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {originMarker}
                {destMarker}
                {origin && destination && <RoutingControl origin={origin} destination={destination} />}
              </MapContainer>
            </div>

            <div style={{ width: window.innerWidth <= 640 ? "100%" : 360, borderLeft: window.innerWidth <= 640 ? "none" : "1px solid #e5e7eb", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Directions</div>
                <button onClick={() => setShowFullMap(false)} style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer" }}>&times;</button>
              </div>
              <ol style={{ padding: 12, margin: 0, listStyle: "decimal" }}>
                {stepsList && stepsList.length ? (
                  stepsList.map((s, idx) => (
                    <li key={idx} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ fontWeight: 600 }}>{renderManeuverText(s.maneuver) || s.name || "Proceed"}</div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>{s.name || ""} — {formatDistance(s.distance)}</div>
                    </li>
                  ))
                ) : (
                  <div style={{ padding: 12 }}>No directions available</div>
                )}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
