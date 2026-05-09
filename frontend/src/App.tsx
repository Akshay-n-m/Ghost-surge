/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenId } from './types';
import { TacticalProvider } from './TacticalContext';

// Screen Components
import LandingPage from './LandingPage';
import CommandHUD from './CommandHUD';
import Sigint from './Sigint';
import ForensicAnalysis from './ForensicAnalysis';
import AnomalyLog from './AnomalyLog';
import SettingsAppearance from './SettingsAppearance';
import Sensors from './Sensors';
import SettingsSecurity from './SettingsSecurity';
import SettingsAccount from './SettingsAccount';
import Bathymetric from './Bathymetric';

type TransitionType = 'push' | 'push_back' | 'slide_up' | 'none';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [transition, setTransition] = useState<TransitionType>('none');

  const handleNavigate = (screen: ScreenId, trans: TransitionType = 'push') => {
    setTransition(trans);
    setCurrentScreen(screen);
  };

  const getTransitionVariants = (type: TransitionType) => {
    switch (type) {
      case 'push':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-20%', opacity: 0 }
        };
      case 'push_back':
        return {
          initial: { x: '-100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '20%', opacity: 0 }
        };
      case 'slide_up':
        return {
          initial: { y: '100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { scale: 0.95, opacity: 0 }
        };
      case 'none':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getTransitionVariants(transition);

  const renderScreen = () => {
    const props = { currentScreen, onNavigate: handleNavigate };
    switch (currentScreen) {
      case 'landing': return <LandingPage {...props} />;
      case 'command-hud': return <CommandHUD {...props} />;
      case 'sigint': return <Sigint {...props} />;
      case 'forensic-analysis': return <ForensicAnalysis {...props} />;
      case 'anomaly-log': return <AnomalyLog {...props} />;
      case 'settings-appearance': return <SettingsAppearance {...props} />;
      case 'sensors': return <Sensors {...props} />;
      case 'settings-security': return <SettingsSecurity {...props} />;
      case 'settings-account': return <SettingsAccount {...props} />;
      case 'bathymetric': return <Bathymetric {...props} />;
      default: return <LandingPage {...props} />;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <TacticalProvider>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentScreen}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </TacticalProvider>
    </div>
  );
}
