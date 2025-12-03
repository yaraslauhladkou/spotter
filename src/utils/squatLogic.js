/**
 * Checks the squat state based on head crossing a horizontal line.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {object} currentState - Current logic state { stage }
 * @returns {object} { newState, isRep, feedback }
 */
export const checkSquat = (landmarks, currentState) => {
    // MediaPipe Pose Landmarks:
    // 0: nose
    const nose = landmarks[0];

    // Visibility Check
    if (nose.visibility < 0.5) {
        return {
            newState: currentState,
            isRep: false,
            feedback: 'Show Face'
        };
    }

    // Metric: Nose Y position (0 is top, 1 is bottom)
    const noseY = nose.y;
    // Hysteresis Thresholds
    // Center is 0.5
    // Must go below 0.6 to count as DOWN
    // Must go above 0.4 to count as UP
    const THRESHOLD_DOWN = 0.6;
    const THRESHOLD_UP = 0.4;

    let { stage } = currentState;
    let isRep = false;
    let feedback = '';

    // State Machine
    // UP: Nose above line (y < 0.4)
    // DOWN: Nose below line (y > 0.6)

    if (stage === 'UP' || stage === 'IDLE') {
        if (noseY > THRESHOLD_DOWN) {
            stage = 'DOWN';
            feedback = 'Good Depth!';
        } else if (noseY > 0.45 && noseY < 0.55) {
            feedback = 'Go Lower';
        } else {
            feedback = 'Ready';
        }
    } else if (stage === 'DOWN') {
        if (noseY < THRESHOLD_UP) {
            stage = 'UP';
            isRep = true;
            feedback = 'Rep Completed';
        } else {
            feedback = 'Come Up';
        }
    }

    return {
        newState: { stage },
        isRep,
        feedback
    };
};
