import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("3D Model Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="red" wireframe />
                </mesh>
            );
        }
        return this.props.children;
    }
}

// Generic Model Component
const Model = ({ url, animationName, ...props }) => {
    const group = useRef();
    // useGLTF will suspend or throw. We need to handle the error.
    // If the file is missing, this throws.
    const { scene, animations } = useGLTF(url, true); // true = useDraco (optional)
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (!actions) return;

        // Stop all previous actions
        Object.values(actions).forEach(action => action?.stop());

        if (animationName && actions[animationName]) {
            const action = actions[animationName];
            action.reset().fadeIn(0.5).play();
        }
    }, [animationName, actions]);

    return <primitive ref={group} object={scene} {...props} />;
};

const ThreeScene = ({ modelUrl, animationName, scale = 1, position = [0, 0, 0] }) => {
    return (
        <div className="w-full h-full min-h-[300px]">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <React.Suspense fallback={
                    <mesh>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial color="#8aa6a2" wireframe />
                    </mesh>
                }>
                    <ErrorBoundary>
                        <Model url={modelUrl} animationName={animationName} scale={scale} position={position} />
                    </ErrorBoundary>
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default ThreeScene;
