import React, { useState, useCallback, useRef } from 'react';
import WebcamCanvas from './components/WebcamCanvas';
import { checkSquat } from './utils/squatLogic';

function App() {
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState('Get Ready');

  // Use Ref for instant state updates (avoids race conditions)
  const logicStateRef = useRef({
    stage: 'UP'
  });

  // Sync Ref to State for UI updates
  const [uiState, setUiState] = useState({
    stage: 'UP'
  });

  const handlePoseResults = useCallback((results) => {
    if (results.poseLandmarks) {
      // Read from Ref (instant)
      const currentState = logicStateRef.current;
      const { newState, isRep, feedback: newFeedback } = checkSquat(results.poseLandmarks, currentState);

      // Write to Ref (instant)
      logicStateRef.current = newState;

      // Update UI State (eventual)
      if (newState.stage !== uiState.stage) {
        setUiState({ stage: newState.stage });
      }

      if (isRep) {
        setCount(c => c + 1);
      }

      if (newFeedback) {
        setFeedback(newFeedback);
      }
    }
  }, [uiState.stage]);

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
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: uiState.stage === 'DOWN' ? 'var(--secondary-accent)' : 'white' }}>
              {uiState.stage}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => setCount(0)}
          className="glass-panel"
          style={{
            marginBottom: '20px',
            padding: '10px 30px',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '30px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          RESET COUNTER
        </button>

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
