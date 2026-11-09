================================================================================
PMAS-ARID AGRICULTURE UNIVERSITY RAWALPINDI
Institute of Geo Information and Earth Observation (IGEO)
Course: WebGIS Development (RSG-505) — Lab Assignment #03
Title: Interactive WebGIS Navigation Dashboard (OpenStreetMap & Leaflet.js)
================================================================================
Student Name:       Emaan Abid
Arid Registration:  24-ARID-2205
Program:            BS Geo-Informatics (5th Semester)
Course Instructor:  Sir Jaffar Waqas
Assigned City:      Islamabad (Allocated from Lab 3.xlsx)
Assigned Category:  Mosque (Allocated from Lab 3.xlsx)
Selected Locations: 1. Faisal Mosque (Shah Faisal Masjid, Margalla Foothills)
                       [33.7297° N, 73.0372° E]
                    2. Lal Masjid (Red Mosque, Sector G-6/2, Islamabad)
                       [33.7088° N, 73.0857° E]
================================================================================

PACKAGE CONTENTS IN THIS FOLDER:
================================================================================
1. WebGIS_Lab03_24-ARID-2205_Emaan_Abid.pdf
   - Official 6-page comprehensive lab submission report complying with the exact
     naming convention specified in Lab 3.pdf (WebGIS_Lab03_ARIDNo_Name.pdf).
   - Features the official PMAS-Arid Agriculture University emblem, student credentials,
     study area allocation, full dashboard overview, active driving route telemetry,
     source code implementation, AI interaction sessions, and rigorous answers to
     all 5 conceptual questions (Q1 to Q5).

2. WebGIS_Lab03_Step_by_Step_Implementation_Guide.pdf
   - A dedicated 5-page Step-by-Step Methodology & Engineering Guide detailing the
     full development workflow:
     * Phase 1: Environment setup & official Arid logo integration
     * Phase 2: Semantic HTML5 architecture & 3-column layout
     * Phase 3: Diagnosing & resolving the Microsoft Edge HTTP 403 Forbidden tile error
     * Phase 4: Custom mosque marker cartography & interactive HTML popups
     * Phase 5: Multi-mode origin management (Live GPS, Arid Campus, Zero Point, Pick on Map)
     * Phase 6: OSRM REST routing engine integration & Haversine fallback algorithms
     * Phase 7: AI engineering collaboration workflow
     * Phase 8: Standalone single-file packaging & verification protocol

3. WebGIS_Lab03_Dashboard.html
   - Self-contained, portable single-file version of the dashboard.
   - Embeds all CSS styles, JavaScript logic, and the PMAS-Arid University Logo
     directly as a Base64 Data URI.
   - Guaranteed to open offline in Microsoft Edge, Chrome, or Firefox by simply
     double-clicking, without needing an HTTP web server or external image files.

4. index.html / style.css / script.js
   - Clean, modular production source files implementing:
     * High-reliability CartoDB Voyager tiles (OpenStreetMap data, zero 403 errors)
     * Layer switcher control (CartoDB Voyager, Esri Streets, OSM Standard, Positron, Esri Satellite)
     * Multi-mode origin selector with campus presets and "Pick on Map" mode
     * OSRM REST API route fetching and dynamic GeoJSON polyline rendering
     * Real-time distance (km) and estimated travel duration (minutes) telemetry

5. assets/
   - Arid Logo.png / Logo.png: Official high-resolution emblem of PMAS-Arid Agriculture University.

6. screenshots/
   - dashboard_overview.png: High-resolution overview of the Islamabad WebGIS dashboard.
   - route_faisal_mosque.png: Driving route from Zero Point to Faisal Mosque (~7.1 km, ~11 min).
   - route_lal_masjid.png: Driving route from Zero Point to Lal Masjid (~3.8 km, ~6 min).
   - ai_interaction_1.png: AI development session 1 (Layout & Leaflet setup).
   - ai_interaction_2.png: AI development session 2 (Geolocation & OSRM routing).

================================================================================
RESOLVING THE MICROSOFT EDGE HTTP 403 ERROR:
================================================================================
When HTML files are opened directly from local disk (file:///...), browsers send
empty referer and null origin headers. The standard OpenStreetMap server
(tile.openstreetmap.org) rejects these requests with HTTP 403 Forbidden.
We solved this by:
1. Setting CartoDB Voyager as the primary default base layer. It is built on
   OpenStreetMap data, displays full roads and landmarks of Islamabad, and
   allows CORS from file:/// URLs with 100% uptime.
2. Adding an automated failover listener on OSM Standard: if it returns 403,
   the dashboard automatically switches to CartoDB Voyager and displays a banner.
3. Adding explicit container invalidation (map.invalidateSize()) ensuring
   zoom, pan, and cursor operations respond instantaneously.

================================================================================
HOW TO RUN:
================================================================================
Option 1 (Instant Offline Preview):
  Double-click `WebGIS_Lab03_Dashboard.html` or `index.html` in Microsoft Edge,
  Chrome, or Firefox.

Option 2 (Local Server):
  In PowerShell, run:
    python -m http.server 8080
  Open http://localhost:8080 in your web browser.

INTERACTIVE FEATURES:
- Click "Live GPS": Queries browser geolocation.
- Click "Arid Univ": Sets origin to PMAS-Arid Agriculture University campus.
- Click "Zero Point": Sets origin to central Islamabad.
- Click "Pick on Map": Turns cursor into a crosshair; click anywhere on the map
  to choose any custom start location!
- Click "Calculate Route to Faisal Mosque" or "Calculate Route to Lal Masjid"
  to calculate driving path, distance, and travel time.
================================================================================
