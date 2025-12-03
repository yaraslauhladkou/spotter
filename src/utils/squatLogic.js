/**
 * Checks the squat state based on amplitude and strict baseline validation.
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
            newState: { ...currentState, baselineRatio: null, stage: 'IDLE' }, // Reset if lost
            isRep: false,
            feedback: 'Show Full Body'
        };
    }

    // 2. Calculate Metrics
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

    const torsoLength = Math.abs(hipY - shoulderY);
    const legLength = Math.abs(ankleY - hipY);

    if (torsoLength < 0.05) {
        return { newState: currentState, isRep: false, feedback: 'Adjust Camera' };
    }

    const currentRatio = legLength / torsoLength;

    // 3. Update State
    let { stage, baselineRatio } = currentState;
    let isRep = false;
    let feedback = '';

    // STRICT BASELINE VALIDATION
    // Only calibrate if we are clearly standing.
    // A ratio of 1.2+ usually indicates standing (legs longer than torso).
    // Sitting usually has a ratio < 1.0.
    const MIN_STANDING_RATIO = 1.2;

    if (baselineRatio === null) {
        if (currentRatio > MIN_STANDING_RATIO) {
            baselineRatio = currentRatio;
            feedback = 'Calibrated';
        } else {
            return {
                newState: { ...currentState, stage: 'IDLE' },
                isRep: false,
                feedback: 'Stand Up to Calibrate'
            };
        }
    } else {
        // Continuous calibration: if we see a "taller" standing pose, update baseline
        if (currentRatio > baselineRatio) {
            baselineRatio = currentRatio;
        }
    }

    // Thresholds relative to baseline
    const ratioToBaseline = currentRatio / baselineRatio;

    // State Machine Thresholds
    const THRESHOLD_DESCEND = 0.85; // Start going down
    const THRESHOLD_BOTTOM = 0.70;  // Deep squat
    const THRESHOLD_ASCEND = 0.85;  // Coming back up
    const THRESHOLD_RESET = 0.95;   // Back to standing

    // State Machine
    // Stages: IDLE -> DESCENDING -> BOTTOM -> ASCENDING -> IDLE (Rep)

    switch (stage) {
        case 'IDLE':
        case 'UP': // Legacy support or alias
            if (ratioToBaseline < THRESHOLD_DESCEND) {
                stage = 'DESCENDING';
                feedback = 'Going Down...';
            } else {
                feedback = 'Ready';
            }
            break;

        case 'DESCENDING':
            if (ratioToBaseline < THRESHOLD_BOTTOM) {
                stage = 'BOTTOM';
                feedback = 'Good Depth!';
            } else if (ratioToBaseline > THRESHOLD_RESET) {
                // Aborted squat
                stage = 'IDLE';
                feedback = 'Reset';
            } else {
                feedback = 'Go Lower';
            }
            break;

        case 'BOTTOM':
            if (ratioToBaseline > THRESHOLD_ASCEND) {
                stage = 'ASCENDING';
                feedback = 'Coming Up...';
            } else {
                feedback = 'Hold...';
            }
            break;

        case 'ASCENDING':
            if (ratioToBaseline > THRESHOLD_RESET) {
                stage = 'IDLE';
                isRep = true;
                feedback = 'Rep Completed';
            } else if (ratioToBaseline < THRESHOLD_BOTTOM) {
                // Went back down
                stage = 'BOTTOM';
                feedback = 'Good Depth!';
            } else {
                feedback = 'Push Up';
            }
            break;

        default:
            stage = 'IDLE';
            break;
    }

    return {
        newState: { stage, baselineRatio },
        isRep,
        feedback
    };
};
