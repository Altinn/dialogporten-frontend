import { decryptPersonUrn } from './personUrnCipher.ts';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const walk = (node: unknown, fn: (value: unknown) => unknown): unknown => {
  if (typeof node === 'string') {
    return fn(node);
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = walk(node[i], fn);
    }
    return node;
  }
  if (isPlainObject(node)) {
    for (const key of Object.keys(node)) {
      node[key] = walk(node[key], fn);
    }
    return node;
  }
  return node;
};

export const decryptPersonUrnsDeep = <T>(data: T): T => walk(data, decryptPersonUrn) as T;
