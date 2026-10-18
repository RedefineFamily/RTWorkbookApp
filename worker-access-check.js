// Drop-in access check for the Religious Trauma Workbook Worker.
//
// WHAT CHANGES: the gate used to let in any confirmed Kit subscriber.
// Now it lets in (a) anyone who has bought the $8 workbook product in Kit
// Commerce, and (b) anyone tagged as a grandfathered free user (people who
// got it before the price went on). Strategy 1 of the workbook is free to
// everyone and never reaches this check.
//
// Kit's free plan has no automations, so buyers are NOT tagged. This reads
// Kit's purchase records directly instead.
//
// HOW TO USE: in the Worker's `subscribe` handler, replace the existing
// "is this a confirmed subscriber?" lookup with a call to
// checkWorkbookAccess(email, env). It returns one of:
//   { verified: true }                      -> unlock
//   { verified: false, purchased: false }   -> show "no purchase yet" + buy button
//   { verified: false, pending: true }      -> subscriber exists but unconfirmed
//   { verified: false }                     -> not on the list at all
//
// The chat route should call the same function so access is enforced
// server-side, not just at the gate.
//
// SECRETS (Cloudflare > Worker > Settings > Variables):
//   KIT_API_KEY           Kit v4 API key (Kit > Settings > Developer)
//   WORKBOOK_PRODUCT_ID   293921  (the "Religious Trauma Recovery Workbook" product)
//   WORKBOOK_FREE_TAG     name of the grandfather tag, e.g. "workbook-free"
//
// KIT SIDE (one time): Subscribers > select all > Add tag "workbook-free".

const KIT_API = 'https://api.kit.com/v4';

async function kitGet(path, env) {
  const res = await fetch(KIT_API + path, {
    headers: { 'X-Kit-Api-Key': env.KIT_API_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Kit ${res.status} on ${path}`);
  return res.json();
}

// Walk the purchases list (newest first) looking for this email + product.
// Volume is small, so a few pages is plenty; cap it so a bad day can't loop.
async function hasPurchased(email, productId, env) {
  let after = '';
  for (let page = 0; page < 10; page++) {
    const data = await kitGet(`/purchases?per_page=500${after ? '&after=' + encodeURIComponent(after) : ''}`, env);
    for (const p of data.purchases || []) {
      if ((p.email_address || '').toLowerCase() !== email) continue;
      if (p.status && String(p.status).toLowerCase() === 'refunded') continue;
      const products = p.products || [];
      if (products.some(pr => String(pr.id) === String(productId) || String(pr.pid) === String(productId))) return true;
    }
    const pg = data.pagination || {};
    if (!pg.has_next_page || !pg.end_cursor) break;
    after = pg.end_cursor;
  }
  return false;
}

export async function checkWorkbookAccess(email, env) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean.includes('@')) return { verified: false };

  // 1. Bought it?
  const productId = env.WORKBOOK_PRODUCT_ID || '293921';
  if (await hasPurchased(clean, productId, env)) return { verified: true };

  // 2. Grandfathered free user?
  const found = await kitGet(`/subscribers?email_address=${encodeURIComponent(clean)}`, env);
  const sub = (found.subscribers || [])[0];
  if (!sub) return { verified: false };

  const tagged = await kitGet(`/subscribers/${sub.id}/tags`, env);
  const names = new Set((tagged.tags || []).map(t => (t.name || '').toLowerCase()));
  const freeTag = (env.WORKBOOK_FREE_TAG || 'workbook-free').toLowerCase();
  if (names.has(freeTag)) return { verified: true };

  // 3. On the list but hasn't bought.
  if (sub.state && sub.state !== 'active') return { verified: false, pending: true };
  return { verified: false, purchased: false };
}
