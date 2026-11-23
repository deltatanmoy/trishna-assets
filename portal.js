/*! Trishna portal – login + study material (Supabase free tier)
 *  Host this file outside Blogger (GitHub Pages / jsDelivr / R2), then set in the theme:
 *    TPS.PORTAL_JS='https://…/portal.js'
 *  and, before it loads, define window.TPS_PORTAL={url:'https://xxxx.supabase.co',key:'PUBLIC_ANON_KEY'}
 *  (Edit the two constants below instead if you prefer.)
 */
(function () {
  var CFG = window.TPS_PORTAL || { url: 'PASTE_SUPABASE_URL', key: 'PASTE_SUPABASE_ANON_KEY' };
  var root = document.getElementById('portal-app');
  if (!root) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { try { var x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch (e) { return '#'; } }
  if (/PASTE_/.test(CFG.url)) { root.innerHTML = '<p>Portal is not configured yet. Please call or WhatsApp us.</p>'; return; }

  var sb, user = null, items = [], cat = 'all';
  var S = { bn: { login: 'লগইন / সাইন-আপ', google: 'Google দিয়ে চালিয়ে যান', mail: 'ইমেইলে লগইন-লিংক পাঠান', ph: 'আপনার ইমেইল', sent: 'আপনার ইমেইলে লিংক পাঠানো হয়েছে—খুলে লগইন সম্পন্ন করুন।', out: 'লগআউট', hi: 'স্বাগতম', all: 'সব', lock: '🔒 লগইন করলে দেখা যাবে', open: 'খুলুন', none: 'এখনো কিছু যোগ হয়নি।', note: 'লগইন করলে সদস্যদের জন্য বিশেষ ম্যাটেরিয়াল পাবেন।' } };
  var T = S.bn;

  function load(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = function () { root.innerHTML = '<p>Could not load login service. Try again later.</p>'; }; document.head.appendChild(s); }

  function draw() {
    var cats = ['all'].concat(items.map(function (i) { return i.category || 'General'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var h = '<div class="pt-bar">';
    h += user ? '<span>' + T.hi + ', <b>' + esc(user.email) + '</b></span> <button type="button" class="tps-btn tps-btn-alt" id="pt-out">' + T.out + '</button>'
      : '<div class="pt-login"><b>' + T.login + '</b><button type="button" class="tps-btn" id="pt-g">' + T.google + '</button><form id="pt-f"><input type="email" required placeholder="' + T.ph + '" autocomplete="email" aria-label="email"/><button class="tps-btn tps-btn-alt" type="submit">' + T.mail + '</button></form><small>' + T.note + '</small></div>';
    h += '</div><div class="q-cats">' + cats.map(function (c) { return '<button type="button" data-c="' + esc(c) + '" class="' + (c === cat ? 'on' : '') + '">' + esc(c === 'all' ? T.all : c) + '</button>'; }).join('') + '</div><div class="pt-list">';
    var n = 0;
    items.forEach(function (it) {
      if (cat !== 'all' && (it.category || 'General') !== cat) return; n++;
      var locked = !it.is_public && !user;
      h += '<div class="pt-it"><div><b>' + esc(it.title) + '</b><small>' + esc(it.category || '') + ' · ' + esc((it.lang || '').toUpperCase()) + ' · ' + esc(it.kind || '') + '</small><p>' + esc(it.description) + '</p></div>' +
        (locked ? '<span class="pt-lock">' + T.lock + '</span>' : '<button type="button" class="tps-btn" data-id="' + it.id + '">' + T.open + '</button>') + '</div>';
    });
    if (!n) h += '<p>' + T.none + '</p>';
    h += '</div>';
    root.innerHTML = h;
    var out = root.querySelector('#pt-out'); if (out) out.onclick = function () { sb.auth.signOut(); };
    var g = root.querySelector('#pt-g'); if (g) g.onclick = function () { sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] + '#tps-portal' } }); };
    var f = root.querySelector('#pt-f'); if (f) f.onsubmit = function (e) { e.preventDefault(); sb.auth.signInWithOtp({ email: f.querySelector('input').value, options: { emailRedirectTo: location.href.split('#')[0] + '#tps-portal' } }).then(function (r) { alert(r.error ? r.error.message : T.sent); }); };
    root.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { cat = b.getAttribute('data-c'); draw(); }; });
    root.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { openItem(items.filter(function (x) { return String(x.id) === b.getAttribute('data-id'); })[0]); }; });
  }
  function openItem(it) {
    if (!it) return;
    if (it.file_path) {
      sb.storage.from('materials').createSignedUrl(it.file_path, 300).then(function (r) { if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener'); else alert(r.error && r.error.message); });
    } else if (it.url) { window.open(safeUrl(it.url), '_blank', 'noopener'); }
  }
  function fetchItems() {
    sb.from('materials').select('*').order('sort', { ascending: true }).then(function (r) { items = r.data || []; draw(); });
  }
  load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', function () {
    sb = window.supabase.createClient(CFG.url, CFG.key);
    sb.auth.getSession().then(function (r) { user = r.data.session && r.data.session.user; fetchItems(); });
    sb.auth.onAuthStateChange(function (_e, s) { user = s && s.user; fetchItems(); });
  });
  var st = document.createElement('style');
  st.textContent = '.pt-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px}.pt-login{display:flex;flex-direction:column;gap:8px;width:100%;max-width:420px}.pt-login form{display:flex;gap:6px;flex-wrap:wrap}.pt-login input{flex:1 1 180px;padding:11px;border:1.5px solid #cfdbe6;border-radius:12px;font-size:16px}.pt-it{display:flex;gap:12px;justify-content:space-between;align-items:center;border:1.5px solid #e6edf3;border-radius:16px;padding:12px;margin:9px 0;background:#fff}.pt-it p{margin:4px 0 0}.pt-it small{display:block;color:#64748b}.pt-lock{font-weight:800;color:#a56b00;white-space:nowrap}';
  document.head.appendChild(st);
})();
