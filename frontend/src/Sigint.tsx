import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Waves, Play, Square, ShieldCheck } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function Sigint(props: NavigationProps) {
  const { isAcousticEmulationActive, setAcousticEmulationActive } = useTactical();
  const [amplitudes, setAmplitudes] = useState(Array(32).fill(0));
  const [classifications, setClassifications] = useState([
    { label: 'CH_1 (SHRIMP)', prob: 0.1, rate: '100KB/s' },
    { label: 'CH_2 (WHALE)', prob: 0.1, rate: '100KB/s' },
    { label: 'CH_3 (PROP)', prob: 0.1, rate: '100KB/s' },
    { label: 'CH_4 (SUB)', prob: 0.1, rate: '100KB/s' }
  ]);
  const [bioDensity, setBioDensity] = useState(0);
  const [stealthIndex, setStealthIndex] = useState(0);
  const [primaryAnomaly, setPrimaryAnomaly] = useState("SIG_DELTA_823");
  
  // New States for Interaction
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);

  // Animation Loop for Oscilloscope
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setPhase(p => p + 0.1);
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    // Generate some initial random data for the bar chart
    setAmplitudes(Array.from({length: 32}, () => 0.05));

    const socket = new WebSocket('ws://localhost:8000/ws/triangulation');
    wsRef.current = socket;
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audio_stream') {
          setIsPlaying(true);
          setAmplitudes(prev => {
            const newAmps = [...prev.slice(1), Math.max(0.05, data.amplitude * 5)];
            return newAmps;
          });
        } else if (data.type === 'classification') {
          setBioDensity(data.bio_density || 0);
          setStealthIndex(data.stealth_index || 0);
          setPrimaryAnomaly(data.primary_anomaly || "SIG_DELTA_823");
          setClassifications([
            { label: 'CH_1 (SHRIMP)', prob: data.classifications[0]?.prob || 0.1, rate: '142KB/s' },
            { label: 'CH_2 (WHALE)', prob: data.classifications[1]?.prob || 0.1, rate: '104KB/s' },
            { label: 'CH_3 (PROP)', prob: data.classifications[2]?.prob || 0.1, rate: '88KB/s' },
            { label: 'CH_4 (SUB)', prob: data.classifications[3]?.prob || 0.1, rate: '92KB/s' }
          ]);
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };

    return () => socket.close();
  }, []);

  const toggleStream = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const newIsPlaying = !isPlaying;
      wsRef.current.send(JSON.stringify({ type: 'control', action: newIsPlaying ? 'start' : 'stop' }));
      setIsPlaying(newIsPlaying);
      if (!newIsPlaying) {
         setAmplitudes(Array(32).fill(0.05));
      }
    }
  };

  const currentAmp = isPlaying ? (amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length) : 0;

  return (
    <Layout {...props} title="SIGINT // SOUNDSCAPE_SYNTHESIS">
      <div className="flex-1 flex flex-col gap-3 min-w-0 pb-4">
        
        {/* Top Section: Acoustic Spectrogram & Channels */}
        <div className="bg-surface border border-outline-variant p-4 flex flex-col relative overflow-hidden flex-1 min-h-[350px]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Waves size={14} className="text-primary" />
              Acoustic Spectrogram [Delta-9]
            </h2>
            <div className="flex items-center gap-4 text-[9px] text-on-surface-variant font-black">
              <button 
                onClick={toggleStream}
                className={`flex items-center gap-1.5 px-3 py-1 border transition-colors ${isPlaying ? 'bg-primary/20 border-primary text-white' : 'bg-surface-container border-outline-variant hover:text-white'}`}
              >
                 {isPlaying ? <Square size={10} className="text-primary" fill="currentColor"/> : <Play size={10} />}
                 {isPlaying ? 'ACTIVE_STREAM' : 'START_STREAM'}
              </button>
              <button 
                onClick={() => setAcousticEmulationActive(!isAcousticEmulationActive)}
                className={`flex items-center gap-1.5 px-3 py-1 border transition-colors ${isAcousticEmulationActive ? 'bg-tertiary/20 border-tertiary text-white shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'bg-surface-container border-outline-variant hover:text-white'}`}
              >
                 <ShieldCheck size={10} className={isAcousticEmulationActive ? "text-tertiary" : ""} />
                 {isAcousticEmulationActive ? 'EMULATION_ENGAGED' : 'ENABLE_ACOUSTIC_EMULATION'}
              </button>
              <span className="flex items-center gap-1.5 ml-4"><span className="w-1.5 h-1.5 bg-primary rounded-full" /> BW: 5.0 MHz</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-tertiary rounded-full" /> GAIN: +18 dB</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex-1 flex items-end gap-1 mb-6 border-b border-outline-variant/30 pb-1">
            {amplitudes.map((amp, i) => {
              // If masking is enabled, the spectrogram shows the "residual" masked result (very small)
              const displayAmp = isAcousticEmulationActive 
                ? (amp * 0.1 + Math.random() * 0.05) 
                : amp;

              return (
                <div key={i} className="flex-1 bg-primary/20 relative flex items-end" style={{ height: '100%' }}>
                  <div 
                    className={`w-full transition-all duration-75 ease-out shadow-[0_-4px_12px_rgba(74,222,128,0.3)]
                      ${isAcousticEmulationActive ? 'bg-primary/20 border-t border-primary/50' : 'bg-primary/40 border-t-2 border-primary'}
                    `}
                    style={{ height: `${Math.min(100, displayAmp * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Channels */}
          <div className="grid grid-cols-4 gap-3">
            {classifications.map((ch, i) => (
              <div key={i} className="border border-outline-variant p-2.5 flex flex-col gap-2 bg-surface-container-low">
                <div className="flex justify-between items-center text-[9px] font-black uppercase">
                  <span className="text-on-surface-variant">{ch.label}</span>
                  <span className="text-primary">Sync</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest w-full relative">
                  <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-500" style={{ width: `${ch.prob * 100}%` }} />
                </div>
                <div className="flex justify-between items-center text-[8px] font-black uppercase text-on-surface-variant">
                  <span className="text-white">{ch.rate}</span>
                  <span>12ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Metadata & Oscilloscope */}
        <div className="grid grid-cols-12 gap-3 h-48">
          
          {/* Stream Metadata */}
          <div className="col-span-12 md:col-span-6 bg-surface border border-outline-variant p-4 flex flex-col">
             <h3 className="text-[10px] font-black text-on-surface-variant uppercase mb-4 tracking-widest">Stream Metadata</h3>
             <div className="flex flex-col gap-3 flex-1 justify-center">
                {[
                  { label: 'ID:', value: isAcousticEmulationActive ? 'MASK_ACTIVE' : primaryAnomaly, isPrimary: true },
                  { label: 'COORD:', value: '42.22°N 12.8°E', isPrimary: false },
                  { label: 'BIO-DENSITY:', value: `${(bioDensity * 100).toFixed(1)}%`, isPrimary: false },
                  { label: 'STEALTH-IDX:', value: isAcousticEmulationActive ? '99.9%' : `${(stealthIndex * 100).toFixed(1)}%`, isPrimary: false },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[10px] text-on-surface-variant font-black uppercase">{row.label}</span>
                    <span className={`text-[11px] font-bold ${row.isPrimary ? 'text-primary' : 'text-white'}`}>{row.value}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Raw Oscilloscope */}
          <div className="col-span-12 md:col-span-6 bg-surface border border-outline-variant p-4 flex flex-col relative overflow-hidden">
             <h3 className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest">Raw Oscilloscope</h3>
             <div className="flex-1 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  {/* Primary Signal (Green) */}
                  <path 
                    d={`M ${Array.from({length: 50}).map((_, i) => `${i * 2},${50 + Math.sin(i / 5 + phase) * (currentAmp * 40)}`).join(' L ')}`} 
                    className="stroke-primary fill-none"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  
                  {/* Emulation Mask (Yellow Inverted) - Only visible when masking */}
                  {isAcousticEmulationActive && (
                    <path 
                      d={`M ${Array.from({length: 50}).map((_, i) => `${i * 2},${50 + Math.sin(i / 5 + phase + Math.PI) * (currentAmp * 40)}`).join(' L ')}`} 
                      className="stroke-tertiary fill-none"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Idle flatline if not playing */}
                  {!isPlaying && (
                    <path 
                      d="M 0,50 L 100,50" 
                      className="stroke-primary/50 fill-none"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
             </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
