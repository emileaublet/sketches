import { useState, useEffect } from "react";
import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SketchPage from "./pages/SketchPage";
import { loadSketches } from "./utils/loadSketches";
import type { Meta } from "./types";

function App() {
  const [sketches, setSketches] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSketches().then((loadedSketches) => {
      setSketches(loadedSketches);
      setIsLoading(false);
    });
  }, []);

  // Helper function to find the next non-hidden sketch
  const findNextSketch = (currentIndex: number): Meta => {
    let nextIndex = currentIndex + 1;
    while (nextIndex !== currentIndex) {
      if (nextIndex >= sketches.length) {
        nextIndex = 0; // Wrap around to beginning
      }
      if (!sketches[nextIndex].hidden) {
        return sketches[nextIndex];
      }
      nextIndex++;
    }
    // If all sketches are hidden except current, return current
    return sketches[currentIndex];
  };

  // Helper function to find the previous non-hidden sketch
  const findPrevSketch = (currentIndex: number): Meta => {
    let prevIndex = currentIndex - 1;
    while (prevIndex !== currentIndex) {
      if (prevIndex < 0) {
        prevIndex = sketches.length - 1; // Wrap around to end
      }
      if (!sketches[prevIndex].hidden) {
        return sketches[prevIndex];
      }
      prevIndex--;
    }
    // If all sketches are hidden except current, return current
    return sketches[currentIndex];
  };

  // Don't render routes until sketches are loaded
  if (isLoading) {
    return <div>Loading...</div>; // You could replace this with a proper loading component
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <HomePage sketches={sketches.filter((sketch) => !sketch.hidden)} />
          }
        />
        {sketches.map((sketch, i) => (
          <Route
            key={sketch.id}
            path={`/sketch/${sketch.id}`}
            element={
              <SketchPage
                sketch={sketch}
                prev={findPrevSketch(i)}
                next={findNextSketch(i)}
              />
            }
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
