import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { MOCK_DATA } from '../../constants/const';

export default function VehicleModel() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Real model placeholder
  // import { useGLTF } from '@react-three/drei';
  // const { scene } = useGLTF('/nissan_gtr.glb');

  return (
    <group>
      {/* Primitive Box as placeholder for the vehicle */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="#0A0A0A" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Interactive Nodes */}
      {MOCK_DATA.vehicle.interactiveNodes.map((node) => (
        <group key={node.id} position={node.position}>
          <Html center zIndexRange={[100, 0]}>
            <div className="relative flex items-center justify-center font-sans pointer-events-none">
              {/* Pulsing Dot */}
              <div 
                className={`w-3 h-3 rounded-full bg-white cursor-pointer pointer-events-auto transition-transform ${selectedNode?.id === node.id ? 'scale-150' : 'hover:scale-125'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onPointerEnter={() => setHoveredNode(node.id)}
                onPointerLeave={() => setHoveredNode(null)}
              />
              <div className="absolute w-6 h-6 rounded-full border-2 border-white animate-ping" />
              
              {/* Hover Tooltip */}
              {hoveredNode === node.id && selectedNode?.id !== node.id && (
                <div className="absolute left-6 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur border border-gray-600">
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
