import { NextApiRequest, NextApiResponse } from 'next';

export function applyCors(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청은 여기서 바로 응답 종료
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}