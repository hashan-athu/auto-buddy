import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import VehicleModel from './VehicleModel';

// Assets
import interiorModelUrl from '../../assets/models/buildings/garage_nfs_2015.glb?url';

function InteriorModel() {
  const { scene } = useGLTF(interiorModelUrl);
  
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.receiveShadow = true;
        node.castShadow = false; // Interior structure usually doesn't cast shadows unless specifically needed
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={[50, 50, 50]} position={[0, -0.05, 0]} />;
}

export default function GarageInterior() {
  const [lightsSeq, setLightsSeq] = useState(0);

  useEffect(() => {
    const timers = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLightsSeq(i), i * 350));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Canvas shadows camera={{ position: [4, 2, 4], fov: 45 }}>
      <color attach="background" args={['#010101']} />
      <fog attach="fog" args={['#010101', 5, 25]} />
      
      <Suspense fallback={null}>
        <InteriorModel />

        {/* Sequenced Strategic Ceiling Spotlights - Boosted Intensities */}
        {lightsSeq >= 1 && <spotLight position={[0, 4, 3]} intensity={40} angle={0.6} penumbra={0.5} castShadow color="#ffffff" />}
        {lightsSeq >= 2 && <spotLight position={[-2, 4, 0]} intensity={25} angle={0.6} penumbra={0.5} color="#ffffff" />}
        {lightsSeq >= 3 && <spotLight position={[2, 4, 0]} intensity={25} angle={0.6} penumbra={0.5} color="#ffffff" />}
        {lightsSeq >= 4 && <spotLight position={[-2, 4, -3]} intensity={25} angle={0.6} penumbra={0.5} color="#ffffff" />}
        {lightsSeq >= 5 && <spotLight position={[2, 4, -3]} intensity={25} angle={0.6} penumbra={0.5} color="#ffffff" />}
        
        <ambientLight intensity={0.6} />
        
        <VehicleModel />

        <OrbitControls 
          enablePan={false}
          minDistance={1.5}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2 - 0.1}
          makeDefault
        />
        
        {/* Adds subtle reflections to metallic surfaces */}
        <Environment preset="city" blur={0.8} opacity={1} />
      </Suspense>
    </Canvas>
  );
}

