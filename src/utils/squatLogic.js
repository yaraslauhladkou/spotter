/**
 * Checks the squat state based on head position and full body visibility.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {string} currentStage - Current stage ('UP' or 'DOWN')
 * @returns {object} { stage, isRep, feedback, angle }
 */

let baselineY = null; // Store the standing height (min Y)

export const checkSquat = (landmarks, currentStage) => {
    // MediaPipe Pose Landmarks:
    // 0: nose
    // 23: left_hip, 24: right_hip
    // 27: left_ankle, 28: right_ankle

    const nose = landmarks[0];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // 1. Check Full Body Visibility
    // We need at least one ankle to be visible to ensure the user is fully in frame.
    // Visibility score ranges from 0 to 1. 0.5 is a good threshold.
    const isLeftAnkleVisible = leftAnkle.visibility > 0.5;
    const isRightAnkleVisible = rightAnkle.visibility > 0.5;

    if (!isLeftAnkleVisible && !isRightAnkleVisible) {
        // Reset baseline if user leaves frame or gets too close
        baselineY = null;
        return { stage: currentStage, isRep: false, feedback: 'Step Back (Show Feet)', angle: 0 };
    }

    // Ensure nose is also visible
    if (nose.visibility < 0.5) {
        return { stage: currentStage, isRep: false, feedback: 'Show Face', angle: 0 };
    }

    // 2. Establish Baseline (Standing Position)
    // Update baseline if we find a higher head position (smaller Y) WHILE ankles are visible.
    if (baselineY === null || nose.y < baselineY) {
        baselineY = nose.y;
    }

    // 3. Squat Detection Logic
    const threshold = 0.15; // Normalized coordinates drop

    let stage = currentStage;
    let isRep = false;
    let feedback = '';

    // Calculate "depth" as distance from baseline
    const depth = nose.y - baselineY;

    // Hysteresis for state change
    if (depth > threshold) { // Dropped down
        if (stage === 'UP') {
            stage = 'DOWN';
            feedback = 'Good Depth!';
        }
    } else if (depth < threshold * 0.5) { // Returned up
        if (stage === 'DOWN') {
            stage = 'UP';
            isRep = true;
            feedback = 'Rep Completed';
        } else {
            stage = 'UP';
            // Optional: Check if standing straight?
            // For now, just being close to baseline is enough.
            feedback = 'Ready';
        }
    } else {
        // In between states
        if (stage === 'DOWN') {
            feedback = 'Hold...';
        } else {
            feedback = 'Go Lower';
        }
    }

    // Return a dummy angle for UI compatibility if needed, or we can repurpose it to show depth %
    const displayValue = Math.round(depth * 100);

    return { stage, isRep, feedback, angle: displayValue };
};
