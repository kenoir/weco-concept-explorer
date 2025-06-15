import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE_URL = "https://api.wellcomecollection.org/catalogue/v2/works";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { subjects } = req.query; // Extract subjects (concept ID) from query parameters

  if (typeof subjects !== "string") {
    res.status(400).json({ error: "Subjects (concept ID) must be a string" });
    return;
  }

  // Construct the URL with the subjects query parameter
  // Example: https://api.wellcomecollection.org/catalogue/v2/works?subjects=avkn7rq3
  const fetchUrl = `${API_BASE_URL}?subjects=${encodeURIComponent(subjects)}`;

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.error(`API error for works with subject ${subjects}: ${response.status}, ${await response.text()}`);
      res.status(response.status).json({ error: `Failed to fetch works for subject ${subjects}` });
      return;
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching works for subject ${subjects}:`, error);
    res.status(500).json({ error: `Internal server error while fetching works for subject ${subjects}` });
  }
}
