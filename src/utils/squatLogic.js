/**
 * Checks the squat state based on biomechanical ratios and debouncing.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {object} currentState - Current logic state { stage, baselineRatio }
 * @returns {object} { newState, isRep, feedback }
 */
export const checkSquat = (landmarks, currentState) => {
    // MediaPipe Pose Landmarks:
    // 11: left_shoulder, 12: right_shoulder
    // 23: left_hip, 24: right_hip
    // 27: left_ankle, 28: right_ankle

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // 1. Visibility Check
    const minVisibility = 0.5;
    if (
        leftShoulder.visibility < minVisibility || rightShoulder.visibility < minVisibility ||
        leftHip.visibility < minVisibility || rightHip.visibility < minVisibility ||
        (leftAnkle.visibility < minVisibility && rightAnkle.visibility < minVisibility)
    ) {
        return {
            newState: { ...currentState, baselineRatio: null }, // Reset baseline if tracking lost
            isRep: false,
            feedback: 'Show Full Body'
        };
    }

    // 2. Calculate Metrics
    // Average Y positions (0 is top, 1 is bottom)
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Vertical segments
    const torsoLength = Math.abs(hipY - shoulderY);
    const legLength = Math.abs(ankleY - hipY);

    // Prevent division by zero or tiny torso
    if (torsoLength < 0.05) {
        return { newState: currentState, isRep: false, feedback: 'Adjust Camera' };
    }

    // Ratio: Leg Length / Torso Length
    // Standing: Legs extended (max length). Ratio is high.
    // Squat: Legs folded (shorter vertical projection). Ratio is low.
    const currentRatio = legLength / torsoLength;

    // 3. Update State
    let { stage, baselineRatio } = currentState;
    let isRep = false;
    let feedback = '';

    // Initialize baseline if needed (assume standing at start)
    // We update baseline if we see a "taller" ratio (more standing)
    if (baselineRatio === null || currentRatio > baselineRatio) {
        baselineRatio = currentRatio;
    }

    // Thresholds (relative to baseline)
    // Squat depth: Ratio drops significantly.
    // E.g., if standing ratio is 1.5, squat might be 1.0.
    // Let's say drop of 30% is a good squat.
    const SQUAT_THRESHOLD_RATIO = 0.75; // 75% of baseline
    const STANDING_THRESHOLD_RATIO = 0.90; // 90% of baseline to return

    const ratioToBaseline = currentRatio / baselineRatio;

    if (stage === 'UP') {
        if (ratioToBaseline < SQUAT_THRESHOLD_RATIO) {
            stage = 'DOWN';
            feedback = 'Good Depth!';
        } else {
            feedback = 'Ready';
        }
    } else if (stage === 'DOWN') {
        if (ratioToBaseline > STANDING_THRESHOLD_RATIO) {
            stage = 'UP';
            isRep = true;
            feedback = 'Rep Completed';
        } else {
            feedback = 'Hold...';
        }
    }

    return {
        newState: { stage, baselineRatio },
        isRep,
        feedback
    };
};
