import PEMB from './pembahasan.json';

const J = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    if (!p.startsWith('/api/')) return new Response('Not found', { status: 404 });
    const pin = env.GURU_PIN || '';
    const guruOk = !pin || req.headers.get('x-guru-pin') === pin;
    const stub = env.KELAS.get(env.KELAS.idFromName('utama'));
    const fwd = (path, init) => stub.fetch('https://do' + path, init);

    if (p === '/api/pembahasan') return guruOk ? J(PEMB) : J({ error: 'pin' }, 401);
    if (p === '/api/sesi') {
      if (req.method === 'GET') return fwd('/sesi');
      if (req.method === 'POST') {
        if (!guruOk) return J({ error: 'pin' }, 401);
        return fwd('/sesi', { method: 'POST', body: await req.text() });
      }
    }
    if (p === '/api/progres' && req.method === 'GET') return guruOk ? fwd('/progres') : J({ error: 'pin' }, 401);
    const m = p.match(/^\/api\/progres\/([a-z0-9-]{1,40})$/);
    if (m) {
      if (req.method === 'GET') return fwd('/progres/' + m[1]);
      if (req.method === 'PUT') {
        const t = await req.text();
        if (t.length > 6000) return J({ error: 'terlalu besar' }, 413);
        return fwd('/progres/' + m[1], { method: 'PUT', body: t });
      }
    }
    return J({ error: 'tidak ditemukan' }, 404);
  },
};

export class Kelas {
  constructor(state) {
    this.st = state.storage;
  }
  async fetch(req) {
    const p = new URL(req.url).pathname;
    const n = Date.now();
    if (p === '/sesi') {
      let s = (await this.st.get('sesi')) || { status: 'off', epoch: 0, pz: 0, pzAt: null, u: 0 };
      if (req.method === 'POST') {
        let a = '';
        try { a = JSON.parse(await req.text()).aksi; } catch (e) {}
        const ep = s.epoch || 0;
        if (a === 'mulai') s = { status: 'on', epoch: ep + 1, pz: 0, pzAt: null };
        else if (a === 'aktif' || (a === 'jeda' && s.status === 'paused'))
          s = { status: 'on', epoch: ep, pz: (s.pz || 0) + (s.pzAt ? n - s.pzAt : 0), pzAt: null };
        else if (a === 'jeda' && s.status === 'on') s = { status: 'paused', epoch: ep, pz: s.pz || 0, pzAt: n };
        else if (a === 'mati') s = { status: 'off', epoch: ep, pz: s.pz || 0, pzAt: s.pzAt || n };
        else return J({ error: 'aksi tidak valid' }, 400);
        s.u = n;
        await this.st.put('sesi', s);
      }
      return J({ sesi: s, now: n });
    }
    const m = p.match(/^\/progres\/(.+)$/);
    if (m) {
      const k = 'p:' + m[1];
      if (req.method === 'PUT') {
        let d;
        try { d = JSON.parse(await req.text()); } catch (e) { return J({ error: 'json' }, 400); }
        if (!d || typeof d !== 'object' || typeof d.i !== 'number' || typeof d.a !== 'object') return J({ error: 'bentuk' }, 400);
        d.nama = String(d.nama || '').slice(0, 40);
        await this.st.put(k, d);
        return J({ ok: 1 });
      }
      return J((await this.st.get(k)) || null);
    }
    if (p === '/progres') return J([...(await this.st.list({ prefix: 'p:' })).values()]);
    return J({ error: 'tidak ditemukan' }, 404);
  }
}
