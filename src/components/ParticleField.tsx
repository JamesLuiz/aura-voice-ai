import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count: number;
  isSpeaking: boolean;
  isProcessing: boolean;
  robotState: string;
}

function Particles({ count, isSpeaking, isProcessing, robotState }: ParticlesProps) {
  const mesh = useRef<THREE.Points>(null);
  const light = useRef<THREE.PointLight>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 2.5 + Math.random() * 1.5;
      
      temp.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        velocity: Math.random() * 0.01 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count]);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.x;
      positions[i * 3 + 1] = particle.y;
      positions[i * 3 + 2] = particle.z;
    });
    return positions;
  }, [particles, count]);

  const getParticleColor = () => {
    switch (robotState) {
      case "error":
        return new THREE.Color(1, 0.2, 0.2);
      case "thinking":
      case "processing":
        return new THREE.Color(1, 0.8, 0.2);
      case "speaking":
        return new THREE.Color(0.2, 1, 1);
      default:
        return new THREE.Color(0.4, 0.8, 1);
    }
  };

  useFrame((state) => {
    if (!mesh.current) return;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    
    particles.forEach((particle, i) => {
      const i3 = i * 3;
      
      // Spiral motion
      const angle = time * particle.velocity + particle.phase;
      const radius = 2.5 + Math.sin(time * 0.5 + particle.phase) * 0.5;
      
      if (isSpeaking) {
        // Expand and pulse when speaking
        const pulse = 1 + Math.sin(time * 8 + particle.phase) * 0.3;
        positions[i3] = particle.x * pulse;
        positions[i3 + 1] = particle.y * pulse;
        positions[i3 + 2] = particle.z * pulse;
      } else if (isProcessing) {
        // Swirl effect when processing
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = particle.y + Math.sin(time * 2 + particle.phase) * 0.3;
        positions[i3 + 2] = Math.sin(angle) * radius;
      } else {
        // Gentle float when idle
        positions[i3] = particle.x + Math.sin(time + particle.phase) * 0.1;
        positions[i3 + 1] = particle.y + Math.cos(time * 0.7 + particle.phase) * 0.1;
        positions[i3 + 2] = particle.z + Math.sin(time * 0.5 + particle.phase) * 0.1;
      }
    });
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = time * 0.05;
    
    // Update light
    if (light.current) {
      light.current.intensity = isSpeaking ? 2 + Math.sin(time * 10) * 0.5 : 1;
    }
  });

  const color = getParticleColor();

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isSpeaking ? 0.08 : 0.05}
          color={color}
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <pointLight ref={light} position={[0, 0, 0]} color={color} intensity={1} distance={10} />
    </>
  );
}

interface ParticleFieldProps {
  isSpeaking: boolean;
  isProcessing: boolean;
  robotState: string;
  isConnected: boolean;
}

export default function ParticleField({ isSpeaking, isProcessing, robotState, isConnected }: ParticleFieldProps) {
  if (!isConnected) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <Particles 
          count={150} 
          isSpeaking={isSpeaking} 
          isProcessing={isProcessing}
          robotState={robotState}
        />
      </Canvas>
    </div>
  );
}
