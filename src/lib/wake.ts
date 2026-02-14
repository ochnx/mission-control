const GATEWAY_URL = 'wss://mac-mini-von-oskar.tail31e8e5.ts.net';
const GATEWAY_TOKEN = 'geheim';

export async function wakeAgent(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[wake] timeout after 5s — gateway unreachable');
      try { ws.close(); } catch {}
      resolve(false);
    }, 5000);

    let ws: WebSocket;
    try {
      // Pass token as query param (some gateways reject connect-frame auth from browsers)
      ws = new WebSocket(`${GATEWAY_URL}?token=${GATEWAY_TOKEN}`);
    } catch (err) {
      console.warn('[wake] WebSocket constructor failed:', err);
      clearTimeout(timeout);
      resolve(false);
      return;
    }

    ws.onopen = () => {
      console.log('[wake] connected to gateway');
      // Also send token in connect frame as fallback
      ws.send(JSON.stringify({ type: 'connect', params: { auth: { token: GATEWAY_TOKEN } } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'hello-ok') {
          console.log('[wake] authenticated, sending wake request');
          ws.send(
            JSON.stringify({
              id: Date.now().toString(),
              type: 'req',
              method: 'system.wake',
              params: { text: `MC action: ${text}`, mode: 'now' },
            })
          );
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        } else {
          console.warn('[wake] unexpected message:', msg);
        }
      } catch {
        console.warn('[wake] failed to parse message:', event.data);
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    };

    ws.onerror = (event) => {
      console.warn('[wake] WebSocket error:', event);
      clearTimeout(timeout);
      resolve(false);
    };

    ws.onclose = (event) => {
      console.warn(`[wake] WebSocket closed: code=${event.code} reason=${event.reason}`);
    };
  });
}

/** Fire-and-forget wake — never blocks UI */
export function fireWake(text: string): void {
  wakeAgent(text).then((ok) => {
    if (!ok) console.warn('[wake] wake failed (non-blocking, command is in DB)');
  });
}
