import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import VehicleModel from './VehicleModel';

export default function GarageInterior() {
  const [lightsSeq, setLightsSeq] = useState(0);

  useEffect(() => {
    // Sequence 5 ceiling floodlights turning on one by one
    const timers = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLightsSeq(i), i * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Canvas camera={{ position: [4, 2, 4], fov: 50 }}>
      {/* Environment & Floor */}
      <color attach="background" args={['#020202']} />
      <fog attach="fog" args={['#020202', 10, 30]} />
      
      {/* Concrete Floor with reflectiveness using ContactShadows as a proxy or just standard mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.1} />
      </mesh>
      
      {/* High-quality shadow for the vehicle */}
      <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={1} color="#000000" />

      {/* Sequenced Ceiling Lights */}
      {lightsSeq >= 1 && <spotLight position={[0, 8, 4]} intensity={2} angle={0.6} penumbra={0.5} color="#fff" castShadow />}
      {lightsSeq >= 2 && <spotLight position={[-4, 8, 2]} intensity={2} angle={0.6} penumbra={0.5} color="#fff" />}
      {lightsSeq >= 3 && <spotLight position={[4, 8, 2]} intensity={2} angle={0.6} penumbra={0.5} color="#fff" />}
      {lightsSeq >= 4 && <spotLight position={[-4, 8, -2]} intensity={2} angle={0.6} penumbra={0.5} color="#fff" />}
      {lightsSeq >= 5 && <spotLight position={[4, 8, -2]} intensity={2} angle={0.6} penumbra={0.5} color="#fff" />}
      
      {/* Ambient fallback */}
      <ambientLight intensity={0.2} />

      <VehicleModel />

      <OrbitControls 
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going below floor
      />
    </Canvas>
  );
}
