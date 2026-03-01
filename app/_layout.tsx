import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { FinanceProvider } from "@/lib/finance-context";
import { StatusBar } from "expo-status-bar";
import { AppSplash } from "@/components/AppSplash";
import { AppGuide } from "@/components/AppGuide";
import { ThemeProvider, useThemeConfig } from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-transaction"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="manage-accounts"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="manage-categories"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-goal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function MainContent() {
  const { isDark } = useThemeConfig();
  const [showSplash, setShowSplash] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function checkFirstLaunch() {
      const hasSeenGuide = await AsyncStorage.getItem('yeahmoney_guide_seen');
      if (!hasSeenGuide) {
        setShowGuide(true);
      }
    }
    checkFirstLaunch();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {showSplash ? (
          <AppSplash onFinish={() => setShowSplash(false)} />
        ) : (
          <>
            <RootLayoutNav />
            {showGuide && (
              <AppGuide onFinish={() => {
                setShowGuide(false);
                AsyncStorage.setItem('yeahmoney_guide_seen', 'true');
              }} />
            )}
          </>
        )}
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FinanceProvider>
            <MainContent />
          </FinanceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
