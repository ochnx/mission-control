const GATEWAY_URL = 'wss://mac-mini-von-oskar.tail31e8e5.ts.net';
const GATEWAY_TOKEN = 'geheim';

export async function wakeAgent(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve(false);
    }, 5000);

    let ws: WebSocket;
    try {
      ws = new WebSocket(GATEWAY_URL);
    } catch {
      clearTimeout(timeout);
      resolve(false);
      return;
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', params: { auth: { token: GATEWAY_TOKEN } } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'hello-ok') {
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
        }
      } catch {
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
  });
}

/** Fire-and-forget wake — never blocks UI */
export function fireWake(text: string): void {
  wakeAgent(text).then(() => {});
}
