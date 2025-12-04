import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { drawCanvas } from '../utils/drawUtils';

const WebcamCanvas = ({ onPoseResults, lineY = 0.5, onLineMove }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const onPoseResultsRef = useRef(onPoseResults);
    const lineYRef = useRef(lineY);

    useEffect(() => {
        onPoseResultsRef.current = onPoseResults;
    }, [onPoseResults]);

    useEffect(() => {
        lineYRef.current = lineY;
    }, [lineY]);

    // Handle Dragging
    const handleStart = (clientY) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const y = (clientY - rect.top) / rect.height;

        // Check if click is near the line (within 5%)
        if (Math.abs(y - lineY) < 0.05) {
            setIsDragging(true);
        }
    };

    const handleMove = (clientY) => {
        if (isDragging && canvasRef.current && onLineMove) {
            const rect = canvasRef.current.getBoundingClientRect();
            let y = (clientY - rect.top) / rect.height;
            // Clamp between 0.1 and 0.9
            y = Math.max(0.1, Math.min(0.9, y));
            onLineMove(y);
        }
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    // Mouse Events
    const onMouseDown = (e) => handleStart(e.clientY);
    const onMouseMove = (e) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => handleEnd();

    // Touch Events
    const onTouchStart = (e) => handleStart(e.touches[0].clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `${import.meta.env.BASE_URL}mediapipe/${file}`;
            },
        });

        pose.setOptions({
            modelComplexity: 0,
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
                drawCanvas(ctx, results, lineYRef.current);

                if (onPoseResultsRef.current) {
                    onPoseResultsRef.current(results);
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
    }, []); // Empty dependency array to run once

    return (
        <div className="glass-panel" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '640px',
            aspectRatio: '9/16', // Maintain aspect ratio
            margin: '0 auto',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
        }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
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
