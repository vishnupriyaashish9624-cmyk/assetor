import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from './src/store/authStore';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MainNavigator from './src/navigation/MainNavigator';
import ForceResetPasswordScreen from './src/screens/ForceResetPasswordScreen';

// Debug utilities (available in browser console as window.debugAuth())
import './src/utils/authDebug';




const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#f1c40f',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#2c3e50',
  },
};

export default function App() {
  const { isAuthenticated, user, loadStorage, checkAuth } = useAuthStore();

  useEffect(() => {
    loadStorage();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App] isAuthenticated=true. Triggering session refresh...');
      checkAuth();
    }
  }, [isAuthenticated]);

  return (
    <PaperProvider
      theme={theme}
      settings={{
        icon: props => <MaterialCommunityIcons {...props} />,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : user?.force_reset ? (
            <Stack.Screen name="ForceReset" component={ForceResetPasswordScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
