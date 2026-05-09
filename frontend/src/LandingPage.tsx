import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { NavigationProps } from './types';
import { Globe } from 'lucide-react';
import * as THREE from 'three';
import SplineLoader from '@splinetool/loader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function LandingPage({ onNavigate }: NavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Typewriter state
  const FULL_TEXT_LINE1 = 'The Architecture Of';
  const FULL_TEXT_LINE2 = 'Invisibility';
  const FULL_TEXT = FULL_TEXT_LINE1 + '\n' + FULL_TEXT_LINE2;
  const [typedText, setTypedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      if (i < FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, i + 1));
        i++;
        // Uneven timing: longer pauses at spaces and newlines
        const ch = FULL_TEXT[i - 1];
        const delay = ch === ' ' ? Math.random() * 80 + 60
          : ch === '\n' ? Math.random() * 300 + 200
          : Math.random() * 70 + 30;
        setTimeout(type, delay);
      } else {
        setIsDone(true);
      }
    };
    const startDelay = setTimeout(type, 600);
    return () => { cancelled = true; clearTimeout(startDelay); };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -100000, 100000);
    camera.position.set(0, 0, 2291.96);
    camera.zoom = 3.2;
    camera.updateProjectionMatrix();

    const scene = new THREE.Scene();
    const splineGroup = new THREE.Group();
    scene.add(splineGroup);

    const loader = new SplineLoader();
    loader.load(
      'https://prod.spline.design/1yIwJ0bXXXZAAeeD/scene.splinecode',
      (splineScene) => {
        const box = new THREE.Box3().setFromObject(splineScene);
        const center = box.getCenter(new THREE.Vector3());
        splineScene.position.x -= center.x;
        splineScene.position.y -= center.y;
        splineScene.position.z -= center.z;
        splineGroup.add(splineScene);
      }
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.125;
    controls.enableZoom = false;
    controls.target.set(0, 0, 0);

    const onWindowResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.left = w / - 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = h / - 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onWindowResize);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (splineGroup) {
        splineGroup.rotation.y += 0.002;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div id="landing-page" className="relative min-h-screen bg-background flex flex-col overflow-hidden font-mono">
      <div className="crt-overlay" />
      <div className="noise-overlay" />
      
      {/* SURGICAL MINT FILTER */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <filter id="mint-surge-filter" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            0 0 0 0 0.28
            0 0 0 0 0.83
            0 0 0 0 0.48
            0 0 0 1.0 0" 
          />
        </filter>
      </svg>
      
      <nav className="fixed top-0 w-full z-40 border-b border-outline-variant bg-background/80 backdrop-blur-sm px-4 py-3 flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-primary shadow-[0_0_8px_rgba(74,222,128,1)]" />
          <span className="text-sm font-black tracking-tighter text-white">GHOST-SURGE<span className="text-primary ml-1 font-light">SYSTEMS</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden sm:flex items-center gap-2 text-primary text-[9px]">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            STEALTH_INITIATED
          </div>
        </div>
      </nav>

      <header className="relative flex-1 flex flex-col lg:flex-row items-center justify-center px-6 md:px-16 lg:px-24 pt-20 overflow-hidden gap-8 lg:gap-0">
        <div className="absolute inset-0 bg-hero-bg bg-cover bg-center grayscale opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        <div className="relative z-20 lg:w-1/2 mt-4 lg:mt-0 order-1 flex-shrink-0">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-2 mb-6 text-[10px] tracking-widest text-primary font-black uppercase">
              <span className="bg-primary/20 p-1">Protocol Type: NTI_B9</span>
              <span>Acoustic Masking Array</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-6 text-white">
              {(() => {
                const line1 = FULL_TEXT_LINE1;
                const line2 = FULL_TEXT_LINE2;
                const typed1 = typedText.slice(0, line1.length);
                const typed2 = typedText.length > line1.length + 1
                  ? typedText.slice(line1.length + 1)
                  : '';
                const cursorEl = (
                  <span
                    className="inline-block w-[3px] h-[0.85em] bg-primary align-middle ml-1"
                    style={{ animation: isDone ? 'blink-cursor 1s step-end infinite' : 'none', opacity: 1 }}
                  />
                );
                return (
                  <>
                    <span>{typed1}</span>
                    {typedText.length >= line1.length && <br />}
                    <span className="text-primary">{typed2}{!isDone || true ? cursorEl : cursorEl}</span>
                  </>
                );
              })()}
            </h1>
            <p className="max-w-md text-xs text-on-surface-variant font-bold leading-relaxed mb-8 border-l border-primary pl-4">
              Eliminate your acoustic footprint with next-generation bio-mimetic sonar refraction. 
              GHOST-SURGE NTI allows for seamless integration into ambient deep-sea spectral noise.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => onNavigate('command-hud', 'push')} className="inline-flex justify-center items-center px-10 py-4 bg-primary text-black font-black uppercase tracking-widest hover:bg-white transition-all text-xs group">
                Log In
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="ml-2">→</motion.span>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="lg:w-1/2 w-full h-[420px] lg:h-[650px] relative flex items-center justify-center order-2 flex-shrink-0">
           {/* Apply the surgical filter to the canvas container */}
           <div 
             ref={containerRef} 
             className="w-full h-full cursor-grab active:cursor-grabbing" 
             style={{ filter: 'url(#mint-surge-filter) brightness(1.4) drop-shadow(0 0 10px rgba(72, 213, 124, 0.3))' }} 
           />
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-[320px] h-[320px] border border-primary/20 rounded-full animate-pulse flex items-center justify-center">
                 <div className="w-[240px] h-[240px] border border-primary/10 rounded-full animate-[spin_10s_linear_infinite] border-dashed" />
              </div>
           </div>
        </div>
      </header>

      <footer className="border-t border-outline-variant px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-on-surface-variant uppercase font-black tracking-widest bg-surface/30 z-30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          <span>EST. 2045 GHOST-SURGE SYSTEMS</span>
        </div>
        <div className="flex gap-8">
          <span className="text-white">STATUS: NOMINAL</span>
          <span className="text-primary">CORE_ACTIVE: 100%</span>
          <a href="#" className="hover:text-primary">Docs</a>
          <a href="#" className="hover:text-primary">Security</a>
        </div>
      </footer>
    </div>
  );
}
