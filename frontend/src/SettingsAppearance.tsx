import React, { useState } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Palette, ScreenShare, Cpu, Layout as LayoutIcon, ChevronRight } from 'lucide-react';
import { useTactical } from './TacticalContext';

export default function SettingsAppearance(props: NavigationProps) {
  const tactical = useTactical();

  // Local state to hold temporary selections before hitting "Apply"
  const [localTheme, setLocalTheme] = useState(tactical.theme);
  const [localCrt, setLocalCrt] = useState(tactical.crtEnabled);
  const [localNoise, setLocalNoise] = useState(tactical.noiseEnabled);
  
  // These are just visual toggles that don't do anything yet, but make the UI look full
  const [localAberration, setLocalAberration] = useState(false);
  const [localGlow, setLocalGlow] = useState('NOMINAL');

  const themes = [
    { label: 'Deep Abyss', color: 'bg-background' },
    { label: 'NTI Green', color: 'bg-[#06201b]' },
    { label: 'Tactical', color: 'bg-[#121418]' },
    { label: 'Exposure', color: 'bg-[#2a2d35]' },
  ];

  const handleApply = () => {
    tactical.setTheme(localTheme);
    tactical.setCrtEnabled(localCrt);
    tactical.setNoiseEnabled(localNoise);
  };

  const handleDiscard = () => {
    setLocalTheme(tactical.theme);
    setLocalCrt(tactical.crtEnabled);
    setLocalNoise(tactical.noiseEnabled);
  };

  return (
    <Layout {...props} title="SETTINGS // APPEARANCE">
      <div className="flex-1 flex gap-3 max-w-6xl mx-auto w-full">
        <div className="w-1/4 bg-surface border border-outline-variant flex flex-col pt-3">
          <div className="px-3 mb-4">
            <h2 className="text-[11px] font-black text-white uppercase mb-1">Configuration</h2>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-tighter">Interface_Customization</p>
          </div>
          
          <div className="flex flex-col flex-1">
            <button className="flex items-center justify-between px-3 py-2 bg-surface-container-highest border-r-2 border-primary text-primary transition-all">
               <div className="flex items-center gap-2">
                 <Palette size={14} />
                 <span className="text-[11px] font-black uppercase">Aesthetic</span>
               </div>
            </button>
            <button 
              onClick={() => props.onNavigate('settings-security', 'none')}
              className="flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all"
            >
               <div className="flex items-center gap-2">
                 <Cpu size={14} />
                 <span className="text-[11px] font-black uppercase">Security</span>
               </div>
            </button>
            <button 
              onClick={() => props.onNavigate('settings-account', 'none')}
              className="flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all"
            >
               <div className="flex items-center gap-2">
                 <ScreenShare size={14} />
                 <span className="text-[11px] font-black uppercase">Account</span>
               </div>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-surface border border-outline-variant p-6 relative overflow-hidden flex flex-col">
           <h3 className="text-lg font-black text-white uppercase mb-6 border-b border-outline-variant pb-2 flex items-center justify-between">
              Visual Aesthetic
              <span className="text-[9px] text-primary font-light">UID: 0x8232</span>
           </h3>

           <div className="space-y-6 relative z-10 flex-1 overflow-auto pr-2 scrollbar-hide">
             {/* SURFACE PALETTE */}
             <section>
               <h4 className="text-[9px] font-black text-on-surface-variant uppercase mb-3 tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Surface Palette
               </h4>
               <div className="grid grid-cols-4 gap-3">
                 {themes.map(theme => {
                   const isActive = localTheme === theme.color;
                   return (
                     <div 
                       key={theme.label} 
                       onClick={() => setLocalTheme(theme.color)}
                       className="flex flex-col gap-1.5 group cursor-pointer"
                     >
                       <div className={`h-12 w-full ${theme.color === 'bg-background' ? 'bg-black' : theme.color} border transition-all flex items-end p-0.5 ${isActive ? 'border-primary shadow-[0_0_12px_rgba(74,222,128,0.3)]' : 'border-outline-variant group-hover:border-primary/50'}`}>
                          <div className={`w-1.5 h-1.5 bg-primary transition-opacity ${isActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                       </div>
                       <span className={`text-[8px] font-black uppercase text-center transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-white'}`}>
                         {theme.label}
                       </span>
                     </div>
                   );
                 })}
               </div>
             </section>

             {/* RENDER OVERLAYS */}
             <section>
               <h4 className="text-[9px] font-black text-on-surface-variant uppercase mb-3 tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-tertiary rounded-full" /> Render Overlays
               </h4>
               <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5">
                    <span className="text-[11px] text-white font-black uppercase">CRT_SCANLINES</span>
                    <button 
                      onClick={() => setLocalCrt(!localCrt)}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border ${localCrt ? 'text-primary border-primary/30' : 'text-on-surface-variant border-outline-variant/30 hover:text-white'}`}
                    >
                      {localCrt ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5">
                    <span className="text-[11px] text-white font-black uppercase">ATMOS_NOISE</span>
                    <button 
                      onClick={() => setLocalNoise(!localNoise)}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border ${localNoise ? 'text-primary border-primary/30' : 'text-on-surface-variant border-outline-variant/30 hover:text-white'}`}
                    >
                      {localNoise ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5">
                    <span className="text-[11px] text-white font-black uppercase">CHROM_ABERRATION</span>
                    <button 
                      onClick={() => setLocalAberration(!localAberration)}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border ${localAberration ? 'text-primary border-primary/30' : 'text-on-surface-variant border-outline-variant/30 hover:text-white'}`}
                    >
                      {localAberration ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5">
                    <span className="text-[11px] text-white font-black uppercase">HUD_GLOW_ENGINE</span>
                    <button 
                      onClick={() => setLocalGlow(prev => prev === 'NOMINAL' ? 'OVERRIDE' : 'NOMINAL')}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border text-primary border-primary/30`}
                    >
                      {localGlow}
                    </button>
                  </div>
               </div>
             </section>
           </div>

           <div className="pt-4 flex justify-end gap-3 shrink-0">
             <button 
               onClick={handleDiscard}
               className="px-4 py-1.5 border border-outline-variant text-on-surface-variant text-[10px] font-black uppercase hover:bg-surface-container-high hover:text-white transition-colors"
             >
               Discard
             </button>
             <button 
               onClick={handleApply}
               className="px-8 py-1.5 bg-primary text-black text-[10px] font-black uppercase hover:bg-white transition-all shadow-[0_0_12px_rgba(74,222,128,0.2)]"
             >
               Apply protocol
             </button>
           </div>
        </div>
      </div>
    </Layout>
  );
}
