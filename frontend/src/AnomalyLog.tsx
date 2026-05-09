import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { NavigationProps } from './types';
import { History } from 'lucide-react';

interface LogEntry {
  id: string;
  type: string;
  time: string;
  msg: string;
  source: string;
  severity: 'INFO' | 'WARN' | 'HIGH' | 'CRITICAL';
  isNew?: boolean;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 'init_1', type: 'SYSTEM', time: new Date().toISOString().substring(11,19), msg: 'ANOMALY LOG INITIALIZED. LISTENING FOR TELEMETRY...', source: 'SYS_DB', severity: 'INFO' },
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getCurrentTime() {
  return new Date().toISOString().substring(11,19) + 'z';
}

export default function AnomalyLog(props: NavigationProps) {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [filter, setFilter] = useState<string>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const lastTelemetryRef = useRef<{ bioDensity: number; stealthIndex: number; lastCritTime: number; lastBioTime: number }>({ 
    bioDensity: 0, 
    stealthIndex: 1,
    lastCritTime: 0,
    lastBioTime: 0
  });

  const addLog = (type: string, msg: string, source: string, severity: LogEntry['severity']) => {
    setLogs(prev => [...prev, { id: generateId(), type, time: getCurrentTime(), msg, source, severity, isNew: true }]);
  };

  useEffect(() => {
    // Scroll to bottom whenever logs change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/triangulation');
    wsRef.current = socket;
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'classification') {
          const now = Date.now();
          const { bio_density = 0, stealth_index = 1 } = data;
          const last = lastTelemetryRef.current;

          // Detect Stealth Compromise (drop below 40%, limit to 1 log per 5 seconds)
          if (stealth_index < 0.40 && (now - last.lastCritTime > 5000)) {
            addLog('SECURITY', `CAVITATION SIGNATURE DETECTED - STEALTH COMPROMISED (${(stealth_index * 100).toFixed(1)}%)`, 'KRNL_SEC', 'CRITICAL');
            last.lastCritTime = now;
          }

          // Detect Massive Biomass Spike (jump of >15% instantly)
          if ((bio_density - last.bioDensity) > 0.15 && (now - last.lastBioTime > 4000)) {
            addLog('ALERT', `HEURISTIC DETECTED: MASSIVE ACOUSTIC BIOMASS SPIKE`, 'SONAR_A', 'HIGH');
            last.lastBioTime = now;
          }

          last.bioDensity = bio_density;
          last.stealthIndex = stealth_index;
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };

    // Heartbeat ping every 12 seconds
    const heartbeat = setInterval(() => {
      addLog('SYSTEM', 'DATA SYNC WITH GHOST-RELAY-9 SECURE', 'COMM_LNK', 'INFO');
    }, 12000);

    return () => {
      socket.close();
      clearInterval(heartbeat);
    };
  }, []);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = e.currentTarget.value.trim().toLowerCase();
      e.currentTarget.value = '';

      if (!cmd) return;

      // Echo command
      addLog('INPUT', `> ${cmd.toUpperCase()}`, 'USER_TERM', 'INFO');

      setTimeout(() => {
        switch (cmd) {
          case 'clear':
            setLogs([]);
            break;
          case 'ping':
            addLog('SYSTEM', 'PONG - LATENCY: 14ms', 'SYS_DB', 'INFO');
            break;
          case 'filter:critical':
            setFilter('critical');
            addLog('SYSTEM', 'FILTER APPLIED: SHOWING CRITICAL & HIGH ALERTS ONLY', 'SYS_DB', 'WARN');
            break;
          case 'filter:clear':
            setFilter('all');
            addLog('SYSTEM', 'FILTERS CLEARED', 'SYS_DB', 'INFO');
            break;
          case 'override':
            addLog('SECURITY', 'UNAUTHORIZED OVERRIDE ATTEMPTED - LOGGING IP', 'KRNL_SEC', 'CRITICAL');
            break;
          default:
            addLog('ERROR', `COMMAND NOT RECOGNIZED: ${cmd}`, 'SYS_DB', 'WARN');
        }
      }, 300);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'critical') return log.severity === 'CRITICAL' || log.severity === 'HIGH';
    return true;
  });

  return (
    <Layout {...props} title="TACTICAL // ANOMALY_LOG">
      <div className="flex-1 flex flex-col bg-surface border border-outline-variant overflow-hidden rounded">
        <header className="flex justify-between items-center px-3 py-2 bg-surface-container-high border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <History size={14} className="text-on-surface-variant" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              TACTICAL_LOG
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            </span>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setFilter('all')} className={`text-[9px] font-black border px-2 py-0.5 uppercase transition-all ${filter === 'all' ? 'border-primary text-black bg-primary' : 'border-primary/30 text-primary hover:bg-primary/10'}`}>All</button>
             <button onClick={() => setFilter('critical')} className={`text-[9px] font-black border px-2 py-0.5 uppercase transition-all ${filter === 'critical' ? 'border-error text-black bg-error' : 'border-error/30 text-error hover:bg-error/10'}`}>Critical</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto font-mono text-[11px] scanlines p-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface z-10 shadow-md">
              <tr className="bg-surface-container text-[9px] text-on-surface-variant font-black uppercase tracking-tighter border-b border-outline-variant">
                <th className="px-3 py-1.5 w-24">Time</th>
                <th className="px-3 py-1.5 w-20">Type</th>
                <th className="px-3 py-1.5">Message</th>
                <th className="px-3 py-1.5 w-24">Node</th>
                <th className="px-3 py-1.5 w-20 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isCritical = log.severity === 'CRITICAL' || log.severity === 'HIGH';
                const severityColor = 
                  log.severity === 'CRITICAL' ? 'text-error' :
                  log.severity === 'HIGH' ? 'text-tertiary' :
                  log.severity === 'WARN' ? 'text-warning' : 'text-primary';

                return (
                  <tr key={log.id} className={`border-b border-outline-variant/10 hover:bg-surface-container transition-colors group ${log.isNew && isCritical ? 'animate-decode' : ''}`}>
                    <td className="px-3 py-1.5 text-on-surface-variant font-bold opacity-70 group-hover:opacity-100 italic">{log.time}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1 py-0.5 border ${isCritical ? 'border-error/40 text-error' : 'border-outline-variant/40 text-on-surface-variant'} text-[8px] font-black uppercase tracking-tighter`}>
                        {log.type}
                      </span>
                    </td>
                    <td className={`px-3 py-1.5 ${isCritical ? 'text-white font-black' : 'text-on-surface'} truncate max-w-0`}>
                      {log.msg}
                    </td>
                    <td className="px-3 py-1.5 text-on-surface-variant uppercase text-[10px] font-bold">[{log.source}]</td>
                    <td className={`px-3 py-1.5 font-black text-[9px] uppercase text-right ${severityColor}`}>
                      {log.severity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div ref={bottomRef} className="h-4" />
        </div>

        <div className="bg-surface-container border-t border-outline-variant p-2 shrink-0">
           <div className="flex items-center gap-2 px-2 bg-black/40 border border-outline-variant rounded focus-within:border-primary/50 transition-colors">
              <span className="text-primary font-black text-[10px]">&gt;</span>
              <input 
                type="text" 
                placeholder="execute command..." 
                onKeyDown={handleCommand}
                className="w-full bg-transparent border-none text-[10px] outline-none text-primary placeholder:text-primary/20 py-1.5 font-black uppercase"
                autoComplete="off"
                spellCheck="false"
              />
           </div>
        </div>
      </div>
    </Layout>
  );
}
