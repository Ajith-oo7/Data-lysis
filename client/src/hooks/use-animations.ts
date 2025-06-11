import { useCallback } from 'react';

// Let's use CSS animations instead of anime.js to avoid import issues
/**
 * Custom hook for animations throughout the application
 */
export function useAnimations() {
  /**
   * Apply a CSS class to animate an element's entrance with a fade-in and slide-up effect
   * @param element The element reference
   */
  const fadeInUp = useCallback((element: HTMLElement | null) => {
    if (element) {
      // Remove any existing animation classes
      element.classList.remove('fade-in-up-animation');
      
      // Force a reflow to restart the animation
      void element.offsetWidth;
      
      // Add the animation class
      element.classList.add('fade-in-up-animation');
    }
  }, []);

  /**
   * Apply a CSS class to animate an element with a scale effect
   * @param element The element reference
   */
  const scaleIn = useCallback((element: HTMLElement | null) => {
    if (element) {
      // Remove any existing animation classes
      element.classList.remove('scale-in-animation');
      
      // Force a reflow to restart the animation
      void element.offsetWidth;
      
      // Add the animation class
      element.classList.add('scale-in-animation');
    }
  }, []);

  return {
    fadeInUp,
    scaleIn,
  };
}