// Polyfills required for youtubei.js + other web-API consumers on Hermes.
// MUST be imported BEFORE any module that depends on these globals.
// Mirrors the official RN setup from
// https://github.com/luanrt/youtube.js/blob/main/src/platform/react-native.md

import 'event-target-polyfill';
import 'react-native-url-polyfill/auto';
import 'web-streams-polyfill/polyfill';
import 'text-encoding-polyfill';
import { decode, encode } from 'base-64';

// @ts-ignore: `global` is provided by RN/Node
const g: any = globalThis;
// @ts-ignore
const gl: any = typeof global !== 'undefined' ? global : g;

// base-64 — youtubei.js sig parser uses btoa/atob internally.
if (!gl.btoa) gl.btoa = encode;
if (!gl.atob) gl.atob = decode;
if (!g.btoa) g.btoa = encode;
if (!g.atob) g.atob = decode;

// CustomEvent — Hermes ships Event but not CustomEvent.
// See https://github.com/nodejs/node/issues/40678#issuecomment-1126944677
if (typeof gl.CustomEvent !== 'function') {
  class CustomEvent extends Event {
    #detail: any;
    constructor(type: string, options?: { detail?: any } & EventInit) {
      super(type, options);
      this.#detail = options?.detail ?? null;
    }
    get detail() {
      return this.#detail;
    }
  }
  gl.CustomEvent = CustomEvent;
  g.CustomEvent = CustomEvent;
}

// Mirror anything set on globalThis onto global. In some Hermes builds
// globalThis !== global, so a polyfill that targets globalThis only is
// invisible to bare identifier lookups (which resolve via `global`).
for (const key of [
  'EventTarget',
  'Event',
  'CustomEvent',
  'TextEncoder',
  'TextDecoder',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'URL',
  'URLSearchParams',
]) {
  if (gl[key] === undefined && g[key] !== undefined) {
    gl[key] = g[key];
  }
}
