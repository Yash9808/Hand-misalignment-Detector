import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HandData } from '../types/HandData';

interface HandVisualization3DProps {
  handData: HandData[];
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const HandVisualization3D: React.FC<HandVisualization3DProps> = ({ handData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handMeshesRef = useRef<THREE.Group[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f2937);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing hand meshes
    handMeshesRef.current.forEach(group => {
      sceneRef.current?.remove(group);
    });
    handMeshesRef.current = [];

    if (!handData || handData.length === 0) return;

    handData.forEach((hand, handIndex) => {
      const handGroup = new THREE.Group();
      const color = handIndex === 0 ? 0x3b82f6 : 0x10b981; // Blue for first hand, green for second

      // Create landmarks
      const landmarkGeometry = new THREE.SphereGeometry(0.01, 8, 8);
      const landmarkMaterial = new THREE.MeshPhongMaterial({ color });

      hand.landmarks.forEach((landmark, index) => {
        const sphere = new THREE.Mesh(landmarkGeometry, landmarkMaterial);
        // Convert from normalized coordinates to 3D space
        sphere.position.set(
          (landmark.x - 0.5) * 2,
          -(landmark.y - 0.5) * 2,
          landmark.z * 2
        );
        handGroup.add(sphere);
      });

      // Create connections
      const connectionMaterial = new THREE.LineBasicMaterial({ color, linewidth: 2 });
      
      HAND_CONNECTIONS.forEach(([start, end]) => {
        if (hand.landmarks[start] && hand.landmarks[end]) {
          const points = [
            new THREE.Vector3(
              (hand.landmarks[start].x - 0.5) * 2,
              -(hand.landmarks[start].y - 0.5) * 2,
              hand.landmarks[start].z * 2
            ),
            new THREE.Vector3(
              (hand.landmarks[end].x - 0.5) * 2,
              -(hand.landmarks[end].y - 0.5) * 2,
              hand.landmarks[end].z * 2
            )
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, connectionMaterial);
          handGroup.add(line);
        }
      });

      // Add finger angle labels (as text sprites would be complex, we'll skip for now)
      
      sceneRef.current.add(handGroup);
      handMeshesRef.current.push(handGroup);
    });
  }, [handData]);

  return (
    <div className="w-full h-64 lg:h-80">
      <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Hand data info overlay */}
      {handData && handData.length > 0 && (
        <div className="mt-4 space-y-2">
          {handData.map((hand, index) => (
            <div key={index} className="text-sm">
              <div className={`font-semibold ${index === 0 ? 'text-blue-400' : 'text-green-400'}`}>
                {hand.handedness} Hand:
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs text-gray-300">
                {Object.entries(hand.fingerAngles).map(([finger, angle]) => (
                  <div key={finger}>
                    {finger}: {Math.round(angle)}°
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandVisualization3D;