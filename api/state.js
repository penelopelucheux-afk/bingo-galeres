import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "bingo-galeres";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") {
    const data = await redis.get(KEY);
    return res.json(data || null);
  }
  if (req.method === "POST") {
    await redis.set(KEY, req.body);
    return res.json({ ok: true });
  }
  res.status(405).end();
}
