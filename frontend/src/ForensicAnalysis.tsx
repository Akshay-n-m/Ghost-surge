import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Fingerprint, Database, Network, Activity, Play, Square, Settings2, CheckCircle2, WifiOff } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function ForensicAnalysis(props: NavigationProps) {
  const { isDeobfuscationComplete, setDeobfuscationComplete } = useTactical();
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState('submarine');
  const [currentAmp, setCurrentAmp] = useState(0);
  const [amplitudes, setAmplitudes] = useState(Array(100).fill(0));
  const [wsStatus, setWsStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [classifications, setClassifications] = useState([
    { name: 'Alpheidae (Shrimp)', prob: 0.92, type: 'biological', trend: 'STABLE' },
    { name: 'Balaenoptera (Whale)', prob: 0.85, type: 'biological', trend: 'NOMINAL' },
    { name: 'Cavitation (Propeller)', prob: 0.05, type: 'anomalous', trend: 'LOW' },
    { name: 'Submarine Hum', prob: 0.01, type: 'anomalous', trend: 'LOW' }
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const nextPlayTime = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    const connectWS = () => {
      setWsStatus('connecting');
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/triangulation';
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => setWsStatus('online');
      socket.onclose = () => {
        setWsStatus('offline');
        setIsPlaying(false);
      };
      socket.onerror = () => setWsStatus('offline');

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'classification') {
            const updated = [
              { name: 'Alpheidae (Shrimp)',    prob: data.classifications[0].prob, type: 'biological', trend: data.classifications[0].prob > 0.5 ? 'DETECTED' : 'LOW' },
              { name: 'Balaenoptera (Whale)',  prob: data.classifications[1].prob, type: 'biological', trend: data.classifications[1].prob > 0.5 ? 'DETECTED' : 'LOW' },
              { name: 'Cavitation (Propeller)', prob: data.classifications[2].prob, type: 'anomalous', trend: data.classifications[2].prob > 0.5 ? 'ALERT' : 'NOMINAL' },
              { name: 'Submarine Hum',         prob: data.classifications[3].prob, type: 'anomalous', trend: data.classifications[3].prob > 0.5 ? 'ALERT' : 'NOMINAL' }
            ];
            setClassifications(updated);
          } else if (data.type === 'audio_stream') {
            setCurrentAmp(data.amplitude);
            setAmplitudes(prev => [...prev.slice(1), data.amplitude]);

            // Real audio playback
            if (audioCtx.current && audioCtx.current.state === 'running') {
              const raw = atob(data.data);
              const array = new Int16Array(raw.length / 2);
              const view = new DataView(new ArrayBuffer(raw.length));
              for (let i = 0; i < raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
              for (let i = 0; i < array.length; i++) array[i] = view.getInt16(i * 2, true);
              const float32 = new Float32Array(array.length);
              for (let i = 0; i < array.length; i++) float32[i] = array[i] / 32768;

              const buffer = audioCtx.current.createBuffer(1, float32.length, 16000);
              buffer.copyToChannel(float32, 0);
              const src = audioCtx.current.createBufferSource();
              src.buffer = buffer;
              src.connect(audioCtx.current.destination);

              const now = audioCtx.current.currentTime;
              if (nextPlayTime.current < now) nextPlayTime.current = now;
              src.start(nextPlayTime.current);
              nextPlayTime.current += buffer.duration;
            }
          }
        } catch (e) {
          console.error('WS Error:', e);
        }
      };
    };

    connectWS();
    return () => {
      wsRef.current?.close();
      stopMic();
    };
  }, []);

  const startMic = async () => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const sourceNode = audioCtx.current.createMediaStreamSource(stream);
      const processor = audioCtx.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isPlaying) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          wsRef.current.send(pcmData.buffer);
        }
      };

      sourceNode.connect(processor);
      processor.connect(audioCtx.current.destination);
    } catch (err) {
      console.error("Mic Error:", err);
      setSource('submarine'); // Fallback
    }
  };

  const stopMic = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && source === 'mic') {
      startMic();
    } else {
      stopMic();
    }
  }, [isPlaying, source]);

  const toggleStream = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      nextPlayTime.current = audioCtx.current.currentTime;
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const newIsPlaying = !isPlaying;
      wsRef.current.send(JSON.stringify({ type: 'control', action: newIsPlaying ? 'start' : 'stop' }));
      setIsPlaying(newIsPlaying);
      if (!newIsPlaying) {
        setAmplitudes(Array(100).fill(0));
      } else {
        setTimeout(() => setDeobfuscationComplete(true), 3000);
      }
    }
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'control', action: 'change_source', value: newSource }));
    }
  };

  return (
    <Layout {...props} title="FORENSIC // SPECTRAL_DE_OBFUSCATOR">
      <div className="flex-1 overflow-auto space-y-3 pb-4">

        {/* Backend Status Banner */}
        {wsStatus !== 'online' && (
          <div className={`flex items-center gap-3 px-4 py-2 border text-[10px] font-black uppercase tracking-widest
            ${wsStatus === 'connecting'
              ? 'border-tertiary/40 bg-tertiary/10 text-tertiary animate-pulse'
              : 'border-error/40 bg-error/10 text-error'}`}>
            <WifiOff size={12} />
            {wsStatus === 'connecting'
              ? `CONNECTING TO SENTINEL BRIDGE... (${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'})`
              : 'BACKEND OFFLINE — Check Render deployment or local sentinel_bridge.py'}
          </div>
        )}

        <div className="grid grid-cols-12 gap-3 h-64">
          {/* Signal Extraction */}
          <div className="col-span-12 lg:col-span-4 bg-surface border border-outline-variant p-3 flex flex-col relative overflow-hidden group">
            <Fingerprint className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors" size={56} />
            <h3 className="text-[10px] font-black text-white uppercase mb-3 tracking-widest border-b border-outline-variant pb-1 flex items-center justify-between">
              Signal Extraction
              <span className={`text-[8px] ${isPlaying ? 'text-primary animate-pulse' : 'text-on-surface-variant'}`}>
                {isPlaying ? 'ACTIVE_STREAM' : wsStatus === 'offline' ? 'NO_LINK' : 'IDLE'}
              </span>
            </h3>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-surface-container-low p-2 border border-outline-variant/30">
                  <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center border border-outline-variant">
                    <Database size={18} className={isPlaying ? 'text-primary' : 'text-on-surface-variant'} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[12px] font-black text-white uppercase truncate">{source}_ARRAY</p>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase">16.0kHz // PCM_S16LE</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-high border border-outline-variant p-2">
                    <p className="text-[8px] text-on-surface-variant uppercase font-black mb-1">Confidence</p>
                    <p className="text-[12px] text-white font-black">98.4%</p>
                  </div>
                  <div className="bg-surface-container-high border border-outline-variant p-2">
                    <p className="text-[8px] text-on-surface-variant uppercase font-black mb-1">Signal Floor</p>
                    <p className="text-[12px] text-primary font-black">{(currentAmp * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <button
                onClick={toggleStream}
                disabled={wsStatus !== 'online'}
                className={`w-full py-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all
                  ${wsStatus !== 'online'
                    ? 'bg-surface-container text-on-surface-variant cursor-not-allowed border border-outline-variant'
                    : isPlaying
                      ? 'bg-error text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : 'bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.3)] hover:bg-white'}`}
              >
                {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                {wsStatus !== 'online' ? 'Bridge Offline' : isPlaying ? 'Terminate Link' : 'Initialize Extraction'}
              </button>

              {isDeobfuscationComplete && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-primary text-[10px] font-black uppercase bg-primary/10 py-1 border border-primary/30">
                  <CheckCircle2 size={12} /> De-Obfuscation Complete
                </div>
              )}
            </div>
          </div>

          {/* Acoustic Input Selection */}
          <div className="col-span-12 lg:col-span-8 bg-surface border border-outline-variant p-3 flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-outline-variant pb-1">
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Acoustic Input Selection</h3>
              <Settings2 size={12} className="text-on-surface-variant" />
            </div>
            <div className="flex-1 grid grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { id: 'submarine', label: 'Submarine' },
                { id: 'whale',     label: 'Whale'     },
                { id: 'shrimp',    label: 'Shrimp'    },
                { id: 'reef',      label: 'Reef'      },
                { id: 'mic',       label: 'Live Mic'  }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSourceChange(item.id)}
                  className={`border flex flex-col items-center justify-center p-2 group transition-all
                    ${source === item.id
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container-high'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mb-1.5 ${source === item.id ? 'bg-primary scale-125' : 'border border-primary'}`} />
                  <span className={`text-[8px] text-center uppercase font-black leading-tight tracking-tighter
                    ${source === item.id ? 'text-white' : 'text-on-surface-variant'}`}>{item.label}</span>
                </button>
              ))}
              <div className="col-span-full mt-auto p-2 bg-black/40 border border-outline-variant/30 flex items-center justify-between">
                <span className="text-[8px] text-on-surface-variant font-black">ACTIVE_NODE: NODE_082_BALTIC</span>
                <div className="flex gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`w-1 h-3 ${isPlaying ? 'bg-primary/40 animate-pulse' : 'bg-outline-variant/20'}`} style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Signature De-Obfuscation */}
        <div className="bg-surface border border-outline-variant p-4 flex-1 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Network size={16} className="text-primary" />
              <div>
                <h2 className="text-[12px] font-black text-white uppercase tracking-wider">Neural Signature De-Obfuscation</h2>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase">Cross-Referencing YAMNet AI Knowledge Base [Local_Model_V1] — Updates every ~8s</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-primary uppercase">Engine Status: {isPlaying ? 'Analyzing' : 'Ready'}</span>
              <div className="w-32 h-1 bg-surface-container-highest mt-1">
                <div className={`h-full bg-primary transition-all duration-500 ${isPlaying ? 'w-full' : 'w-0'}`} />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex flex-col gap-2.5">
              {classifications.map(item => (
                <div key={item.name} className="flex justify-between items-center border-b border-outline-variant/30 pb-1">
                  <div>
                    <p className="text-[9px] text-on-surface-variant font-black uppercase">{item.name}</p>
                    <p className={`text-[7px] font-bold ${item.type === 'anomalous' ? 'text-error' : 'text-primary'}`}>{item.trend}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] text-white font-black">{(item.prob * 100).toFixed(1)}%</span>
                    <div className="w-16 h-1 bg-surface-container-highest mt-0.5">
                      <div
                        className={`h-full transition-all duration-700 ${item.type === 'anomalous' ? 'bg-error' : 'bg-primary'}`}
                        style={{ width: `${item.prob * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-auto bg-surface-container-high p-2 border-l-2 border-primary">
                <p className="text-[9px] font-black text-primary mb-1 uppercase">Top Detection</p>
                <p className="text-[11px] text-white font-bold uppercase italic">
                  {classifications.reduce((prev, cur) => prev.prob > cur.prob ? prev : cur).name}
                </p>
              </div>
            </div>

            <div className="flex-1 border border-outline-variant bg-black/60 relative overflow-hidden flex flex-col p-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-primary" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">Spectral Oscilloscope</span>
                </div>
                <span className="text-[8px] text-on-surface-variant font-mono">T: +{amplitudes.length}ms</span>
              </div>

              <div className="flex-1 relative flex items-center justify-center border border-outline-variant/20 bg-surface-dim/40 overflow-hidden">
                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d={`M ${amplitudes.map((amp, i) => `${i * 10},${50 - amp * 100}`).join(' L ')}`}
                    className="stroke-primary fill-none stroke-[2px] transition-all duration-75"
                  />
                  <path
                    d={`M ${amplitudes.map((amp, i) => `${i * 10},${50 + amp * 100}`).join(' L ')}`}
                    className="stroke-primary/30 fill-none stroke-[1px] transition-all duration-75"
                  />
                </svg>

                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#4ade80_1px,transparent_1px),linear-gradient(to_bottom,#4ade80_1px,transparent_1px)] bg-[length:50px_25px]" />

                {!isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] animate-pulse">
                      {wsStatus === 'offline' ? 'BRIDGE OFFLINE — START sentinel_bridge.py' : 'AWAITING_INPUT...'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-between">
                <div className="flex gap-2">
                  <div className="w-16 h-1 bg-primary/20"><div className="h-full bg-primary" style={{ width: `${currentAmp * 100}%` }} /></div>
                  <span className="text-[8px] text-primary font-black">SIG_LEVEL</span>
                </div>
                <span className="text-[8px] text-on-surface-variant font-black">X-REF: GHOST_SURGE_DB_v4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
