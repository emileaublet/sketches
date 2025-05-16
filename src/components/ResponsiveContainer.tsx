import { useRef, useState, useEffect, ReactNode, ReactElement } from "react";

interface Size {
  width: number;
  height: number;
}

interface ResponsiveContainerProps {
  /** A function that receives the container’s { width, height } */
  children: (size: Size) => ReactNode;
  /** Optional className or style to size your container */
  className?: string;
}

/**
 * ResponsiveContainer watches its own size and
 * calls its render-prop children with { width, height }.
 */
export function ResponsiveContainer({
  children,
  className,
}: ResponsiveContainerProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Create a ResizeObserver to watch container size
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {/* Only render children once we have a non-zero size */}
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
}
