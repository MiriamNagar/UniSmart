import { useTabScroll } from "@/contexts/tab-scroll-context";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView } from "react-native";

/**
 * Remember vertical scroll position for a screen while the user switches
 * bottom tabs, and restore it when they come back.
 */
export function usePersistedTabScroll(scrollKey: string) {
  const { getOffset, setOffset } = useTabScroll();
  const scrollRef = useRef<ScrollView>(null);
  const lastY = useRef(0);
  const restoreAfterLayoutRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const y = getOffset(scrollKey);
      restoreAfterLayoutRef.current = y;

      const tryRestore = () => {
        const target = restoreAfterLayoutRef.current;
        if (target == null) return;
        restoreAfterLayoutRef.current = null;
        scrollRef.current?.scrollTo({ y: target, animated: false });
      };

      const t = setTimeout(tryRestore, 32);

      return () => {
        clearTimeout(t);
        setOffset(scrollKey, lastY.current);
        restoreAfterLayoutRef.current = null;
      };
    }, [scrollKey, getOffset, setOffset]),
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastY.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  const onContentSizeChange = useCallback(() => {
    const target = restoreAfterLayoutRef.current;
    if (target == null) return;
    restoreAfterLayoutRef.current = null;
    scrollRef.current?.scrollTo({ y: target, animated: false });
  }, []);

  return {
    scrollRef,
    scrollViewProps: {
      ref: scrollRef,
      onScroll,
      onContentSizeChange,
      scrollEventThrottle: 16,
    },
  };
}
