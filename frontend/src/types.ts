export type ScreenId = 
  | 'landing' 
  | 'command-hud' 
  | 'sigint' 
  | 'forensic-analysis' 
  | 'anomaly-log' 
  | 'settings-appearance' 
  | 'sensors' 
  | 'settings-security' 
  | 'settings-account' 
  | 'bathymetric';

export interface NavigationProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId, transition?: 'push' | 'push_back' | 'slide_up' | 'none') => void;
}
