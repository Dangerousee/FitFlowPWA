import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { code } = req.body;
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_KAKAO_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  const tokenUrl = process.env.NEXT_PUBLIC_KAKAO_TOKEN_URI;
  if (!tokenUrl) throw new Error('tokenUrl이 정의되지 않았습니다.');

  if (!clientId || !clientSecret || !redirectUri || !code) {
    throw new Error('토큰 요청에 필요한 값이 누락되었습니다.');
  }

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

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