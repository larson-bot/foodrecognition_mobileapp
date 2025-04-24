import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerTitle: 'Calurfood', // ✅ Title at the top of each screen
        headerTitleAlign: 'center',
        headerTintColor: '#4CAF50',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'transparent',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dietitian',
          headerTitle: 'Calurfood', // ✅ Optional: Override if you want a different title here
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Food Log',
          headerTitle: 'Calurfood',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calorieTracker"
        options={{
          title: 'Tracker',
          headerTitle: 'Calurfood',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Food List',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommendation"
        options={{
          title: 'Advice',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
