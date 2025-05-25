import { Stack } from "expo-router";
import { View, Dimensions, StatusBar, Platform } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../globals.css";

const { width, height } = Dimensions.get('window');

export default function RootLayout() {
  useEffect(() => {
    // Hide navigation bar on Android when app starts
    if (Platform.OS === 'android') {
      const hideNavigationBar = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#F8FAFC');
        } catch (error) {
          console.log('Navigation bar configuration failed:', error);
        }
      };
      hideNavigationBar();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Ensure navigation bar stays hidden when navigating
      if (Platform.OS === 'android') {
        const maintainHiddenState = async () => {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
          } catch (error) {
            console.log('Failed to maintain hidden navigation bar:', error);
          }
        };
        maintainHiddenState();
      }
    }, [])
  );

  return (
    <SafeAreaProvider>
      <View style={{ 
        flex: 1, 
        width: width, 
        height: height,
        backgroundColor: '#F8FAFC' 
      }}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#F8FAFC" 
          translucent={true}
          hidden={false}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#F8FAFC',
              width: width,
              height: height,
            }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="tasks/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="tasks/[id]/edit"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
