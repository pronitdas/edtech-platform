'use client'

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

interface ModelViewerProps {
    data: {
        modelUrl: string;
        previewUrl: string;
        previewLogoUrl?: string;
        videoUrl?: string;
        textureUrls: { colorMapUrl: string }[];
    };
}

const Model: React.FC<{ url: string; textureUrl?: string }> = ({ url, textureUrl }) => {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
//    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        // Load model
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            setModel(gltf.scene);
        });

        // Load texture if available
        if (textureUrl) {
            // const textureLoader = new THREE.TextureLoader();
            // textureLoader.load(textureUrl, (loadedTexture) => {
            //     setTexture(loadedTexture);
            // });
        }
    }, [url, textureUrl]);

    return model ? (
        <primitive
            object={model}
            dispose={null}
            // onBeforeRender={() => {
            //     // Apply the texture to all mesh materials in the model
            //     if (texture) {
            //         model.traverse((child) => {
            //             // if ((child as THREE.Mesh).isMesh) {
            //             //     (child as THREE.Mesh).material.map = texture;
            //             //     (child as THREE.Mesh).material.needsUpdate = true;
            //             // }
            //         });
            //     }
            // }}
        />
    ) : null;
};

const ModelViewer: React.FC<ModelViewerProps> = ({ data }) => {
    const { modelUrl, previewUrl, previewLogoUrl, videoUrl, textureUrls } = data;

    return (
        <div className="model-viewer-container max-w-3xl mx-auto p-4 bg-gray-100 rounded-lg shadow-lg">
            {/* 3D Model Viewer */}
            <Canvas style={{ height: '500px', width: '100%' }} camera={{ position: [2, 2, 5], fov: 50 }}>
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <React.Suspense fallback={<div>Loading...</div>}>
                    <Model url={modelUrl} textureUrl={textureUrls[0]?.colorMapUrl} />
                    <Environment preset="studio" />
                </React.Suspense>
                <OrbitControls enableZoom={true} />
            </Canvas>

            {/* Preview Image */}
            {previewUrl && (
                <div className="mt-4">
                    <img
                        src={previewUrl}
                        alt="Model Preview"
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>
            )}

            {/* Preview Logo Image */}
            {previewLogoUrl && (
                <div className="mt-4">
                    <img
                        src={previewLogoUrl}
                        alt="Model Preview with Logo"
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>
            )}

            {/* Video Preview */}
            {videoUrl && (
                <div className="mt-4">
                    <video
                        src={videoUrl}
                        controls
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>
            )}
        </div>
    );
};

export default ModelViewer;
