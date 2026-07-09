# 3D Personal Auto Manager - Technical Summary (Comprehensive)

This document provides a full technical breakdown of the 3D Personal Auto Manager application, detailing every architectural layer, 3D asset, and lighting configuration.

## 1. Core Architecture & Tech Stack
- **Framework**: React 19 + Vite 8 (Ultra-fast HMR and build performance).
- **3D Engine**: React Three Fiber (R3F) + Three.js for canvas rendering.
- **R3F Utilities**: `@react-three/drei` for GLTF loading, HTML overlays, and OrbitControls.
- **State Management**: Zustand (Global store tracking application state, login, and node selection).
- **2D UI/Overlays**: Tailwind CSS (Lucide-React for icons, Framer Motion for UI animations).
- **Asset Loader**: Vite native URL imports with `?url` suffix and `assetsInclude` configuration in `vite.config.js`.

---

## 2. 3D Model Specifications

### Exterior Environment (GarageExterior.jsx)
| Category | Asset Filename | Scale | Position | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Building** | `small_modern_garage.glb` | `[1, 1, 1]` | `[0, 0, 0]` | High-fidelity modern facade with industrial gate. |
| **Object** | `game-ready_pbr_padlock.glb` | `[0.4, 0.4, 0.4]` | `[0, 1.1, 0.5]` | Interactive locking mechanism with pulse animation. |
| **Terrain** | `grass_asphalt_ground.glb` | `[1, 1, 1]` | `[0, -0.05, 0]` | Environment base with grass and asphalt textures. |

### Interior Environment (GarageInterior.jsx)
| Category | Asset Filename | Scale | Position | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Interior** | `garage_nfs_2015.glb` | `[50, 50, 50]` | `[0, -0.05, 0]` | Detailed garage interior (NFS 2015 style) scaled for immersion. |
| **Vehicle** | `nissan_gtr_r35.glb` | `[1, 1, 1]` | `[0, -0.48, 0]` | Hero vehicle with PBR materials and shadow configuration. |

---

## 3. Lighting & Atmospheric Settings

### Phase 1: Exterior Noir
- **Ambient Light**: `intensity: 0.25` (Lifts shadows to reveal terrain/building details).
- **Primary Light**: `PointLight` at `[0, 4, 1]`.
  - **Intensity**: `40`
  - **Color**: `#ffaa55` (Incandescent warm glow).
  - **Effects**: `castShadow` enabled, `decay: 2`.
- **Atmosphere**: Designed to feel like a high-end garage entrance at dusk.

### Phase 2: Interior Showroom
- **Ambient Light**: `intensity: 0.6` (Ensures full visibility of the garage structure).
- **Sequenced Lighting**: 5 `SpotLight` ceiling floodlights powered on in **350ms** intervals.
  - **Master Intensity**: `40` (Light 1) / `25` (Lights 2-5).
  - **Color**: `#ffffff` (Clean white showroom light).
- **Environment**: `Environment` component with `preset="city"` and **opacity 1.0** for realistic PBR reflections on the GT-R's bodywork.
- **Shadows**: `shadows` enabled on the main Canvas for grounded realism.

---

## 4. Interactive Node System (const.js)
Interactive points are mapped as `[x, y, z]` coordinates relative to the vehicle's world position.

| Node ID | Coordinate | Target Component |
| :--- | :--- | :--- |
| `tyre_front_left` | `[1.0, 0.3, 1.4]` | Front-left wheel surface. |
| `engine_bay` | `[0, 0.8, 1.5]` | Center of the vehicle's hood. |
| `brake_pads` | `[-1.0, 0.3, -1.2]` | Rear-right braking system area. |

---

## 5. UI & State Flow
1. **Loading phase**: CSS-based "Awakening" animation (blinking eyelids + blur transition).
2. **Login Logic**: Validate `admin` / `password123` via `LoginModal.jsx`. 
3. **Camera Sequencing**:
   - Camera starts far (`z: 8`).
   - "Enter Garage" lerps camera to gate view (`z: 4.5`).
   - Successful unlock fades the scene and transitions state to `interior`.
4. **Data Sidebar**: Sliding right-panel (`DashboardSidebar.jsx`) triggered by clicking R3F `<Html>` pulsing dots.

---

## 6. Key Configuration Overrides
**`vite.config.js`**:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'], // Allows importing binary assets directly
});
```
**`index.css`**:
- Custom `@theme` configuration for modern typography (Inter/Sans).
- Global overflow hidden for full-screen immersive experience.
