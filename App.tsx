import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { loadListingOptions } from './src/features/listings/constants';

export default function App() {
  // Warm the category + pickup-location lists from the backend at boot. No-op in
  // mock mode and never throws, so it can't delay or break first paint.
  useEffect(() => {
    loadListingOptions();
  }, []);

  return (<SafeAreaProvider><StatusBar style="auto" /><RootNavigator /></SafeAreaProvider>);
}
