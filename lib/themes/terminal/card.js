// Terminal: a window drops in, the title is typed at a prompt, the subtitle
// prints as output. On the way out the screen switches off.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const mono = () => cfg().theme?.fonts?.mono ?? 'Menlo, Consolas, monospace';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function style(B, out, keyCount, typed) {
    const T = colors();
    const leave = out < Infinity ? `animation:demoOff ${0.6 * B}ms cubic-bezier(.7,0,.9,.4) ${out}ms forwards` : '';
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;font-family:${mono()};background:${T.bg};opacity:0;animation:demoFadeIn ${0.4 * B}ms steps(2) forwards${out < Infinity ? `, demoFadeOut 1ms linear ${out + 0.6 * B}ms forwards` : ''}}
.demo .screen{position:absolute;inset:0;transform-origin:50% 50%;${leave}}
.demo .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px);mix-blend-mode:screen}
.demo .win{position:absolute;left:50%;top:50%;width:min(1100px,88vw);transform:translate(-50%,-56%) translateY(-24px);opacity:0;background:${T.frame};border:1px solid ${T.border};border-radius:min(12px,2.5vw);box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden;animation:demoDrop ${0.8 * B}ms cubic-bezier(.2,.8,.2,1) ${0.3 * B}ms forwards}
.demo .bar{display:flex;align-items:center;gap:8px;height:min(40px,8vw);padding:0 min(16px,3vw);border-bottom:1px solid ${T.border};color:${T.muted};font-size:min(14px,2.8vw)}
.demo .bar i{width:min(12px,2.4vw);height:min(12px,2.4vw);border-radius:50%;background:#ff5f57}.demo .bar i+i{background:#febc2e}.demo .bar i+i+i{background:#28c840;margin-right:10px}
.demo .body{padding:min(34px,5vw) min(40px,5vw) min(40px,6vw);background:${T.bg};color:${T.text};font-size:max(16px,min(40px,5.6vw,calc(78vw / ${Math.max(typed + 4, 12) * 0.62})));line-height:1.35}
.demo .cmt{color:${T.muted};font-size:min(20px,3.4vw);opacity:0;animation:demoShow 1ms linear ${B}ms forwards}
.demo .cmt b{color:${T.accent};font-weight:600}
.demo .line{display:flex;align-items:baseline;white-space:nowrap}
.demo .ps{color:${T.prompt};margin-right:.6em}
.demo .cmd{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom;width:0;max-width:100%;animation:demoType ${1.4 * B}ms steps(${Math.max(typed, 1)}) ${1.1 * B}ms forwards}
.demo .cur{display:inline-block;width:.55em;height:1.1em;background:${T.text};vertical-align:text-bottom;margin-left:2px;animation:demoBlink ${B}ms steps(1) infinite}
.demo .out{color:${T.muted};font-size:min(24px,3.8vw);margin-top:.4em;opacity:0;animation:demoShow 1ms linear ${2.7 * B}ms forwards}
.demo .out.url{color:${T.prompt};font-size:min(32px,5vw)}
.demo .row{display:flex;gap:min(12px,2vw);margin-top:min(22px,3vw)}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(56px,10vw);height:min(56px,10vw);padding:0 min(12px,2vw);border:1.5px solid ${T.prompt};border-radius:min(8px,1.5vw);color:${T.prompt};font-size:min(28px,5vw);opacity:0;animation:demoShow 1ms linear forwards}
${Array.from({ length: keyCount }, (_, i) => `.demo .key.k${i + 1}{animation-delay:${(2.9 + 0.2 * i) * B}ms}`).join('\n')}
@keyframes demoFadeIn{to{opacity:1}}
@keyframes demoFadeOut{to{opacity:0}}
@keyframes demoShow{to{opacity:1}}
@keyframes demoDrop{to{opacity:1;transform:translate(-50%,-56%)}}
@keyframes demoType{to{width:${typed}ch}}
@keyframes demoBlink{50%{opacity:0}}
@keyframes demoOff{60%{transform:scale(1,.004);opacity:1}to{transform:scale(0,.004);opacity:0}}
</style>`;
  }
  const keyCaps = (keys) => (keys.length ? `<div class="row">${keys.map((k, i) => `<span class="key k${i + 1}">${esc(k)}</span>`).join('')}</div>` : '');
  // The card lives in a shadow root, so the page's own CSS cannot restyle it.
  function mount(html) {
    document.getElementById('demo-transition')?.remove();
    const el = document.createElement('div');
    el.id = 'demo-transition';
    const i = html.indexOf('</style>') + 8;
    el.attachShadow({ mode: 'open' }).innerHTML = `${html.slice(0, i)}<div class="demo">${html.slice(i)}</div>`;
    document.body.append(el);
  }
  const win = (title, body) => `<div class="screen"><div class="win"><div class="bar"><i></i><i></i><i></i>${esc(title)}</div><div class="body">${body}</div></div><div class="scan"></div></div>`;

  window.__demo = {
    transition(step, title, subtitle, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      holdMs ??= 4 * B;
      const IN = 2 * B, OUT = 2 * B;
      const cmd = String(title ?? '');
      mount(`${style(B, IN + holdMs, keys.length, cmd.length)}${win('demo — zsh', `
  ${step ? `<div class="cmt"># <b>${esc(step)}</b></div>` : ''}
  <div class="line"><span class="ps">~ $</span><span class="cmd">${esc(cmd)}</span><span class="cur"></span></div>
  ${subtitle ? `<div class="out">${esc(subtitle)}</div>` : ''}
  ${keyCaps(keys)}`)}`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      const cmd = url ? `open ${url}` : String(title ?? '');
      mount(`${style(B, Infinity, keys.length, cmd.length)}${win('demo — zsh', `
  <div class="cmt"># <b>${esc(title)}</b>${subtitle ? ` — ${esc(subtitle)}` : ''}</div>
  <div class="line"><span class="ps">~ $</span><span class="cmd">${esc(cmd)}</span><span class="cur"></span></div>
  ${url ? `<div class="out url">${esc(url)}</div>` : ''}
  ${lines.map((l) => `<div class="out">${esc(l)}</div>`).join('')}
  ${keyCaps(keys)}`)}`);
      return 2 * B + (holdMs ?? 4 * B);
    },
    keys(label) {
      const T = colors();
      document.getElementById('demo-keys')?.remove();
      const host = document.querySelector('dialog[open]') ?? document.body;
      const el = document.createElement('div');
      el.id = 'demo-keys';
      el.textContent = label;
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:8px;background:${T.bg};color:${T.prompt};font:600 22px ${mono()};letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.45);border:1px solid ${T.prompt};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();
