import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useCursor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

// Importing assets to let Vite handle the paths
import garageModelUrl from '../../assets/models/buildings/small_modern_garage.glb?url';
import padlockModelUrl from '../../assets/models/objects/game-ready_pbr_padlock.glb?url';
import terrainModelUrl from '../../assets/models/terrain/grass_asphalt_ground.glb?url';

function CameraRig({ targetPosition }) {
  useFrame((state) => {
    state.camera.position.lerp(targetPosition, 0.03);
    state.camera.lookAt(0, 1.5, 0); 
  });
  return null;
}

function TerrainModel() {
  const { scene } = useGLTF(terrainModelUrl);
  
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} position={[0, -0.05, 0]} />;
}

function GarageModel({ isUnlocked }) {
  const { scene } = useGLTF(garageModelUrl);
  const garageRef = useRef();

  // Handle shadow casting/receiving
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} ref={garageRef} position={[0, 0, 0]} />;
}

function Padlock({ onPadlockClick, isUnlocked }) {
  const { scene } = useGLTF(padlockModelUrl);
  const [hovered, setHovered] = useState(false);
  const padlockRef = useRef();
  useCursor(hovered);

  useFrame((state) => {
    if (padlockRef.current && !isUnlocked) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      padlockRef.current.scale.set(scale, scale, scale);
    }
    if (isUnlocked && padlockRef.current) {
      padlockRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    }
  });

  return (
    <group position={[0, 1.1, 0.5]}>
      <primitive 
        object={scene} 
        ref={padlockRef}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        onClick={onPadlockClick}
        scale={[0.4, 0.4, 0.4]}
      />
      
      {!isUnlocked && (
        <Html position={[0, 0.5, 0]} center>
          <div className={`transition-opacity duration-300 pointer-events-none text-white text-xs whitespace-nowrap bg-black/60 px-2 py-1 rounded border border-white/20 backdrop-blur-sm ${hovered ? 'opacity-100' : 'opacity-0'}`}>
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
  const targetCameraPos = hasEntered ? new THREE.Vector3(0, 1.5, 4.5) : new THREE.Vector3(0, 1.5, 8);

  return (
    <div className="w-full h-screen bg-black relative">
      {!hasEntered && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button 
            onClick={() => setHasEntered(true)}
            className="pointer-events-auto px-8 py-3 border border-white/30 text-white bg-white/5 hover:bg-white/10 hover:border-white transition-all rounded backdrop-blur-md text-lg font-light tracking-[0.2em] uppercase"
          >
            Enter Garage
          </button>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 1.5, 8], fov: 60 }}>
        <color attach="background" args={['#020202']} />
        
        <Suspense fallback={null}>
          {/* Cinematic Incandescent Lighting - Boosted for better visibility */}
          <pointLight position={[0, 4, 1]} intensity={40} color="#ffaa55" distance={15} decay={2} castShadow />
          <ambientLight intensity={0.25} />

          <TerrainModel />
          <GarageModel isUnlocked={isUnlocked} />
          {hasEntered && <Padlock onPadlockClick={onUnlockRequested} isUnlocked={isUnlocked} />}
          
          <CameraRig targetPosition={targetCameraPos} />
        </Suspense>
      </Canvas>
    </div>
  );
}
