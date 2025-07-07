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

  // Don't render routes until sketches are loaded
  if (isLoading) {
    return <div>Loading...</div>; // You could replace this with a proper loading component
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage sketches={sketches} />} />
        {sketches.map((sketch, i) => (
          <Route
            key={sketch.id}
            path={`/sketch/${sketch.id}`}
            element={
              <SketchPage
                sketch={sketch}
                prev={i > 0 ? sketches[i - 1] : sketches[sketches.length - 1]}
                next={i < sketches.length - 1 ? sketches[i + 1] : sketches[0]}
              />
            }
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
