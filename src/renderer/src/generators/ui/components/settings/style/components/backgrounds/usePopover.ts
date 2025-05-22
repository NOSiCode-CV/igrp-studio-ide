import { useRef, useEffect, useState } from 'react';

export function usePopover() {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    function updatePosition() {
      if (!popoverRef.current) return;

      const rect = popoverRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setPosition(spaceBelow >= 200 || spaceBelow > spaceAbove ? 'bottom' : 'top');
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return { popoverRef, position };
}