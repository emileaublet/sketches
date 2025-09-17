import { PenFamily } from "./types";

export const staedtlerPens = {
  name: "Staedtler Triplus Fineliner",
  opaque: false,
  lineWidth: 0.3,
  pens: {
    yellow: [224, 209, 53, 255], // #e0d135
    orange: [235, 140, 44, 255], // #eb8c2c
    red: [226, 52, 21, 255], // #e23415
    fuchsia: [178, 60, 50, 255], // #b23c32
    rose: [240, 123, 170, 255], // #f07bab
    mauve: [187, 75, 194, 255], // #bb4bc2
    violet: [71, 69, 154, 255], // #47459a
    navy: [0, 37, 157, 255], // #00259d
    blue: [27, 80, 179, 255], // #1b50b3
    light_blue: [33, 114, 197, 255], // #2172c5
    baby_blue: [91, 189, 225, 255], // #5bbde1
    teal: [106, 191, 191, 255], // #6abfbf
    green: [29, 93, 60, 255], // #1d5d3c
    dark_green: [123, 179, 51, 255], // #7bb333
    army_green: [100, 111, 44, 255], // #646f2c
    light_brown: [183, 128, 51, 255], // #b78033
    brown: [57, 38, 24, 255], // #392618
    light_grey: [193, 195, 179, 255], // #c1c3b3
    grey: [48, 47, 41, 255], // #302f29
    black: [23, 21, 21, 255], // #171515
  },
} satisfies PenFamily;

export const schneiderMetallicPens = {
  name: "Schneider Metallic",
  opaque: true,
  lineWidth: 0.4,
  pens: {
    silver: [236, 232, 205, 255], // #ece8cd
    vintage_green: [210, 222, 152, 255], // #d2de98
    rose: [201, 170, 173, 255], // #c9aaad
    gold: [225, 206, 111, 255], // #e1ce6f
    polar_blue: [172, 203, 207, 255], // #accbcf
    vintage_red: [220, 160, 149, 255], // #dca095
    frosted_violet: [81, 75, 98, 255], // #514b62
  },
} satisfies PenFamily;

export const gellyRollPens = {
  name: "Gelly Roll",
  opaque: true,
  lineWidth: 0.6,
  pens: {
    "423": [207, 190, 222, 255], // #cfbedf
    "428": [155, 215, 117, 255], // #9bd775
    "431": [106, 194, 203, 255], // #6ac2cb
    "422": [188, 124, 125, 255], // #bc7c7d
    "432": [199, 214, 100, 255], // #c7d664
    "425": [179, 218, 227, 255], // #b3dae3
    "438": [74, 125, 221, 255], // #4a7ddd
    "415": [215, 184, 106, 255], // #d7b86a
    "412": [232, 166, 112, 255], // #e8a670
    "417": [176, 157, 131, 255], // #b09d83
    "419": [255, 116, 102, 255], // #ff7466
    "424": [122, 106, 177, 255], // #7a6ab1
    "421": [248, 128, 205, 255], // #f880cd
    "403": [232, 246, 113, 255], // #e8f375
    "429": [99, 216, 208, 255], // #63d8d0
    "420": [255, 141, 198, 255], // #ff8dc6
    "427": [187, 239, 142, 255], // #bee58e
    "436": [70, 148, 218, 255], // #4694da
    "405": [247, 191, 123, 255], // #f7bf7b
    "418": [255, 155, 164, 255], // #ff9ba4
    "50": [225, 232, 218, 255], // #e1e8da
  },
} satisfies PenFamily;

export const micronPens = {
  name: "Micron",
  opaque: false,
  lineWidth: 0.25,
  pens: {
    brown_012: [153, 102, 51, 255], // #996633
    blue_036: [0, 102, 204, 255], // #0066cc
    black_049: [0, 0, 0, 255], // #000000
    green_029: [0, 153, 0, 255], // #009900
    red_019: [204, 0, 0, 255], // #cc0000
    purple_024: [153, 0, 153, 255], // #990099
  },
} satisfies PenFamily;

export const allPens = {
  staedtlerPens,
  schneiderMetallicPens,
  gellyRollPens,
  micronPens,
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
