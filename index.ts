// MUST be first: polyfills before any module that may need them
// (expo-router/entry eagerly evaluates routes which transitively pull
// youtubei.js which needs EventTarget, URL, streams, etc.)
import './polyfills';

import 'expo-router/entry';
