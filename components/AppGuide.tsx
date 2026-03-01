import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const GUIDE_STEPS = [
  {
    title: "Welcome to Yeah! Money",
    description: "Manage your finances effortlessly. Let's take a quick tour of the features.",
    icon: "wallet-outline",
    color: "#00D09C"
  },
  {
    title: "Dashboard Overview",
    description: "See your Net Balance, Monthly Income, and Expenses at a glance on the Home tab.",
    icon: "home-outline",
    color: "#5B8DEF"
  },
  {
    title: "Track Everything",
    description: "Use the '+' button to add transactions quickly. Categorize them to stay organized.",
    icon: "add-circle-outline",
    color: "#00D09C"
  },
  {
    title: "Visual Analytics",
    description: "Visualize your spending patterns with charts and get alerts on increased expenses.",
    icon: "pie-chart-outline",
    color: "#FFB84D"
  },
  {
    title: "Financial Goals",
    description: "Set savings targets and use our Emergency Fund Calculator to secure your future.",
    icon: "flag-outline",
    color: "#FF6B6B"
  }
];

export function AppGuide({ onFinish }: { onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const theme = useTheme();

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const step = GUIDE_STEPS[currentStep];

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={[styles.container, { backgroundColor: theme.card }]}
        >
          <View style={styles.progressRow}>
            {GUIDE_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i <= currentStep ? step.color : theme.border }
                ]}
              />
            ))}
          </View>

          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(400)}
            exiting={SlideOutLeft.duration(400)}
            style={styles.content}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${step.color}20` }]}>
              <Ionicons name={step.icon as any} size={48} color={step.color} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {step.description}
            </Text>
          </Animated.View>

          <View style={styles.footer}>
            <Pressable style={styles.skipBtn} onPress={onFinish}>
              <Text style={[styles.skipText, { color: theme.textTertiary }]}>Skip</Text>
            </Pressable>

            <Pressable
              style={[styles.nextBtn, { backgroundColor: step.color }]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>
                {currentStep === GUIDE_STEPS.length - 1 ? "Get Started" : "Next"}
              </Text>
              <Ionicons
                name={currentStep === GUIDE_STEPS.length - 1 ? "checkmark" : "arrow-forward"}
                size={18}
                color="#fff"
              />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  progressDot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
});
