import React, { useState, useEffect } from "react";
import P5Wrapper from "../components/P5Wrapper";
import type { Meta } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Rel } from "@/components/Rel";
import { cx } from "class-variance-authority";
import { Helmet } from "react-helmet-async";

interface SketchPageProps {
  sketch: Meta;
  prev?: Meta;
  next?: Meta;
}

const SketchPage: React.FC<SketchPageProps> = ({ sketch, prev, next }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "dark" ? "light" : "dark"));
  };

  const ogImage = window.location.origin + sketch.thumbnail;

  return (
    <>
      <Helmet>
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div>
        <>
          {!isFullscreen && (
            <div className="py-8">
              <h1 className="text-4xl">{sketch.title}</h1>
              <p className="text-xl text-muted-foreground">
                {sketch.description}
              </p>
              <Rel rel={sketch.rel} relHref={sketch.relHref} />
            </div>
          )}

          <div
            className={cx(
              "flex items-center justify-center overflow-hidden rounded-lg border-muted aspect-square bg-background",
              isFullscreen
                ? "absolute w-screen h-screen top-0 left-0"
                : "relative border-2"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center w-full h-full">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <P5Wrapper
                className={cx(
                  "transition-colors",
                  mode === "dark" ? "bg-background" : "bg-foreground"
                )}
                handleViewFullscreen={toggleFullscreen}
                handleModeToggle={toggleMode}
                mode={mode}
                isFullscreen={isFullscreen}
                slug={sketch.slug ?? ""}
              />
            )}
          </div>
        </>
      </div>
      <div
        className={cx(
          "flex items-end justify-between mt-12",
          isFullscreen && "hidden"
        )}
      >
        <button
          disabled={!prev}
          className="group flex flex-col items-start cursor-pointer"
          onClick={() => {
            if (prev) {
              window.location.href = `/sketch/${prev.slug}`;
            }
          }}
        >
          <span className="opacity-40">Previous</span>
          <span className="text-2xl opacity-60 hover:opacity-100">
            {prev?.title}
          </span>
        </button>
        <button
          disabled={!next}
          className="group flex flex-col items-end cursor-pointer"
          onClick={() => {
            if (next) {
              window.location.href = `/sketch/${next.slug}`;
            }
          }}
        >
          <span className="opacity-40">Next</span>
          <span className="text-2xl opacity-60 hover:opacity-100">
            {next?.title}
          </span>
        </button>
      </div>
    </>
  );
};

export default SketchPage;
