import React, { useState, useEffect } from "react";
import P5Wrapper from "../components/P5Wrapper";
import { Maximize, Minimize, RefreshCw } from "lucide-react";
import type { Meta } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Rel } from "@/components/Rel";
import { cx } from "class-variance-authority";
import { Helmet } from "react-helmet-async";

interface SketchPageProps {
  sketch: Meta;
}

const SketchPage: React.FC<SketchPageProps> = ({ sketch }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const refresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const ogImage = window.location.origin + sketch.thumbnail;

  return (
    <>
      <Helmet>
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div>
        {isLoading ? (
          <Skeleton className="w-full h-96" />
        ) : (
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
              <P5Wrapper slug={sketch.slug ?? ""} />

              <div className="absolute top-0 right-0 z-10 flex items-center justify-between p-4">
                <Button
                  size={"icon"}
                  variant={"ghost"}
                  className="cursor-pointer"
                  onClick={refresh}
                  aria-label={"Refresh sketch"}
                >
                  <RefreshCw />
                </Button>
                <Button
                  size={"icon"}
                  variant={"ghost"}
                  className="cursor-pointer"
                  onClick={toggleFullscreen}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? <Minimize /> : <Maximize />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SketchPage;
