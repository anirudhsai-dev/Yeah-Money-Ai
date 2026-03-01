import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export function AppSplash({ onFinish }: { onFinish: () => void }) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const bolt1Opacity = useSharedValue(0);
  const bolt2Opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const signatureOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Thunder Lightning Sequence
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 100 }),
      withTiming(0.8, { duration: 50 }),
      withTiming(0, { duration: 150 })
    );

    // Bolts "spreading" effect
    bolt1Opacity.value = withSequence(
      withDelay(100, withTiming(1, { duration: 50 })),
      withTiming(0, { duration: 200 })
    );
    bolt2Opacity.value = withSequence(
      withDelay(200, withTiming(1, { duration: 50 })),
      withTiming(0, { duration: 200 })
    );

    // 2. Logo Animation - Spreading from center
    logoScale.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.exp)
      })
    );
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    // 3. Text Animation
    textOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));

    // 4. Signature Animation
    signatureOpacity.value = withDelay(2200, withTiming(1, { duration: 800 }));

    // 5. Finish
    const timer = setTimeout(() => {
      onFinish();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const animatedBolt1Style = useAnimatedStyle(() => ({
    opacity: bolt1Opacity.value,
    transform: [{ scale: 2 }, { rotate: '-45deg' }]
  }));

  const animatedBolt2Style = useAnimatedStyle(() => ({
    opacity: bolt2Opacity.value,
    transform: [{ scale: 2 }, { rotate: '45deg' }]
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(textOpacity.value ? 0 : 10, { duration: 800 }) }]
  }));

  const animatedSignatureStyle = useAnimatedStyle(() => ({
    opacity: signatureOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Thunder Flash Overlay */}
      <Animated.View style={[styles.flash, animatedFlashStyle, { backgroundColor: colorScheme === 'dark' ? '#fff' : '#000' }]} />

      {/* Bolts Spreading Effect */}
      <Animated.View style={[styles.bolt, animatedBolt1Style]}>
        <Ionicons name="flash" size={100} color={theme.primary} />
      </Animated.View>
      <Animated.View style={[styles.bolt, animatedBolt2Style]}>
        <Ionicons name="flash" size={100} color={theme.primary} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.Image
          source={require('@/assets/images/splash-icon.png')}
          style={[styles.logo, animatedLogoStyle]}
          resizeMode="contain"
        />

        <Animated.View style={[styles.textContainer, animatedTextStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Yeah! Money is all it matters!
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We are here to help you track your expenses, goals and many more...
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.signatureContainer, animatedSignatureStyle]}>
        <Text style={[styles.signature, { color: theme.textSecondary }]}>
          - Anirudh Sai Manepalli
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
  bolt: {
    position: 'absolute',
    zIndex: 9998,
  },
  content: {
    alignItems: 'center',
    width: '90%',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  signatureContainer: {
    position: 'absolute',
    bottom: 60,
    right: 40,
  },
  signature: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
});
