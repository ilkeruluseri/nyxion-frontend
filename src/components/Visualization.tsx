import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { StarBackground } from "./StarBackground";
import * as THREE from "three";

export default function Visualization() {
    return (
        <div style={{ width: "100%", height: "100vh" }}> 
            <Canvas camera={{ position: [0, 0, 5] }}>
            <StarBackground textureUrl="/8k_stars.jpg" />

            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color="orange" />
            </mesh>

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <OrbitControls 
                enableRotate 
                enablePan 
                enableZoom 
                mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                RIGHT: THREE.MOUSE.PAN
                }}
            />
            </Canvas>
        </div>
    );
}
