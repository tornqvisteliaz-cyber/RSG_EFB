/**
 * RSG EFB - Windows Classic OS Theme Instrument
 * MSFS 2024 — Real SimVar Integration
 * ================================================================
 * All flight/weather data is sourced from official MSFS 2024 SDK
 * Simulation Variables via SimVar.GetSimVarValue().
 *
 * SIMVAR REFERENCE (https://docs.flightsimulator.com):
 *
 * AIRSPEED (Airspeed / Navigation):
 *   "AIRSPEED INDICATED"       → knots   → IAS (indicated airspeed)
 *   "AIRSPEED TRUE"            → knots   → TAS (true airspeed)
 *   "AIRSPEED MACH"            → mach    → Mach number
 *
 * POSITION (Flight Position / Navigation):
 *   "PLANE LATITUDE"           → degrees → GPS Latitude
 *   "PLANE LONGITUDE"          → degrees → GPS Longitude
 *   "PLANE HEADING DEGREES MAGNETIC" → degrees → Heading (magnetic)
 *   "PLANE HEADING DEGREES TRUE" → degrees → Heading (true)
 *   "GROUND VELOCITY"          → knots   → Ground Speed
 *   "INDICATED ALTITUDE"       → feet    → Altitude (IAA/pilot)
 *   "PLANE ALTITUDE"            → feet    → Altitude (AGL/WGS84)
 *   "VERTICAL SPEED"            → feet per minute → V/S
 *
 * FUEL (Fuel):
 *   "FUEL TOTAL QUANTITY"       → gallons → Fuel onboard (gal)
 *   "FUEL TOTAL QUANTITY WEIGHT"→ pounds  → Fuel weight (lbs)
 *   "ESTIMATED FUEL FLOW"        → pounds per hour → FF (lbs/hr)
 *
 * ENGINE (Engine):
 *   "GENERAL ENG FUEL FLOW PPH:1" → pounds per hour → FF pph (Eng 1)
 *   "GENERAL ENG RPM:1"          → rpm     → Engine RPM (Eng 1)
 *   "TURB ENG N1:1"              → percent → N1 turbine % (Eng 1)
 *   "GENERAL ENG COMBUSTION:1"   → bool    → Engine running (Eng 1)
 *
 * WEATHER (Miscellaneous):
 *   "AMBIENT TEMPERATURE"        → celsius       → OAT
 *   "AMBIENT WIND VELOCITY"      → knots         → Wind speed
 *   "AMBIENT WIND DIRECTION"      → degrees       → Wind dir (magnetic)
 *   "AMBIENT VISIBILITY"         → meters        → Visibility
 *   "AMBIENT PRESSURE"           → millibars     → Ambient pressure
 *   "BAROMETER PRESSURE"          → millibars     → Baro/QNH setting
 *
 * AUTOPILOT (Autopilot):
 *   "AUTOPILOT MASTER"             → bool    → AP active
 *   "AUTOPILOT HEADING LOCK DIR"   → degrees → AP heading target
 *   "AUTOPILOT ALTITUDE LOCK VAR"  → feet    → AP altitude target
 *
 * GEAR / FLAPS (Checklist / System):
 *   "GEAR HANDLE POSITION"        → bool    → Gear handle (true=down)
 *   "FLAPS HANDLE PERCENT"        → percent → Flaps position %
 *
 * ================================================================
 * Update rate: 10 Hz (every 100 ms)
 * Formatters:
 *   Speed/Alt/Heading   → Math.round() → integer string
 *   V/S                 → nearest 10 fpm
 *   Fuel/qty            → 1 decimal
 *   Lat/Lon             → 4 decimal places
 *   Heading             → padLeft 3 digits (e.g. "027")
 * ================================================================
 */

class RSG_EFB extends BaseInstrument {
    constructor() {
        super();

        this.initialized = false;
        this.templateID = "RSG_EFB";

        // Real-time flight data object — populated by SimVars each tick
        this.flightData = {
            airspeed:           0,   // IAS  knots
            tas:                0,   // TAS  knots
            mach:               0,   // mach
            altitude:           0,   // Indicated Altitude (feet)
            altitudeTrue:        0,   // Plane Altitude AGL (feet)
            heading:            0,   // Magnetic heading (degrees, 0-360)
            headingTrue:        0,   // True heading (degrees)
            verticalSpeed:      0,   // feet/min
            groundSpeed:        0,   // knots
            lat:                0,   // degrees
            lon:                0,   // degrees
            // Fuel
            fuelGal:            0,   // gallons
            fuelLbs:            0,   // pounds
            fuelFlowPph:        0,   // lbs/hr
            // Engine
            rpm:                0,   // rpm
            n1:                 0,   // percent
            engineRunning:      false,
            // Weather
            oat:                0,   // celsius
            windSpeed:          0,   // knots
            windDir:            0,   // degrees
            visibility:         0,   // meters
            ambientPressure:    0,   // millibars
            baroSetting:        0,   // millibars
            // Autopilot
            apActive:           false,
            apHeading:          0,
            apAltitude:         0,
            // System
            gearHandle:         false,
            flapsPercent:       0,
        };

        this.checklistItems = [
            { name: "Pre-Flight", completed: false, items: [
                { text: "Parking brake set", checked: false },
                { text: "Beacon lights on", checked: false },
                { text: "Fuel quantities set", checked: false },
                { text: "Weights confirmed", checked: false }
            ]},
            { name: "Before Start", completed: false, items: [
                { text: "Aircraft documents on board", checked: false },
                { text: "ATIS received", checked: false },
                { text: "Briefing complete", checked: false },
                { text: "Cabin ready", checked: false }
            ]},
            { name: "Engine Start", completed: false, items: [
                { text: "Anti-ice off", checked: false },
                { text: "Start procedure complete", checked: false },
                { text: "APU stable", checked: false },
                { text: "APU off", checked: false }
            ]},
            { name: "Taxi & Takeoff", completed: false, items: [
                { text: "Takeoff briefing complete", checked: false },
                { text: "Gear up", checked: false },
                { text: "Flaps up", checked: false }
            ]},
            { name: "Climb", completed: false, items: [
                { text: "Acceleration altitude", checked: false },
                { text: "APU on", checked: false },
                { text: "Cabin pressurization", checked: false }
            ]},
            { name: "Cruise", completed: false, items: [
                { text: "LRC procedures", checked: false },
                { text: "Fuel burn verified", checked: false },
                { text: "WX check", checked: false }
            ]},
            { name: "Descent", completed: false, items: [
                { text: "ATIS received dest.", checked: false },
                { text: "Approach briefing", checked: false },
                { text: "Anti-ice on", checked: false }
            ]},
            { name: "Approach", completed: false, items: [
                { text: "Gear down", checked: false },
                { text: "Flaps set", checked: false },
                { text: "Autopilot disconnect", checked: false },
                { text: "Approach stable", checked: false }
            ]},
            { name: "Landing", completed: false, items: [
                { text: "Touchdown", checked: false },
                { text: "Spoilers deployed", checked: false },
                { text: "Thrust reversers", checked: false },
                { text: "Brakes set", checked: false }
            ]}
        ];

        this.windows = {};

        this.dragState = {
            active: false,
            target: null,
            offsetX: 0,
            offsetY: 0
        };

        this.updateCount = 0;
    }

    get templateID() {
        return "RSG_EFB";
    }

    connectedCallback() {
        super.connectedCallback();

        // Inject CSS (only once)
        const styleId = 'rsg-efb-styles';
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = './RSG_EFB.css';
            document.head.appendChild(link);
        }

        this.initialized = true;
        this.initWindowDragging();
        this.initChecklist();
        this.startDataUpdate();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.initialized = false;
        console.log("[RSG EFB] Disconnected");
    }

    Update() {
        super.Update();
        this.updateClock();
    }

    /**
     * startDataUpdate — 10 Hz poll via setInterval.
     * Each tick reads real MSFS SimVars into flightData and updates all UI displays.
     */
    startDataUpdate() {
        setInterval(() => {
            this.updateFlightDataFromSimVars();
        }, 100); // 10 Hz
    }

    /**
     * readSV — Convenience wrapper for SimVar.GetSimVarValue.
     * Returns raw value; NaN means the SimVar is not active/available.
     */
    readSV(name, unit) {
        return SimVar.GetSimVarValue(name, unit);
    }

    /**
     * Update all flight data from MSFS 2024 SimVars.
     * Source: https://docs.flightsimulator.com/msfs2024/html/
     */
    updateFlightDataFromSimVars() {
        const fd = this.flightData;

        // ── AIRSPEED ──────────────────────────────────────────
        fd.airspeed  = Math.round(this.readSV("AIRSPEED INDICATED",          "knots"));
        fd.tas       = Math.round(this.readSV("AIRSPEED TRUE",               "knots"));
        fd.mach      = parseFloat(this.readSV("AIRSPEED MACH",                "mach").toFixed(3));

        // ── POSITION ─────────────────────────────────────────
        fd.lat       = parseFloat(this.readSV("PLANE LATITUDE",              "degrees").toFixed(4));
        fd.lon       = parseFloat(this.readSV("PLANE LONGITUDE",              "degrees").toFixed(4));
        fd.altitude  = Math.round(this.readSV("INDICATED ALTITUDE",           "feet"));
        fd.altitudeTrue = Math.round(this.readSV("PLANE ALTITUDE",            "feet"));
        fd.heading   = Math.round(this.readSV("PLANE HEADING DEGREES MAGNETIC","degrees"));
        fd.headingTrue = Math.round(this.readSV("PLANE HEADING DEGREES TRUE",  "degrees"));
        fd.verticalSpeed = Math.round(this.readSV("VERTICAL SPEED",          "feet per minute") / 10) * 10;
        fd.groundSpeed    = Math.round(this.readSV("GROUND VELOCITY",          "knots"));

        // ── FUEL ─────────────────────────────────────────────
        fd.fuelGal   = parseFloat(this.readSV("FUEL TOTAL QUANTITY",        "gallons").toFixed(1));
        fd.fuelLbs   = parseFloat(this.readSV("FUEL TOTAL QUANTITY WEIGHT",  "pounds").toFixed(1));
        fd.fuelFlowPph = Math.round(this.readSV("ESTIMATED FUEL FLOW",       "pounds per hour"));

        // ── ENGINE ────────────────────────────────────────────
        fd.rpm         = Math.round(this.readSV("GENERAL ENG RPM:1",        "rpm"));
        fd.n1          = parseFloat(this.readSV("TURB ENG N1:1",             "percent").toFixed(1));
        fd.engineRunning = !!this.readSV("GENERAL ENG COMBUSTION:1",       "bool");

        // ── WEATHER ───────────────────────────────────────────
        fd.oat            = parseFloat(this.readSV("AMBIENT TEMPERATURE",    "celsius").toFixed(1));
        fd.windSpeed      = Math.round(this.readSV("AMBIENT WIND VELOCITY",  "knots"));
        fd.windDir        = Math.round(this.readSV("AMBIENT WIND DIRECTION", "degrees"));
        fd.visibility    = parseFloat((this.readSV("AMBIENT VISIBILITY",     "meters") / 1609.34).toFixed(1)); // convert to SM
        fd.ambientPressure = parseFloat(this.readSV("AMBIENT PRESSURE",     "millibars").toFixed(1));
        fd.baroSetting    = parseFloat(this.readSV("BAROMETER PRESSURE",     "millibars").toFixed(1));

        // ── AUTOPILOT ────────────────────────────────────────
        fd.apActive   = !!this.readSV("AUTOPILOT MASTER",              "bool");
        fd.apHeading  = Math.round(this.readSV("AUTOPILOT HEADING LOCK DIR","degrees"));
        fd.apAltitude = Math.round(this.readSV("AUTOPILOT ALTITUDE LOCK VAR","feet"));

        // ── GEAR / FLAPS ─────────────────────────────────────
        fd.gearHandle   = !!this.readSV("GEAR HANDLE POSITION",       "bool");
        fd.flapsPercent = Math.round(this.readSV("FLAPS HANDLE PERCENT", "percent"));

        // Push data to all display windows
        this.updatePerformanceDisplay();
        this.updateWeatherDisplay();
        this.updateChecklistDisplay();
        this.updateFlightPlanDisplay();
    }

    // ──────────────────────────────────────────────────────────────
    //  UI UPDATE METHODS — one per window/app
    // ──────────────────────────────────────────────────────────────

    updatePerformanceDisplay() {
        const fd = this.flightData;

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        // Primary section — Live Data panel
        set('perf-speed',    fd.airspeed + ' kts');
        set('perf-mach',     fd.mach.toFixed(3));
        set('perf-alt',      fd.altitude.toLocaleString() + ' ft');
        set('perf-gs',       fd.groundSpeed + ' kts');
        set('perf-tas',      fd.tas + ' kts');
        set('perf-hdg',      this.pad3(fd.heading) + '°M');
        set('perf-hdg-t',    this.pad3(fd.headingTrue) + '°T');
        set('perf-vs',       (fd.verticalSpeed >= 0 ? '+' : '') + fd.verticalSpeed + ' fpm');
        set('perf-lat',      fd.lat);
        set('perf-lon',      fd.lon);
        set('perf-alt-true', fd.altitudeTrue.toLocaleString() + ' ft');

        // Weather section (Performance window)
        set('perf-wind',     fd.windSpeed > 0 ? this.pad3(fd.windDir) + '° @ ' + fd.windSpeed + ' kts' : 'CALM');
        set('perf-vis',      fd.visibility + ' SM');
        set('perf-oat',      fd.oat + '°C');

        // Engine section
        set('perf-rpm',      fd.rpm > 0 ? fd.rpm + ' rpm' : '—');
        set('perf-n1',        fd.n1 > 0 ? fd.n1 + '%' : '—');
        set('perf-ff',        fd.fuelFlowPph > 0 ? fd.fuelFlowPph + ' lbs/hr' : '—');

        // Fuel section
        set('perf-fuel-lbs', fd.fuelLbs > 0 ? fd.fuelLbs + ' lbs' : '—');
        set('perf-fuel-gal', fd.fuelGal > 0 ? fd.fuelGal + ' gal' : '—');

        // Autopilot section
        set('perf-ap',       fd.apActive ? 'ON' : 'OFF');
        set('perf-ap-hdg',   fd.apActive ? this.pad3(fd.apHeading) + '°' : '—');
        set('perf-ap-alt',   fd.apActive ? fd.apAltitude.toLocaleString() + ' ft' : '—');
    }

    updateWeatherDisplay() {
        const fd = this.flightData;

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const windDirStr  = this.pad3(fd.windDir) + '°';
        const windSpeedStr = fd.windSpeed + ' kts';
        set('weather-wind-value',   windDirStr + ' @ ' + windSpeedStr);
        set('weather-vis-value',   fd.visibility + ' SM');
        set('weather-oat-value',   fd.oat + '°C');
        set('weather-dewp-value',  (fd.oat - 5).toFixed(1) + '°C');  // est. dewpoint
        set('weather-baroset-value', fd.baroSetting.toFixed(1) + ' mb');
        set('weather-temp-value',   fd.oat + '°C');
    }

    updateChecklistDisplay() {
        const fd = this.flightData;

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        // Gear indicator — "UP" when handle not pressed, "DOWN" when pressed
        set('checklist-gear', fd.gearHandle ? 'DOWN' : 'UP');

        // Flaps indicator
        set('checklist-flaps', fd.flapsPercent + '%');

        // Engine indicator
        set('checklist-engine', fd.engineRunning ? 'RUNNING' : 'OFF');
    }

    updateFlightPlanDisplay() {
        const fd = this.flightData;

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        // Flight plan speed/alt fields — use real data when available
        const speedEl = document.getElementById('fp-speed');
        if (speedEl && fd.airspeed > 0) {
            speedEl.textContent = fd.airspeed + ' kts IAS';
        }

        const altEl = document.getElementById('fp-altitude');
        if (altEl && fd.altitude > 0) {
            altEl.textContent = fd.altitude.toLocaleString() + ' ft';
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  UTILITY
    // ──────────────────────────────────────────────────────────────

    /** Pad heading (0-360) to 3 digits: 7 → "007", 270 → "270" */
    pad3(n) {
        if (isNaN(n) || n === 0) return '000';
        return String(Math.round(n)).padStart(3, '0');
    }

    updateClock() {
        const now = new Date();
        const h   = String(now.getHours()).padStart(2, '0');
        const m   = String(now.getMinutes()).padStart(2, '0');
        const s   = String(now.getSeconds()).padStart(2, '0');
        const timeString = h + ':' + m + ':' + s;
        const clockEl = document.getElementById('taskbar-clock');
        if (clockEl) clockEl.textContent = timeString;
    }

    // ──────────────────────────────────────────────────────────────
    //  WINDOW DRAG — drag windows by title bar
    // ──────────────────────────────────────────────────────────────

    initWindowDragging() {
        document.addEventListener('mousedown', (e) => {
            const titleBar = e.target.closest('.window-title');
            if (!titleBar) return;
            const windowEl = titleBar.closest('.window');
            if (!windowEl) return;
            this.dragState.active = true;
            this.dragState.target = windowEl;
            const rect = windowEl.getBoundingClientRect();
            this.dragState.offsetX = e.clientX - rect.left;
            this.dragState.offsetY = e.clientY - rect.top;
            windowEl.style.zIndex = Date.now();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.dragState.active || !this.dragState.target) return;
            e.preventDefault();
            const x = e.clientX - this.dragState.offsetX;
            const y = e.clientY - this.dragState.offsetY;
            this.dragState.target.style.left = x + 'px';
            this.dragState.target.style.top  = y + 'px';
        });

        document.addEventListener('mouseup', () => {
            this.dragState.active = false;
            this.dragState.target = null;
        });
    }

    // ──────────────────────────────────────────────────────────────
    //  CHECKLIST — collapsible categories
    // ──────────────────────────────────────────────────────────────

    initChecklist() {
        const container = document.getElementById('checklist-container');
        if (!container) return;
        container.innerHTML = '';

        this.checklistItems.forEach((cat, catIndex) => {
            const section = document.createElement('div');
            section.className = 'checklist-section';

            const header = document.createElement('div');
            header.className = 'checklist-header';
            header.innerHTML = `<span class="checklist-arrow">&#9654;</span> ${cat.name}`;
            header.addEventListener('click', () => {
                this.toggleChecklistCategory(catIndex, section);
            });

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'checklist-items';
            itemsDiv.style.display = 'none';

            cat.items.forEach((item, itemIndex) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'checklist-item';
                itemDiv.innerHTML = `
                    <input type="checkbox" id="ci-${catIndex}-${itemIndex}"
                           ${item.checked ? 'checked' : ''}
                           onchange="toggleChecklistItem(${catIndex},${itemIndex})">
                    <label for="ci-${catIndex}-${itemIndex}">${item.text}</label>
                `;
                itemsDiv.appendChild(itemDiv);
            });

            section.appendChild(header);
            section.appendChild(itemsDiv);
            container.appendChild(section);
        });
    }

    toggleChecklistCategory(catIndex, section) {
        const arrow  = section.querySelector('.checklist-arrow');
        const items  = section.querySelector('.checklist-items');
        if (arrow && items) {
            const isOpen = arrow.innerHTML === '&#9660;';
            arrow.innerHTML = isOpen ? '&#9654;' : '&#9660;';
            items.style.display = isOpen ? 'none' : 'block';
        }
    }

    toggleChecklistItem(catIndex, itemIndex) {
        const cb = document.getElementById('ci-' + catIndex + '-' + itemIndex);
        if (cb) {
            this.checklistItems[catIndex].items[itemIndex].checked = cb.checked;
        }
    }

    onInteraction(_event) {
        // Required override — do not remove
    }
}

customElements.define("rsg-efb", RSG_EFB);

// ──────────────────────────────────────────────────────────────────────
//  GLOBAL WINDOW HELPERS — called from HTML onclick attributes
// ──────────────────────────────────────────────────────────────────────

let rsgEFBInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const efbElement = document.querySelector('rsg-efb');
    if (efbElement) {
        rsgEFBInstance = efbElement;
        console.log("[RSG EFB] Instance registered");
    }
});

function openWindow(windowName) {
    const window = document.getElementById('window-' + windowName);
    if (window) {
        window.style.display = 'block';
        window.style.visibility = 'visible';
        window.style.zIndex = 100;
    }
    const taskBtn = document.getElementById('task-' + windowName);
    if (taskBtn) taskBtn.classList.add('active');
}

function closeWindow(windowName) {
    const window = document.getElementById('window-' + windowName);
    if (window) window.style.display = 'none';
    const taskBtn = document.getElementById('task-' + windowName);
    if (taskBtn) taskBtn.classList.remove('active');
}

function minimizeWindow(windowName) {
    const window = document.getElementById('window-' + windowName);
    if (window) window.style.display = 'none';
}

function maximizeWindow(windowName) {
    const window = document.getElementById('window-' + windowName);
    if (!window) return;
    if (window.dataset.maximized === 'true') {
        window.style.width  = '';
        window.style.height = '';
        window.style.left   = '';
        window.style.top    = '';
        window.dataset.maximized = 'false';
    } else {
        window.style.width  = '100%';
        window.style.height = 'calc(100% - 30px)';
        window.style.left   = '0px';
        window.style.top    = '0px';
        window.dataset.maximized = 'true';
    }
}

function toggleTaskbarWindow(windowName) {
    const window = document.getElementById('window-' + windowName);
    if (!window) return;
    if (window.style.display === 'none') {
        openWindow(windowName);
    } else {
        minimizeWindow(windowName);
    }
}

function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    const btn  = document.getElementById('start-button');
    if (menu && btn) {
        const isVisible = menu.style.display !== 'none';
        menu.style.display = isVisible ? 'none' : 'block';
        btn.classList.toggle('active', !isVisible);
    }
}

function hideStartMenu() {
    const menu = document.getElementById('start-menu');
    const btn  = document.getElementById('start-button');
    if (menu) menu.style.display = 'none';
    if (btn)  btn.classList.remove('active');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('start-menu');
    const btn  = document.getElementById('start-button');
    if (menu && btn && menu.style.display !== 'none' && !e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
        hideStartMenu();
    }
});

function toggleChecklistItem(catIndex, itemIndex) {
    if (rsgEFBInstance) rsgEFBInstance.toggleChecklistItem(catIndex, itemIndex);
}

console.log("[RSG EFB] Script loaded — SimVar Edition v2.0");
