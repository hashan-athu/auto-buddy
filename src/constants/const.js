export const MOCK_DATA = {
  user: {
    username: "admin",
    password: "password123"
  },
  vehicle: {
    model: "Nissan GT-R R35",
    general: {
      dailyRunningRecords: 12450, // in km
      totalMaintenanceCost: 4500, // in USD
      fuelCost: 1200, // in USD
      licenseExpiry: "2026-10-15",
      insuranceExpiry: "2026-08-01"
    },
    interactiveNodes: [
      {
        id: "tyre_front_left",
        position: [1.2, 0.4, 2.0], // Relative to the 3D car's center
        title: "Tyre Status (Front Left)",
        data: {
          lastReplaced: "2025-01-10",
          healthColor: "text-green-500", // Tailwind color
          expectedChange: "2026-01-10",
          pressure: "34 psi"
        }
      },
      {
        id: "engine_bay",
        position: [0, 1.0, 2.5],
        title: "Engine Bay",
        data: {
          lastReplaced: "N/A",
          healthColor: "text-yellow-500",
          expectedChange: "Service due in 500km",
          oilLevel: "Optimal"
        }
      },
      {
        id: "brake_pads",
        position: [-1.2, 0.4, -1.8],
        title: "Rear Right Brakes",
        data: {
          lastReplaced: "2024-05-15",
          healthColor: "text-red-500",
          expectedChange: "Immediate replacement required",
          wearCondition: "90%"
        }
      }
    ]
  }
};
