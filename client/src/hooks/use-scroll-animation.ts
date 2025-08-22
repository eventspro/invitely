import { useEffect, useRef } from 'react';

export function useScrollAnimation(animationClass = 'animate-slide-up') {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationClass);
            // Add a slight delay for enhanced effect
            setTimeout(() => {
              entry.target.classList.add('animate-float');
            }, 800);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [animationClass]);

  return elementRef;
}

export function useStaggeredAnimation(delay = 200) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = Array.from(entry.target.children) as HTMLElement[];
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('animate-slide-up');
              }, index * delay);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [delay]);

  return containerRef;
}