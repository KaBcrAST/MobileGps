import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';
import MapScreen from './src/screens/NavigationMainScreen';
import OAuthRedirect from './src/components/OAuthRedirect';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['gpsapp://', 'https://react-gpsapi.vercel.app'],
  config: {
    screens: {
      OAuthRedirect: 'oauth-redirect',
      Map: 'map'
    }
  }
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator>
          <Stack.Screen 
            name="Map" 
            component={MapScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="OAuthRedirect" 
            component={OAuthRedirect} 
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}