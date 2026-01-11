import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ROUTES } from '@/constants/routes';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Fade out and navigate after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        router.replace(ROUTES.AUTH.STUDENT_SESSION);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, opacityAnim]);

  const handlePress = () => {
    // Fade out and navigate when user taps
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace(ROUTES.AUTH.STUDENT_SESSION);
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: opacityAnim,
          },
        ]}>
        <TouchableOpacity
          style={styles.touchableContainer}
          activeOpacity={1}
          onPress={handlePress}>
          {/* Icon Container */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
              },
            ]}>
            <View style={styles.iconSquare}>
              <MaterialIcons name="menu-book" size={56} color="#5B4C9D" />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
              },
            ]}>
            <ThemedText style={styles.title}>UniSmart</ThemedText>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
              },
            ]}>
            <ThemedText style={styles.tagline}>OPTIMAL ACADEMIC FLOW</ThemedText>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B4C9D',
  },
  animatedContainer: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconSquare: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#B8B3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 48,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
});

