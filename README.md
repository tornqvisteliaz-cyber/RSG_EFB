# RSG EFB - Windows Classic OS Theme

**A Microsoft Flight Simulator 2024 Electronic Flight Bag (EFB) with Windows 95/98/XP Classic Styling**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![MSFS](https://img.shields.io/badge/MSFS-2024-yellow)
![Platform](https://img.shields.io/badge/platform-Windows%20Classic-teal)

---

## Overview

RSG EFB is a fully-featured Electronic Flight Bag instrument for Microsoft Flight Simulator 2024, styled to look like a classic Windows operating system. It provides pilots with essential flight information through an intuitive, Windows-inspired interface featuring:

- 🗺️ **Flight Plan Viewer** - Route overview with waypoints and distance
- 🌤️ **Weather Display** - METAR information and conditions
- ✓ **Interactive Checklists** - Expandable pre-flight and phase checklists
- 📊 **Flight Instruments** - Real-time airspeed, altitude, heading, and more
- 📄 **Notepad** - Flight notes and remarks editor
- ⚙️ **Settings** - Display and unit configuration

---

## Screenshots

The EFB features a classic Windows 95/98/XP aesthetic with:
- Teal desktop background
- Draggable windows with classic chrome
- Start menu with application shortcuts
- Taskbar with window buttons and system clock
- Desktop icons for quick access

---

## Installation

### Method 1: Community Folder (Recommended)

1. **Download the package** or clone this repository
2. **Copy the `RSG_EFB_Package` folder** to your Community folder:
   ```
   C:\Users\<YourUsername>\AppData\Local\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\
   ```
3. **Launch MSFS 2024** - The EFB will be available for aircraft integration

### Method 2: Aircraft Integration

For aircraft developers, integrate into your aircraft package:

1. Copy `PackageSources/html_ui/Pages/VCockpit/Instruments/RSG_EFB/` to your aircraft's `HtmlUi/Pages/VCockpit/Instruments/` folder
2. Merge `manifest.json` with your aircraft's manifest
3. Merge `layout.json` with your aircraft's layout
4. Add the instrument reference to your aircraft's `panel.cfg`

### Method 3: ZIP Installation

1. Download `RSG_EFB_Package.zip` from releases
2. Extract to Community folder
3. Launch MSFS

---

## Package Structure

```
RSG_EFB_Package/
├── manifest.json           # MSFS package manifest
├── layout.json             # Package contents manifest
├── PackageSources/
│   └── html_ui/
│       └── Pages/
│           └── VCockpit/
│               └── Instruments/
│                   └── RSG_EFB/
│                       ├── RSG_EFB.html    # Main instrument HTML
│                       ├── RSG_EFB.js      # BaseInstrument class
│                       ├── RSG_EFB.css     # Windows Classic styles
│                       ├── panel.cfg       # Panel configuration
│                       └── template.html    # Fallback template
└── README.md               # This file
```

---

## Aircraft Integration Guide

### Adding to Your Aircraft

1. **Copy the instrument files** to your aircraft package:
   ```bash
   cp -r PackageSources/html_ui/Pages/VCockpit/Instruments/RSG_EFB /path/to/your/aircraft/HtmlUi/Pages/VCockpit/Instruments/
   ```

2. **Update your panel.cfg**:
   ```ini
   [VCockpit Instrument]
   0 = RSG_EFB, 0, 0, 1920, 1080, RSG_EFB
   ```

3. **Update your layout.json** to include the new files:
   ```json
   {
     "content": [
       { "path": "HtmlUi/Pages/VCockpit/Instruments/RSG_EFB/RSG_EFB.html", "size": 19470, "type": "HtmlUi" },
       { "path": "HtmlUi/Pages/VCockpit/Instruments/RSG_EFB/RSG_EFB.js", "size": 16942, "type": "Script" },
       { "path": "HtmlUi/Pages/VCockpit/Instruments/RSG_EFB/RSG_EFB.css", "size": 15334, "type": "Style" },
       { "path": "HtmlUi/Pages/VCockpit/Instruments/RSG_EFB/template.html", "size": 920, "type": "HtmlUi" }
     ]
   }
   ```

4. **Update your manifest.json** to declare dependencies

---

## Features

### Desktop
- Teal gradient wallpaper
- 6 clickable desktop icons
- Double-click to open applications
- Single-click to select icons

### Window Management
- Draggable windows (click and drag title bar)
- Minimize, maximize, close buttons
- Windows stack with z-index management
- Taskbar window buttons show open windows

### Start Menu
- Toggle with Start button
- Application shortcuts
- Click outside to dismiss
- Windows Classic gradient header

### Taskbar
- Start button with Windows icon
- Window buttons (auto-updated)
- System tray with icons
- Live clock display

### Flight Data (Simulated)
The EFB includes simulated flight data for demonstration:
- Airspeed: 250 KTS (varying ±2)
- Altitude: 35,000 FT (varying ±10)
- Heading: 270° (varying ±2)
- Vertical Speed: 0 FPM (varying ±100)
- Fuel Flow: 2,450 LB/H (varying ±50)
- Fuel Quantity: 18,400 LBS (decreasing)
- Ground Speed: 480 KTS (varying ±5)
- Mach: 0.82

### Connecting to Real Sim Data

To connect to actual MSFS sim variables, modify `RSG_EFB.js`:

```javascript
// Example: Get airspeed from MSFS
updateFlightData() {
    this.flightData.airspeed = Simplane.getIndicatedSpeed();
    this.flightData.altitude = Simplane.getAltitude();
    this.flightData.heading = Simplane.getHeadingMagnetic();
    // Add more sim variables as needed
}
```

---

## Customization

### Theme Colors
Edit `RSG_EFB.css` to change the color scheme:

```css
/* Desktop background */
#desktop { background: linear-gradient(135deg, #008080 0%, #006666 50%, #004d4d 100%); }

/* Title bar gradient */
.window-titlebar { background: linear-gradient(90deg, #000080, #1084d0); }

/* Start button / taskbar */
#taskbar, #start-button { background: #c0c0c0; }
```

### Adding New Windows

1. Add HTML to `RSG_EFB.html`:
```html
<div class="window" id="window-mywindow">
    <div class="window-titlebar" onmousedown="startDrag(event, 'mywindow')">
        <span class="window-title">My Window</span>
        <div class="window-controls">
            <button onclick="closeWindow('mywindow')">×</button>
        </div>
    </div>
    <div class="window-content">
        <!-- Window content here -->
    </div>
</div>
```

2. Add to `this.windows` in JS:
```javascript
this.windows = {
    // ... existing windows ...
    mywindow: { visible: false, minimized: false }
};
```

3. Add desktop icon and taskbar button

---

## Development

### Debugging in MSFS

1. Enable Developer Mode in MSFS settings
2. Open Coherent GT Debugger (Ctrl+Shift+D)
3. Navigate to the EFB iframe
4. Access console for `console.log()` output

### Testing Outside MSFS

The EFB works as a standalone HTML file for testing:
- Open `RSG_EFB.html` in a browser
- No flight data will be simulated
- All UI features remain functional

---

## Known Limitations

- Flight data is simulated (not connected to MSFS simvars by default)
- Only tested on 1920x1080 resolution
- Some touch interactions may need adjustment for tablet use

---

## Credits

- **Development**: RSG Development Team
- **Inspiration**: Windows 95/98/XP Classic UI
- **Framework**: Microsoft Flight Simulator 2024 SDK

---

## License

This project is provided for educational and personal use. Feel free to modify and integrate into your aircraft packages.

---

## Changelog

### v1.0.0 (Initial Release)
- Windows Classic OS theme
- Flight Plan viewer
- Weather display with METAR
- Interactive checklists
- Flight instruments panel
- Notepad for notes
- Settings panel
- Draggable windows
- Start menu
- Taskbar with live clock

---

**Enjoy flying with RSG EFB!** ✈️🪟
