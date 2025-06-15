import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE_URL = "https://api.wellcomecollection.org/catalogue/v2/concepts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query; // Extract id from the dynamic route parameter

  if (typeof id !== "string") {
    res.status(400).json({ error: "Concept ID must be a string" });
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      console.error(`API error for concept ${id}: ${response.status}, ${await response.text()}`);
      res.status(response.status).json({ error: `Failed to fetch concept ${id}` });
      return;
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching concept ${id}:`, error);
    res.status(500).json({ error: `Internal server error while fetching concept ${id}` });
  }
}
