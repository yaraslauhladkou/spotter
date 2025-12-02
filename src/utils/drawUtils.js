import { POSE_CONNECTIONS } from '@mediapipe/pose';

export const drawCanvas = (ctx, results) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Draw connectors
    if (results.poseLandmarks) {
        for (const connection of POSE_CONNECTIONS) {
            const start = results.poseLandmarks[connection[0]];
            const end = results.poseLandmarks[connection[1]];

            if (start.visibility > 0.5 && end.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(start.x * width, start.y * height);
                ctx.lineTo(end.x * width, end.y * height);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#00f3ff'; // Neon Cyan
                ctx.stroke();
            }
        }

        // Draw landmarks
        for (const landmark of results.poseLandmarks) {
            if (landmark.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(landmark.x * width, landmark.y * height, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#7000ff'; // Neon Purple
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            }
        }
    }
    ctx.restore();
};
