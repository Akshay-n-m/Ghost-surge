import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { ShieldAlert, Fingerprint, Key, Palette, Cpu, ScreenShare, AlertTriangle, TerminalSquare, Loader2 } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function SettingsSecurity(props: NavigationProps) {
  const tactical = useTactical();

  // Biometric States
  const [isBiometricActive, setIsBiometricActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Factor States
  const [authFactors, setAuthFactors] = useState([
    { name: 'HW_TOKEN [YUBI-GHOST]', id: '0x293...8B1', status: 'Linked' }
  ]);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingLogs, setPairingLogs] = useState<string[]>([]);

  // Hardening Metrics
  const [cacheState, setCacheState] = useState<'VOLATILE' | 'PERSISTENT'>('VOLATILE');

  // Emergency Wipe States
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeCode, setWipeCode] = useState('');
  const [typedCode, setTypedCode] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeLogs, setWipeLogs] = useState<string[]>([]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  // Biometric Handlers
  const handleScanStart = () => {
    setIsScanning(true);
    setScanProgress(0);
    scanIntervalRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setIsScanning(false);
          setIsBiometricActive(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const handleScanStop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanProgress < 100) {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // Add Security Layer (Pairing)
  const startPairing = () => {
    if (isPairing) return;
    setIsPairing(true);
    setPairingLogs([]);
    let step = 0;
    const steps = [
      "SEARCHING FOR HW_TOKEN ON BUS_0",
      "HANDSHAKE INITIATED... RSA-2048",
      "EXCHANGING KEYS: 0x4F... 0x9A...",
      "VERIFYING CHECKSUM...",
      "PAIRING SUCCESSFUL."
    ];
    
    const interval = setInterval(() => {
      setPairingLogs(prev => [...prev, steps[step]]);
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setAuthFactors(prev => [...prev, {
            name: `HW_TOKEN [NANO-DRIVE_${Math.floor(Math.random() * 1000)}]`,
            id: `0x${Math.random().toString(16).substr(2, 6).toUpperCase()}...`,
            status: 'Linked'
          }]);
          setIsPairing(false);
        }, 1000);
      }
    }, 600);
  };

  // Emergency Wipe Handlers
  const initWipe = () => {
    setWipeCode(`GHOST-PROTO-${Math.floor(Math.random() * 900 + 100)}`);
    setTypedCode('');
    setIsWipeModalOpen(true);
  };

  const handleWipeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTypedCode(val);
    if (val === wipeCode) {
      executeWipe();
    }
  };

  const executeWipe = () => {
    setIsWiping(true);
    let lines = 0;
    const generateWipeText = () => {
      const dirs = ['/sys/kernel/', '/var/log/', '/root/.ghost/', '/dev/zero', 'GLOBAL_CONTEXT'];
      return `[ERASE] ${dirs[Math.floor(Math.random() * dirs.length)]} -> 0x00000000`;
    };

    const wipeInterval = setInterval(() => {
      setWipeLogs(prev => [...prev.slice(-20), generateWipeText()]);
      lines++;
      if (lines > 40) {
        clearInterval(wipeInterval);
        // ACTUALLY WIPE GLOBAL STATE
        tactical.setOperatorName('OPERATOR_01 // VECTOR');
        tactical.setOperatorImage(null);
        tactical.setDeobfuscationComplete(false);
        tactical.setAcousticEmulationActive(false);
        tactical.setPendingDestination(null);
        // Navigate away
        props.onNavigate('landing', 'push_back');
      }
    }, 50);
  };

  return (
    <Layout {...props} title="SETTINGS // SECURITY">
      
      {/* EMERGENCY WIPE OVERLAY */}
      {isWipeModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-12">
           <div className={`max-w-2xl w-full border ${isWiping ? 'border-error bg-error/10' : 'border-error/50 bg-black'} p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]`}>
              {!isWiping ? (
                <>
                  <div className="flex items-center gap-4 text-error mb-6 border-b border-error/30 pb-4">
                     <AlertTriangle size={48} className="animate-pulse" />
                     <div>
                       <h2 className="text-3xl font-black uppercase tracking-widest leading-none">Destruct Protocol</h2>
                       <p className="text-[12px] uppercase font-bold tracking-widest text-error/80 mt-1">Authorization Required</p>
                     </div>
                  </div>
                  <p className="text-white text-[12px] font-mono uppercase mb-6 leading-relaxed">
                    Warning: This action is irreversible. All local volatile memory, operator profiles, and tactical context will be purged. 
                    <br/><br/>
                    To confirm, type the following authorization code: <span className="text-error font-black bg-error/20 px-2 py-0.5">{wipeCode}</span>
                  </p>
                  <div className="flex items-center gap-3">
                     <TerminalSquare size={24} className="text-error" />
                     <input
                       autoFocus
                       value={typedCode}
                       onChange={handleWipeInput}
                       className="bg-transparent border-b-2 border-error text-2xl font-black text-white uppercase tracking-widest outline-none w-full"
                       placeholder="ENTER CODE..."
                     />
                  </div>
                  <button 
                    onClick={() => setIsWipeModalOpen(false)}
                    className="mt-8 text-on-surface-variant hover:text-white text-[10px] font-black uppercase underline decoration-dashed"
                  >
                    [ABORT SEQUENCE]
                  </button>
                </>
              ) : (
                <div className="h-64 overflow-hidden flex flex-col justify-end font-mono text-[10px] text-error uppercase leading-tight">
                  {wipeLogs.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                  <div className="h-1 bg-error w-full mt-4 animate-pulse" />
                </div>
              )}
           </div>
        </div>
      )}

      {/* BIOMETRIC SCANNER OVERLAY */}
      {isScanning && !isBiometricActive && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
           <div className="flex flex-col items-center gap-6">
              <div className="relative w-48 h-48 border border-tertiary/30 bg-surface flex items-center justify-center">
                 <Fingerprint size={80} className={`${scanProgress > 0 ? 'text-tertiary' : 'text-on-surface-variant'} transition-colors duration-200`} />
                 
                 {/* Scanning laser line */}
                 <div 
                   className="absolute left-0 w-full h-1 bg-tertiary shadow-[0_0_12px_rgba(234,179,8,1)] transition-all duration-75"
                   style={{ top: `${scanProgress}%`, opacity: scanProgress > 0 ? 1 : 0 }}
                 />
                 
                 <div className="absolute bottom-2 right-2 text-tertiary font-black text-[12px]">{Math.floor(scanProgress)}%</div>
              </div>
              <p className="text-tertiary font-black uppercase tracking-widest animate-pulse">Scanning Bio-Signature...</p>
           </div>
        </div>
      )}

      <div className="flex-1 flex gap-3 max-w-6xl mx-auto w-full">
        <div className="w-1/4 bg-surface border border-outline-variant flex flex-col pt-3">
          <div className="px-3 mb-4">
            <h2 className="text-[11px] font-black text-white uppercase mb-1">Configuration</h2>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-tighter">Security_Configuration</p>
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
            <button className="flex items-center justify-between px-3 py-2 bg-surface-container-highest border-r-2 border-primary text-primary transition-all">
               <div className="flex items-center gap-2">
                 <ShieldAlert size={14} />
                 <span>Security</span>
               </div>
            </button>
            <button 
              onClick={() => props.onNavigate('settings-account', 'none')}
              className="flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all"
            >
               <div className="flex items-center gap-2">
                 <ScreenShare size={14} />
                 <span>Account</span>
               </div>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-surface border border-outline-variant p-6 relative overflow-hidden flex flex-col">
           <h3 className="text-lg font-black text-white uppercase mb-6 border-b border-outline-variant pb-2">Security Protocol</h3>

           <div className="space-y-6 relative z-10 flex-1 overflow-auto pr-2 scrollbar-hide">
              {/* BIOMETRICS MODULE */}
              <section className={`bg-surface-container-low p-3 border-l-2 ${isBiometricActive ? 'border-tertiary' : 'border-error'}`}>
                <div className="flex gap-3 items-center">
                  <div 
                    onMouseDown={!isBiometricActive ? handleScanStart : undefined}
                    onMouseUp={!isBiometricActive ? handleScanStop : undefined}
                    onMouseLeave={!isBiometricActive ? handleScanStop : undefined}
                    className={`p-2 border transition-all ${isBiometricActive ? 'border-tertiary/30' : 'border-error/50 cursor-crosshair hover:bg-error/10'}`}
                  >
                    <Fingerprint size={24} className={isBiometricActive ? "text-tertiary" : "text-error"} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase mb-1 flex items-center gap-2">
                      BIOMETRIC AUTHENTICATION
                      <span className={`text-[8px] px-1 text-black ${isBiometricActive ? 'bg-tertiary' : 'bg-error text-white'}`}>
                        {isBiometricActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </h4>
                    <p className="text-[9px] text-on-surface-variant leading-tight font-bold uppercase">
                      {isBiometricActive 
                        ? 'Neural spectral verification is ENGAGED. Mismatch triggers TERMINAL_LOCK_0x04.'
                        : 'Biometric lock disengaged. HOLD SCANNER TO REACTIVATE.'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {isBiometricActive && (
                      <button 
                        onClick={() => setIsBiometricActive(false)}
                        className="text-tertiary font-black text-[9px] border border-tertiary/30 px-2 py-0.5 hover:bg-tertiary hover:text-black transition-all"
                      >
                        REVOKE
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                 {/* AUTH FACTORS */}
                 <div>
                   <h4 className="text-[9px] font-black text-on-surface-variant uppercase mb-3 tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full" /> Auth Factors
                   </h4>
                   <div className="space-y-2">
                      {authFactors.map((factor, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 border border-outline-variant hover:bg-surface-container-low transition-colors group bg-surface-container-low/30">
                           <div className="flex items-center gap-3">
                             <Key size={14} className="text-primary" />
                             <div>
                               <p className="text-[11px] text-white font-black uppercase">{factor.name}</p>
                               <p className="text-[8px] text-on-surface-variant font-bold tracking-widest">ID: {factor.id}</p>
                             </div>
                           </div>
                           <span className="text-[8px] bg-primary/10 text-primary border border-primary/40 px-1.5 font-black uppercase py-0.5">{factor.status}</span>
                        </div>
                      ))}
                      
                      {isPairing ? (
                        <div className="p-3 border border-dashed border-primary bg-primary/5 flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase">
                             <Loader2 size={12} className="animate-spin" />
                             Pairing Hardware Token...
                           </div>
                           <div className="font-mono text-[8px] text-on-surface-variant leading-tight">
                             {pairingLogs.map((log, i) => <p key={i}>{'>'} {log}</p>)}
                           </div>
                        </div>
                      ) : (
                        <button 
                          onClick={startPairing}
                          className="w-full flex items-center justify-center py-2 border border-dashed border-outline-variant hover:border-primary text-on-surface-variant font-black text-[9px] uppercase hover:text-primary transition-all bg-black/20"
                        >
                          [+] ADD SECURITY LAYER
                        </button>
                      )}
                   </div>
                 </div>

                 {/* HARDENING METRICS */}
                 <div>
                   <h4 className="text-[9px] font-black text-on-surface-variant uppercase mb-3 tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full" /> Hardening Metrics
                   </h4>
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                         <span className="text-[10px] text-white font-bold uppercase">Idle Timeout</span>
                         <span className="text-[10px] text-primary font-black uppercase">5m 00s</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                         <span className="text-[10px] text-white font-bold uppercase">Cache Resilience</span>
                         <div className="flex items-center gap-2">
                           {cacheState === 'PERSISTENT' && (
                             <span className="text-[8px] font-black text-error animate-pulse border border-error/50 px-1 bg-error/10">[VULNERABLE]</span>
                           )}
                           <button 
                             onClick={() => setCacheState(prev => prev === 'VOLATILE' ? 'PERSISTENT' : 'VOLATILE')}
                             className={`text-[10px] font-black uppercase border px-2 py-0.5 transition-colors ${cacheState === 'VOLATILE' ? 'text-primary border-primary/30 hover:bg-primary/10' : 'text-error border-error/30 hover:bg-error/10'}`}
                           >
                             {cacheState}
                           </button>
                         </div>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                         <span className="text-[10px] text-white font-bold uppercase">Protocol Version</span>
                         <span className="text-[10px] text-primary font-black uppercase">v4.8-SEC</span>
                      </div>
                   </div>
                 </div>
              </section>
           </div>

           <div className="pt-4 flex justify-end shrink-0 border-t border-outline-variant/30 mt-auto">
              <button 
                onClick={initWipe}
                className="flex items-center gap-2 text-error text-[10px] font-black uppercase hover:bg-error hover:text-white px-4 py-1.5 transition-colors border border-error"
              >
                <ShieldAlert size={12} />
                Emergency Wipe
              </button>
           </div>
        </div>
      </div>
    </Layout>
  );
}
