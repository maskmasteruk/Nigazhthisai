import 'dotenv/config';
import ws from 'ws';
if (typeof global !== 'undefined') {
  (global as any).WebSocket = ws;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).WebSocket = ws;
}

