import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Activity, ShieldAlert, ShieldCheck, Crosshair, Zap, Navigation } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function CommandHUD(props: NavigationProps) {
  const tactical = useTactical();
  
  // Telemetry States
  const [bioDensity, setBioDensity] = useState(0);
  const [stealthIndex, setStealthIndex] = useState(1);
  const [primaryAnomaly, setPrimaryAnomaly] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Interactive Target State
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);

  // Interactive Vitals State
  const [vitals, setVitals] = useState({ battery: 92, hull: 100, thermal: 35 });
  const [isRerouting, setIsRerouting] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/triangulation');
    wsRef.current = socket;
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'classification') {
          setBioDensity(data.bio_density || 0);
          setStealthIndex(data.stealth_index || 0);
          setPrimaryAnomaly(data.primary_anomaly);
          
          // Map classifications to radar targets
          const newAnomalies = data.classifications
             .filter((c: any) => c.prob > 0.3)
             .map((c: any, index: number) => {
                const isThreat = c.name.includes("Propeller") || c.name.includes("Submarine");
                // Spread them around the radar based on a pseudo-random angle
                const angle = (index * 75 + (Date.now() / 10000)) % 360;
                const distance = 40 + (1 - c.prob) * 40; // Higher probability = closer
                return {
                   id: c.name,
                   isThreat,
                   prob: c.prob,
                   x: 50 + Math.cos(angle * Math.PI / 180) * distance,
                   y: 50 + Math.sin(angle * Math.PI / 180) * distance,
                   bearing: Math.round((angle + 360) % 360),
                   range: Math.round(distance * 100),
                };
             });
          setAnomalies(newAnomalies);
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };

    return () => socket.close();
  }, []);

  // Update selected target if live data changes
  useEffect(() => {
    if (selectedTarget) {
      const liveTarget = anomalies.find(a => a.id === selectedTarget.id);
      if (liveTarget) setSelectedTarget(liveTarget);
    }
  }, [anomalies, selectedTarget]);

  const handleReroute = () => {
    if (isRerouting || vitals.battery <= 20 || vitals.thermal >= 100) return;
    setIsRerouting(true);
    
    const interval = setInterval(() => {
      setVitals(prev => {
         if (prev.thermal >= 100 || prev.battery <= 20) {
           clearInterval(interval);
           setIsRerouting(false);
           return { ...prev, thermal: Math.min(100, prev.thermal), battery: Math.max(20, prev.battery) };
         }
         return {
           ...prev,
           thermal: prev.thermal + 3,
           battery: prev.battery - 1
         };
      });
    }, 100);
  };

  // Derive Tactical Drive State
  let driveState = 'COMPROMISED';
  let driveBg = 'bg-error animate-pulse';
  let driveColor = 'text-error border-error';

  if (!tactical.isDeobfuscationComplete || !tactical.isAcousticEmulationActive) {
     driveState = 'SYSTEM LOCKED';
  } else if (tactical.pendingDestination) {
     driveState = 'IN TRANSIT';
     driveBg = 'bg-primary';
     driveColor = 'text-primary border-primary';
  } else {
     driveState = 'STATIONARY';
     driveBg = 'bg-tertiary';
     driveColor = 'text-tertiary border-tertiary';
  }

  return (
    <Layout {...props} title="COMMAND HUD // TACTICAL_VIEW">
      <div className="grid grid-cols-12 gap-3 h-full pb-4">
        {/* Left Panel: System Vitals */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="bg-surface border border-outline-variant p-3 flex-1 relative flex flex-col">
            <h3 className="text-[10px] font-black text-white uppercase border-b border-outline-variant pb-1 mb-3 tracking-widest flex items-center justify-between">
              System Vitals
              <span className="text-primary font-light text-[8px]">ACTIVE</span>
            </h3>
            
            <div className="flex flex-col gap-2 flex-1">
              {[
                { label: 'DEPTH_MTR', value: '1,402.0' },
                { label: 'SPEED_KTS', value: tactical.pendingDestination ? '24.1' : '0.0' },
                { label: 'HEADING_TRU', value: '012.8°' },
                { label: 'PITCH_DEG', value: tactical.pendingDestination ? '+01.4' : '00.0' },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-end border-b border-outline-variant border-opacity-30 pb-0.5">
                  <span className="text-[9px] text-on-surface-variant font-bold uppercase">{stat.label}</span>
                  <span className="text-sm font-black text-white font-display">{stat.value}</span>
                </div>
              ))}

              <div className="mt-4 space-y-4">
                {/* BATTERY */}
                <div>
                  <div className="flex justify-between text-[8px] mb-1">
                    <span className="text-on-surface-variant font-black uppercase">BATTERY_CORE</span>
                    <span className={vitals.battery < 40 ? 'text-error' : 'text-primary'}>{vitals.battery}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest">
                    <div className="h-full bg-primary transition-all duration-75" style={{ width: `${vitals.battery}%` }} />
                  </div>
                </div>

                {/* HULL */}
                <div>
                  <div className="flex justify-between text-[8px] mb-1">
                    <span className="text-on-surface-variant font-black uppercase">HULL_INTEGRITY</span>
                    <span className="text-primary">{vitals.hull}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest">
                    <div className="h-full bg-primary transition-all duration-75" style={{ width: `${vitals.hull}%` }} />
                  </div>
                </div>

                {/* THERMAL SHIELD (INTERACTIVE) */}
                <div className="p-2 border border-outline-variant/50 bg-surface-container-low group relative overflow-hidden">
                  <div className="flex justify-between text-[8px] mb-1">
                    <span className="text-white font-black uppercase flex items-center gap-1">
                      <ShieldAlert size={10} className={vitals.thermal < 50 ? 'text-tertiary animate-pulse' : 'text-primary'} /> 
                      THERMAL_SHIELD
                    </span>
                    <span className={vitals.thermal < 50 ? 'text-tertiary' : 'text-primary'}>{Math.floor(vitals.thermal)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest mb-2 border border-outline-variant/30">
                    <div className={`h-full transition-all duration-75 ${vitals.thermal < 50 ? 'bg-tertiary' : 'bg-primary'}`} style={{ width: `${vitals.thermal}%` }} />
                  </div>
                  {vitals.thermal < 100 && (
                     <button 
                       onClick={handleReroute}
                       disabled={isRerouting || vitals.battery <= 20}
                       className="w-full text-[8px] font-black uppercase py-1 border border-tertiary/50 text-tertiary hover:bg-tertiary hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                     >
                       <Zap size={10} />
                       {isRerouting ? 'Rerouting...' : 'Reroute Core Power'}
                     </button>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-3">
                <div className={`bg-surface-container-high p-2 flex justify-between items-center border-l-2 ${driveColor}`}>
                  <span className="text-[11px] text-white uppercase font-black">DRIVE STATE</span>
                  <span className={`text-[9px] text-black px-1.5 font-black uppercase ${driveBg}`}>
                    {driveState}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-3 h-40 relative flex flex-col">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase border-b border-outline-variant pb-1 mb-2 tracking-widest">Acoustic Status</h3>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="border border-outline-variant p-2 flex flex-col justify-center bg-surface-container-low">
                <span className="text-[8px] text-on-surface-variant mb-1 uppercase font-black">BIO_DENSITY</span>
                <span className="text-xs text-white font-black">{(bioDensity * 100).toFixed(1)}%</span>
              </div>
              <div className={`border p-2 flex flex-col justify-center ${stealthIndex > 0.6 ? 'border-outline-variant bg-surface-container-low' : 'border-error bg-error/10'}`}>
                <span className="text-[8px] text-on-surface-variant mb-1 uppercase font-black">STEALTH_IDX</span>
                <div className="flex items-center gap-1">
                  {stealthIndex > 0.6 ? <ShieldCheck size={12} className="text-primary" /> : <ShieldAlert size={12} className="text-error" />}
                  <span className={`text-xs font-black ${stealthIndex > 0.6 ? 'text-primary' : 'text-error'}`}>
                    {(stealthIndex * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Radar / Map */}
        <div className="col-span-12 lg:col-span-9 bg-surface border border-outline-variant relative flex flex-col items-center justify-center overflow-hidden min-h-[400px]">
          {/* Decorative Corner Marks */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-outline-variant/50" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-outline-variant/50" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-outline-variant/50" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-outline-variant/50" />
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary bg-surface px-3 tracking-widest border border-outline-variant border-t-0 p-1 z-30 flex items-center gap-2">
            <Navigation size={12} />
            SONAR_RADIAL_ARRAY [B-9]
          </div>

          {/* TARGET TELEMETRY PANEL */}
          {selectedTarget && (
             <div className="absolute top-8 right-8 z-40 bg-surface-container-high border border-error/50 p-3 w-64 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex justify-between items-center border-b border-error/30 pb-1 mb-2">
                   <h4 className="text-[10px] font-black text-error uppercase flex items-center gap-1">
                      <Crosshair size={12} /> TARGET LOCKED
                   </h4>
                   <button onClick={() => setSelectedTarget(null)} className="text-on-surface-variant hover:text-white text-[8px] font-black uppercase">DROP</button>
                </div>
                <div className="space-y-1.5">
                   <p className="text-xs font-black text-white uppercase tracking-tighter truncate">{selectedTarget.id}</p>
                   
                   <div className="grid grid-cols-2 gap-2 py-2 border-y border-outline-variant/20">
                      <div>
                         <p className="text-[8px] text-on-surface-variant font-black uppercase">Bearing</p>
                         <p className="text-[10px] text-primary font-mono">{selectedTarget.bearing}°</p>
                      </div>
                      <div>
                         <p className="text-[8px] text-on-surface-variant font-black uppercase">Range</p>
                         <p className="text-[10px] text-primary font-mono">{selectedTarget.range}m</p>
                      </div>
                   </div>
                   
                   <div>
                     <p className="text-[8px] text-on-surface-variant font-black uppercase mb-1">Threat Probability</p>
                     <div className="h-1.5 w-full bg-surface-container-highest border border-outline-variant/30">
                        <div className="h-full bg-error transition-all duration-200" style={{ width: `${selectedTarget.prob * 100}%` }} />
                     </div>
                   </div>
                </div>
             </div>
          )}

          <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px] rounded-full border border-outline-variant/30 flex items-center justify-center">
             {/* Bio-Noise Background */}
             <div 
                className="absolute inset-0 rounded-full blur-2xl transition-all duration-1000 mix-blend-screen"
                style={{
                  background: `radial-gradient(circle, rgba(74,222,128,${bioDensity * 0.15}) 0%, transparent 70%)`,
                }}
              />

            {/* Concentric Rings */}
            {[40, 100, 160, 220].map((radius, i) => (
              <div 
                key={i} 
                className={`absolute rounded-full border border-primary/20 pointer-events-none ${i === 2 ? 'border-dashed' : ''}`}
                style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
              />
            ))}
            
            <div className="absolute w-2 h-2 bg-primary rounded-full z-20 shadow-[0_0_12px_rgba(74,222,128,1)] pointer-events-none" />
            
            {/* Crosshairs */}
            <div className="absolute w-full h-px bg-outline-variant/20 pointer-events-none" />
            <div className="absolute h-full w-px bg-outline-variant/20 pointer-events-none" />

            {/* Sweep */}
            <div 
              className="absolute inset-0 rounded-full mix-blend-screen opacity-10 animate-[spin_4s_linear_infinite] pointer-events-none"
              style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #4ade80 360deg)' }}
            />

            {/* Render Live Anomalies */}
            {anomalies.map((a, index) => {
               const isSelected = selectedTarget?.id === a.id;
               
               return (
                 <div 
                   key={index}
                   onClick={() => setSelectedTarget(a)}
                   className="absolute flex flex-col items-center transition-all duration-1000 ease-in-out cursor-crosshair group"
                   style={{ left: `${a.x}%`, top: `${a.y}%`, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 30 : 20 }}
                 >
                   
                   {/* Selection Reticle */}
                   {isSelected && (
                     <div className="absolute -inset-4 border border-error/50 rounded-full animate-[spin_3s_linear_infinite] pointer-events-none">
                        <div className="absolute top-0 left-1/2 w-1 h-1 bg-error -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-error -translate-x-1/2 translate-y-1/2" />
                     </div>
                   )}

                   {a.isThreat ? (
                      <div className={`w-2.5 h-2.5 bg-error rounded-sm flex items-center justify-center ${isSelected ? 'scale-125' : 'animate-pulse group-hover:scale-150 transition-transform'}`}>
                        <div className="w-1 h-1 bg-surface rounded-full" />
                      </div>
                   ) : (
                      <div className={`w-2 h-2 bg-primary rotate-45 border border-surface shadow-[0_0_4px_rgba(74,222,128,0.5)] ${isSelected ? 'scale-125 bg-white' : 'group-hover:scale-150 transition-transform'}`} />
                   )}
                   
                   <span className={`text-[8px] mt-1 px-1 font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''} ${a.isThreat ? 'text-error border border-error bg-surface' : 'text-primary bg-surface/80 border border-primary/30'}`}>
                      {a.id}
                   </span>
                 </div>
               );
            })}
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[9px] text-on-surface-variant bg-surface-container-low p-1.5 border border-outline-variant font-black uppercase z-30">
            <span>Range: 10km</span>
            <div className="w-20 h-1 bg-surface-container-highest relative">
              <div className="absolute inset-y-0 left-0 bg-primary w-1/2" />
            </div>
          </div>
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[9px] text-on-surface-variant bg-surface-container-low p-1.5 border border-outline-variant font-black uppercase z-30">
             <Activity size={12} className="text-primary" />
             <span>PRI_CONTACT: {primaryAnomaly || 'NONE'}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
