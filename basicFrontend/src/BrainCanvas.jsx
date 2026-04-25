import React, { Suspense, useRef, useMemo, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Float, Stage } from '@react-three/drei';
import * as THREE from 'three';

function BrainModel() {
  const { scene } = useGLTF('/brain.glb');
  const brainRef = useRef();

  // Define material once so it doesn't re-create 60 times a second
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#999999",
    wireframe: true,
    transparent: true,
    opacity: 0.08,
    roughness: 1,
    metalness: 0
  }), []);

  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) obj.material = material;
    });
  }, [scene, material]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (brainRef.current) {
      brainRef.current.rotation.y = t * 0.1;
      const s = 2.2 + Math.sin(t * 0.5) * 0.05;
      brainRef.current.scale.set(s, s, s);
    }
  });

  return <primitive ref={brainRef} object={scene} />;
}

export default function BrainCanvas() {
  return (
    // Ensure the container is block-level and has explicit dimensions
    <div className="relative w-full h-[500px] block">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        // This ensures the drawing buffer matches the CSS size immediately
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        <Suspense fallback={null}>
          {/* adjustCamera={1.2} will zoom out slightly to ensure it fits */}
          <Stage environment="city" intensity={0.5} shadows={false} adjustCamera={1.2}>
            <Float speed={1.5}>
              <BrainModel />
            </Float>
          </Stage>
        </Suspense>
      </Canvas>
    </div>
  );
}