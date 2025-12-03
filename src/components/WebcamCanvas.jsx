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
                return `${import.meta.env.BASE_URL}mediapipe/${file}`;
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
            if (canvasRef.current && webcamRef.current && webcamRef.current.video) {
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;

                // Set canvas dimensions to match video
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;

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
                // Remove fixed width/height here to allow camera to choose best resolution or default
            });
            camera.start();
            setCameraActive(true);
        }
    }, [onPoseResults]);

    return (
        <div className="glass-panel" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '640px',
            aspectRatio: '9/16', // Maintain aspect ratio
            margin: '0 auto',
            overflow: 'hidden'
        }}>
            <Webcam
                ref={webcamRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6
                }}
                videoConstraints={{
                    facingMode: "user"
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
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
