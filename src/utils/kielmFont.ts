import { p5SVG } from "p5.js-svg";

export class KielmFont {
  p: p5SVG;
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  ts: number;
  glyphs: { [key: string]: () => void };

  constructor(p: p5SVG) {
    this.p = p;
    this.tx = 12.5;
    this.ty = 25.0;
    this.sx = 0;
    this.sy = 0;
    this.ts = 6.0;

    // Build glyph dispatch table once
    this.glyphs = {
      A: this._A,
      a: this._a,
      B: this._B,
      b: this._b,
      C: this._C,
      c: this._c,
      D: this._D,
      d: this._d,
      E: this._E,
      e: this._e,
      F: this._F,
      f: this._f,
      G: this._G,
      g: this._g,
      H: this._H,
      h: this._h,
      I: this._I,
      i: this._i,
      J: this._J,
      j: this._j,
      K: this._K,
      k: this._k,
      L: this._L,
      l: this._l,
      M: this._M,
      m: this._m,
      N: this._N,
      n: this._n,
      O: this._O,
      o: this._o,
      P: this._P,
      p: this._p,
      Q: this._Q,
      q: this._q,
      R: this._R,
      r: this._r,
      S: this._S,
      s: this._s,
      T: this._T,
      t: this._t,
      U: this._U,
      u: this._u,
      V: this._V,
      v: this._v,
      W: this._W,
      w: this._w,
      X: this._X,
      x: this._x,
      Y: this._Y,
      y: this._y,
      Z: this._Z,
      z: this._z,

      "0": this._zero,
      "1": this._one,
      "2": this._two,
      "3": this._three,
      "4": this._four,
      "5": this._five,
      "6": this._six,
      "7": this._seven,
      "8": this._eight,
      "9": this._nine,

      _: this._underscore,
      "-": this._dash,
      "?": this._question,
      ".": this._period,
      ":": this._colon,
      ";": this._semicolon,
      ",": this._comma,
      "!": this._exclaim,
      "/": this._slash,
      "&": this._amp,
      " ": this._space,
    };
  }

  drawChar(c: string) {
    const accents: { [key: string]: string } = {
      é: "e",
      è: "e",
      ê: "e",
      ë: "e",
      à: "a",
      â: "a",
      î: "i",
      ï: "i",
      ô: "o",
      û: "u",
      ù: "u",
      ç: "c",
      É: "E",
      È: "E",
      Ê: "E",
      Ë: "E",
      À: "A",
      Â: "A",
      Î: "I",
      Ï: "I",
      Ô: "O",
      Û: "U",
      Ù: "U",
      Ç: "C",
    };
    const base = accents[c] || c;
    const fn = this.glyphs[base];
    if (fn) return fn.call(this);
  }

  getTextWidth(str: string, tx: number, sx: number, ts: number): number {
    return str.length * (tx + sx + ts);
  }

  drawString(
    str: string,
    px: number,
    py: number,
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    alignH: "LEFT" | "CENTER" | "RIGHT" = "LEFT",
  ) {
    this.tx = tx;
    this.ty = ty;
    this.sx = sx;
    this.sy = sy;
    // Scale spacing relative to width
    this.ts = tx * 0.4;

    let x = px;
    const y = py;
    const adv = tx + sx + this.ts;

    // Handle alignment
    if (alignH === "CENTER") {
      const totalWidth = this.getTextWidth(str, tx, sx, this.ts);
      x -= totalWidth / 2;
    } else if (alignH === "RIGHT") {
      const totalWidth = this.getTextWidth(str, tx, sx, this.ts);
      x -= totalWidth;
    }

    for (let i = 0; i < str.length; i++) {
      this.p.push();
      this.p.translate(x, y);
      this.drawChar(str[i]);
      this.p.pop();
      x += adv;
    }
  }

  //-------------------------
  // Glyph designs

  _A() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(tx / 2 + sx / 2, 0);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
    const ang = Math.atan((tx / 2 + sx / 2) / (ty + sy));
    const angX = Math.tan(ang) * (ty / 3);
    p.line(angX, (2 * ty) / 3 + sy, tx + sx - angX, (2 * ty) / 3 + sy);
  }

  _a() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty + sy);
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.endShape();
    p.beginShape();
    p.vertex(tx + sx, (3 * ty) / 4 + sy);
    p.vertex(tx + sx, (3 * ty) / 4);
    p.bezierVertex(tx + sx, (3 * ty) / 4, tx + sx, ty / 2, tx / 2 + sx, ty / 2);
    p.vertex(tx / 2, ty / 2);
    p.bezierVertex(0, ty / 2, 0, (3 * ty) / 4, 0, (3 * ty) / 4);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
  }

  _B() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx, 0);
    p.bezierVertex(tx / 2 + sx, 0, tx + sx, 0, tx + sx, ty / 4);
    p.vertex(tx + sx, ty / 4 + sy / 2);
    p.bezierVertex(
      tx + sx,
      ty / 2 + sy / 2,
      tx / 2 + sx / 2,
      ty / 2 + sy / 2,
      tx / 2 + sx / 2,
      ty / 2 + sy / 2,
    );
    p.vertex(0, ty / 2 + sy / 2);
    p.endShape();
    const yoff = ty / 2 + sy / 2;
    p.beginShape();
    p.vertex(0, yoff);
    p.vertex(tx / 2 + sx, yoff);
    p.bezierVertex(tx / 2 + sx, yoff, tx + sx, yoff, tx + sx, yoff + ty / 4);
    p.vertex(tx + sx, yoff + ty / 4 + sy / 2);
    p.bezierVertex(
      tx + sx,
      yoff + ty / 2 + sy / 2,
      tx / 2 + sx / 2,
      yoff + ty / 2 + sy / 2,
      tx / 2 + sx / 2,
      yoff + ty / 2 + sy / 2,
    );
    p.vertex(0, yoff + ty / 2 + sy / 2);
    p.endShape();
  }

  _b() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
    p.line(0, 0, 0, ty + sy);
  }

  _C() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 3);
    p.bezierVertex(tx + sx, ty / 3, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(tx / 2, 0);
    p.bezierVertex(0, 0, 0, ty / 3, 0, ty / 3);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.endShape();
  }

  _c() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.endShape();
  }

  _D() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 3);
    p.bezierVertex(tx + sx, ty / 3, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(0, 0);
    p.vertex(0, ty + sy);
    p.vertex(tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx + sx, ty / 3);
    p.endShape();
  }

  _d() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
    p.line(tx + sx, 0, tx + sx, ty + sy);
  }

  _E() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, 0);
    p.vertex(0, 0);
    p.vertex(0, ty + sy);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
    p.line(0, ty / 2 + sy / 2, (2 * tx) / 3 + sx, ty / 2 + sy / 2);
  }

  _e() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, (5 * ty) / 8 + sy / 2);
    p.vertex(tx + sx, (5 * ty) / 8 + sy / 2);
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.endShape();
  }

  _F() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, 0);
    p.vertex(0, 0);
    p.vertex(0, ty + sy);
    p.endShape();
    p.line(0, ty / 2 + sy / 2, (2 * tx) / 3 + sx, ty / 2 + sy / 2);
  }

  _f() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.vertex(tx / 2 + sx / 2, ty / 4);
    p.bezierVertex(tx / 2 + sx / 2, ty / 4, tx / 2 + sx / 2, 0, tx + sx / 2, 0);
    p.vertex(tx + sx, 0);
    p.endShape();
    p.line(0, ty / 2 + sy / 2, tx + sx, ty / 2 + sy / 2);
    p.line(0, ty + sy, tx + sx, ty + sy);
  }

  _G() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 3);
    p.bezierVertex(tx + sx, ty / 3, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(tx / 2, 0);
    p.bezierVertex(0, 0, 0, ty / 3, 0, ty / 3);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.endShape();
    p.beginShape();
    p.vertex(tx / 2 + sx / 2, ty / 2 + sy / 2);
    p.vertex(tx + sx, ty / 2 + sy / 2);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _g() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, ty / 2 + sy);
    p.bezierVertex(
      0,
      ty / 2 + sy,
      0,
      (3 * ty) / 4 + sy,
      tx / 2,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx / 2 + sx, (3 * ty) / 4 + sy);
    p.bezierVertex(
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      ty / 2 + sy,
      tx + sx,
      ty / 2 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
    p.beginShape();
    p.vertex(tx / 2 + sx / 2, (3 * ty) / 4 + sy);
    p.vertex(tx + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (5 * ty) / 4 + sy,
      tx / 2 + sx,
      (5 * ty) / 4 + sy,
    );
    p.vertex(tx / 2, (5 * ty) / 4 + sy);
    p.bezierVertex(0, (5 * ty) / 4 + sy, 0, ty + sy, 0, ty + sy);
    p.endShape();
    p.line(tx / 2 + sx / 2, ty / 4, tx + sx, ty / 4);
  }

  _H() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, 0, ty + sy);
    p.line(0, ty / 2 + sy / 2, tx + sx, ty / 2 + sy / 2);
    p.line(tx + sx, 0, tx + sx, ty + sy);
  }

  _h() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty + sy);
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, ty + sy);
    p.endShape();
    p.line(0, 0, 0, ty + sy);
  }

  _I() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, tx + sx, 0);
    p.line(0, ty + sy, tx + sx, ty + sy);
    p.line(tx / 2 + sx / 2, 0, tx / 2 + sx / 2, ty + sy);
  }

  _i() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx / 2 + sx / 2, ty / 4);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.endShape();
    p.line(0, ty + sy, tx + sx, ty + sy);
    p.line(tx / 2 + sx / 2, 0, tx / 2 + sx / 2, ty / 8);
  }

  _J() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx + sx, 0);
    p.vertex(tx / 3, 0);
    p.endShape();
  }

  _j() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx / 4, ty / 4);
    p.vertex((3 * tx) / 4 + sx, ty / 4);
    p.vertex((3 * tx) / 4 + sx, ty + sy);
    p.bezierVertex(
      (3 * tx) / 4 + sx,
      ty + sy,
      (3 * tx) / 4 + sx,
      (5 * ty) / 4 + sy,
      tx / 4 + sx,
      (5 * ty) / 4 + sy,
    );
    p.vertex(0, (5 * ty) / 4 + sy);
    p.endShape();
    p.line((3 * tx) / 4 + sx, 0, (3 * tx) / 4 + sx, ty / 8);
  }

  _K() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, 0, ty + sy);
    p.line(0, (2 * ty) / 3 + sy, tx + sx, 0);
    const ang = Math.atan(((2 * ty) / 3 + sy) / (tx + sx));
    const angX = (ty / 2 + sy / 2) / Math.tan(ang);
    p.line(tx + sx - angX, ty / 2 + sy / 2, tx + sx, ty + sy);
  }

  _k() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, 0, ty + sy);
    p.line(tx + sx, ty / 4, 0, (3 * ty) / 4 + sy);
    p.line(tx + sx, ty + sy, tx / 2 + sx / 2, ty / 2 + sy / 2);
  }

  _L() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(0, ty + sy);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _l() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx / 2, 0);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.endShape();
    p.line(0, ty + sy, tx + sx, ty + sy);
  }

  _M() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx / 2, (2 * ty) / 3 + sy);
    p.vertex(tx + sx, 0);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _m() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 4, 0, ty + sy);
    p.beginShape();
    p.vertex(0, (3 * ty) / 8);
    p.bezierVertex(0, (3 * ty) / 8, 0, ty / 4, tx / 4, ty / 4);
    p.vertex(tx / 4 + sx / 2, ty / 4);
    p.bezierVertex(
      tx / 2 + sx / 2,
      ty / 4,
      tx / 2 + sx / 2,
      (3 * ty) / 8,
      tx / 2 + sx / 2,
      (3 * ty) / 8,
    );
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.endShape();
    const xoff = tx / 2 + sx / 2;
    p.beginShape();
    p.vertex(xoff, (3 * ty) / 8);
    p.bezierVertex(xoff, (3 * ty) / 8, xoff, ty / 4, tx / 4 + xoff, ty / 4);
    p.vertex(tx / 4 + sx / 2 + xoff, ty / 4);
    p.bezierVertex(
      tx / 2 + sx / 2 + xoff,
      ty / 4,
      tx / 2 + sx / 2 + xoff,
      (3 * ty) / 8,
      tx / 2 + sx / 2 + xoff,
      (3 * ty) / 8,
    );
    p.vertex(tx / 2 + sx / 2 + xoff, ty + sy);
    p.endShape();
  }

  _N() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(0, 0);
    p.vertex(tx + sx, ty + sy);
    p.vertex(tx + sx, 0);
    p.endShape();
  }

  _n() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 4, 0, ty + sy);
    p.beginShape();
    p.vertex(tx + sx, ty + sy);
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.endShape();
  }

  _O() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 3);
    p.bezierVertex(tx + sx, ty / 3, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(tx / 2, 0);
    p.bezierVertex(0, 0, 0, ty / 3, 0, ty / 3);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx + sx, ty / 3);
    p.endShape();
  }

  _o() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
  }

  _P() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx, 0);
    p.quadraticVertex(tx + sx, 0, tx + sx, ty / 4);
    p.vertex(tx + sx, ty / 4 + sy / 2);
    p.quadraticVertex(tx + sx, ty / 2 + sy / 2, tx / 2 + sx, ty / 2 + sy / 2);
    p.vertex(0, ty / 2 + sy / 2);
    p.endShape();
  }

  _p() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 4, 0, (5 * ty) / 4 + sy);
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
  }

  _Q() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 3);
    p.bezierVertex(tx + sx, ty / 3, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(tx / 2, 0);
    p.bezierVertex(0, 0, 0, ty / 3, 0, ty / 3);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx + sx, ty / 3);
    p.endShape();
    p.line(tx / 2 + sx / 2, ty / 2 + sy, tx + sx, ty + sy);
  }

  _q() {
    const { p, tx, ty, sx, sy } = this;
    p.line(tx + sx, ty / 4, tx + sx, (5 * ty) / 4 + sy);
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.vertex(tx + sx, ty / 2);
    p.endShape();
  }

  _R() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty + sy);
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx, 0);
    p.quadraticVertex(tx + sx, 0, tx + sx, ty / 4);
    p.vertex(tx + sx, ty / 4 + sy / 2);
    p.quadraticVertex(tx + sx, ty / 2 + sy / 2, tx / 2 + sx, ty / 2 + sy / 2);
    p.vertex(0, ty / 2 + sy / 2);
    p.endShape();
    p.line(tx / 2 + sx / 2, ty / 2 + sy / 2, tx + sx, ty + sy);
  }

  _r() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 2);
    p.bezierVertex(tx + sx, ty / 2, tx + sx, ty / 4, tx / 2 + sx, ty / 4);
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(0, ty / 4, 0, ty / 2, 0, ty / 2);
    p.endShape();
    p.line(0, ty / 4, 0, ty + sy);
  }

  _S() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty / 4);
    p.bezierVertex(tx + sx, ty / 4, tx + sx, 0, tx / 2 + sx, 0);
    p.vertex(tx / 2, 0);
    p.bezierVertex(0, 0, 0, ty / 4, 0, ty / 4);
    p.bezierVertex(
      0,
      (2 * ty) / 3 + sy,
      tx + sx,
      ty / 3,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.bezierVertex(
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      ty + sy,
      tx / 2 + sx,
      ty + sy,
    );
    p.vertex(tx / 2, ty + sy);
    p.bezierVertex(0, ty + sy, 0, (2 * ty) / 3 + sy, 0, (2 * ty) / 3 + sy);
    p.endShape();
  }

  _s() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex((7 * tx) / 8 + sx, (3 * ty) / 8);
    p.bezierVertex(
      (7 * tx) / 8 + sx,
      (3 * ty) / 8,
      (7 * tx) / 8 + sx,
      ty / 4,
      tx / 2 + sx,
      ty / 4,
    );
    p.vertex(tx / 2, ty / 4);
    p.bezierVertex(tx / 8, ty / 4, tx / 8, (3 * ty) / 8, tx / 8, (3 * ty) / 8);
    p.bezierVertex(
      tx / 8,
      (5 * ty) / 8 + sy,
      tx + sx,
      (3 * ty) / 8,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.bezierVertex(
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      ty + sy,
      tx / 2 + sx,
      ty + sy,
    );
    p.vertex(tx / 2, ty + sy);
    p.bezierVertex(0, ty + sy, 0, (3 * ty) / 4 + sy, 0, (3 * ty) / 4 + sy);
    p.endShape();
  }

  _T() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, tx + sx, 0);
    p.line(tx / 2 + sx / 2, 0, tx / 2 + sx / 2, ty + sy);
  }

  _t() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 4, tx + sx, ty / 4);
    p.beginShape();
    p.vertex(tx / 2 + sx / 2, 0);
    p.vertex(tx / 2 + sx / 2, (3 * ty) / 4 + sy);
    p.bezierVertex(
      tx / 2 + sx / 2,
      (3 * ty) / 4 + sy,
      tx / 2 + sx / 2,
      ty + sy,
      (3 * tx) / 4 + sx / 2,
      ty + sy,
    );
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _U() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
      tx + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx + sx, 0);
    p.endShape();
  }

  _u() {
    const { p, tx, ty, sx, sy } = this;
    p.line(tx + sx, ty / 4, tx + sx, ty + sy);
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(0, (3 * ty) / 4 + sy);
    p.bezierVertex(0, (3 * ty) / 4 + sy, 0, ty + sy, tx / 2, ty + sy);
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
      tx + sx,
      (3 * ty) / 4 + sy,
    );
    p.endShape();
  }

  _V() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.vertex(tx + sx, 0);
    p.endShape();
  }

  _v() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.vertex(tx + sx, ty / 4);
    p.endShape();
  }

  _W() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx / 4, ty + sy);
    p.vertex(tx / 2 + sx / 2, ty / 3);
    p.vertex((3 * tx) / 4 + sx, ty + sy);
    p.vertex(tx + sx, 0);
    p.endShape();
  }

  _w() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx / 4 + sx / 4, ty + sy);
    p.vertex(tx / 2 + sx / 2, ty / 2 + sy / 2);
    p.vertex((3 * tx) / 4 + (3 * sx) / 4, ty + sy);
    p.vertex(tx + sx, ty / 4);
    p.endShape();
  }

  _X() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, 0, tx + sx, ty + sy);
    p.line(0, ty + sy, tx + sx, 0);
  }

  _x() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 4, tx + sx, ty + sy);
    p.line(0, ty + sy, tx + sx, ty / 4);
  }

  _Y() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx / 2 + sx / 2, ty / 2 + sy / 2);
    p.vertex(tx + sx, 0);
    p.endShape();
    p.line(tx / 2 + sx / 2, ty / 2 + sy / 2, tx / 2 + sx / 2, ty + sy);
  }

  _y() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.vertex(tx + sx, ty / 4);
    p.endShape();
    p.beginShape();
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.bezierVertex(
      tx / 2 + sx / 2,
      ty + sy,
      tx / 2 + sx / 2,
      (5 * ty) / 4 + sy,
      sx / 2,
      (5 * ty) / 4 + sy,
    );
    p.vertex(0, (5 * ty) / 4 + sy);
    p.endShape();
  }

  _Z() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx + sx, 0);
    p.vertex(0, ty + sy);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _z() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx + sx, ty / 4);
    p.vertex(0, ty + sy);
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _underscore() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty + sy, tx + sx, ty + sy);
  }

  _dash() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty / 2 + sy / 2, tx + sx, ty / 2 + sy / 2);
  }

  _question() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 3);
    p.bezierVertex(0, ty / 3, 0, 0, tx / 2, 0);
    p.vertex(tx / 2 + sx, 0);
    p.bezierVertex(tx + sx, 0, tx + sx, ty / 3, tx + sx, ty / 3);
    p.vertex(tx + sx, ty / 3 + sy);
    p.bezierVertex(
      tx + sx,
      ty / 3 + sy,
      tx + sx,
      ty / 3 + ty / 4 + sy,
      tx / 2 + sx / 2,
      ty / 3 + ty / 4 + sy,
    );
    p.vertex(tx / 2 + sx / 2, (3 * ty) / 4 + sy);
    p.endShape();
    p.line(tx / 2 + sx / 2, (7 * ty) / 8 + sy, tx / 2 + sx / 2, ty + sy);
  }

  _period() {
    const { p, tx, ty, sx, sy } = this;
    p.line(tx / 2 + sx / 2, (7 * ty) / 8 + sy, tx / 2 + sx / 2, ty + sy);
  }

  _colon() {
    const { p, tx, ty, sx, sy } = this;
    p.line(
      tx / 2 + sx / 2,
      ty / 2 + sy / 2 - ty / 8,
      tx / 2 + sx / 2,
      ty / 2 + sy / 2,
    );
    p.line(tx / 2 + sx / 2, (7 * ty) / 8 + sy, tx / 2 + sx / 2, ty + sy);
  }

  _semicolon() {
    const { p, tx, ty, sx, sy } = this;
    p.line(
      tx / 2 + sx / 2,
      ty / 2 + sy / 2 - ty / 8,
      tx / 2 + sx / 2,
      ty / 2 + sy / 2,
    );
    p.line(
      tx / 2 + sx / 2,
      (7 * ty) / 8 + sy,
      tx / 2 + sx / 2 - tx / 4,
      ty + sy,
    );
  }

  _comma() {
    const { p, tx, ty, sx, sy } = this;
    p.line(
      tx / 2 + sx / 2,
      (7 * ty) / 8 + sy,
      tx / 2 + sx / 2 - tx / 4,
      ty + sy,
    );
  }

  _exclaim() {
    const { p, tx, ty, sx, sy } = this;
    p.line(tx / 2 + sx / 2, 0, tx / 2 + sx / 2, (3 * ty) / 4 + sy);
    p.line(tx / 2 + sx / 2, (7 * ty) / 8 + sy, tx / 2 + sx / 2, ty + sy);
  }

  _slash() {
    const { p, tx, ty, sx, sy } = this;
    p.line(0, ty + sy, tx + sx, 0);
  }

  _amp() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, ty + sy);
    p.bezierVertex(
      (2 * tx) / 3 + sx / 3,
      (2 * ty) / 3 + (2 * sy) / 3,
      tx / 8 + tx / 12 - sx / 12,
      ty / 6 + sy / 6,
      tx / 8,
      ty / 8,
    );
    p.bezierVertex(
      tx / 8,
      ty / 12,
      (3 * tx) / 8 - tx / 12 + sx / 12,
      0,
      (3 * tx) / 8,
      0,
    );
    p.vertex((3 * tx) / 8 + sx, 0);
    p.bezierVertex(
      (5 * tx) / 8 + sx,
      0,
      (5 * tx) / 8 + sx,
      ty / 8,
      (5 * tx) / 8 + sx,
      ty / 8,
    );
    p.bezierVertex(
      (5 * tx) / 8 + sx,
      ty / 4,
      0,
      ty / 2 + sy,
      0,
      (3 * ty) / 4 + sy,
    );
    p.bezierVertex(
      0,
      (5 * ty) / 6 + (5 * sy) / 6,
      tx / 6 + sx / 3,
      ty + sy,
      tx / 2,
      ty + sy,
    );
    p.vertex(tx / 2 + sx, ty + sy);
    p.bezierVertex(
      tx + sx,
      ty + sy,
      tx + sx,
      ty / 2 + sy / 2,
      tx + sx,
      ty / 2 + sy / 2,
    );
    p.vertex((3 * tx) / 4 + sx, ty / 2 + sy / 2);
    p.endShape();
  }

  _space() {
    // intentionally empty
  }

  _one() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.vertex(tx / 2 + sx / 2, 0);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.endShape();
    p.line(0, ty + sy, tx + sx, ty + sy);
  }

  _two() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 3);
    p.bezierVertex(0, ty / 9, tx / 6, 0, tx / 2, 0);
    p.vertex(tx / 2 + sx, 0);
    p.bezierVertex((5 * tx) / 6 + sx, 0, tx + sx, ty / 9, tx + sx, ty / 3);
    p.vertex(tx + sx, ty / 3 + sy);
    p.bezierVertex(
      tx + sx,
      (2 * ty) / 3 + sy,
      0,
      (2 * ty) / 3 + sy,
      0,
      ty + sy,
    );
    p.vertex(tx + sx, ty + sy);
    p.endShape();
  }

  _three() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx + sx, 0);
    p.vertex(tx / 2 + sx / 2, ty / 3);
    p.bezierVertex(
      (5 * (tx + sx)) / 6,
      ty / 3,
      tx + sx,
      (4 * ty) / 9,
      tx + sx,
      (2 * ty) / 3,
    );
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.bezierVertex(
      tx + sx,
      (8 * ty) / 9 + sy,
      (5 * tx) / 6 + sx,
      ty + sy,
      tx / 2 + sx,
      ty + sy,
    );
    p.vertex(tx / 2, ty + sy);
    p.bezierVertex(0, ty + sy, 0, (2 * ty) / 3 + sy, 0, (2 * ty) / 3 + sy);
    p.endShape();
  }

  _four() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx / 3, 0);
    p.vertex(0, (2 * ty) / 3 + sy);
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.endShape();
    p.line((2 * tx) / 3 + sx, 0, (2 * tx) / 3 + sx, ty + sy);
  }

  _five() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, 0);
    p.vertex(0, 0);
    p.vertex(0, ty / 3);
    p.vertex(tx / 2 + sx, ty / 3);
    p.bezierVertex(
      (4 * tx + 5 * sx) / 6,
      ty / 3,
      tx + sx,
      (4 * ty) / 9,
      tx + sx,
      (2 * ty) / 3,
    );
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.bezierVertex(
      tx + sx,
      (8 * ty) / 9 + sy,
      (5 * tx) / 6 + sx,
      ty + sy,
      tx / 2 + sx,
      ty + sy,
    );
    p.bezierVertex(0, ty + sy, 0, (2 * ty) / 3 + sy, 0, (2 * ty) / 3 + sy);
    p.endShape();
  }

  _six() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.bezierVertex(
      tx + sx,
      (8 * ty) / 9 + sy,
      (5 * tx) / 6 + sx,
      ty + sy,
      tx / 2 + sx,
      ty + sy,
    );
    p.vertex(tx / 2, ty + sy);
    p.bezierVertex(0, ty + sy, 0, (2 * ty) / 3 + sy, 0, (2 * ty) / 3 + sy);
    p.vertex(0, (2 * ty) / 3);
    p.bezierVertex(0, (4 * ty) / 9, tx / 6, ty / 3, tx / 2, ty / 3);
    p.vertex(tx / 2 + sx, ty / 3);
    p.bezierVertex(
      tx + sx,
      ty / 3,
      tx + sx,
      (2 * ty) / 3,
      tx + sx,
      (2 * ty) / 3,
    );
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.endShape();
    p.beginShape();
    p.vertex(0, (2 * ty) / 3);
    p.bezierVertex(0, (2 * ty) / 9, (2 * tx) / 9, 0, (2 * tx) / 3, 0);
    p.endShape();
  }

  _seven() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(tx + sx, 0);
    p.vertex(tx / 2 + sx / 2, ty + sy);
    p.endShape();
  }

  _eight() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 4);
    p.bezierVertex(0, ty / 12, tx / 6, 0, tx / 2, 0);
    p.vertex(tx / 2 + sx, 0);
    p.bezierVertex(tx + sx, 0, tx + sx, ty / 4, tx + sx, ty / 4);
    p.vertex(tx + sx, ty / 4 + sy / 2);
    p.bezierVertex(
      tx + sx,
      (5 * ty) / 12 + sy / 2,
      (5 * tx) / 6 + sx,
      ty / 2 + sy / 2,
      tx / 2 + sx,
      ty / 2 + sy / 2,
    );
    p.vertex(tx / 2, ty / 2 + sy / 2);
    p.bezierVertex(0, ty / 2 + sy / 2, 0, ty / 4 + sy / 2, 0, ty / 4 + sy / 2);
    p.vertex(0, ty / 4);
    p.endShape();

    const yoff = ty / 2 + sy / 2;
    p.beginShape();
    p.vertex(0, yoff + ty / 4);
    p.bezierVertex(0, yoff + ty / 12, tx / 6, yoff, tx / 2, yoff);
    p.vertex(tx / 2 + sx, yoff);
    p.bezierVertex(
      tx + sx,
      yoff,
      tx + sx,
      yoff + ty / 4,
      tx + sx,
      yoff + ty / 4,
    );
    p.vertex(tx + sx, yoff + ty / 4 + sy / 2);
    p.bezierVertex(
      tx + sx,
      yoff + (5 * ty) / 12 + sy / 2,
      (5 * tx) / 6 + sx,
      yoff + ty / 2 + sy / 2,
      tx / 2 + sx,
      yoff + ty / 2 + sy / 2,
    );
    p.vertex(tx / 2, yoff + ty / 2 + sy / 2);
    p.bezierVertex(
      0,
      yoff + ty / 2 + sy / 2,
      0,
      yoff + ty / 4 + sy / 2,
      0,
      yoff + ty / 4 + sy / 2,
    );
    p.vertex(0, yoff + ty / 4);
    p.endShape();
  }

  _nine() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(0, ty / 3);
    p.bezierVertex(0, ty / 9, tx / 6, 0, tx / 2, 0);
    p.vertex(tx / 2 + sx, 0);
    p.bezierVertex(tx + sx, 0, tx + sx, ty / 3, tx + sx, ty / 3);
    p.vertex(tx + sx, ty / 3 + sy);
    p.bezierVertex(
      tx + sx,
      (5 * ty) / 9 + sy,
      (5 * tx) / 6 + sx,
      (2 * ty) / 3 + sy,
      tx / 2 + sx,
      (2 * ty) / 3 + sy,
    );
    p.vertex(tx / 2, (2 * ty) / 3 + sy);
    p.bezierVertex(0, (2 * ty) / 3 + sy, 0, ty / 3 + sy, 0, ty / 3 + sy);
    p.vertex(0, ty / 3);
    p.endShape();
    p.line(tx + sx, ty / 3 + sy, tx + sx, ty + sy);
  }

  _zero() {
    const { p, tx, ty, sx, sy } = this;
    p.beginShape();
    p.vertex(tx / 2 + sx, 0);
    p.quadraticVertex(tx + sx, 0, tx + sx, ty / 3);
    p.vertex(tx + sx, (2 * ty) / 3 + sy);
    p.quadraticVertex(tx + sx, ty + sy, tx / 2 + sx, ty + sy);
    p.vertex(tx / 2, ty + sy);
    p.quadraticVertex(0, ty + sy, 0, (2 * ty) / 3 + sy);
    p.vertex(0, ty / 3);
    p.quadraticVertex(0, 0, tx / 2, 0);
    p.vertex(tx / 2 + sx, 0);
    p.endShape();
    p.line((2 * tx) / 3 + sx, ty / 3, tx / 3, (2 * ty) / 3 + sy);
  }
}
