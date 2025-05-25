import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate responsive positioning
  const tabBarHeight = 70;
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) + 10 : 10;
  const horizontalMargin = Math.max(10, width * 0.02); // 2% of screen width, minimum 10px
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomMargin,
          left: horizontalMargin,
          right: horizontalMargin,
          width: width - (horizontalMargin * 2),
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 25,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              width: '100%',
              height: tabBarHeight,
              borderRadius: 25,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          />
        ),
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "rgba(0, 0, 0, 0.6)",
        tabBarLabelStyle: {
          fontSize: Math.max(11, width * 0.03), // Responsive font size
          fontWeight: '600',
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          flex: 1,
          borderRadius: 20,
          marginHorizontal: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tasks",
          tabBarLabel: "Tasks",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: 20,
              padding: 8,
              minWidth: 40,
              alignItems: 'center',
            }}>
              <MaterialIcons 
                name={focused ? "list-alt" : "list"} 
                size={focused ? Math.max(24, width * 0.065) : Math.max(22, width * 0.06)} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Task",
          tabBarLabel: "Add",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: 20,
              padding: 8,
              minWidth: 40,
              alignItems: 'center',
            }}>
              <MaterialIcons 
                name={focused ? "add-circle" : "add-circle-outline"} 
                size={focused ? Math.max(24, width * 0.065) : Math.max(22, width * 0.06)} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
