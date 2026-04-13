import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

function CameraRig({ targetPosition }) {
  useFrame((state) => {
    // Smoothly interpolate camera position and lookAt
    state.camera.position.lerp(targetPosition, 0.03);
    state.camera.lookAt(0, 1.5, 0); 
  });
  return null;
}

function Door({ isUnlocked }) {
  const doorRef = useRef();
  
  useFrame(() => {
    if (isUnlocked && doorRef.current) {
      // Animate door sliding up
      if (doorRef.current.position.y < 5) {
        doorRef.current.position.y += 0.02;
      }
    }
  });

  return (
    <mesh ref={doorRef} position={[0, 2, -1]}>
      <boxGeometry args={[4, 4, 0.2]} />
      <meshStandardMaterial color="#333333" rough />
    </mesh>
  );
}

function Padlock({ onPadlockClick, isUnlocked }) {
  const [hovered, setHovered] = useState(false);
  const padlockRef = useRef();
  useCursor(hovered);

  useFrame((state) => {
    if (padlockRef.current && !isUnlocked) {
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      padlockRef.current.scale.set(scale, scale, scale);
    }
    if (isUnlocked && padlockRef.current) {
      // Animate unlocking (falling piece or scaling down)
      padlockRef.current.scale.lerp(new THREE.Vector3(0,0,0), 0.1);
    }
  });

  return (
    <group position={[0, 0.5, -0.8]}>
      <mesh 
        ref={padlockRef}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        onClick={onPadlockClick}
      >
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color="#ffd700" emissive={hovered ? "#ffd700" : "#000"} emissiveIntensity={hovered ? 0.5 : 0} />
      </mesh>
      
      {/* HTML Hover text */}
      {!isUnlocked && (
        <Html position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className={`transition-opacity duration-300 pointer-events-none text-white text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            Click to get inside
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GarageExterior({ onUnlockRequested }) {
  const { isUnlocked } = useAppStore();
  const [hasEntered, setHasEntered] = useState(false);

  // Initial far position, target near position
  const targetCameraPos = hasEntered ? new THREE.Vector3(0, 1.5, 2) : new THREE.Vector3(0, 1.5, 8);

  return (
    <div className="w-full h-screen bg-black relative">
      {!hasEntered && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button 
            onClick={() => setHasEntered(true)}
            className="pointer-events-auto px-6 py-3 border-2 border-white text-white bg-transparent hover:bg-white hover:text-black transition-colors rounded backdrop-blur-sm text-lg font-semibold tracking-wider font-sans"
          >
            Enter Garage
          </button>
        </div>
      )}

      <Canvas camera={{ position: [0, 1.5, 8], fov: 60 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Dim incandescent lamp above the door */}
        <pointLight position={[0, 5, 1]} intensity={0.5} color="#ffaa55" distance={10} decay={2} />
        <ambientLight intensity={0.1} />

        {/* Concrete Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* Brick Wall Exterior */}
        <mesh position={[0, 2, -1.1]}>
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial color="#4a2e2b" roughness={0.9} />
        </mesh>

        <Door isUnlocked={isUnlocked} />
        {hasEntered && <Padlock onPadlockClick={onUnlockRequested} isUnlocked={isUnlocked} />}
        
        <CameraRig targetPosition={targetCameraPos} />
      </Canvas>
    </div>
  );
}
