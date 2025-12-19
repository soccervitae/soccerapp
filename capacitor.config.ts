import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7b5263c1e47047b3ad66551b39158258',
  appName: 'Soccer Vitae',
  webDir: 'dist',
  server: {
    url: 'https://7b5263c1-e470-47b3-ad66-551b39158258.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullScreen'
    }
  }
};

export default config;
