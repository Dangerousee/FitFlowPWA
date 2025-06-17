import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { code, state } = req.body;
  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_NAVER_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;

  const tokenUrl = process.env.NEXT_PUBLIC_NAVER_TOKEN_URI +
    `?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`;

  try {
    const response = await fetch(tokenUrl, { method: "GET" });
    const data = await response.json();

    if (data.access_token) {
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: "Failed to get access token", details: data });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
}