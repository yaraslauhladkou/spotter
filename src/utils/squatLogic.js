/**
 * Calculates the angle between three points (A, B, C) at point B.
 * @param {object} a - Point A {x, y}
 * @param {object} b - Point B {x, y}
 * @param {object} c - Point C {x, y}
 * @returns {number} Angle in degrees
 */
export const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
};

/**
 * Checks the squat state based on landmarks.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {string} currentStage - Current stage ('UP' or 'DOWN')
 * @returns {object} { stage, isRep, feedback }
 */
export const checkSquat = (landmarks, currentStage) => {
    // MediaPipe Pose Landmarks:
    // 23: left_hip, 24: right_hip
    // 25: left_knee, 26: right_knee
    // 27: left_ankle, 28: right_ankle

    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    // Ensure visibility is good enough
    if (leftHip.visibility < 0.5 || leftKnee.visibility < 0.5 || leftAnkle.visibility < 0.5) {
        return { stage: currentStage, isRep: false, feedback: 'Adjust Camera' };
    }

    // Calculate angles for both legs (or just one, usually left is fine if side view, but average is safer for front view)
    // For front view, depth is harder to judge by angle alone, but we can try.
    // Actually, for a standard squat tracker, side view is best. 
    // But let's assume the user might be front-facing. 
    // Vertical displacement of hip relative to knee is another metric.

    // Let's stick to angles. 
    const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Use the average or the most visible leg
    const angle = leftAngle; // Simplified for now

    let stage = currentStage;
    let isRep = false;
    let feedback = '';

    // Thresholds
    const STANDING_THRESHOLD = 160;
    const SQUAT_THRESHOLD = 90; // Parallel or below

    if (angle > STANDING_THRESHOLD) {
        stage = 'UP';
    }

    if (angle < SQUAT_THRESHOLD && currentStage === 'UP') {
        stage = 'DOWN';
        feedback = 'Good Depth!';
    }

    // Count rep when returning to UP from DOWN
    // Wait, usually we count when they complete the rep (return to standing)
    // So:
    // 1. Start UP
    // 2. Go DOWN (set stage = DOWN)
    // 3. Go UP (if stage was DOWN, count++)

    if (angle > STANDING_THRESHOLD && currentStage === 'DOWN') {
        stage = 'UP';
        isRep = true;
        feedback = 'Rep Completed';
    } else if (currentStage === 'DOWN' && angle < SQUAT_THRESHOLD) {
        feedback = 'Hold...';
    } else if (currentStage === 'UP' && angle < STANDING_THRESHOLD && angle > SQUAT_THRESHOLD) {
        feedback = 'Go Lower';
    }

    return { stage, isRep, feedback, angle };
};
