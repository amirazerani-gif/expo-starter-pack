/**
 * hooks/core/usePresence.ts
 * Mounts a component while it is visible or animating out, and drives a
 * 0 to 1 animation value for the enter and exit. Used by Modal and Dropdown.
 *
 *   const { mounted, progress } = usePresence(visible, 200);
 *   if (!mounted) return null;
 *   <Animated.View style={{ opacity: progress }} />
 *
 * `progress` runs on the native driver, so animate only opacity and
 * transforms with it.
 */
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export function usePresence(visible: boolean, duration = 200) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, mounted, duration, progress]);

  return { mounted, progress };
}
