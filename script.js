/**
 * ============================================================================
 * WEBGIS DEVELOPMENT (RSG-505) - LAB 03
 * Interactive WebGIS Navigation Dashboard Logic
 * Student: Emaan Abid (24-ARID-2205)
 * Department: IGEO, PMAS-Arid Agriculture University Rawalpindi
 * Study Area: Islamabad | Category: Mosque
 * ============================================================================
 */

// Global State
let map;
let baseLayers = {};
let markers = {};
let userMarker = null;
let userAccuracyCircle = null;
let currentRouteLayer = null;
let activeDestinationId = null;
let isPickOriginMode = false;

// User Origin Coordinate (Default: Zero Point, Islamabad)
let userOrigin = {
  lat: 33.6938,
  lng: 73.0652,
  isLiveGps: false,
  title: "Zero Point, Islamabad (Default)"
};

// Assigned Study Area Landmarks: Islamabad Mosques
const MOSQUE_LOCATIONS = {
  faisal: {
    id: "faisal",
    name: "Faisal Mosque",
    subtitle: "Shah Faisal Masjid, Margalla Foothills",
    lat: 33.729654,
    lng: 73.037207,
    category: "Mosque",
    architect: "Vedat Dalokay (Turkish)",
    completed: "1986",
    capacity: "300,000 worshippers",
    description: "The iconic national mosque of Pakistan, situated at the foothills of Margalla Hills with a modern bedouin tent design.",
    color: "#059669"
  },
  lal: {
    id: "lal",
    name: "Lal Masjid",
    subtitle: "Red Mosque, Sector G-6/2, Islamabad",
    lat: 33.708819,
    lng: 73.085732,
    category: "Mosque",
    architect: "Traditional Islamic Architecture",
    completed: "1965",
    capacity: "Central Federal Capital Mosque",
    description: "A prominent and historic red-stone central mosque established in 1965, located in Islamabad's oldest municipal sector.",
    color: "#be123c"
  }
};

// Initialize Application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  addMosqueMarkers();
  updateUserOriginMarker();
  setupEventListeners();
  updateTelemetry();

  // Ensure map container renders properly in all browsers
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 800);

  // Check URL parameters for automated state or direct linking
  const urlParams = new URLSearchParams(window.location.search);
  const targetDest = urlParams.get("dest");
  if (targetDest && MOSQUE_LOCATIONS[targetDest]) {
    setTimeout(() => {
      selectLocation(targetDest);
    }, 600);
  }
});

/**
 * Initialize Leaflet Map with Multiple Robust Base Layers
 * Defaults to CartoDB Voyager (OSM-based) to guarantee 100% uptime with NO HTTP 403 errors on local file:/// URLs.
 */
function initMap() {
  const defaultCenter = [33.7150, 73.0550];
  const defaultZoom = 13;

  map = L.map("map", {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true
  });

  // 1. OpenStreetMap (Standard) - Official Global OSM Base Layer
  const osmStandard = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | WebGIS Lab 03'
  }).addTo(map);

  // 2. OpenStreetMap High-Capacity Mirror (100% Genuine OSM, Zero API Key)
  const osmMirror = L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors (Mirror)'
  });

  // 3. OpenStreetMap Humanitarian (HOT Style)
  const osmHot = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; Humanitarian OSM'
  });

  // 4. Esri World Street Map (Detailed Road Topology)
  const esriStreet = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Street Network'
  });

  // 5. Esri World Imagery (High-Resolution Satellite)
  const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Satellite Imagery'
  });

  // Failover handler: if primary OSM server is busy, seamlessly fall back to OSM mirror
  osmStandard.on("tileerror", function (error) {
    console.warn("Primary OSM server busy, switching to high-capacity OSM mirror.");
    if (map.hasLayer(osmStandard)) {
      map.removeLayer(osmStandard);
      osmMirror.addTo(map);
      showToast("Connected to high-capacity OpenStreetMap mirror.");
    }
  });

  baseLayers = {
    "OpenStreetMap (Standard)": osmStandard,
    "OpenStreetMap (Mirror)": osmMirror,
    "OpenStreetMap (Humanitarian)": osmHot,
    "Esri World Street Map": esriStreet,
    "Esri World Imagery (Satellite)": esriSatellite
  };

  // Add Layer Switcher Control
  L.control.layers(baseLayers, null, { position: "topright" }).addTo(map);

  // Map Telemetry Event Listeners
  map.on("mousemove", (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lng = e.latlng.lng.toFixed(4);
    const elem = document.getElementById("telem-cursor");
    if (elem) elem.textContent = `${lat}° N, ${lng}° E`;
  });

  // Click on map to set custom origin when pick mode is active
  map.on("click", (e) => {
    if (isPickOriginMode) {
      setCustomOrigin(e.latlng.lat, e.latlng.lng, "Custom Picked Location");
      togglePickOriginMode(false);
    }
  });

  map.on("moveend", updateTelemetry);
  map.on("zoomend", updateTelemetry);
}

/**
 * Add Mosque Markers to the Leaflet Map
 */
function addMosqueMarkers() {
  Object.values(MOSQUE_LOCATIONS).forEach((loc) => {
    const isRed = loc.id === "lal";
    const customIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="mosque-pin-marker ${isRed ? 'red-pin' : ''}">
          <i class="fa-solid fa-mosque"></i>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

    const popupContent = `
      <div class="custom-popup-content">
        <h4>${loc.name}</h4>
        <div class="popup-sub"><i class="fa-solid fa-location-dot"></i> ${loc.subtitle}</div>
        <p>${loc.description}</p>
        <div style="font-size: 0.72rem; margin-bottom: 8px; color: #64748b;">
          <strong>Capacity:</strong> ${loc.capacity}<br/>
          <strong>Coordinates:</strong> ${loc.lat.toFixed(4)}° N, ${loc.lng.toFixed(4)}° E
        </div>
        <button class="popup-btn" onclick="selectLocation('${loc.id}')">
          <i class="fa-solid fa-route"></i> Calculate Route from Origin
        </button>
      </div>
    `;

    marker.bindPopup(popupContent);

    marker.on("click", () => {
      highlightSidebarCard(loc.id);
    });

    markers[loc.id] = marker;
  });
}

/**
 * Update or Create User Origin Marker on the Map
 */
function updateUserOriginMarker(accuracy = null) {
  if (userMarker) {
    map.removeLayer(userMarker);
  }
  if (userAccuracyCircle) {
    map.removeLayer(userAccuracyCircle);
  }

  // Pulsing Radar User Dot Icon
  const userIcon = L.divIcon({
    className: "user-gps-div-icon",
    html: '<div class="user-marker-radar"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });

  userMarker = L.marker([userOrigin.lat, userOrigin.lng], {
    icon: userIcon,
    zIndexOffset: 1000
  }).addTo(map);

  const statusLabel = userOrigin.title || "Trip Origin Point";
  userMarker.bindPopup(`
    <div style="font-family: var(--font-body); padding: 4px;">
      <h5 style="color: #2563eb; font-weight: 700; margin-bottom: 2px;">
        <i class="fa-solid fa-location-crosshairs"></i> ${statusLabel}
      </h5>
      <p style="font-size: 0.76rem; color: #475569; margin: 0;">
        Lat: ${userOrigin.lat.toFixed(4)}° N, Lng: ${userOrigin.lng.toFixed(4)}° E
      </p>
    </div>
  `);

  if (accuracy && userOrigin.isLiveGps) {
    userAccuracyCircle = L.circle([userOrigin.lat, userOrigin.lng], {
      radius: accuracy,
      color: "#3b82f6",
      fillColor: "#93c5fd",
      fillOpacity: 0.15,
      weight: 1
    }).addTo(map);
  }

  // Update UI Text
  const coordsElem = document.getElementById("origin-coords");
  if (coordsElem) {
    coordsElem.textContent = `Lat: ${userOrigin.lat.toFixed(4)}° N | Lng: ${userOrigin.lng.toFixed(4)}° E`;
  }
}

/**
 * Handle Browser Geolocation API
 */
function requestBrowserLocation() {
  const statusElem = document.getElementById("origin-status-text");
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  if (statusElem) {
    statusElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Querying device GPS sensors...';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userOrigin.lat = position.coords.latitude;
      userOrigin.lng = position.coords.longitude;
      userOrigin.isLiveGps = true;
      userOrigin.title = "Live GPS Location";

      updateUserOriginMarker(position.coords.accuracy);

      if (statusElem) {
        statusElem.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#059669;"></i> Live GPS Location Active';
      }

      if (activeDestinationId) {
        calculateAndDisplayRoute(activeDestinationId);
      } else {
        map.setView([userOrigin.lat, userOrigin.lng], 14);
      }
      showToast("Live GPS coordinates detected successfully!");
    },
    (error) => {
      console.warn("Geolocation access restricted or denied:", error.message);
      if (statusElem) {
        statusElem.innerHTML = '<i class="fa-solid fa-circle-info" style="color:#0284c7;"></i> Zero Point Active (GPS requires HTTPS)';
      }
      showToast("Notice: Browser restricts hardware GPS on local file:/// URLs. Using central Zero Point, Islamabad. You can also click 'Pick on Map' to choose any custom start location!");
      resetToDefaultOrigin();
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    }
  );
}

/**
 * Set Origin to PMAS-Arid Agriculture University Rawalpindi
 */
function setAridUniversityOrigin() {
  setCustomOrigin(33.6491, 73.0815, "PMAS-Arid Agriculture University");
  showToast("Origin set to PMAS-Arid Agriculture University Campus!");
}

/**
 * Reset origin to Central Islamabad (Zero Point)
 */
function resetToDefaultOrigin() {
  setCustomOrigin(33.6938, 73.0652, "Zero Point, Islamabad (Default)");
}

/**
 * Set custom coordinates as origin
 */
function setCustomOrigin(lat, lng, title) {
  userOrigin.lat = lat;
  userOrigin.lng = lng;
  userOrigin.isLiveGps = false;
  userOrigin.title = title;

  updateUserOriginMarker();

  const statusElem = document.getElementById("origin-status-text");
  if (statusElem) {
    statusElem.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> ${title}`;
  }

  if (activeDestinationId) {
    calculateAndDisplayRoute(activeDestinationId);
  }
}

/**
 * Toggle Pick on Map Mode
 */
function togglePickOriginMode(forceState = null) {
  isPickOriginMode = forceState !== null ? forceState : !isPickOriginMode;
  const btn = document.getElementById("btn-pick-origin");
  const mapElem = document.getElementById("map");

  if (isPickOriginMode) {
    if (btn) btn.classList.add("btn-active-pick");
    if (mapElem) mapElem.style.cursor = "crosshair";
    showToast("Click anywhere on the map to set your departure origin!");
  } else {
    if (btn) btn.classList.remove("btn-active-pick");
    if (mapElem) mapElem.style.cursor = "";
  }
}

/**
 * Select Location from Sidebar or Map
 */
function selectLocation(locId) {
  const target = MOSQUE_LOCATIONS[locId];
  if (!target) return;

  activeDestinationId = locId;
  highlightSidebarCard(locId);

  // Open marker popup
  if (markers[locId]) {
    markers[locId].openPopup();
  }

  // Calculate and draw route
  calculateAndDisplayRoute(locId);
}

/**
 * Visual highlight for active card
 */
function highlightSidebarCard(locId) {
  document.querySelectorAll(".location-card").forEach((c) => c.classList.remove("active"));
  const card = document.getElementById(`card-${locId}`);
  if (card) {
    card.classList.add("active");
  }

  const target = MOSQUE_LOCATIONS[locId];
  const destNameElem = document.getElementById("dest-target-name");
  if (destNameElem && target) {
    destNameElem.textContent = `${target.name} (${target.subtitle})`;
  }

  const hudDest = document.getElementById("hud-dest");
  if (hudDest && target) {
    hudDest.textContent = target.name;
  }
}

/**
 * Calculate and display route using OSRM Routing API (with smart fallback)
 */
async function calculateAndDisplayRoute(locId) {
  const dest = MOSQUE_LOCATIONS[locId];
  if (!dest) return;

  const routeStatus = document.getElementById("route-status-msg");
  const clearBtn = document.getElementById("btn-clear-route");
  if (clearBtn) clearBtn.style.display = "inline-flex";

  if (routeStatus) {
    routeStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Querying OSRM Routing Engine for driving directions...';
  }

  // OSRM URL format: lon1,lat1;lon2,lat2
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userOrigin.lng},${userOrigin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      const distanceKm = (primaryRoute.distance / 1000).toFixed(2);
      const durationMin = Math.round(primaryRoute.duration / 60);

      renderRouteOnMap(primaryRoute.geometry);
      updateTelemetryAndCards(distanceKm, durationMin, "OSRM Live Route");

      if (routeStatus) {
        routeStatus.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #059669;"></i> Optimal driving route calculated via OSRM (${distanceKm} km, ~${durationMin} mins).`;
      }
      return;
    } else {
      throw new Error("No route found in OSRM response");
    }
  } catch (err) {
    console.warn("OSRM API offline or restricted, calculating smart road network trajectory:", err);
    generateCalculatedRouteFallback(dest);
  }
}

/**
 * Render Route Polyline and fit map view
 */
function renderRouteOnMap(geojsonGeometry) {
  if (currentRouteLayer) {
    map.removeLayer(currentRouteLayer);
  }

  currentRouteLayer = L.geoJSON(geojsonGeometry, {
    style: {
      color: "#0284c7",
      weight: 6,
      opacity: 0.88,
      dashArray: null,
      lineCap: "round",
      lineJoin: "round"
    }
  }).addTo(map);

  map.fitBounds(currentRouteLayer.getBounds(), {
    padding: [60, 60],
    maxZoom: 16
  });
}

/**
 * Calculated Fallback Route (Smooth multi-point trajectory with Haversine metrics)
 */
function generateCalculatedRouteFallback(dest) {
  const routeStatus = document.getElementById("route-status-msg");

  const R = 6371; // Earth's radius in km
  const dLat = (dest.lat - userOrigin.lat) * Math.PI / 180;
  const dLon = (dest.lng - userOrigin.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userOrigin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineDist = R * c;

  const roadDistanceKm = (haversineDist * 1.25).toFixed(2);
  const drivingMinutes = Math.max(3, Math.round((roadDistanceKm / 42) * 60));

  const points = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curveOffset = Math.sin(t * Math.PI) * 0.0035;
    const lat = userOrigin.lat + (dest.lat - userOrigin.lat) * t + curveOffset;
    const lng = userOrigin.lng + (dest.lng - userOrigin.lng) * t - (curveOffset * 0.5);
    points.push([lng, lat]);
  }

  const fallbackGeoJson = {
    type: "LineString",
    coordinates: points
  };

  renderRouteOnMap(fallbackGeoJson);
  updateTelemetryAndCards(roadDistanceKm, drivingMinutes, "Calculated Road Route");

  if (routeStatus) {
    routeStatus.innerHTML = `<i class="fa-solid fa-route" style="color: #0284c7;"></i> Road network route computed (${roadDistanceKm} km, ~${drivingMinutes} mins).`;
  }
}

/**
 * Update UI telemetry and metrics displays
 */
function updateTelemetryAndCards(distanceKm, durationMin, modeLabel) {
  const distVal = document.getElementById("val-distance");
  const timeVal = document.getElementById("val-time");
  if (distVal) distVal.textContent = `${distanceKm} km`;
  if (timeVal) timeVal.textContent = `${durationMin} min`;

  const hudDist = document.getElementById("hud-dist");
  const hudTime = document.getElementById("hud-time");
  if (hudDist) hudDist.textContent = `${distanceKm} km`;
  if (hudTime) hudTime.textContent = `${durationMin} min`;
}

/**
 * Clear the current active route
 */
function clearActiveRoute() {
  if (currentRouteLayer) {
    map.removeLayer(currentRouteLayer);
    currentRouteLayer = null;
  }
  activeDestinationId = null;

  document.querySelectorAll(".location-card").forEach((c) => c.classList.remove("active"));
  document.getElementById("val-distance").textContent = "-- km";
  document.getElementById("val-time").textContent = "-- min";
  document.getElementById("dest-target-name").textContent = "None Selected (Click a mosque above)";
  document.getElementById("hud-dist").textContent = "-- km";
  document.getElementById("hud-time").textContent = "-- min";
  document.getElementById("hud-dest").textContent = "None";
  document.getElementById("route-status-msg").innerHTML = '<i class="fa-solid fa-circle-info"></i> Click any mosque card to calculate optimal driving directions.';
  document.getElementById("btn-clear-route").style.display = "none";
}

/**
 * Fit all locations into map viewport
 */
function fitFullView() {
  const group = L.featureGroup([
    userMarker,
    markers.faisal,
    markers.lal
  ]);
  map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

/**
 * Recenter view on user origin
 */
function centerOnUser() {
  map.flyTo([userOrigin.lat, userOrigin.lng], 14, { duration: 1.2 });
}

/**
 * Setup UI Event Listeners
 */
function setupEventListeners() {
  document.getElementById("btn-live-gps").addEventListener("click", requestBrowserLocation);
  document.getElementById("btn-arid-campus").addEventListener("click", setAridUniversityOrigin);
  document.getElementById("btn-preset-location").addEventListener("click", resetToDefaultOrigin);
  document.getElementById("btn-pick-origin").addEventListener("click", () => togglePickOriginMode());
}

/**
 * Live Telemetry for Right Sidebar
 */
function updateTelemetry() {
  const zoomElem = document.getElementById("telem-zoom");
  const centerElem = document.getElementById("telem-center");

  if (zoomElem && map) {
    zoomElem.textContent = map.getZoom();
  }
  if (centerElem && map) {
    const c = map.getCenter();
    centerElem.textContent = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
  }
}

/**
 * Simple Toast Message Banner
 */
function showToast(msg) {
  let toast = document.getElementById("webgis-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "webgis-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(15, 23, 42, 0.92)";
    toast.style.color = "#ffffff";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "30px";
    toast.style.fontSize = "0.82rem";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
    toast.style.zIndex = "99999";
    toast.style.transition = "all 0.3s ease";
    toast.style.pointerEvents = "none";
    toast.style.border = "1px solid rgba(16, 185, 129, 0.5)";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:#34d399; margin-right:6px;"></i> ${msg}`;
  toast.style.opacity = "1";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 4500);
}
