import React, { useState, useEffect } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { useActiveVehicle } from '../../api/vehicles';
import { useComponents } from '../../api/components';
import { layoutForModel, healthColor } from '../../scene/hotspots';

// Assets
import gtrModelUrl from '../../assets/models/vehicles/nissan_gtr_r35.glb?url';

export default function VehicleModel() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const [hoveredKey, setHoveredKey] = useState(null);
  const { vehicle } = useActiveVehicle();
  const { data: components } = useComponents(vehicle?.id);

  const { scene } = useGLTF(gtrModelUrl);

  // Apply shadows to all meshes in the car
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  // Merge the model's hotspot layout (positions) with live Component state.
  const layout = layoutForModel(vehicle?.model_3d);
  const nodes = layout.map((spot) => ({
    ...spot,
    component: components?.find((c) => c.hotspot_key === spot.hotspot_key) ?? null,
  }));

  return (
    <group>
      {/* Real GT-R Model - Grounded at -1.2 to sit flush on the interior floor */}
      <primitive object={scene} scale={[1, 1, 1]} position={[0, -1.2, 0]} />

      {/* Interactive nodes, coloured by component health */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.hotspot_key === node.hotspot_key;
        const color = healthColor(node.component?.health);

        return (
          <group key={node.hotspot_key} position={node.position}>
            <Html center zIndexRange={[100, 0]}>
              <div className="relative flex items-center justify-center font-sans pointer-events-none">
                {/* Pulsing dot */}
                <div
                  className={`w-3 h-3 rounded-full cursor-pointer pointer-events-auto transition-transform ${
                    isSelected ? 'scale-150 border-2 border-white' : 'hover:scale-125'
                  }`}
                  style={{
                    backgroundColor: color,
                    boxShadow: isSelected ? `0 0 15px ${color}` : `0 0 8px ${color}99`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode({
                      hotspot_key: node.hotspot_key,
                      title: node.component?.label || node.title,
                      component: node.component,
                    });
                  }}
                  onPointerEnter={() => setHoveredKey(node.hotspot_key)}
                  onPointerLeave={() => setHoveredKey(null)}
                />
                {!isSelected && (
                  <div
                    className="absolute w-6 h-6 rounded-full animate-ping"
                    style={{ border: `1px solid ${color}80` }}
                  />
                )}

                {/* Hover tooltip */}
                {hoveredKey === node.hotspot_key && !isSelected && (
                  <div className="absolute left-6 whitespace-nowrap bg-black/90 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm backdrop-blur border border-white/10 shadow-xl">
                    {node.component?.label || node.title}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
