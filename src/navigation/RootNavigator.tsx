import React from 'react';
import {useAuthStore} from '../stores/auth.store';
import {useConfigStore} from '../stores/config.store';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import ForceUpdateScreen from '../screens/ForceUpdateScreen';
import {APP_VERSION} from '../config';

/** Simple semver compare: returns true if current < required */
function isVersionBelow(current: string, required: string): boolean {
  const c = current.split('.').map(Number);
  const r = required.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (r[i] || 0)) return true;
    if ((c[i] || 0) > (r[i] || 0)) return false;
  }
  return false;
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const config = useConfigStore(s => s.config);
  const isLoaded = useConfigStore(s => s.isLoaded);

  // Gate: Maintenance mode
  if (isLoaded && config.maintenance.enabled) {
    return <MaintenanceScreen />;
  }

  // Gate: Force update
  if (
    isLoaded &&
    config.content.forceUpdate.enabled &&
    isVersionBelow(APP_VERSION, config.content.forceUpdate.minVersion)
  ) {
    return <ForceUpdateScreen />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // If user is authenticated but hasn't completed profile setup, show setup screen
  if (!user?.name || !user?.username) {
    return <ProfileSetupScreen />;
  }

  return <MainTabs />;
}
