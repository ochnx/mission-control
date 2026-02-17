const WAKE_URL = 'https://mac-mini-von-oskar.tail31e8e5.ts.net/wake';
const WAKE_TOKEN = 'geheim';

/**
 * Wake the agent via simple HTTP POST.
 * The wake-proxy on the Mac Mini handles the request and calls
 * `openclaw system event --mode now` locally.
 */
export async function wakeAgent(text: string): Promise<boolean> {
  try {
    const res = await fetch(WAKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAKE_TOKEN}`,
      },
      body: JSON.stringify({ text: `MC action: ${text}` }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[wake] failed: ${res.status} ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    console.log('[wake] success:', data);
    return data.ok === true;
  } catch (err) {
    console.warn('[wake] error:', err);
    return false;
  }
}

/** Fire-and-forget wake — never blocks UI */
export function fireWake(text: string): void {
  wakeAgent(text).then((ok) => {
    if (!ok) console.warn('[wake] wake failed (non-blocking, command is in DB)');
  });
}
