import React from "react";
import { Link } from "react-router";
import type { Meta } from "../types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface HomePageProps {
  sketches: Meta[];
}

const HomePage: React.FC<HomePageProps> = ({ sketches }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sketches.map((sketch) => (
        <Link key={sketch.id} to={`/sketch/${sketch.id}`}>
          <Card className="relative h-full pt-0 overflow-hidden transition-shadow duration-300 hover:shadow-lg group">
            <div className="relative overflow-hidden rounded-t-lg aspect-[4/3] thumbnail">
              {sketch.thumbnail && (
                <img
                  src={sketch.thumbnail}
                  alt={sketch.title}
                  className="object-cover w-full h-full transition-transform duration-1000 rounded-t-lg will-change-transform transform-3d group-hover:scale-105"
                />
              )}
            </div>
            <CardHeader className="absolute bottom-0 w-full p-4 rounded-b-lg bg-background/80 backdrop-blur-xl">
              <CardTitle className="text-xl">{sketch.title}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default HomePage;
