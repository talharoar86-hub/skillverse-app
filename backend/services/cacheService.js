const Redis = require('ioredis');
const crypto = require('crypto');

let redis = null;

const getRedis = () => {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    redis.on('error', (err) => console.warn('Redis connection error:', err.message));
    redis.on('connect', () => console.log('Redis Connected'));
    try { redis.connect(); } catch {}
  }
  return redis;
};

const cacheMiddleware = (prefix, ttl = 300) => async (req, res, next) => {
  const client = getRedis();
  if (!client) return next();

  try {
    const key = `${prefix}:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
    const cached = await client.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      client.setex(key, ttl, JSON.stringify(data)).catch(() => {});
      return originalJson(data);
    };
    next();
  } catch {
    next();
  }
};

const invalidateCache = async (pattern) => {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch {}
};

const setCache = async (key, data, ttl = 300) => {
  const client = getRedis();
  if (!client) return;
  try { await client.setex(key, ttl, JSON.stringify(data)); } catch {}
};

const getCache = async (key) => {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

module.exports = { getRedis, cacheMiddleware, invalidateCache, setCache, getCache };
