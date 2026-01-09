"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

interface Dice3DProps {
  isRolling: boolean;
  finalNumber: number;
  onRollComplete: () => void;
}

function DiceMesh({ isRolling, finalNumber, onRollComplete }: Dice3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rollTime, setRollTime] = useState(0);
  const rotationSpeed = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isRolling) {
      // Start rolling with random speeds
      rotationSpeed.current = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3,
      };
      setRollTime(0);
    }
  }, [isRolling]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      // Increment roll time
      setRollTime((t) => t + delta);

      // Gradually slow down rotation
      const damping = Math.max(0, 1 - rollTime / 4); // 4 seconds to stop

      meshRef.current.rotation.x += rotationSpeed.current.x * damping;
      meshRef.current.rotation.y += rotationSpeed.current.y * damping;
      meshRef.current.rotation.z += rotationSpeed.current.z * damping;

      // Bounce effect (vertical movement)
      const bounceHeight = Math.sin(rollTime * 10) * 0.5 * damping;
      meshRef.current.position.y = bounceHeight;

      // Check if rolling is complete
      if (rollTime > 4) {
        // Snap to final rotation based on the number
        const rotations = getFinalRotation(finalNumber);
        meshRef.current.rotation.set(rotations.x, rotations.y, rotations.z);
        meshRef.current.position.y = 0;
        onRollComplete();
      }
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      {/* Three.js BoxGeometry face order:
          0: right (+X), 1: left (-X), 2: top (+Y),
          3: bottom (-Y), 4: front (+Z), 5: back (-Z) */}
      <meshStandardMaterial attach="material-0" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(1)} />
      </meshStandardMaterial>
      <meshStandardMaterial attach="material-1" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(2)} />
      </meshStandardMaterial>
      <meshStandardMaterial attach="material-2" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(3)} />
      </meshStandardMaterial>
      <meshStandardMaterial attach="material-3" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(4)} />
      </meshStandardMaterial>
      <meshStandardMaterial attach="material-4" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(5)} />
      </meshStandardMaterial>
      <meshStandardMaterial attach="material-5" color="white">
        <canvasTexture attach="map" image={createDiceFaceTexture(6)} />
      </meshStandardMaterial>
    </mesh>
  );
}

// Helper function to create dice face texture
function createDiceFaceTexture(number: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 256, 256);

  // Border
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 248);

  // Dots
  ctx.fillStyle = "#d32f2f";
  const dotRadius = 20;
  const positions = getDotPositions(number);

  positions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * 256, y * 256, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// Helper function to get dot positions for each number
function getDotPositions(number: number): [number, number][] {
  const center = 0.5;
  const corner = 0.25;
  const opposite = 0.75;

  switch (number) {
    case 1:
      return [[center, center]];
    case 2:
      return [
        [corner, corner],
        [opposite, opposite],
      ];
    case 3:
      return [
        [corner, corner],
        [center, center],
        [opposite, opposite],
      ];
    case 4:
      return [
        [corner, corner],
        [corner, opposite],
        [opposite, corner],
        [opposite, opposite],
      ];
    case 5:
      return [
        [corner, corner],
        [corner, opposite],
        [center, center],
        [opposite, corner],
        [opposite, opposite],
      ];
    case 6:
      return [
        [corner, corner],
        [corner, center],
        [corner, opposite],
        [opposite, corner],
        [opposite, center],
        [opposite, opposite],
      ];
    default:
      return [[center, center]];
  }
}

// Helper function to get final rotation for each number
// Must match the texture assignment in DiceMesh
function getFinalRotation(number: number): { x: number; y: number; z: number } {
  const rotations = [
    { x: 0, y: Math.PI / 2, z: 0 }, // 1 on right face (material-0)
    { x: 0, y: -Math.PI / 2, z: 0 }, // 2 on left face (material-1)
    { x: -Math.PI / 2, y: 0, z: 0 }, // 3 on top face (material-2)
    { x: Math.PI / 2, y: 0, z: 0 }, // 4 on bottom face (material-3)
    { x: 0, y: 0, z: 0 }, // 5 on front face (material-4)
    { x: 0, y: Math.PI, z: 0 }, // 6 on back face (material-5)
  ];
  return rotations[number - 1] || rotations[0];
}

export function Dice3DScene({
  isRolling,
  finalNumber,
  onRollComplete,
}: Dice3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />

      <DiceMesh
        isRolling={isRolling}
        finalNumber={finalNumber}
        onRollComplete={onRollComplete}
      />
    </Canvas>
  );
}
