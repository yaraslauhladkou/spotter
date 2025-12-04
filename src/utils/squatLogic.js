/**
 * Checks the squat state based on head crossing a horizontal line.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {object} currentState - Current logic state { stage }
 * @param {number} lineY - Vertical position of the line (0-1)
 * @returns {object} { newState, isRep, feedback }
 */
export const checkSquat = (landmarks, currentState, lineY = 0.5) => {
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
    // Center is lineY
    // Must go below lineY + 0.1 to count as DOWN
    // Must go above lineY - 0.1 to count as UP
    const THRESHOLD_DOWN = lineY + 0.1;
    const THRESHOLD_UP = lineY - 0.1;

    let { stage } = currentState;
    let isRep = false;
    let feedback = '';

    // State Machine
    // UP: Nose above line
    // DOWN: Nose below line

    if (stage === 'UP' || stage === 'IDLE') {
        if (noseY > THRESHOLD_DOWN) {
            stage = 'DOWN';
            feedback = 'Good Depth!';
        } else if (noseY > THRESHOLD_UP + 0.05 && noseY < THRESHOLD_DOWN - 0.05) {
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
