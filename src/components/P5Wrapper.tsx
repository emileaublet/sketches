import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";

interface P5WrapperProps {
  slug: string;
  className?: string;
}

const P5Wrapper: React.FC<P5WrapperProps> = ({ slug, className }) => {
  const [sketch, setSketch] = useState();
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    // Dynamically import the sketch module
    const loadSketch = async () => {
      try {
        const { default: sketchModule } = await import(
          `../sketches/${slug}.ts`
        );
        setSketch(() => sketchModule);
      } catch (error) {
        console.error("Error loading sketch:", error);
      }
    };

    loadSketch();
  }, [slug]);
  useEffect(() => {
    // wait for the container to be available
    if (!containerRef.current || !sketch) {
      return;
    }

    // Create p5 instance
    if (containerRef.current) {
      containerRef.current.innerHTML = ""; // Clear previous sketch
      p5InstanceRef.current = new p5(sketch, containerRef.current);
    }

    // Cleanup
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [sketch]);

  return <div id="sketch-canvas" ref={containerRef} className={className} />;
};

export default P5Wrapper;
