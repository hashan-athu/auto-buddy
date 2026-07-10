// Per-model 3D hotspot layout: where each interactive point sits on a given
// vehicle model. This is presentation (hand-tuned to each .glb's scale/pose) and
// lives in the frontend on purpose — the *state* at each hotspot (health, service
// history) comes from the API's Component records, matched by `hotspot_key`.
//
// Positions are in the vehicle group's local space (see VehicleModel).
export const HOTSPOT_LAYOUTS = {
  nissan_gtr_r35: [
    { hotspot_key: 'tyre_front_left', position: [1.0, 0.3, 1.4], title: 'Tyre (Front Left)' },
    { hotspot_key: 'engine', position: [0, 0.8, 1.5], title: 'Engine Bay' },
    { hotspot_key: 'brakes', position: [-1.0, 0.3, -1.2], title: 'Rear Brakes' },
  ],
};

export const DEFAULT_MODEL = 'nissan_gtr_r35';

export function layoutForModel(model3d) {
  return HOTSPOT_LAYOUTS[model3d] ?? HOTSPOT_LAYOUTS[DEFAULT_MODEL];
}

// Health status -> colour, shared by the 3D dots and the sidebar accent.
export const HEALTH_COLORS = {
  good: '#4ade80',
  warning: '#fbbf24',
  critical: '#f87171',
  unknown: '#9ca3af',
};

export function healthColor(health) {
  return HEALTH_COLORS[health] ?? HEALTH_COLORS.unknown;
}
