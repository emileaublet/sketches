import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import p5 from "p5";

export const meta: Meta = {
  id: "garden-01",
  title: "Garden 01",
  description: "A garden of flowers",
  relHref: "https://openprocessing.org/sketch/881479",
  rel: "Roni Kaufman",
  thumbnail: "/garden-01.png",
};

const circleWaveSketch = (p: p5SVG) => {
  let particles: Particle[] = [];
  const n = 100; // even fewer lines
  const squiggliness = 1 / 100;
  const squiggliness2 = 1 / 500;
  let interval: NodeJS.Timeout;

  let clipCenter: p5.Vector;
  let clipRadius: number;
  const width = 500;
  const height = 500;
  p.setup = () => {
    p.createCanvas(width, height, p.SVG);
    p.colorMode(p.HSB, 100);
    p.angleMode(p.DEGREES);
    p.noStroke();

    clipCenter = p.createVector(p.width / 2, p.height / 2);
    clipRadius = p.min(p.width, p.height) * 0.45;

    interval = setInterval(createParticles, 500);
  };

  p.draw = () => {
    if (p.frameCount < 500) {
      for (const part of particles) {
        part.draw();
        part.move();
      }
    } else if (p.frameCount === 500) {
      clearInterval(interval);
    } else if (p.frameCount < 650) {
      for (let i = 0; i < 4; i++) {
        // ⬅ doubled from 2 to 4
        p.fill(75, 25, 95, 100);
        addFlower(1, i);
      }
    } else if (p.frameCount < 700) {
      for (let i = 0; i < 4; i++) {
        // ⬅ doubled from 2 to 4
        p.fill(13, 5, 96, 100);
        addFlower(2, i);
      }
    } else if (p.frameCount < 750) {
      for (let i = 0; i < 4; i++) {
        // ⬅ doubled from 2 to 4
        p.fill(13, 75, 97, 100);
        addFlower(3, i);
      }
    }
  };

  function createParticles() {
    particles = [];
    for (let i = 0; i < n; i++) {
      let x_, y_;
      do {
        x_ = p.random(p.width);
        y_ = p.random(p.height);
      } while (p.dist(x_, y_, clipCenter.x, clipCenter.y) > clipRadius);

      const s_ = p.random(0.9, 1.1);
      const c_ = p.color(35, 70, 60); // fixed grass color
      particles.push(new Particle(x_, y_, s_, c_));
    }
  }

  class Particle {
    x: number;
    y: number;
    size: number;
    c: p5.Color;
    alpha: number;
    dist: number;
    path: p5.Vector[];

    constructor(x_: number, y_: number, s_: number, c_: p5.Color) {
      this.x = x_;
      this.y = y_;
      this.size = s_;
      this.c = c_;
      this.alpha = 100;
      this.dist = s_;
      this.path = [];
    }

    move() {
      const theta =
        p.noise(
          this.x * squiggliness,
          this.y * squiggliness,
          p.frameCount / 1000
        ) *
          p.PI +
        p.PI;
      const v = p5.Vector.fromAngle(theta, this.dist);
      this.x += v.x;
      this.y += v.y;
      this.dist *= 0.9999;
      this.size *= 0.98;

      this.path.push(p.createVector(this.x, this.y));
      if (this.path.length > 50) {
        this.path.shift();
      }
    }

    draw() {
      p.noFill();
      this.c.setAlpha(100); // solid color
      p.stroke(this.c);
      p.strokeWeight(this.size);

      p.beginShape();
      for (const pos of this.path) {
        p.curveVertex(pos.x, pos.y);
      }
      p.endShape();

      p.noStroke();
    }
  }

  function addFlower(id: number, _i: number): void {
    let x: number, y: number, nz: number;
    do {
      x = p.floor(p.random(p.width));
      y = p.floor(p.random(p.height)) * 4;
      nz = p.noise(x * squiggliness2, y * squiggliness2, id);
    } while (
      p.floor(nz * 10) % 2 === 0 ||
      p.dist(x, y / 4, clipCenter.x, clipCenter.y) > clipRadius
    );

    p.stroke(getFill());
    p.strokeWeight(3.5);
    p.point(x, y / 4);
  }

  function getFill() {
    const c = p.drawingContext.fillStyle;
    return p.color(c);
  }
};

export default circleWaveSketch;
