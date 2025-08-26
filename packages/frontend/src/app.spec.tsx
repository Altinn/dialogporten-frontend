import 'web-streams-polyfill/es6';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { customRender } from '../utils/test-utils.tsx';
import App from './App.tsx';
import { server } from './mocks/node.ts';

describe('App Smoke Test', async () => {
  beforeAll(async () => {
    server.listen();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('renders without crashing', () => {
    const { getByRole } = customRender(<App />);
    const appElement = getByRole('main');
    expect(appElement).toBeTruthy();
  });
});
