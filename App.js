import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import './src/utils/polyfills';
import { Linking } from 'react-native';

// Add this to handle the OAuth callback
Linking.addEventListener('url', ({ url }) => {
  if (url.includes('auth/google/callback')) {
    // Extract token or handle authentication success
    console.log('Google OAuth callback received:', url);
    // Update your authentication state here
  }
});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}