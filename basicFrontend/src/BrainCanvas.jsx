import React, { Suspense, useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Float, Stage } from '@react-three/drei';
import * as THREE from 'three';

// Size on mount and on window resize
function ResizeHandler() {
  const { size, gl } = useThree();
  useEffect(() => {
    gl.setSize(size.width, size.height);
  }, [size, gl]);
  return null;
}

function BrainModel() {
  const { scene } = useGLTF('/brain.glb');
  const brainRef = useRef();

  // Define materials once
  const materials = useMemo(() => ({
    wireframe: new THREE.MeshStandardMaterial({
      color: "#262626",
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    }),
    solid: new THREE.MeshStandardMaterial({
      color: "#262626",
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    })
  }), []);

  useLayoutEffect(() => {
    const meshes = [];

    scene.traverse((obj) => {
      if (obj.isMesh && !obj.userData.isCore) {
        meshes.push(obj);
      }
    });

    // Solid inner core + wireframe outer layer
    meshes.forEach((obj) => {
      obj.material = materials.wireframe;

      // Prevent infinite cloning by checking if we already added a core
      if (obj.children.length === 0) {
        const core = obj.clone();
        core.userData.isCore = true; 
        core.material = materials.solid;
        obj.add(core);
      }
    });

    if (brainRef.current) {
      brainRef.current.rotation.x = 0.15; // Slight forward tilt
    }
  }, [scene, materials]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (brainRef.current) {
      // Rotate ONLY on the Y axis to keep the shape clear
      brainRef.current.rotation.y = t * 0.1;
      
      // "breathing" scale effect
      const s = 2.2 + Math.sin(t * 0.5) * 0.05;
      brainRef.current.scale.set(s, s, s);
    }
  });

  return <primitive ref={brainRef} object={scene} />;
}

export default function BrainCanvas() {
  return (
    <div className="relative w-full h-[500px] block overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        onCreated={({ gl }) => {
          // Triggers a resize calculation as soon as the WebGL context exists
          window.dispatchEvent(new Event('resize'));
        }}
      >
        <ResizeHandler />
        <Suspense fallback={null}>
          <Stage 
            environment="city" 
            intensity={0.5} 
            shadows={false} 
            adjustCamera={1.1} // Auto-centers and fits the model
          >
            <Float 
              speed={1.5} 
              rotationIntensity={0.2} // Reduced tilt to keep the brain recognizable
              floatIntensity={0.5}
            >
              <BrainModel />
            </Float>
          </Stage>
        </Suspense>
      </Canvas>
    </div>
  );
}