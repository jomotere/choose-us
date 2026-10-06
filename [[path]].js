const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const rid = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
const load = async (db, code) => {
  const { results } = await db.prepare('select role,data from couples where code=?').bind(code).all();
  const d = {}; for (const r of results) d[r.role] = JSON.parse(r.data); return d;
};
const put = (db, code, role, o) => db.prepare('insert or replace into couples(code,role,data) values(?,?,?)').bind(code, role, JSON.stringify(o)).run();

// Each partner only ever receives their own answers plus a combined result.
const view = (d, role) => {
  const me = d[role], p = d[role === 'a' ? 'b' : 'a'];
  const out = { role, me: { topics: me.topics } };
  if (p && p.declined) return { ...out, stage: 'declined' };
  if (!me.ans) return { ...out, stage: 'questions' };
  if (!p || !p.ans) return { ...out, stage: 'waiting' };
  if (!(me.ready && p.ready)) return { ...out, stage: 'notboth' };
  out.stage = 'unlocked';
  if (me.topics && p.topics) {
    const a = d.a.topics, b = d.b.topics;
    out.roadmap = a.map((x, i) => x === 'Unsure' || b[i] === 'Unsure' ? 'important' : x === 'Settled' && b[i] === 'Settled' ? 'aligned' : 'discuss');
  }
  return out;
};

export async function onRequest({ request, env }) {
  const url = new URL(request.url), r = url.pathname.replace(/^\/api\//, ''), db = env.DB;
  const b = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
  const code = String(b.code || url.searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const tok = String(b.token || url.searchParams.get('token') || '');

  if (r === 'create') {
    const c = rid(6), t = rid(24);
    await put(db, c, 'a', { token: t, name: String(b.name || '').slice(0, 40), ans: null, topics: null });
    return j({ code: c, token: t, role: 'a' });
  }
  const d = await load(db, code);
  if (!d.a) return j({ error: 'Invitation not found.' }, 404);
  if (r === 'join') {
    if (d.b) return j({ error: 'This invitation has already been opened.' }, 409);
    const t = rid(24); await put(db, code, 'b', { token: t, ans: null, topics: null });
    return j({ code, token: t, role: 'b' });
  }
  if (r === 'decline') { if (!d.b) await put(db, code, 'b', { declined: true }); return j({ ok: 1 }); }

  const role = ['a', 'b'].find(x => d[x] && d[x].token && d[x].token === tok);
  if (!role) return j({ error: 'Not authorised.' }, 401);
  const me = d[role];
  if (r === 'save') {
    if (Array.isArray(b.ans) && b.ans.length === 5) { me.ans = b.ans.map(x => String(x).slice(0, 40)); me.ready = Number(b.ans[4]) >= 3; }
    if (Array.isArray(b.topics) && b.topics.length === 7) me.topics = b.topics.map(x => String(x).slice(0, 10));
    await put(db, code, role, me); d[role] = me;
  }
  return j(view(d, role));
}
