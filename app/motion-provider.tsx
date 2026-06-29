'use client';

import * as React from 'react';
import { MotionConfig } from 'motion/react';

const REDUCE_ANIMATION_STORAGE_KEY = 'an-reduce-animation';

type ReducedAnimationContextValue = {
  reduceAnimation: boolean;
  toggleReduceAnimation: () => void;
};

const ReducedAnimationContext = React.createContext<ReducedAnimationContextValue | null>(null);

function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduceAnimation, setReduceAnimation] = React.useState(false);

  React.useEffect(() => {
    setReduceAnimation(localStorage.getItem(REDUCE_ANIMATION_STORAGE_KEY) === 'true');
  }, []);

  const toggleReduceAnimation = React.useCallback(() => {
    setReduceAnimation((current) => {
      const next = !current;
      localStorage.setItem(REDUCE_ANIMATION_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ReducedAnimationContext.Provider value={{ reduceAnimation, toggleReduceAnimation }}>
      <MotionConfig reducedMotion={reduceAnimation ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </ReducedAnimationContext.Provider>
  );
}

function useReducedAnimation() {
  const context = React.useContext(ReducedAnimationContext);

  if (!context) {
    throw new Error('useReducedAnimation must be used within MotionProvider');
  }

  return context;
}

export { MotionProvider, useReducedAnimation };
