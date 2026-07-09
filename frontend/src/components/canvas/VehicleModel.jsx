import React, { useState, useEffect, useRef } from 'react';
import { Html, useGLTF, TransformControls } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { MOCK_DATA } from '../../constants/const';

// Assets
import gtrModelUrl from '../../assets/models/vehicles/nissan_gtr_r35.glb?url';

export default function VehicleModel() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  
  const { scene } = useGLTF(gtrModelUrl);

  // Apply shadows to all meshes in the car
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Hidden global toggle for devs: window.toggleDebug()
    window.toggleDebug = () => setDebugMode(prev => !prev);
    console.log("%c 🛠️ 3D Debug Mode: Type 'toggleDebug()' in console to enable node positioning.", "color: #ffaa55; font-weight: bold;");
  }, [scene]);

  return (
    <group>
      {/* Real GT-R Model - Grounded at -1.2 to sit flush on the interior floor */}
      <primitive object={scene} scale={[1, 1, 1]} position={[0, -1.2, 0]} />

      {/* Interactive Nodes */}
      {MOCK_DATA.vehicle.interactiveNodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        
        return (
          <React.Fragment key={node.id}>
            {debugMode && isSelected ? (
              <TransformControls 
                position={node.position} 
                onMouseUp={(e) => {
                  const p = e.target.object.position;
                  const coord = `[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`;
                  console.log(`%c 📍 Node Adjusted [${node.id}]: ${coord}`, "color: #00ff00; font-weight: bold;");
                }}
                mode="translate"
              >
                <mesh visible={false}>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                </mesh>
              </TransformControls>
            ) : null}

            <group position={node.position}>
              <Html center zIndexRange={[100, 0]}>
                <div className="relative flex items-center justify-center font-sans pointer-events-none">
                  {/* Pulsing Dot */}
                  <div 
                    className={`w-3 h-3 rounded-full bg-white cursor-pointer pointer-events-auto transition-transform ${isSelected ? 'scale-150 shadow-[0_0_15px_rgba(255,255,255,0.8)] border-2 border-orange-500' : 'hover:scale-125'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    onPointerEnter={() => setHoveredNode(node.id)}
                    onPointerLeave={() => setHoveredNode(null)}
                  />
                  {!isSelected && <div className="absolute w-6 h-6 rounded-full border border-white/50 animate-ping" />}
                  
                  {/* Hover Tooltip */}
                  {hoveredNode === node.id && !isSelected && (
                    <div className="absolute left-6 whitespace-nowrap bg-black/90 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm backdrop-blur border border-white/10 shadow-xl">
                      {node.title}
                    </div>
                  )}
                </div>
              </Html>
            </group>
          </React.Fragment>
        );
      })}
    </group>
  );
}


