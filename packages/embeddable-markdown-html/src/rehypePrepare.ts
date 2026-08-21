import type { FormPolicy } from './formPolicy.ts';
import { resolveFormAction } from './formPolicy.ts';
import { sanitizeStyle } from './styleAttribute.ts';

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

export const formActionPlaceholder = /^\{formAction:([^}]+)\}$/;

export const formTokenPlaceholder = /\{formToken\}/g;

const sameOrigin = (url: string, baseUrl: string | undefined): boolean => {
  if (!baseUrl) {
    return false;
  }
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
};

const resolvePlaceholderAction = (action: unknown, policy: FormPolicy): string | undefined => {
  if (typeof action !== 'string') {
    return undefined;
  }
  const named = action.trim().match(formActionPlaceholder);
  if (!named || !policy.baseUrl) {
    return undefined;
  }
  try {
    return new URL(named[1], policy.baseUrl).href;
  } catch {
    return undefined;
  }
};

const visit = (node: HastNode, policy: FormPolicy, token: string | undefined) => {
  let scopedToken = token;

  if (node.type === 'element' && node.properties) {
    const properties = node.properties;
    if (properties.style !== undefined) {
      const style = sanitizeStyle(properties.style);
      if (style === undefined) {
        delete properties.style;
      } else {
        properties.style = style;
      }
    }

    if (node.tagName === 'form') {
      const resolvedPlaceholder = resolvePlaceholderAction(properties.action, policy);
      if (resolvedPlaceholder !== undefined) {
        properties.action = resolvedPlaceholder;
      }
      const action = resolveFormAction(properties.action, policy);
      scopedToken = action.url !== undefined && sameOrigin(action.url, policy.baseUrl) ? policy.token : undefined;
    }

    if (node.tagName === 'input' && typeof properties.value === 'string') {
      properties.value = properties.value.replace(formTokenPlaceholder, scopedToken ?? '');
    }
  }

  for (const child of node.children ?? []) {
    visit(child, policy, scopedToken);
  }
};

export const rehypePrepare = (policy: FormPolicy = {}) => {
  return (tree: HastNode) => {
    visit(tree, policy, undefined);
  };
};
