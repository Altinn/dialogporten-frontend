import type { SessionStore } from '@fastify/session';
import type { Session } from 'fastify';
import type { Redis } from 'ioredis';

type Callback = Parameters<SessionStore['destroy']>[1];
type CallbackSession = Parameters<SessionStore['get']>[1];
type RedisSession = Session & { __redisSessionId?: string };

export const sessionKeyPrefix = 'sess:';
export const revokedSessionKeyPrefix = 'sess-revoked:';
export const idpSessionKeyPrefix = 'idp-sessions:';
const revokedIdpSessionKeyPrefix = 'idp-sid-revoked:';
const defaultTtlSeconds = 60 * 60 * 24;
export const revokedSessionTtlSeconds = 2 * 60;

const setUnlessRevokedScript = `
if redis.call('EXISTS', KEYS[2]) == 1 then
  return 0
end
if #KEYS == 5 and redis.call('EXISTS', KEYS[5]) == 1 then
  return 0
end
local result = redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2], ARGV[3])
if result and #KEYS == 5 then
  redis.call('SADD', KEYS[3], ARGV[4])
  if redis.call('TTL', KEYS[3]) < tonumber(ARGV[2]) then
    redis.call('EXPIRE', KEYS[3], ARGV[2])
  end
  redis.call('SET', KEYS[4], ARGV[4], 'EX', ARGV[2])
end
return result
`;

const destroyIdpSessionsScript = `
redis.call('SET', KEYS[3], '1', 'EX', ARGV[4])
local sessions = redis.call('SMEMBERS', KEYS[1])
local legacy = redis.call('GET', KEYS[2])
if legacy then table.insert(sessions, legacy) end
for _, sessionId in ipairs(sessions) do
  redis.call('SET', ARGV[1] .. sessionId, '1', 'EX', ARGV[3])
  redis.call('DEL', ARGV[2] .. sessionId)
end
return redis.call('DEL', KEYS[1], KEYS[2])
`;

export const destroyIdpSessions = (redis: Redis, sid: string) =>
  redis.eval(
    destroyIdpSessionsScript,
    3,
    idpSessionKeyPrefix + sid,
    `idp-sid:${sid}`,
    revokedIdpSessionKeyPrefix + sid,
    revokedSessionKeyPrefix,
    sessionKeyPrefix,
    revokedSessionTtlSeconds,
    defaultTtlSeconds,
  );

const getTtlSeconds = (session: Session) => {
  const expires = session.cookie.expires;
  const now = Date.now();
  const cookieTtl = expires ? Math.ceil((new Date(expires).getTime() - now) / 1000) : defaultTtlSeconds;
  if (!Number.isFinite(cookieTtl)) return 0;
  if (!session.token) return cookieTtl;
  const tokenExpiry = Math.max(
    new Date(session.token.access_token_expires_at).getTime() || 0,
    new Date(session.token.refresh_token_expires_at).getTime() || 0,
  );
  return Math.min(cookieTtl, Math.ceil((tokenExpiry - now) / 1000));
};

const settle = <T>(promise: Promise<T>, callback: (error: unknown, result?: T) => void) => {
  promise.then(
    (result) => callback(null, result),
    // Redis command errors can include the full token-bearing command arguments.
    () => callback(new Error('Redis session operation failed')),
  );
};

export class RevocableRedisStore implements SessionStore {
  constructor(private readonly redis: Redis) {}

  get(sessionId: string, callback: CallbackSession) {
    settle(
      this.redis.get(sessionKeyPrefix + sessionId).then((data) => {
        if (!data) return null;
        // Fastify reconstructs sessions by copying enumerable string keys, including for legacy Redis data.
        return { ...JSON.parse(data), __redisSessionId: sessionId } as RedisSession;
      }),
      callback,
    );
  }

  set(sessionId: string, session: RedisSession, callback: Callback) {
    const ttlSeconds = getTtlSeconds(session);
    if (ttlSeconds <= 0) {
      this.destroy(sessionId, callback);
      return;
    }
    const isPersisted = session.__redisSessionId === sessionId;
    const keys = [sessionKeyPrefix + sessionId, revokedSessionKeyPrefix + sessionId];
    // Keep the legacy index usable by older replicas during a rolling deployment.
    if (session.idpSid) {
      keys.push(
        idpSessionKeyPrefix + session.idpSid,
        `idp-sid:${session.idpSid}`,
        revokedIdpSessionKeyPrefix + session.idpSid,
      );
    }
    settle(
      this.redis
        .eval(
          setUnlessRevokedScript,
          keys.length,
          ...keys,
          JSON.stringify(session),
          ttlSeconds,
          isPersisted ? 'XX' : 'NX',
          sessionId,
        )
        .then((result) => {
          if (result === 'OK') {
            session.__redisSessionId = sessionId;
          } else if (!isPersisted) {
            throw new Error('Session could not be created');
          }
        }),
      callback,
    );
  }

  destroy(sessionId: string, callback: Callback) {
    settle(
      this.redis
        .multi()
        .set(revokedSessionKeyPrefix + sessionId, '1', 'EX', revokedSessionTtlSeconds)
        .del(sessionKeyPrefix + sessionId)
        .exec()
        .then((results) => {
          if (!results) throw new Error('Session revocation transaction aborted');
          for (const [error] of results) {
            if (error) throw error;
          }
        }),
      callback,
    );
  }
}
