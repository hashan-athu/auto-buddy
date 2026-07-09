import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
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
    state.camera.lookAt(0, 1.1, 0); 
  });
  return null;
}

function TerrainModel() {
  const { scene } = useGLTF(terrainModelUrl);
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) node.receiveShadow = true;
    });
  }, [scene]);
  return <primitive object={scene} position={[0, -0.05, 0]} />;
}

function GarageModel({ isUnlocked }) {
  const { scene } = useGLTF(garageModelUrl);
  const { setAppState } = useAppStore();
  const doorRef = useRef();
  const transitionTriggered = useRef(false);

  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // Logic to find the roller door mesh
        const name = node.name.toLowerCase();
        if (name.includes('door') || name.includes('gate') || name.includes('roller')) {
          doorRef.current = node;
        }
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (isUnlocked && doorRef.current) {
      // Animate door Y position upwards
      doorRef.current.position.y = THREE.MathUtils.lerp(doorRef.current.position.y, 4, delta * 1.5);
      
      // Trigger transition to interior once door is high enough
      if (doorRef.current.position.y > 3.2 && !transitionTriggered.current) {
        transitionTriggered.current = true;
        setTimeout(() => setAppState('interior'), 800);
      }
    }
  });

  return <primitive object={scene} position={[0, 0, 0]} />;
}

function Padlock({ onPadlockClick, isUnlocked }) {
  const { scene } = useGLTF(padlockModelUrl);
  const [hovered, setHovered] = useState(false);
  const padlockRef = useRef();
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationVel = useRef(new THREE.Vector3(Math.random(), Math.random(), Math.random()));
  
  useCursor(hovered);

  useFrame((state, delta) => {
    if (padlockRef.current) {
      if (!isUnlocked) {
        // Idle pulsing
        const s = 0.05 + Math.sin(state.clock.elapsedTime * 3) * 0.005;
        padlockRef.current.scale.set(s, s, s);
      } else {
        // Falling animation
        velocity.current.y -= 9.8 * delta * 0.5; // Simulate gravity
        padlockRef.current.position.addScaledVector(velocity.current, delta);
        padlockRef.current.rotation.x += rotationVel.current.x * delta * 5;
        padlockRef.current.rotation.z += rotationVel.current.z * delta * 5;
        
        // Fading
        padlockRef.current.traverse(n => {
          if (n.isMesh) {
            n.material.transparent = true;
            n.material.opacity = THREE.MathUtils.lerp(n.material.opacity, 0, delta * 2);
          }
        });
      }
    }
  });

  return (
    <group position={[0, 0.1, 0.45]}>
      <primitive 
        object={scene} 
        ref={padlockRef}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        onClick={onPadlockClick}
        scale={[0.05, 0.05, 0.05]}
      />
      
      {!isUnlocked && (
        <Html position={[0, 0.15, 0]} center>
          <div className={`transition-opacity duration-300 pointer-events-none text-white text-[10px] uppercase tracking-widest whitespace-nowrap bg-black/80 px-3 py-1.5 rounded-sm border border-white/10 backdrop-blur-md shadow-2xl ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            System Locked
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GarageExterior({ onUnlockRequested }) {
  const { isUnlocked } = useAppStore();
  const [hasEntered, setHasEntered] = useState(false);
  const targetCameraPos = hasEntered ? new THREE.Vector3(0, 1.2, 3.8) : new THREE.Vector3(0, 1.5, 8);

  return (
    <div className="w-full h-screen bg-black relative">
      {!hasEntered && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button 
            onClick={() => setHasEntered(true)}
            className="pointer-events-auto px-10 py-4 border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/60 transition-all rounded-sm backdrop-blur-xl text-xs tracking-[0.4em] uppercase font-light"
          >
            Awaiting Command
          </button>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 1.5, 8], fov: 50 }}>
        <color attach="background" args={['#010101']} />
        
        <Suspense fallback={null}>
          <pointLight position={[0, 4, 1.5]} intensity={50} color="#ffaa55" distance={15} decay={2} castShadow />
          <ambientLight intensity={0.03} /> 

          <TerrainModel />
          <GarageModel isUnlocked={isUnlocked} />
          {hasEntered && <Padlock onPadlockClick={onUnlockRequested} isUnlocked={isUnlocked} />}
          
          <CameraRig targetPosition={targetCameraPos} />
        </Suspense>
      </Canvas>
    </div>
  );
}

