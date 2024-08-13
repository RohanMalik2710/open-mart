import React, { useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component to load the GLB model
const Shelf = ({ position, path, scale, onClick }) => {
  const { scene } = useGLTF(path);

  // Add onClick functionality for individual child objects
  scene.traverse((child) => {
    if (child.isMesh) {
      child.userData = { onClick: () => onClick(child) };
    }
  });

  return (
    <primitive object={scene} position={position} scale={scale} />
  );
};

const HoverEffect = ({ selectedObject, setPopup }) => {
  const [hoveredObject, setHoveredObject] = useState(null);

  useFrame(() => {
    if (hoveredObject) {
      hoveredObject.position.y += Math.sin(Date.now() * 0.005) * 0.02;
      hoveredObject.position.z += Math.sin(Date.now() * 0.005) * 0.02;
    }
  });

  useEffect(() => {
    if (selectedObject) {
      // Set the popup message
      setPopup(`${selectedObject.name} selected`);
      console.log(`sahil bhai op ${selectedObject.name}`);

      // Enlarge the object
      selectedObject.scale.set(1.2, 1.2, 1.2);

      // Stop effects and reset scale after 3 seconds
      const timer = setTimeout(() => {
        if (selectedObject) {
          selectedObject.scale.set(1, 1, 1); // Reset to original scale
          setPopup(null);
        }
      }, 3000);

      // Set the hovered object for animation
      setHoveredObject(selectedObject);

      return () => clearTimeout(timer); // Clean up timer on unmount
    }
  }, [selectedObject, setPopup]);

  return null;
};

const ClickableObjects = ({ setSelectedObject }) => {
  const { scene, gl, camera } = useThree();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const handleClick = (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.userData.onClick) {
        clickedObject.userData.onClick();
        setSelectedObject(clickedObject);
      }
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [gl, camera, scene]);

  return null;
};

const CameraControls = () => {
  const { camera } = useThree();
  const speed = 2;

  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log(`Key pressed: ${event.key}`);
      switch (event.key) {
        case 'w':
          camera.position.z -= speed;
          break;
        case 's':
          camera.position.z += speed;
          break;
        case 'a':
          camera.position.x -= speed;
          break;
        case 'd':
          camera.position.x += speed;
          break;
        default:
          break;
      }
      console.log(`Camera position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [camera, speed]);

  return <OrbitControls />;
};

const ThreeDStore = () => {
  const [view, setView] = useState('outside');
  const [selectedObject, setSelectedObject] = useState(null);
  const [popup, setPopup] = useState(null);

  const handleClick = () => {
    if (view === 'outside') {
      setView('inside');
    } else {
      setView('outside');
    }
  };

  return (
    <div className="h-screen w-screen m-0 p-0 overflow-hidden relative">
      <Canvas className="h-full w-full"
        frameloop='always'
        shadows
        camera={{position: [80,30,60], fov: 4}}
      >
        <ambientLight intensity={2} />
        <pointLight position={[100, 50, 50]} />
        <CameraControls />
        {view === 'outside' ? (
          <Shelf key="outside" path='/src/assets/lowpoly_supermarket.glb' position={[0, 0, 0]} scale={[0.5, 0.5, 0.5]} onClick={setSelectedObject} />
        ) : (
          <Shelf key="inside" path='/src/assets/multi_supermarket.glb' position={[-1, -4, -1]} scale={[0.2, 0.2, 0.2]} onClick={setSelectedObject} />
        )}
        <ClickableObjects setSelectedObject={setSelectedObject} />
        <HoverEffect selectedObject={selectedObject} setPopup={setPopup} />
      </Canvas>
      <button
        onClick={handleClick}
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        {view === 'outside' ? 'Enter Market' : 'Exit Market'}
      </button>
      {popup && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded">
          {popup}
        </div>
      )}
    </div>
  );
};

export default ThreeDStore;
