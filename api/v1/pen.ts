import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allPens } from "../../src/pens";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json(allPens);
}
