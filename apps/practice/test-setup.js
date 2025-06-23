import { TextEncoder, TextDecoder } from 'util';

/* https://github.com/tailwindlabs/headlessui/discussions/2832#discussioncomment-9408375 */
global.ResizeObserver = class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
