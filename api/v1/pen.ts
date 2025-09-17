import type { VercelRequest, VercelResponse } from "@vercel/node";
import pens from "../../src/pens/pens.json";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json(pens);
}
