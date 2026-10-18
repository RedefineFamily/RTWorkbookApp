// Drop-in access check for the Religious Trauma Workbook Worker.
//
// WHAT CHANGES: the gate used to let in any confirmed Kit subscriber.
// Now it lets in (a) anyone tagged as a buyer of the $8 workbook, and
// (b) anyone tagged as a grandfathered free user (people who got it before
// the price went on).
//
// HOW TO USE: in the Worker's `subscribe` handler, replace the existing
// "is this a confirmed subscriber?" lookup with a call to
// checkWorkbookAccess(email, env). It returns one of:
//   { verified: true }                      -> unlock
//   { verified: false, purchased: false }   -> show "no purchase yet" + buy button
//   { verified: false, pending: true }      -> subscriber exists but unconfirmed
//   { verified: false }                     -> not on the list at all
//
// Any request that already requires access (the chat route) should call the
// same function so the tag is enforced server-side, not just at the gate.
//
// SECRETS (Cloudflare > Worker > Settings > Variables):
//   KIT_API_KEY          Kit v4 API key (Kit > Settings > Developer)
//   WORKBOOK_TAG         name of the buyer tag, e.g. "workbook-buyer"
//   WORKBOOK_FREE_TAG    name of the grandfather tag, e.g. "workbook-free"
//
// KIT SIDE: Commerce > Products > the $8 product > Settings > "Tag purchasers
// with" -> workbook-buyer. Then tag every existing subscriber with
// workbook-free once (bulk action from the Subscribers page).

const KIT_API = 'https://api.kit.com/v4';

async function kitGet(path, env) {
  const res = await fetch(KIT_API + path, {
    headers: { 'X-Kit-Api-Key': env.KIT_API_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Kit ${res.status} on ${path}`);
  return res.json();
}

export async function checkWorkbookAccess(email, env) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean.includes('@')) return { verified: false };

  // 1. Find the subscriber.
  const found = await kitGet(`/subscribers?email_address=${encodeURIComponent(clean)}`, env);
  const sub = (found.subscribers || [])[0];
  if (!sub) return { verified: false };

  // 2. Read their tags.
  const tagged = await kitGet(`/subscribers/${sub.id}/tags`, env);
  const names = new Set((tagged.tags || []).map(t => (t.name || '').toLowerCase()));

  const buyerTag = (env.WORKBOOK_TAG || 'workbook-buyer').toLowerCase();
  const freeTag = (env.WORKBOOK_FREE_TAG || 'workbook-free').toLowerCase();

  if (names.has(buyerTag) || names.has(freeTag)) return { verified: true };

  // 3. On the list but hasn't bought.
  if (sub.state && sub.state !== 'active') return { verified: false, pending: true };
  return { verified: false, purchased: false };
}
