import type { NextApiRequest, NextApiResponse } from "next";
import apiClient from '@lib/shared/network/axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용되지 않은 요청 방식입니다." });

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "액세스 토큰이 필요합니다." });
  }

  try {
    const { data } = await apiClient.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (data.response) {
      res.status(200).json(data.response);
    } else {
      res.status(400).json({
        error: '사용자 정보를 가져오는 데 실패했습니다.',
        details: data,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: '서버 오류',
      details: error,
    });
  }
}