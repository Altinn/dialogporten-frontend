import { gunzipSync } from 'node:zlib';
import compress from '@fastify/compress';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { graphqlCompression } from '../src/graphql/compression.ts';

const largeBody = {
  items: Array.from({ length: 400 }, (_, i) => ({ id: i, title: `dialog-${i}`, summary: 'x'.repeat(64) })),
};

describe('graphql response compression', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();
    await server.register(compress, { global: false });
    await server.register(
      fp(async (instance) => {
        instance.post('/api/graphql', { compress: graphqlCompression }, async (request) => request.body);
        instance.post('/api/other', async (request) => request.body);
      }),
    );
  });

  afterAll(async () => {
    await server.close();
  });

  it('gzips large graphql responses for clients that accept gzip', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: { 'accept-encoding': 'gzip' },
      payload: largeBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers.vary).toContain('accept-encoding');
    expect(response.rawPayload.length).toBeLessThan(JSON.stringify(largeBody).length / 5);
    expect(JSON.parse(gunzipSync(response.rawPayload).toString('utf-8'))).toEqual(largeBody);
  });

  it('leaves responses below the threshold uncompressed', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: { 'accept-encoding': 'gzip' },
      payload: { ok: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.json()).toEqual({ ok: true });
  });

  it('leaves responses uncompressed when the client does not accept gzip', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: { 'accept-encoding': 'br' },
      payload: largeBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.json()).toEqual(largeBody);
  });

  it('does not compress routes that have not opted in', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/other',
      headers: { 'accept-encoding': 'gzip' },
      payload: largeBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.json()).toEqual(largeBody);
  });
});
