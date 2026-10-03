import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Button, ScreenContainer } from '../shared/components';
import { ComponentGallery } from '../features/gallery/ComponentGallery';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Stub screens: each owner replaces these with the real screen from src/features/<area>/screens.
const Stub = (name: string) => () => <ScreenContainer><Text>{name} (stub)</Text></ScreenContainer>;
function Home({ navigation }: any) {
  return <ScreenContainer><Text>Home (stub)</Text><Button title="Open Component Gallery" onPress={() => navigation.navigate('Gallery')} /></ScreenContainer>;
}
const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = { Home: 'home-outline', Search: 'search-outline', AddItem: 'add-circle-outline', Chat: 'chatbubble-outline', Profile: 'person-outline' };

function Tabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted,
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
    })}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={Stub('Search')} />
      <Tab.Screen name="AddItem" component={Stub('Add Item')} options={{ title: 'Add Item' }} />
      <Tab.Screen name="Chat" component={Stub('Chat')} />
      <Tab.Screen name="Profile" component={Stub('Profile')} />
    </Tab.Navigator>
  );
}
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Gallery" component={ComponentGallery} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
