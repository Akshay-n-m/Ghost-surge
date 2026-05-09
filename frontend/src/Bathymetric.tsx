import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { Map, Layers, Maximize2, Minimize2, ZoomIn, ZoomOut, Compass, Route, ShieldAlert } from 'lucide-react';
import { useTactical } from './TacticalContext';

// A* Implementation
interface Point { x: number; y: number }
interface Node { x: number; y: number; g: number; h: number; f: number; parent: Node | null }

const GRID_SIZE = 50; // 50px per cell

function heuristic(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function formatCoord(deg: number, isLat: boolean) {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const dir = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${degrees}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}" ${dir}`;
}

// Generate some static procedural clouds that we toggle based on bioDensity
const STATIC_CLOUDS = Array.from({length: 25}, () => ({
  x: (Math.random() - 0.5) * 4000,
  y: (Math.random() - 0.5) * 4000,
  r: Math.random() * 300 + 150
}));

// Generate procedural seafloor obstacles (Walls/Islands)
const STATIC_OBSTACLES = [
  { x: -500, y: -800, w: 1000, h: 200 }, // Central Ridge
  { x: 1200, y: -400, w: 300, h: 1200 }, // East Wall
  { x: -1600, y: 600, w: 800, h: 400 },  // Southwest Trench Wall
  { x: 400, y: 1000, w: 200, h: 1000 },  // South Spire
  { x: -1000, y: -1500, w: 400, h: 400 }, // North Block
];

function isBlocked(p: Point) {
  return STATIC_OBSTACLES.some(ob => 
    p.x >= ob.x && p.x <= ob.x + ob.w && 
    p.y >= ob.y && p.y <= ob.y + ob.h
  );
}

export default function Bathymetric(props: NavigationProps) {
  const { isDeobfuscationComplete, isAcousticEmulationActive, pendingDestination, setPendingDestination } = useTactical();
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [destination, setDestination] = useState<Point | null>(null);
  const [bioDensity, setBioDensity] = useState(0);
  const [stealthIndex, setStealthIndex] = useState(0);
  
  // Tactical Calculation States
  const [calcPhase, setCalcPhase] = useState<'idle' | 'warning' | 'calculating'>('idle');
  const [warningMsg, setWarningMsg] = useState('');
  const [alternativePaths, setAlternativePaths] = useState<Point[][]>([]);

  // Live Telemetry States
  const [subPos, setSubPos] = useState<Point>({ x: 0, y: 0 });
  const subPosRef = useRef<Point>({ x: 0, y: 0 });
  const activePathRef = useRef<Point[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/triangulation');
    wsRef.current = socket;
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'classification') {
          setBioDensity(data.bio_density || 0);
          setStealthIndex(data.stealth_index || 0);
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };
    return () => socket.close();
  }, []);

  // Handlers for Pan/Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.001;
    setZoom(z => Math.min(Math.max(0.2, z + zoomDelta), 3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert click to world coordinates and check Tactical Protocols
  const handleMapClick = (e: React.MouseEvent) => {
    if (isDragging) {
       const dx = Math.abs(e.clientX - dragStart.x - pan.x);
       const dy = Math.abs(e.clientY - dragStart.y - pan.y);
       if (dx > 5 || dy > 5) return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const clickX = e.clientX - rect.left - cx;
    const clickY = e.clientY - rect.top - cy;

    const worldX = (clickX - pan.x) / zoom;
    const worldY = (clickY - pan.y) / zoom;
    const target = { x: worldX, y: worldY };

    setPendingDestination(target);

    // Protocol Checks
    if (!isDeobfuscationComplete) {
      setWarningMsg('FORENSIC SCAN REQUIRED');
      setCalcPhase('warning');
      return;
    }
    if (!isAcousticEmulationActive) {
      setWarningMsg('ACOUSTIC EMULATION REQUIRED');
      setCalcPhase('warning');
      return;
    }

    // Pass protocols, begin calculation
    triggerCalculation(target);
  };

  const triggerCalculation = (target: Point) => {
    setCalcPhase('calculating');
    
    // Generate 3 fake dummy paths radiating out to simulate "thinking"
    const startX = subPosRef.current.x;
    const startY = subPosRef.current.y;
    
    const d1 = [{x: startX, y: startY}, {x: startX + 500, y: startY - 200}, target];
    const d2 = [{x: startX, y: startY}, {x: startX - 300, y: startY + 600}, target];
    const d3 = [{x: startX, y: startY}, {x: startX + 800, y: startY + 100}, target];
    
    setAlternativePaths([d1, d2, d3]);

    // After 2 seconds, lock the optimal path and begin move
    setTimeout(() => {
      setCalcPhase('idle');
      setAlternativePaths([]);
      setDestination(target);
    }, 2500);
  };

  // Check if conditions are met while in warning phase (user fixed it in other screen)
  useEffect(() => {
    if (calcPhase === 'warning' && pendingDestination) {
      if (!isDeobfuscationComplete) {
        setWarningMsg('FORENSIC SCAN REQUIRED');
      } else if (!isAcousticEmulationActive) {
        setWarningMsg('ACOUSTIC EMULATION REQUIRED');
      } else {
        // Both conditions met now! Clear warning and calculate.
        setWarningMsg('');
        triggerCalculation(pendingDestination);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeobfuscationComplete, isAcousticEmulationActive, calcPhase, pendingDestination]);


  // Real A* Pathfinding Logic (Calculates from CURRENT sub position)
  const path = useMemo(() => {
    if (!destination) return null;

    const startNode = {
       x: Math.round(subPosRef.current.x / GRID_SIZE) * GRID_SIZE,
       y: Math.round(subPosRef.current.y / GRID_SIZE) * GRID_SIZE
    };
    const goal = { 
       x: Math.round(destination.x / GRID_SIZE) * GRID_SIZE, 
       y: Math.round(destination.y / GRID_SIZE) * GRID_SIZE 
    };
    
    let openSet: Node[] = [{ x: startNode.x, y: startNode.y, g: 0, h: heuristic(startNode, goal), f: 0, parent: null }];
    let closedSet = new Set<string>();
    
    let bestNode = openSet[0];
    let iterations = 0;
    
    const activeClouds = STATIC_CLOUDS.slice(0, Math.floor(bioDensity * STATIC_CLOUDS.length));

    while (openSet.length > 0 && iterations < 2000) {
      iterations++;
      
      openSet.sort((a, b) => a.f - b.f);
      let current = openSet.shift()!;
      
      if (current.x === goal.x && current.y === goal.y) {
         bestNode = current;
         break;
      }
      
      if (heuristic(current, goal) < heuristic(bestNode, goal)) {
          bestNode = current;
      }
      
      closedSet.add(`${current.x},${current.y}`);
      
      const neighbors = [
        { x: current.x + GRID_SIZE, y: current.y },
        { x: current.x - GRID_SIZE, y: current.y },
        { x: current.x, y: current.y + GRID_SIZE },
        { x: current.x, y: current.y - GRID_SIZE },
        { x: current.x + GRID_SIZE, y: current.y + GRID_SIZE },
        { x: current.x - GRID_SIZE, y: current.y - GRID_SIZE },
        { x: current.x + GRID_SIZE, y: current.y - GRID_SIZE },
        { x: current.x - GRID_SIZE, y: current.y + GRID_SIZE },
      ];
      
      for (let n of neighbors) {
         if (closedSet.has(`${n.x},${n.y}`)) continue;
         if (isBlocked(n)) continue; // AVOID TERRAIN WALLS
         
         let cost = 10; // Open water
         
         // Route THROUGH Bio Clouds (lower cost)
         for (let cloud of activeClouds) {
            const dist = Math.hypot(n.x - cloud.x, n.y - cloud.y);
            if (dist < cloud.r) {
               cost = 1; // Stealth cover
               break;
            }
         }
         
         if (n.x !== current.x && n.y !== current.y) cost *= 1.4;

         let tentative_g = current.g + cost;
         
         let existingNode = openSet.find(node => node.x === n.x && node.y === n.y);
         if (!existingNode || tentative_g < existingNode.g) {
            if (!existingNode) {
               existingNode = { x: n.x, y: n.y, g: 0, h: 0, f: 0, parent: null };
               openSet.push(existingNode);
            }
            existingNode.parent = current;
            existingNode.g = tentative_g;
            existingNode.h = heuristic(n, goal);
            existingNode.f = existingNode.g + existingNode.h;
         }
      }
    }
    
    const finalPath = [];
    let curr: Node | null = bestNode;
    while (curr) {
      finalPath.unshift({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    
    if (finalPath.length > 0) {
      finalPath[finalPath.length - 1] = { x: destination.x, y: destination.y };
    }
    
    return finalPath;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, bioDensity]);

  // Synchronize generated path to the animation engine
  useEffect(() => {
    if (path) {
       activePathRef.current = [...path];
    }
  }, [path]);

  // Animation Engine (Moves submarine along activePathRef)
  useEffect(() => {
    let animationId: number;
    const SPEED = 1.5; // Tactical movement speed

    const animate = () => {
      if (activePathRef.current.length > 0) {
        const target = activePathRef.current[0];
        const dx = target.x - subPosRef.current.x;
        const dy = target.y - subPosRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist < SPEED) {
          // Reached waypoint, snap and move to next
          subPosRef.current = { x: target.x, y: target.y };
          activePathRef.current.shift();
        } else {
          // Interpolate position
          subPosRef.current.x += (dx / dist) * SPEED;
          subPosRef.current.y += (dy / dist) * SPEED;
        }
        
        // Trigger render
        setSubPos({ ...subPosRef.current });
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Dynamic Coordinate Calculations based on Sub Position
  const baseLat = 32.7338;
  const baseLon = -117.1697;
  const currentLat = baseLat + (subPos.y * -0.00005);
  const currentLon = baseLon + (subPos.x * 0.00005);
  const formattedLat = formatCoord(currentLat, true);
  const formattedLon = formatCoord(currentLon, false);

  const gridCol = Math.floor(subPos.x / 500) + 5;
  const gridRow = Math.floor(subPos.y / 500) + 5;
  const gridLetter = String.fromCharCode(65 + Math.max(0, Math.min(25, gridCol)));
  const gridRef = `${gridLetter}${Math.max(1, gridRow)}-DELTA`;

  return (
    <Layout {...props} title="NAVIGATOR // TACTICAL_PATHFINDING">
      <div 
        className="flex-1 relative overflow-hidden bg-[#05070a] select-none cursor-crosshair"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
      >
        
        {/* HUD Warnings Overlay */}
        {calcPhase === 'warning' && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
              <div className="bg-error text-white font-black uppercase px-6 py-2 tracking-widest text-[14px] flex items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse">
                <ShieldAlert size={18} />
                AWAITING CLEARANCE: {warningMsg}
              </div>
              <div className="mt-2 text-error/80 text-[10px] font-bold uppercase tracking-tighter bg-surface/90 border border-error/20 px-3 py-1 shadow-lg backdrop-blur-sm">
                Access required modules via Sidebar to satisfy Tactical Protocols
              </div>
           </div>
        )}

        {calcPhase === 'calculating' && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
              <div className="bg-tertiary text-black font-black uppercase px-6 py-2 tracking-widest text-[14px] flex items-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                <Compass size={18} className="animate-spin" />
                CALCULATING ALTERNATIVE VECTORS...
              </div>
           </div>
        )}

        {/* STATIC HUD LAYER */}
        <div className="absolute top-3 left-3 z-20 flex gap-4 pointer-events-none">
           <div className="bg-surface/90 border border-outline-variant p-2.5 flex flex-col gap-0.5 pointer-events-auto min-w-[180px]">
              <span className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                 GRID_REF: {gridRef} [LVL_2]
              </span>
              <span className="text-[12px] text-white font-black uppercase tracking-tight">MARIANA_TRENCH_CANAL_SEC_7A</span>
           </div>
        </div>

        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
           <div className="bg-surface/90 border border-outline-variant flex flex-col items-center">
              {[
                { icon: ZoomIn, onClick: () => setZoom(z => Math.min(z + 0.2, 3)) },
                { icon: ZoomOut, onClick: () => setZoom(z => Math.max(z - 0.2, 0.2)) },
                { icon: Route, onClick: () => setPan({x:0, y:0}) },
                { icon: Layers, onClick: () => {} },
              ].map((btn, i) => (
                <button 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                  className={`w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-variant transition-colors ${i !== 3 ? 'border-b border-outline-variant' : ''}`}
                >
                  <btn.icon size={16} />
                </button>
              ))}
           </div>
           <div className="bg-surface/90 border border-outline-variant w-9 h-9 flex items-center justify-center pointer-events-none">
              <Compass size={18} className="text-tertiary animate-[spin_10s_linear_infinite]" />
           </div>
        </div>

        <div className="absolute bottom-3 left-3 z-20 flex gap-8 font-mono text-[10px] text-on-surface-variant font-black uppercase tracking-tighter bg-surface/90 border border-outline-variant p-2 pointer-events-auto min-w-[340px]">
           <div className="flex flex-col min-w-[80px]">
              <span className="text-[8px] opacity-40">LATITUDE</span>
              <span className="text-white">{formattedLat}</span>
           </div>
           <div className="flex flex-col border-l border-outline-variant pl-3 min-w-[80px]">
              <span className="text-[8px] opacity-40">LONGITUDE</span>
              <span className="text-white">{formattedLon}</span>
           </div>
           <div className="flex flex-col border-l border-outline-variant pl-3">
              <span className="text-[8px] opacity-40">ROUTE RISK</span>
              <span className={`font-black ${stealthIndex > 0.6 ? 'text-primary' : 'text-error'}`}>
                 {stealthIndex > 0.6 ? 'LOW' : 'CRITICAL'} ({((1 - stealthIndex) * 100).toFixed(1)}%)
              </span>
           </div>
        </div>

        <div className="absolute bottom-3 right-3 z-20 w-52 bg-surface/95 border border-outline-variant p-3 shadow-2xl pointer-events-auto">
           <h4 className="text-[9px] font-black text-white uppercase mb-3 tracking-widest border-b border-outline-variant pb-1 flex justify-between">
              Nav Telemetry
              <Layers size={10} className="text-primary" />
           </h4>
           <div className="space-y-3">
              <div className="flex flex-col gap-1">
                 <div className="flex justify-between text-[8px] font-black uppercase">
                    <span className="text-on-surface-variant">Bio-Cover Density</span>
                    <span className="text-white">{(bioDensity * 100).toFixed(1)}%</span>
                 </div>
                 <div className="w-full h-1 bg-surface-container-highest">
                    <div className="h-full bg-primary transition-all duration-500" style={{width: `${bioDensity * 100}%`}} />
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex justify-between text-[8px] font-black uppercase">
                    <span className="text-on-surface-variant">Acoustic Stealth</span>
                    <span className={stealthIndex > 0.6 ? 'text-primary' : 'text-error'}>{(stealthIndex * 100).toFixed(1)}%</span>
                 </div>
                 <div className="w-full h-1 bg-surface-container-highest">
                    <div className={`h-full transition-all duration-500 ${stealthIndex > 0.6 ? 'bg-primary' : 'bg-error'}`} style={{width: `${stealthIndex * 100}%`}} />
                 </div>
              </div>
              <div className="flex gap-2.5 items-center pt-2 border-t border-outline-variant/30">
                 <div className="w-2.5 h-2.5 border border-dashed border-primary rounded-full" />
                 <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-white uppercase leading-none truncate">Path of Least Detection</p>
                    <p className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter">ETA: 14:22:00z</p>
                 </div>
              </div>
           </div>
        </div>


        {/* TRANSFORM LAYER */}
        <div 
          className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none transition-transform duration-75"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
            <div className="absolute inset-[-4000px] w-[8000px] h-[8000px] pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#4ade80_1px,transparent_1px),linear-gradient(to_bottom,#4ade80_1px,transparent_1px)]" style={{ backgroundSize: '100px 100px' }} />
            
            {/* Seafloor Obstacles (Terrain Walls) */}
            {STATIC_OBSTACLES.map((ob, i) => (
              <div 
                key={`ob-${i}`}
                className="absolute bg-surface-container-lowest border-2 border-outline-variant shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                style={{
                  left: ob.x,
                  top: ob.y,
                  width: ob.w,
                  height: ob.h,
                }}
              >
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#4ade80_5px,#4ade80_6px)]" />
                <span className="absolute top-1 left-1 text-[8px] text-on-surface-variant font-black opacity-40 uppercase tracking-tighter">TERRAIN_SEG_{i}</span>
              </div>
            ))}

            {/* Dynamic Bio-Clouds */}
            {STATIC_CLOUDS.slice(0, Math.floor(bioDensity * STATIC_CLOUDS.length)).map((cloud, i) => (
              <div 
                key={i}
                className="absolute rounded-full blur-3xl transition-all duration-1000 mix-blend-screen bg-primary"
                style={{
                  left: cloud.x - cloud.r,
                  top: cloud.y - cloud.r,
                  width: cloud.r * 2,
                  height: cloud.r * 2,
                  opacity: 0.1 + (bioDensity * 0.2),
                }}
              />
            ))}

            {/* Path SVGs */}
            <svg className="absolute overflow-visible pointer-events-none w-[8000px] h-[8000px] left-[-4000px] top-[-4000px]" viewBox="-4000 -4000 8000 8000">
               
               {/* Phase 1: Alternative Faint Dummy Paths */}
               {calcPhase === 'calculating' && alternativePaths.map((altPath, i) => (
                 <path 
                    key={i}
                    d={`M ${altPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    className="stroke-on-surface-variant fill-none stroke-[2px] opacity-40 animate-pulse"
                    vectorEffect="non-scaling-stroke"
                 />
               ))}

               {/* Phase 2: Active Solid Path */}
               {calcPhase !== 'calculating' && activePathRef.current.length > 0 && (
                 <path 
                    d={`M ${subPos.x},${subPos.y} ${activePathRef.current.map(p => `L ${p.x},${p.y}`).join(' ')}`}
                    className="stroke-primary fill-none stroke-[3px] stroke-dasharray-[10,10] animate-[dash_2s_linear_infinite]"
                    vectorEffect="non-scaling-stroke"
                 />
               )}
            </svg>

            {/* Destination Pin (Pending or Actual) */}
            {pendingDestination && (
               <div 
                 className={`absolute w-3 h-3 rounded-full pointer-events-none ${calcPhase === 'warning' ? 'bg-error shadow-[0_0_12px_rgba(239,68,68,1)]' : 'bg-tertiary shadow-[0_0_12px_rgba(234,179,8,1)]'}`}
                 style={{ left: pendingDestination.x - 6, top: pendingDestination.y - 6 }}
               >
                  <div className={`absolute inset-[-10px] border rounded-full animate-ping opacity-50 ${calcPhase === 'warning' ? 'border-error' : 'border-tertiary'}`} />
               </div>
            )}

            {/* RADAR RINGS (Follows Submarine) */}
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`absolute rounded-full border border-primary/10 -translate-x-1/2 -translate-y-1/2 ${i % 2 === 0 ? 'border-dashed' : ''}`}
                style={{ 
                  left: subPos.x, 
                  top: subPos.y,
                  width: `${i * 300}px`, 
                  height: `${i * 300}px` 
                }}
              />
            ))}

            {/* RADAR SWEEP (Follows Submarine) */}
            <div 
               className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
               style={{
                  left: subPos.x,
                  top: subPos.y,
                  width: '1500px',
                  height: '1500px',
               }}
            >
               <div 
                  className="w-full h-full rounded-full origin-center animate-[sweep_4s_linear_infinite]"
                  style={{
                     background: 'conic-gradient(from 0deg, transparent 70%, rgba(74,222,128,0.15) 95%, rgba(74,222,128,0.6) 100%)',
                     clipPath: 'circle(50%)'
                  }}
               />
            </div>

            {/* Vessel Indicator (Follows Submarine) */}
            <div className="absolute w-4 h-4 text-primary pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75" 
                 style={{ left: subPos.x, top: subPos.y }}>
               <div className="w-full h-full bg-primary rotate-45 border-[3px] border-white shadow-[0_0_16px_rgba(74,222,128,1)]" />
               <div className="absolute top-[-40px] left-[-45px] whitespace-nowrap bg-surface border border-primary p-1.5 flex flex-col shadow-xl">
                  <span className="text-[10px] font-black uppercase text-white leading-none">CV-01 // GHOST</span>
                  <span className="text-[8px] text-primary font-bold">DEPTH: 1,402m</span>
               </div>
            </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .stroke-dasharray-\\[10\\,10\\] {
          stroke-dasharray: 10, 10;
        }
      `}} />
    </Layout>
  );
}
