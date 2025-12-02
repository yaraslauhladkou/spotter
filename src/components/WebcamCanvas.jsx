import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { drawCanvas } from '../utils/drawUtils';

const WebcamCanvas = ({ onPoseResults }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                drawCanvas(ctx, results);
                if (onPoseResults) {
                    onPoseResults(results);
                }
            }
        });

        if (webcamRef.current && webcamRef.current.video) {
            const camera = new cam.Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await pose.send({ image: webcamRef.current.video });
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start();
            setCameraActive(true);
        }
    }, [onPoseResults]);

    return (
        <div className="glass-panel" style={{ position: 'relative', width: '640px', height: '480px', margin: '20px auto', overflow: 'hidden' }}>
            <Webcam
                ref={webcamRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    zindex: 9,
                    width: '640px',
                    height: '480px',
                    objectFit: 'cover',
                    opacity: 0.6 // Slightly dim the video to make the skeleton pop
                }}
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    zindex: 9,
                    width: '640px',
                    height: '480px',
                }}
            />
            {!cameraActive && (
                <div className="flex-center" style={{ position: 'absolute', inset: 0, color: 'white' }}>
                    Loading Camera & Model...
                </div>
            )}
        </div>
    );
};

export default WebcamCanvas;
