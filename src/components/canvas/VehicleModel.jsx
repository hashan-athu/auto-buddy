import React, { useState, useEffect } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { MOCK_DATA } from '../../constants/const';

// Assets
import gtrModelUrl from '../../assets/models/vehicles/nissan_gtr_r35.glb?url';

export default function VehicleModel() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const [hoveredNode, setHoveredNode] = useState(null);
  
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

  return (
    <group>
      {/* Real GT-R Model */}
      <primitive object={scene} scale={[1, 1, 1]} position={[0, -0.48, 0]} />

      {/* Interactive Nodes */}
      {MOCK_DATA.vehicle.interactiveNodes.map((node) => (
        <group key={node.id} position={node.position}>
          <Html center zIndexRange={[100, 0]}>
            <div className="relative flex items-center justify-center font-sans pointer-events-none">
              {/* Pulsing Dot */}
              <div 
                className={`w-3 h-3 rounded-full bg-white cursor-pointer pointer-events-auto transition-transform ${selectedNode?.id === node.id ? 'scale-150 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'hover:scale-125'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onPointerEnter={() => setHoveredNode(node.id)}
                onPointerLeave={() => setHoveredNode(null)}
              />
              <div className="absolute w-6 h-6 rounded-full border border-white/50 animate-ping" />
              
              {/* Hover Tooltip */}
              {hoveredNode === node.id && selectedNode?.id !== node.id && (
                <div className="absolute left-6 whitespace-nowrap bg-black/90 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm backdrop-blur border border-white/10 shadow-xl">
                  {node.title}
                </div>
              )}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

