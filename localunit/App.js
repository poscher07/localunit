import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CredentialContext } from './src/context/CredentialContext';
import SplashScreen from './src/screens/SplashScreen';
import DivisionScreen from './src/screens/DivisionScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PortalBridgeScreen from './src/screens/PortalBridgeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [credentials, setCredentials] = React.useState(null);

  return (
    <CredentialContext.Provider value={{ credentials, setCredentials }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f2f7fc' },
          }}
        >
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="DivisionScreen" component={DivisionScreen} />
          <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="PortalBridgeScreen" component={PortalBridgeScreen} />
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CredentialContext.Provider>
  );
}
