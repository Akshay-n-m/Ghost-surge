import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { LogOut, User, Edit3, Shield, Database, ChevronRight, Palette, Cpu, ScreenShare, TerminalSquare, AlertTriangle, Check, UploadCloud, Activity } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function SettingsAccount(props: NavigationProps) {
  const { operatorName, setOperatorName, operatorImage, setOperatorImage } = useTactical();
  
  // Interactive States
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(operatorName);
  const [uptime, setUptime] = useState(0);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminateProgress, setTerminateProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uptime Timer
  useEffect(() => {
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `T+ ${h}:${m}:${s}`;
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOperatorImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Name Editing Handlers
  const saveName = () => {
    if (tempName.trim()) setOperatorName(tempName.trim().toUpperCase());
    setIsEditingName(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') {
      setTempName(operatorName);
      setIsEditingName(false);
    }
  };

  // Diagnostic Simulation
  const runDiagnostics = () => {
    if (isDiagnosing) return;
    setIsDiagnosing(true);
    setDiagnosticLog([]);
    const logs = [
      "INITIATING SECURE PING TO ALPHA-GHOST...",
      "LATENCY: 14ms",
      "HANDSHAKE VERIFIED: RSA-4096",
      "PACKET LOSS: 0.00%",
      "UPLINK STABLE."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setDiagnosticLog(prev => [...prev, logs[i]]);
      i++;
      if (i >= logs.length) {
        clearInterval(interval);
        setTimeout(() => setIsDiagnosing(false), 3000);
      }
    }, 400);
  };

  // Terminate Session Sequence
  const handleTerminate = () => {
    setIsTerminating(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          props.onNavigate('landing', 'push_back');
        }, 500);
      }
      setTerminateProgress(Math.min(progress, 100));
    }, 200);
  };

  return (
    <Layout {...props} title="SETTINGS // ACCOUNT">
      
      {/* TERMINATE SESSION OVERLAY */}
      {isTerminating && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-12">
           <div className="max-w-xl w-full flex flex-col gap-4">
              <div className="flex items-center gap-3 text-error">
                 <AlertTriangle size={32} className="animate-pulse" />
                 <h2 className="text-2xl font-black uppercase tracking-widest">Purging Secure Buffers</h2>
              </div>
              <div className="font-mono text-[10px] text-error/80 uppercase mb-4">
                 <p>&gt; SEVERING HARDWARE HANDSHAKE...</p>
                 <p>&gt; ERASING VOLATILE MEMORY...</p>
                 <p>&gt; GOODBYE, {operatorName.split(' // ')[0]}</p>
              </div>
              <div className="h-2 bg-surface-container-highest border border-error/30 w-full overflow-hidden">
                 <div 
                   className="h-full bg-error transition-all duration-200" 
                   style={{ width: `${terminateProgress}%` }} 
                 />
              </div>
              <p className="text-right text-[10px] text-error font-black">{Math.floor(terminateProgress)}%</p>
           </div>
        </div>
      )}

      <div className="flex-1 flex gap-3 max-w-6xl mx-auto w-full">
        <div className="w-1/4 bg-surface border border-outline-variant flex flex-col pt-3">
          <div className="px-3 mb-4">
            <h2 className="text-[11px] font-black text-white uppercase mb-1">Configuration</h2>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-tighter">Account_Uplink</p>
          </div>
          
          <div className="flex flex-col flex-1 text-[11px] font-black uppercase">
            <button 
              onClick={() => props.onNavigate('settings-appearance', 'none')}
              className="flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all"
            >
               <div className="flex items-center gap-2">
                 <Palette size={14} />
                 <span>Aesthetic</span>
               </div>
            </button>
            <button 
              onClick={() => props.onNavigate('settings-security', 'none')}
              className="flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all"
            >
               <div className="flex items-center gap-2">
                 <Cpu size={14} />
                 <span>Security</span>
               </div>
            </button>
            <button className="flex items-center justify-between px-3 py-2 bg-surface-container-highest border-r-2 border-primary text-primary transition-all">
               <div className="flex items-center gap-2">
                 <ScreenShare size={14} />
                 <span>Account</span>
               </div>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-surface border border-outline-variant p-6 relative overflow-hidden flex flex-col">
           <h3 className="text-lg font-black text-white uppercase mb-6 border-b border-outline-variant pb-2">Active Operator Profile</h3>

           <div className="space-y-8 relative z-10 flex-1 overflow-auto pr-2 scrollbar-hide">
              <section className="flex flex-col md:flex-row items-start gap-5">
                 {/* AVATAR UPLOAD */}
                 <div className="relative">
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleImageUpload} 
                   />
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-24 h-24 bg-surface-container-high border border-outline-variant relative group overflow-hidden cursor-pointer flex items-center justify-center"
                   >
                      {operatorImage ? (
                        <img src={operatorImage} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <User size={48} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                      )}
                      
                      {/* Upload Overlay */}
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <UploadCloud size={16} className="text-primary mb-1" />
                         <span className="text-[8px] font-black text-white uppercase">Upload</span>
                      </div>
                   </div>
                 </div>

                 {/* PROFILE DETAILS */}
                 <div className="flex-1 space-y-2 mt-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <TerminalSquare size={16} className="text-primary animate-pulse" />
                        <input
                          autoFocus
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={saveName}
                          className="bg-transparent border-b border-primary text-xl font-black text-white uppercase tracking-tighter outline-none w-full max-w-sm"
                          placeholder="ENTER CALLSIGN..."
                        />
                        <button onClick={saveName} className="p-1 bg-primary text-black hover:bg-white transition-colors">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-3">
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">{operatorName}</h4>
                        <button 
                          onClick={() => setIsEditingName(true)}
                          className="bg-surface-container-high text-on-surface-variant p-1.5 opacity-0 group-hover:opacity-100 hover:text-primary transition-all hover:scale-110"
                        >
                           <Edit3 size={12} />
                        </button>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest flex items-center gap-2">
                       <Shield size={12} className="text-tertiary" /> 
                       CLEARANCE_LVL: <span className="text-tertiary underline decoration-dotted">ULTRA-VIOLET</span>
                    </p>
                    <div className="pt-2 flex gap-1.5 flex-wrap">
                       <span className="text-[8px] bg-surface-container-highest px-2 py-0.5 border border-outline-variant font-black text-on-surface-variant uppercase tracking-widest">UID_3942-88-X</span>
                       <span className="text-[8px] bg-primary/10 px-2 py-0.5 border border-primary/30 font-black text-primary uppercase tracking-widest">O2_STABLE_CORE</span>
                    </div>
                 </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {/* INTERACTIVE DIAGNOSTICS */}
                 <button 
                   onClick={runDiagnostics}
                   disabled={isDiagnosing}
                   className="border border-outline-variant p-3 flex gap-3 hover:bg-surface-container-low transition-colors bg-surface-container-low/20 text-left relative overflow-hidden group"
                 >
                    <Database size={18} className={`text-on-surface-variant ${isDiagnosing ? 'text-primary animate-bounce' : ''}`} />
                    <div className="relative z-10 w-full">
                      <h5 className="text-[9px] font-black text-on-surface-variant uppercase mb-1">STATION_ASSIGNMENT</h5>
                      
                      {!isDiagnosing ? (
                        <p className="text-[12px] text-white font-black uppercase group-hover:text-primary transition-colors">ALPHA-GHOST TERMINAL</p>
                      ) : (
                        <div className="mt-2 space-y-0.5">
                           {diagnosticLog.map((log, i) => (
                             <p key={i} className="text-[8px] text-primary font-mono uppercase">{'>'} {log}</p>
                           ))}
                           <span className="inline-block w-2 h-2 bg-primary animate-pulse mt-1" />
                        </div>
                      )}
                    </div>
                 </button>

                 {/* LIVE UPTIME TIMER */}
                 <div className="border border-outline-variant p-3 flex gap-3 hover:bg-surface-container-low transition-colors bg-surface-container-low/20">
                    <Activity size={18} className="text-primary animate-pulse" />
                    <div>
                      <h5 className="text-[9px] font-black text-on-surface-variant uppercase mb-1">ACTIVE_UPTIME</h5>
                      <p className="text-[14px] text-white font-black font-mono tracking-wider">{formatUptime(uptime)}</p>
                    </div>
                 </div>
              </section>

              <div className="bg-error/5 border border-error/20 p-3 flex flex-col gap-1.5">
                 <h5 className="text-[9px] font-black text-error uppercase">Security_Advisory</h5>
                 <p className="text-[9px] text-on-surface-variant font-bold uppercase leading-tight">Proceeding with terminal disconnect will purge all local volatile buffers and terminate the secure hardware handshake.</p>
              </div>
           </div>

           <div className="pt-4 flex justify-between items-center shrink-0 border-t border-outline-variant/30 mt-auto">
              <span className="text-[8px] text-on-surface-variant font-black uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                System_State: SECURE
              </span>
              <button 
                onClick={handleTerminate}
                className="flex items-center gap-2 bg-error text-white px-6 py-2 font-black uppercase text-[10px] tracking-widest group hover:bg-opacity-80 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)]"
              >
                 <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                 TERMINATE SESSION
              </button>
           </div>
        </div>
      </div>
    </Layout>
  );
}
