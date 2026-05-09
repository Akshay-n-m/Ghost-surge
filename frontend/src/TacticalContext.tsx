import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TacticalState {
  isDeobfuscationComplete: boolean;
  setDeobfuscationComplete: (val: boolean) => void;
  isAcousticEmulationActive: boolean;
  setAcousticEmulationActive: (val: boolean) => void;
  pendingDestination: { x: number; y: number } | null;
  setPendingDestination: (val: { x: number; y: number } | null) => void;
  operatorName: string;
  setOperatorName: (val: string) => void;
  operatorImage: string | null;
  setOperatorImage: (val: string | null) => void;
  theme: string;
  setTheme: (val: string) => void;
  crtEnabled: boolean;
  setCrtEnabled: (val: boolean) => void;
  noiseEnabled: boolean;
  setNoiseEnabled: (val: boolean) => void;
  isRebooting: boolean;
  setIsRebooting: (val: boolean) => void;
}

const TacticalContext = createContext<TacticalState | undefined>(undefined);

export function TacticalProvider({ children }: { children: ReactNode }) {
  const [isDeobfuscationComplete, setDeobfuscationComplete] = useState(false);
  const [isAcousticEmulationActive, setAcousticEmulationActive] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<{ x: number; y: number } | null>(null);
  const [operatorName, setOperatorName] = useState('OPERATOR_01 // VECTOR');
  const [operatorImage, setOperatorImage] = useState<string | null>(null);
  
  // Aesthetic Global States
  const [theme, setTheme] = useState('bg-background'); // Default class
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [isRebooting, setIsRebooting] = useState(false);

  return (
    <TacticalContext.Provider value={{
      isDeobfuscationComplete, setDeobfuscationComplete,
      isAcousticEmulationActive, setAcousticEmulationActive,
      pendingDestination, setPendingDestination,
      operatorName, setOperatorName,
      operatorImage, setOperatorImage,
      theme, setTheme,
      crtEnabled, setCrtEnabled,
      noiseEnabled, setNoiseEnabled,
      isRebooting, setIsRebooting
    }}>
      {children}
    </TacticalContext.Provider>
  );
}

export function useTactical() {
  const context = useContext(TacticalContext);
  if (context === undefined) {
    throw new Error('useTactical must be used within a TacticalProvider');
  }
  return context;
}
