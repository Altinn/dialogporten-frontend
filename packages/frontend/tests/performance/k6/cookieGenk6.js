import crypto from 'k6/crypto';
import redis from 'k6/experimental/redis';
import encoding from 'k6/encoding';

const redisPwd = __ENV.REDIS_PASSWORD; 
const redisUrl = __ENV.REDIS_URL; 
const redisPort = __ENV.REDIS_PORT; 
const signatureSecret = __ENV.SIGNATURE_SECRET;

const redisHost = `rediss://:${redisPwd}=@${redisUrl}:${redisPort}`; // Use environment variables for password, URL, and port
const redisClient = new redis.Client(redisHost);

function generateSessionId() {
    return encoding.b64encode(crypto.randomBytes(24))
        .replace(/\+/g, '-')   // base64url
        .replace(/\//g, '_')
        .replace(/=+$/, '');   // standard base64
        
}

async function storeSessionInRedis(key, value, ttlSeconds = 3600) {
    try {
        await redisClient.set(key, value, ttlSeconds);
    } catch (err) {
        console.error('Failed to store session:', err);
        throw err;
    }
}

const base64PaddingRE = /=/gu

function generateFastifySession(accessToken, secret) {
    const sessionId = generateSessionId();
    let sign = crypto.createHMAC('sha256', secret);
    sign.update(sessionId);
    const signature = (sign.digest('base64')).replace(base64PaddingRE, '');

    const now = new Date();
    const decoded = JSON.parse(encoding.b64decode(accessToken.split('.')[1].toString(), "rawstd", "s"));
    const pid = decoded.pid;
    const exp = decoded.exp;

    const expiresIn = new Date(exp * 1000).toISOString();

    const session = {
        cookie: {
            expires: null,
            originalMaxAge: null,
            sameSite: null,
            secure: false,
            path: '/',
            httpOnly: true,
            domain: null,
        },
        token: {
            access_token: accessToken,
            access_token_expires_at: expiresIn,
            tokenUpdatedAt: now.toISOString(),
        },
        pid,
        locale: 'en',
    };

    const cookie = {
        name: "arbeidsflate",
        value: `${sessionId}.${signature}`
    }

    return {
        redisKey: `sess:${sessionId}`,
        redisValue: JSON.stringify(session),
        cookie,
    };
}

export async function getCookie(accessToken) {
    const { redisKey, redisValue, cookie } = generateFastifySession(accessToken, signatureSecret);
    await storeSessionInRedis(redisKey, redisValue);
    return cookie;
}