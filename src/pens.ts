import pens from "./pens/pens.json";

export const allPens = {
  ...pens,
} as const;

// export type DotPen that is a dot notation way to find pen (e.g. staedtlerPens.red)
export type DotPen = {
  [K in keyof typeof allPens]: `${K &
    string}.${keyof (typeof allPens)[K]["pens"] & string}`;
}[keyof typeof allPens];

export const all = (family: keyof typeof allPens) => {
  return Object.entries(allPens[family].pens).map(
    ([penName]) => `${family}.${penName}` as DotPen
  );
};
