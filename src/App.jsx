import React, { useState, useCallback } from 'react';
import WebcamCanvas from './components/WebcamCanvas';
import { checkSquat } from './utils/squatLogic';

function App() {
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState('Get Ready');

  // Complex state for the logic (stage, timestamps, baselines)
  const [logicState, setLogicState] = useState({
    stage: 'IDLE',
    baselineRatio: null
  });

  const handlePoseResults = useCallback((results) => {
    if (results.poseLandmarks) {
      const { newState, isRep, feedback: newFeedback } = checkSquat(results.poseLandmarks, logicState);

      setLogicState(newState);

      if (isRep) {
        setCount(c => c + 1);
      }

      if (newFeedback) {
        setFeedback(newFeedback);
      }
    }
  }, [logicState]);

  return (
    <div className="full-screen flex-center">
      <div className="container" style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>

        {/* Header Stats */}
        <div className="stats-container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto 20px auto',
          gap: '10px'
        }}>
          <div className="glass-panel" style={{ padding: '15px 30px', flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>SQUATS</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-accent)' }}>{count}</div>
          </div>

          <div className="glass-panel" style={{ padding: '15px 30px', flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>STATUS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: logicState.stage === 'DOWN' ? 'var(--secondary-accent)' : 'white' }}>
              {logicState.stage}
            </div>
          </div>
        </div>

        {/* Main Video Area */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto'
        }}>
          <WebcamCanvas onPoseResults={handlePoseResults} />

          {/* Overlay Feedback */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            padding: '10px 20px',
            borderRadius: '20px',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
            width: 'max-content'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>{feedback}</span>

          </div>
        </div>

      </div>

      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(112,0,255,0.15) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </div>
  );
}

export default App;
