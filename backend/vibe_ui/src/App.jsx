import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const Waveform = ({ amplitudes }) => {
  // Normalize amplitudes to fit an SVG height of 100
  const points = amplitudes.map((amp, i) => `${i * (1000 / 100)},${100 - amp * 100}`).join(' ');

  return (
    <div className="waveform-panel">
      <div className="waveform-title">Live Acoustic Oscilloscope</div>
      <div className="waveform">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="oscilloscope-svg">
          <polyline points={points} className="oscilloscope-line" />
        </svg>
      </div>
    </div>
  );
};

const SonarGrid = ({ targetPos, onGridClick }) => (
  <div className="sonar-grid-panel">
    <div className="sonar-title">Triangulation Visualizer - [CLICK GRID TO INDUCE ANOMALY]</div>
    <div 
      className="sonar-grid-3d" 
      onClick={onGridClick}
      style={{ cursor: 'crosshair' }}
    >
      {targetPos && (
        <div 
          className="target-blip" 
          style={{ top: `${targetPos.y}%`, left: `${targetPos.x}%` }}
        ></div>
      )}
    </div>
  </div>
);

const ClassificationDashboard = ({ classifications }) => {
  return (
    <div className="classification-panel">
      <h2>Species Classification</h2>
      {classifications.map((item, idx) => (
        <div key={idx} className={`class-item ${item.type}`}>
          <span className="class-name">{item.name}</span>
          <span className="class-prob">{(item.prob * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [targetPos, setTargetPos] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState('submarine');
  const [currentAmp, setCurrentAmp] = useState(0);
  const [amplitudes, setAmplitudes] = useState(Array(100).fill(0));
  const wsRef = useRef(null);
  const audioCtx = useRef(null);
  const nextPlayTime = useRef(0);
  
  const defaultClassifications = [
    { name: 'Alpheidae (Shrimp)', prob: 0.92, type: 'biological' },
    { name: 'Balaenoptera (Whale)', prob: 0.85, type: 'biological' },
    { name: 'Cavitation (Propeller)', prob: 0.05, type: 'anomalous' },
    { name: 'Submarine Hum', prob: 0.01, type: 'anomalous' }
  ];
  
  const [classifications, setClassifications] = useState(defaultClassifications);
  const timeoutRef = useRef(null);

  const triggerAnomaly = (x, y, primaryAnomalyName = 'Manual Induction', newClassifications = null) => {
    // Update target coordinate
    setTargetPos({ x, y });
    
    // Update the UI bars directly from the AI's actual analysis
    if (newClassifications && newClassifications.length > 0) {
      setClassifications(newClassifications);
    } else {
      // Manual induction from grid click or missing AI data
      setClassifications([
        { name: 'Alpheidae (Shrimp)', prob: 0.05 + Math.random() * 0.1, type: 'biological' },
        { name: 'Balaenoptera (Whale)', prob: 0.10 + Math.random() * 0.1, type: 'biological' },
        { name: 'Cavitation (Propeller)', prob: 0.85 + Math.random() * 0.1, type: 'anomalous' },
        { name: 'Submarine Hum', prob: 0.80 + Math.random() * 0.15, type: 'anomalous' }
      ]);
    }

    // Clear any existing reset timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Maintain the UI state for 10 seconds (slightly longer than the 8s AI polling interval)
    timeoutRef.current = setTimeout(() => {
      setTargetPos(null);
      setClassifications(defaultClassifications);
    }, 10000);
  };

  const handleGridClick = (e) => {
    // Calculate click percentage relative to the 3D grid
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Manually trigger anomaly at the clicked location
    triggerAnomaly(x, y);
  };

  useEffect(() => {
    // Connect to the Python Sentinel Bridge WebSocket
    const socket = new WebSocket('ws://localhost:8000/ws/triangulation');
    wsRef.current = socket;
    
    socket.onopen = () => console.log("Connected to Sentinel-Reef Orchestrator.");
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'anomaly') {
          // Fallback if backend sends old format
          console.log("Backend Anomaly Received:", data);
          triggerAnomaly(data.x, data.y, data.anomaly_type, null);
        } else if (data.type === 'classification') {
          console.log("Real AI Classification Received:", data.classifications);
          triggerAnomaly(data.x, data.y, data.primary_anomaly, data.classifications);
        } else if (data.type === 'audio_stream') {
          // Update Waveform and Meter
          setCurrentAmp(data.amplitude);
          setAmplitudes(prev => {
            const newArr = [...prev.slice(1), data.amplitude];
            return newArr;
          });

          // Play Audio if Context is ready
          if (audioCtx.current && audioCtx.current.state === 'running') {
            const raw = atob(data.data);
            const array = new Int16Array(raw.length / 2);
            const view = new DataView(new ArrayBuffer(raw.length));
            for (let i = 0; i < raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
            
            for (let i = 0; i < array.length; i++) {
              array[i] = view.getInt16(i * 2, true); // Little endian
            }

            const float32 = new Float32Array(array.length);
            for (let i = 0; i < array.length; i++) float32[i] = array[i] / 32768;

            const buffer = audioCtx.current.createBuffer(1, float32.length, 16000);
            buffer.copyToChannel(float32, 0);
            const source = audioCtx.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.current.destination);
            
            const now = audioCtx.current.currentTime;
            if (nextPlayTime.current < now) nextPlayTime.current = now;
            source.start(nextPlayTime.current);
            nextPlayTime.current += buffer.duration;
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    return () => socket.close();
  }, []);

  const toggleStream = () => {
    // Initialize/Resume AudioContext on user interaction
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      nextPlayTime.current = audioCtx.current.currentTime;
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const newIsPlaying = !isPlaying;
      wsRef.current.send(JSON.stringify({
        type: 'control',
        action: newIsPlaying ? 'start' : 'stop'
      }));
      setIsPlaying(newIsPlaying);
      if (!newIsPlaying) {
         setAmplitudes(Array(100).fill(0)); // Reset waveform on stop
      }
    } else {
      console.error("WebSocket not connected.");
    }
  };

  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setSource(newSource);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'control',
        action: 'change_source',
        value: newSource
      }));
    }
  };

  return (
    <div className="hud-container">
      <div className="controls-panel">
        <select className="source-select" value={source} onChange={handleSourceChange}>
          <option value="submarine">SUBMARINE CHURN</option>
          <option value="whale">WHALE SONG</option>
          <option value="shrimp">SNAPPING SHRIMP</option>
          <option value="reef">REEF AMBIENT</option>
          <option value="mic">LIVE MICROPHONE</option>
        </select>
        <button 
          className={`stream-btn ${isPlaying ? 'active' : ''}`}
          onClick={toggleStream}
        >
          {isPlaying ? 'STOP STREAM' : 'START STREAM'}
        </button>
        <div className="signal-meter">
          <label>SIGNAL STRENGTH</label>
          <div className="meter-bg">
            <div className="meter-fill" style={{ width: `${currentAmp * 100}%` }}></div>
          </div>
        </div>
      </div>
      <SonarGrid targetPos={targetPos} onGridClick={handleGridClick} />
      <ClassificationDashboard classifications={classifications} />
      <Waveform amplitudes={amplitudes} />
    </div>
  );
}

export default App;
