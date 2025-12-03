/**
 * Checks the squat state based on head position.
 * @param {Array} landmarks - Array of pose landmarks
 * @param {string} currentStage - Current stage ('UP' or 'DOWN')
 * @returns {object} { stage, isRep, feedback, angle }
 */

let baselineY = null; // Store the standing height (min Y)

export const checkSquat = (landmarks, currentStage) => {
    // MediaPipe Pose Landmarks:
    // 0: nose
    const nose = landmarks[0];

    // Ensure visibility
    if (nose.visibility < 0.5) {
        return { stage: currentStage, isRep: false, feedback: 'Show Face', angle: 0 };
    }

    // Update baseline (standing position)
    // We assume the user starts standing or stands up taller.
    // Smaller Y means higher up in the image (0 is top).
    if (baselineY === null || nose.y < baselineY) {
        baselineY = nose.y;
    }

    // If the user moves significantly lower than baseline, reset slightly to adapt to drift?
    // For now, let's just keep the min Y. 
    // Actually, if they move the camera or step back, baseline might need reset.
    // But for simple logic:

    const threshold = 0.15; // Normalized coordinates. 0.15 is a decent drop.

    let stage = currentStage;
    let isRep = false;
    let feedback = '';

    // Calculate "depth" as distance from baseline
    const depth = nose.y - baselineY;

    if (depth > threshold) { // Dropped down
        if (stage === 'UP') {
            stage = 'DOWN';
            feedback = 'Good Depth!';
        }
    } else if (depth < threshold * 0.5) { // Returned up (hysteresis)
        if (stage === 'DOWN') {
            stage = 'UP';
            isRep = true;
            feedback = 'Rep Completed';
        } else {
            stage = 'UP';
            feedback = 'Go Lower';
        }
    }

    // Return a dummy angle for UI compatibility if needed, or we can repurpose it to show depth %
    const displayValue = Math.round(depth * 100);

    return { stage, isRep, feedback, angle: displayValue };
};
