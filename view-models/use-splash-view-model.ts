import { ROUTES } from "@/constants/routes";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useSplashViewModel() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        router.replace(ROUTES.AUTH.WELCOME);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, opacityAnim]);

  const handlePress = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace(ROUTES.AUTH.WELCOME);
    });
  };

  return { fadeAnim, opacityAnim, handlePress };
}
