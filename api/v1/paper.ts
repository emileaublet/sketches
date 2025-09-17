import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const todos = [
    { id: 1, title: "Buy milk" },
    { id: 2, title: "Walk dog" },
  ];

  res.status(200).json(todos);
}
