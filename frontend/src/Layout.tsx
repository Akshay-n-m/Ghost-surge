import React from 'react';
import { ScreenId, NavigationProps } from './types';
import { 
  User, 
  Radar, 
  Waves, 
  Settings2, 
  Search, 
  Settings, 
  Activity,
  History,
  Lock,
  LogOut,
  Palette,
  Terminal,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTactical } from './TacticalContext';
import { useState, useEffect } from 'react';

interface LayoutProps extends NavigationProps {
  children: React.ReactNode;
  activeTab?: string;
  title?: string;
}

export default function Layout({ children, currentScreen, onNavigate, activeTab, title }: LayoutProps) {
  const navItems = [
    { id: 'command-hud', label: 'Tactical_HUD', icon: Radar },
    { id: 'sigint', label: 'SIGINT_Array', icon: Waves },
    { id: 'bathymetric', label: 'Bathy_Nav', icon: Cpu },
    { id: 'forensic-analysis', label: 'Forensic_De-Ob', icon: Search },
    { id: 'anomaly-log', label: 'Anomaly_Log', icon: History },
  ];

  const { operatorName, operatorImage, theme, crtEnabled, noiseEnabled, isRebooting } = useTactical();
  const [time, setTime] = useState(new Date());
  const [latency, setLatency] = useState(14);

  useEffect(() => {
    const timeInterval = setInterval(() => setTime(new Date()), 1000);
    
    const pingInterval = setInterval(async () => {
      const start = Date.now();
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-store' });
        setLatency(Date.now() - start);
      } catch (e) {
        setLatency(Date.now() - start);
      }
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(pingInterval);
    };
  }, []);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${theme} text-on-background font-mono select-none relative`}>
      
      {crtEnabled && <div className="crt-overlay pointer-events-none" />}
      {noiseEnabled && <div className="noise-overlay pointer-events-none" />}

      {/* TOP STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-1 bg-surface-container border-b border-outline-variant text-[10px] tracking-widest z-30 shrink-0">
        <div className="flex items-center space-x-6">
          <span className="text-primary flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            GHOST-SURGE // CONNECTED
          </span>
          <span className="hidden sm:inline">PROTOCOL: v4.82.0-SEC</span>
          <span className="hidden md:inline uppercase">LATENCY: {latency}ms</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden lg:inline text-on-surface-variant">TERM_ID: 10354696234</span>
          <span className="text-tertiary">SEC_LVL: 5 (RESTRICTED)</span>
          <span className="opacity-70 font-black tracking-widest">
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-16 md:w-52 shrink-0 bg-surface border-r border-outline-variant flex flex-col py-3 gap-1 z-20">
          <div className="px-3 mb-4 hidden md:block">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden">
                {operatorImage ? (
                  <img src={operatorImage} alt="Operator" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-on-surface" />
                )}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-[10px] font-black text-white truncate uppercase">{operatorName}</h2>
                <p className="text-[8px] text-on-surface-variant uppercase truncate tracking-tighter">ID: 0x1035469</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ScreenId, item.id === 'command-hud' ? 'push_back' : 'push')}
                  className={`
                    px-4 py-1.5 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-tight transition-all duration-150 text-left
                    ${isActive 
                      ? 'bg-surface-container-highest text-primary border-r-2 border-primary' 
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-white'}
                  `}
                >
                  <item.icon size={14} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto px-3 pt-3 border-t border-outline-variant hidden md:block">
            <p className="text-[8px] uppercase font-black text-primary/60 mb-2">SYSTEM_CFG</p>
            <div className="space-y-0.5">
              {[
                { id: 'settings-account', label: 'Acc_Uplink' },
                { id: 'settings-security', label: 'Sec_Protocol' },
                { id: 'settings-appearance', label: 'Vis_Aesthetic' }
              ].map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => onNavigate(sub.id as ScreenId, 'slide_up')}
                  className="w-full flex items-center justify-between py-1 text-[9px] font-black text-left text-on-surface-variant hover:text-white transition-colors"
                >
                  <span>{sub.label}</span>
                  <ChevronRight size={8} className="opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-10 bg-surface border-b border-outline-variant flex justify-between items-center px-3 shrink-0 z-10">
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-black text-white tracking-tighter uppercase leading-none">
                {title?.split(' // ')[0] || 'COMMAND_HUD'}
                <span className="text-primary ml-2 font-light text-[10px] hidden sm:inline">Tactical_OS</span>
              </h1>
              <p className="text-[8px] text-on-surface-variant uppercase tracking-tighter font-black">B-9 // D: 1,402m // T: 4°C</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 mr-4">
                <div className="bg-surface-container-high border border-outline-variant px-2 py-0.5 text-[9px] text-white">
                  CPU: 14%
                </div>
                <div className="bg-surface-container-high border border-outline-variant px-2 py-0.5 text-[9px] text-primary">
                  SIG: 98%
                </div>
              </div>

              <button 
                onClick={() => onNavigate('sensors', 'none')}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors relative border border-outline-variant"
              >
                <Activity size={14} />
                <span className="absolute top-0 right-0 w-1 h-1 bg-primary rounded-full animate-pulse" />
              </button>
            </div>
          </header>

          <div className={`flex-1 overflow-hidden relative ${theme === 'bg-background' ? 'bg-background' : 'bg-black/20'} p-3 flex flex-col`}>
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen bg-[linear-gradient(to_right,#4ade80_1px,transparent_1px),linear-gradient(to_bottom,#4ade80_1px,transparent_1px)] bg-[length:24px_24px]" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
