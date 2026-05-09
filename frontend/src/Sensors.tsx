import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Cpu, Thermometer, Zap, Activity, Waves, Network } from 'lucide-react';

export default function Sensors(props: NavigationProps) {
  // Simulation States
  const [cpuTemp, setCpuTemp] = useState(42.8);
  const [pwrOut, setPwrOut] = useState(1.24);
  const [neuralL, setNeuralL] = useState(28.1);
  const [stability, setStability] = useState(99.9);
  const [matrixData, setMatrixData] = useState(() => 
    Array.from({ length: 192 }).map(() => ({
      val: Math.floor(Math.random() * 99),
      active: Math.random() > 0.85
    }))
  );
  const [subSystemLoads, setSubSystemLoads] = useState([12, 45, 100, 8, 2, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate stats
      setCpuTemp(prev => Math.max(38, Math.min(55, prev + (Math.random() - 0.5) * 2)));
      setPwrOut(prev => Math.max(1.1, Math.min(1.4, prev + (Math.random() - 0.5) * 0.05)));
      setNeuralL(prev => Math.max(20, Math.min(45, prev + (Math.random() - 0.5) * 3)));
      setStability(prev => Math.max(98, Math.min(100, prev + (Math.random() - 0.5) * 0.2)));
      
      // Update a random subset of matrix nodes
      setMatrixData(prev => prev.map(node => {
        if (Math.random() > 0.9) {
          return {
            val: Math.floor(Math.random() * 99),
            active: Math.random() > 0.85
          };
        }
        return node;
      }));

      // Fluctuate sub-system loads
      setSubSystemLoads(prev => prev.map(load => {
        if (load === 100) return 100; // STEALTH.S5 stays at 100
        return Math.max(0, Math.min(99, load + Math.floor((Math.random() - 0.5) * 5)));
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'TEMP_CPU', value: `${cpuTemp.toFixed(1)}°C`, icon: Thermometer, color: 'text-primary', progress: (cpuTemp - 30) * 3 },
    { label: 'PWR_OUT', value: `${pwrOut.toFixed(2)} GW`, icon: Zap, color: 'text-tertiary', progress: (pwrOut - 1) * 200 },
    { label: 'NEURAL_L', value: `${neuralL.toFixed(1)}%`, icon: Activity, color: 'text-primary', progress: neuralL },
    { label: 'STABILITY', value: `${stability.toFixed(1)}%`, icon: Network, color: 'text-white', progress: (stability - 95) * 20 },
  ];

  const subSystems = [
    { name: 'PUMP.01', status: 'NOMINAL' },
    { name: 'ACTUATOR.H', status: 'ACTIVE' },
    { name: 'STEALTH.S5', status: 'ENGAGED' },
    { name: 'DAMPENER.C', status: 'NOMINAL' },
    { name: 'GIMBAL.RX', status: 'STBY' },
    { name: 'RESERVE.LV', status: 'STBY' },
  ];

  return (
    <Layout {...props} title="HARDWARE // SENSOR_ARRAY">
      <div className="flex-1 flex flex-col gap-3 overflow-hidden font-mono">
        <div className="grid grid-cols-4 gap-3 shrink-0">
           {stats.map((stat, i) => (
             <div key={i} className="bg-surface border border-outline-variant p-2.5 flex flex-col gap-1 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-40 transition-opacity">
                   <stat.icon size={24} className={stat.color} />
                </div>
                <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
                <span className={`text-xl font-black tracking-tighter ${stat.color} leading-none`}>{stat.value}</span>
                <div className="h-0.5 w-full bg-surface-container-highest mt-1.5 overflow-hidden">
                   <div className={`h-full ${stat.color.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: `${stat.progress}%` }} />
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
           <div className="col-span-8 bg-surface border border-outline-variant p-3 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                   <Waves size={14} className="text-primary" />
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">KRONECKER_DISTRIBUTION_MATRIX</h3>
                </div>
                <span className="text-[8px] font-black text-on-surface-variant uppercase">REF: SIGMA_ST_0.4</span>
              </div>
              
              <div className="flex-1 grid grid-cols-16 grid-rows-12 gap-0.5 p-1 bg-black/40 border border-outline-variant/30 relative">
                 {matrixData.map((node, i) => (
                    <div 
                      key={i} 
                      className={`
                        border border-outline-variant/10 flex items-center justify-center text-[7px] font-black transition-all duration-300
                        ${node.active ? 'bg-primary text-black border-primary' : 'text-on-surface-variant/20'}
                      `}
                    >
                      {node.val}
                    </div>
                 ))}
                 {/* Crosshair Overlay */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-1/2 h-px bg-primary/30" />
                    <div className="h-1/2 w-px bg-primary/30" />
                 </div>
              </div>
           </div>

           <div className="col-span-4 flex flex-col gap-3 overflow-hidden">
              <div className="bg-surface border border-outline-variant p-3 flex-1 flex flex-col group transition-all hover:border-primary overflow-hidden">
                 <h3 className="text-[9px] font-black text-on-surface-variant uppercase border-b border-outline-variant pb-1.5 mb-3 flex justify-between items-center">
                    Sub-Systems
                    <span className="text-primary animate-pulse text-[8px]">Scan_Seq_A...</span>
                 </h3>
                 <div className="space-y-2.5 flex-1 overflow-auto pr-1 scrollbar-hide">
                    {subSystems.map((node, i) => (
                      <div key={node.name} className="flex justify-between items-end border-b border-outline-variant/10 pb-1">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-white font-black uppercase leading-tight">{node.name}</span>
                            <span className="text-[8px] text-on-surface-variant font-black">{node.status}</span>
                         </div>
                         <span className="text-[12px] font-black text-primary transition-all duration-1000">{subSystemLoads[i]}%</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-surface border border-outline-variant p-3 h-32 relative flex flex-col overflow-hidden shrink-0">
                 <h3 className="text-[9px] font-black text-on-surface-variant uppercase border-b border-outline-variant pb-1 mb-1">Topology_Preview</h3>
                 <div className="flex-1 flex items-center justify-center opacity-20">
                    <Cpu size={50} className="text-tertiary animate-pulse" />
                 </div>
                 <div className="absolute bottom-1 right-2 text-[8px] font-black text-on-surface-variant uppercase">ID: 0x10354...6140</div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
