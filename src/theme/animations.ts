import { useReducedMotion } from 'react-native-reanimated';
import { withSpring, type WithSpringConfig } from 'react-native-reanimated';

export const SPRING_CONFIG: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const PRESS_SCALE = 0.96;

export const FADE_IN_UP_DURATION = 400;

export const STAGGER_DELAY = 80;

export function useAnimationEnabled(): boolean {
  const reducedMotion = useReducedMotion();
  return !reducedMotion;
}

export { withSpring };
