import { useState, useEffect } from "react";
import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SketchPage from "./pages/SketchPage";
import { loadSketches } from "./utils/loadSketches";
import type { Meta } from "./types";

function App() {
  const [sketches, setSketches] = useState<Meta[]>([]);

  useEffect(() => {
    loadSketches().then(setSketches);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage sketches={sketches} />} />
        {sketches.map((sketch) => (
          <Route
            key={sketch.id}
            path={`/sketch/${sketch.id}`}
            element={<SketchPage sketch={sketch} />}
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
