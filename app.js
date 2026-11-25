(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const PRINCIPAIS = ['Brasileirão Série A','Brasileirão Série B','Campeonato Alemão','Campeonato Espanhol','Campeonato Inglês','Champions League','Copa do Brasil','Copa Libertadores','UEFA Europa League'];
  const iso = d => d.toISOString().slice(0, 10);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sigla = s => s.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  let escopo = null, vista = 'jogos', DATA = {}, dia, filtro = 'todos', agrupar = store.get('agrupar', 'liga'), seguindo = new Set(store.get('seguindo', [])), fechados = new Set(), termo = '';
  const hoje = new Date();

  const SPORTS = {
    futebol: { nome: 'Futebol', emoji: '⚽', arq: 'futebol' },
    basquete: { nome: 'Basquete', emoji: '🏀', arq: 'basquete' },
    volei: { nome: 'Vôlei', emoji: '🏐', arq: 'volei' },
    handebol: { nome: 'Handebol', emoji: '🤾', arq: 'handebol' },
    f1: { nome: 'Fórmula 1', emoji: '🏎️', arq: 'f1', evento: true },
    mma: { nome: 'MMA/UFC', emoji: '🥊', arq: 'mma', evento: true },
    rugbi: { nome: 'Rúgbi', emoji: '🏉', arq: 'rugbi' }
  };
  const datasDe = j => Object.keys(j || {}).filter(k => !k.startsWith('_'));   // "_proximos" não é uma data
  const ALL = {};                        // dados brutos por esporte
  let escolhidos = new Set(['futebol']); // esportes mostrando agora
  const DESTAQUE = /Champions|Libertadores|Sul-Americana|Brasileir|Copa do Brasil|Liga Europa|Premier|Primera|Bundesliga|Serie A|NBA|NBB|Superliga|Euroleague|Fórmula 1|UFC|Seis Nações|Rugby Championship|Copa do Mundo/i;

  function dias() { return Object.keys(DATA).sort(); }

  // junta os esportes escolhidos num único DATA {data: [jogos]}
  function montaDATA() {
    const datas = new Set();
    for (const e in ALL) datasDe(ALL[e]).forEach(d => datas.add(d));
    if (!datas.size) [-1, 0, 1].forEach(n => datas.add(iso(new Date(hoje.getTime() + n * 864e5))));
    DATA = {};
    [...datas].sort().forEach(d => DATA[d] = []);
    for (const e of escolhidos) for (const d of datasDe(ALL[e])) (DATA[d] ||= []).push(...ALL[e][d].map(g => ({ ...g, esporte: e })));
    for (const d in DATA) DATA[d].sort((a, b) => a.hora.localeCompare(b.hora) || a.liga.localeCompare(b.liga));
  }
  const soFutebol = () => escolhidos.size === 1 && escolhidos.has('futebol');
  function tituloPadrao() {
    if (soFutebol()) return 'Onde Assistir Futebol Hoje ao Vivo';
    if (escolhidos.size === 1) { const e = SPORTS[[...escolhidos][0]]; return e.evento ? `Agenda de ${e.nome}` : `Onde Assistir ${e.nome} Hoje`; }
    return 'Onde Assistir Esportes Hoje ao Vivo';
  }

  // escudo: logo do time (imagem) com iniciais coloridas como reserva
  function escudo(n, url) {
    const img = url ? `<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<span class="badge" style="background:hsl(${hue(n)} 55% 40%)">${esc(sigla(n))}${img}</span>`;
  }
  const key = g => g.evento ? `${g.evento}|${g.sessao || ''}` : `${g.casa}|${g.fora}`;
  const soEventos = () => [...escolhidos].every(e => SPORTS[e]?.evento);
  const palavra = n => (soEventos() ? (n === 1 ? 'evento' : 'eventos') : (n === 1 ? 'jogo' : 'jogos'));
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const diaCurto = k => `${SEMANA[new Date(k + 'T12:00:00').getDay()]} ${k.slice(8)}/${k.slice(5, 7)}`;
  // próximos eventos (F1/MMA): depois de amanhã, vindos de "_proximos" no arquivo do esporte
  const proximos = () => [...escolhidos].flatMap(e => (ALL[e]?._proximos || []).map(g => ({ ...g, esporte: e })))
    .filter(g => g.data > dias().slice(-1)[0]).sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
  const aoVivo = g => g.status === 'aovivo';

  function jogosDoDia() {
    let l = (DATA[dia] || []).slice();
    if (dia === 'agora') l = Object.values(DATA).flat().filter(aoVivo);
    if (escopo?.canal) l = l.filter(g => g.canais.some(c => c.nome === escopo.canal));
    return filtrar(l);
  }
  function filtrar(l) {
    if (escopo?.liga) l = l.filter(g => g.liga === escopo.liga);
    if (filtro === 'seguindo') l = l.filter(g => seguindo.has(key(g)) || seguindo.has(g.liga));
    if (termo) { const t = norm(termo); l = l.filter(g => norm([g.casa, g.fora, g.evento, g.sessao, g.local, g.liga, ...g.canais.map(c => c.nome + ' ' + (c.obs || ''))].filter(Boolean).join(' ')).includes(t)); }
    return l;
  }

  function cartao(g, passado) {
    const live = aoVivo(g);
    const hora = live ? `<div class="hora live">${esc(g.tempo)}<small>${g.hora || ''}</small></div>`
      : `<div class="hora">${g.data ? `<small>${diaCurto(g.data)}</small>` : passado || g.status === 'encerrado' ? '<small>Encerrado</small>' : ''}${g.hora}</div>`;
    const time = (n, i) => `<div class="time">${escudo(n, g.logos?.[i])}<span>${esc(n)}</span>${g.placar ? `<span class="esc">${g.placar[i]}</span>` : ''}</div>`;
    const centro = g.evento   // F1/MMA: nome do evento, sessão e local (sem "time x time")
      ? `<div class="times evento"><b class="ev-nome">${esc(g.evento)}</b>${g.sessao ? `<span class="ev-sessao">${esc(g.sessao)}</span>` : ''}${g.local ? `<small class="ev-local">📍 ${esc(g.local)}</small>` : ''}</div>`
      : `<div class="times">${time(g.casa, 0)}${time(g.fora, 1)}</div>`;
    const canais = g.canais.length ? g.canais.map(c => `<span class="canal"><b>${esc(c.nome)}</b>${c.obs ? ` <small>(${esc(c.obs)})</small>` : ''}</span>`).join('')
      : g.esporte === 'futebol' ? '<span class="canal"><small>Sem transmissão informada</small></span>' : '';
    const on = seguindo.has(key(g));
    return `<article class="jogo" tabindex="0"><div class="comp">${soFutebol() ? '' : (SPORTS[g.esporte]?.emoji || '') + ' '}<b>${esc(g.liga)}</b>${g.rodada ? ' - ' + esc(g.rodada) : ''}</div>
      <div class="meio">${hora}${centro}</div>
      <div class="canais">${canais}</div>
      <button class="seguir${on ? ' on' : ''}" data-k="${esc(key(g))}" title="Seguir" aria-pressed="${on}">${on ? '★' : '☆'}</button></article>`;
  }

  // quando a lista/botões são redesenhados, o item em foco some; guarda qual era e devolve o foco a ele
  function guardaFoco() {
    const at = document.activeElement; if (!at || at === document.body) return () => {};
    const k = at.dataset?.k, d = at.dataset?.d, esp = at.dataset?.esp;
    const jogo = at.matches?.('.jogo') ? at.querySelector('.seguir')?.dataset.k : null;
    const grupo = at.matches?.('.grupo-h') ? at.parentNode.dataset.n : null;
    return () => {
      let el = null;
      if (k) el = [...document.querySelectorAll('.seguir')].find(x => x.dataset.k === k);
      else if (jogo) el = [...document.querySelectorAll('.seguir')].find(x => x.dataset.k === jogo)?.closest('.jogo');
      else if (grupo) el = [...document.querySelectorAll('.grupo')].find(x => x.dataset.n === grupo)?.querySelector('.grupo-h');
      else if (d) el = $(`#dias [data-d="${d}"]`);
      else if (esp) el = $(`#esportes-chips [data-esp="${esp}"]`);
      el?.focus({ preventScroll: true });
    };
  }

  function render() {
    const volta = guardaFoco();
    const l = jogosDoDia();
    const passado = dia < iso(hoje) && dia !== 'agora';
    const total = (DATA[dia] || []).length;
    const comCanais = escolhidos.has('futebol');
    const n = dia === 'agora' || escopo || termo || filtro !== 'todos' ? l.length : total;
    $('#sub').textContent = soEventos() ? `Horários e locais dos eventos · ${n} ${palavra(n)}`
      : `${comCanais ? 'Horários e canais de TV e streaming' : 'Horários e placares'} ${escopo ? 'dos jogos' : 'de todos os jogos'} · ${n} jogos`;
    let grupos = {};
    if (agrupar === 'liga') l.forEach(g => (grupos[g.liga] ||= []).push(g));
    else l.slice().sort((a, b) => a.hora.localeCompare(b.hora)).forEach(g => (grupos[g.hora] ||= []).push(g));
    const ordem = Object.keys(grupos).sort((a, b) => agrupar === 'hora' ? a.localeCompare(b)
      : (grupos[b].length - grupos[a].length) || a.localeCompare(b));
    const grupo = (n, gs, titulo) => { const ao = gs.filter(aoVivo).length, f = fechados.has(n);
      return `<section class="grupo${f ? ' fechado' : ''}${titulo ? ' prox' : ''}" data-n="${esc(n)}"><div class="grupo-h" tabindex="0" role="button"><span class="seta">▾</span><h3>${esc(titulo || n)}</h3><small>${gs.length} ${palavra(gs.length)}</small>${ao ? `<span class="ao">${ao} ao vivo</span>` : ''}</div><div class="jogos">${gs.map(g => cartao(g, passado)).join('')}</div></section>`; };
    const prox = dia === 'agora' || escopo?.canal ? [] : filtrar(proximos());
    $('#lista').innerHTML = ordem.map(n => grupo(n, grupos[n])).join('') + (prox.length ? grupo('_proximos', prox, '📅 Próximos eventos') : '');
    $('#vazio').hidden = l.length > 0;
    $('#vazio').textContent = !l.length && !termo && filtro === 'todos' && !escopo && dia !== 'agora' && ![...escolhidos].some(e => datasDe(ALL[e]).some(d => ALL[e][d].length) || ALL[e]?._proximos?.length)
      ? 'Ainda não há dados desse esporte. Eles aparecem assim que a fonte de dados estiver configurada.'
      : soEventos() && !termo && filtro === 'todos' ? (prox.length ? 'Nenhum evento neste dia. Veja os próximos abaixo.' : 'Nenhum evento neste dia.') : 'Nenhuma partida encontrada com esse filtro.';
    $('#recolher').textContent = ordem.length && ordem.every(n => fechados.has(n)) ? 'Expandir tudo' : 'Recolher tudo';
    volta();
  }

  function barraDias() {
    const volta = guardaFoco();
    const ks = dias(), ao = Object.values(DATA).flat().filter(aoVivo).length;
    const SEM = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const nome = k => { const n = Math.round((new Date(k + 'T12:00:00') - new Date(iso(hoje) + 'T12:00:00')) / 864e5);
      return n === 0 ? 'HOJE' : n === -1 ? 'ONTEM' : n === 1 ? 'AMANHÃ' : SEM[new Date(k + 'T12:00:00').getDay()]; };
    const fmt = k => k.slice(8) + '/' + k.slice(5, 7);
    $('#dias').innerHTML = `<button data-d="agora"${dia === 'agora' ? ' class="on"' : ''}><span class="dot"></span>AGORA <small>${ao}</small></button>` +
      ks.map(k => `<button data-d="${k}"${dia === k ? ' class="on"' : ''}>${nome(k)} <small>${fmt(k)}</small></button>`).join('');
    volta();
  }

  function destaques() {
    const hj = DATA[iso(hoje)] || [];
    let l = hj.filter(g => DESTAQUE.test(g.liga));
    if (l.length < 4) l = [...l, ...hj.filter(g => !l.includes(g))];
    l = l.slice(0, 12);
    $('#destaques').hidden = !l.length;
    $('#destaques-titulo').textContent = `🔥 Destaques desta ${DIAS[hoje.getDay()]}`;
    $('#destaques-lista').innerHTML = l.map(g => g.evento
      ? `<div class="dest" tabindex="0"><small>${esc(g.liga)}</small><small>${esc(g.sessao || g.rodada || '')}</small><div class="ev-dest"><b>${esc(g.evento)}</b><span class="hr${aoVivo(g) ? ' live' : ''}">${aoVivo(g) ? esc(g.tempo) : g.hora}</span></div></div>`
      : `<div class="dest" tabindex="0"><small>${esc(g.liga)}</small><small>${esc(g.rodada || '')}</small><div class="vs">${escudo(g.casa, g.logos?.[0])}<span class="hr${aoVivo(g) ? ' live' : ''}">${g.placar ? `${g.placar[0]}-${g.placar[1]}` : g.hora}</span>${escudo(g.fora, g.logos?.[1])}</div></div>`).join('');
  }

  function lateral() {
    const cont = {};
    (DATA[iso(hoje)] || []).forEach(g => { const c = cont[g.liga] ||= { n: g.liga, t: 0, ao: 0 }; c.t++; if (aoVivo(g)) c.ao++; });
    const ordem = Object.values(cont).sort((a, b) => (DESTAQUE.test(b.n) - DESTAQUE.test(a.n)) || (b.t - a.t) || a.n.localeCompare(b.n)).slice(0, 10);
    $('#ligas-nav').innerHTML = ordem.map(c => `<a href="#/liga/${encodeURIComponent(c.n)}"><span><b>${esc(c.n)}</b></span>${c.ao ? `<span class="n">${c.ao}</span>` : ''}</a>`).join('') || '<a href="#/ligas"><span><b>Ver todas as ligas</b></span></a>';
  }

  function selecionar(d) { dia = d; barraDias(); render(); }

  const todosJogos = () => Object.values(DATA).flat();
  function catalogo(tipo) {
    const mapa = new Map();
    for (const g of todosJogos()) {
      const nomes = tipo === 'ligas' ? [g.liga] : g.canais.map(c => c.nome);
      for (const n of nomes) { const x = mapa.get(n) || { n, total: 0, ao: 0, paises: new Set() }; x.total++; if (aoVivo(g)) x.ao++; mapa.set(n, x); }
    }
    let itens = [...mapa.values()].sort((a, b) => (b.total - a.total) || a.n.localeCompare(b.n));
    if (termo) { const t = norm(termo); itens = itens.filter(x => norm(x.n).includes(t)); }
    $('#cat-titulo').textContent = tipo === 'ligas' ? 'Ligas' : 'Programação dos canais';
    $('#cat-sub').textContent = tipo === 'ligas' ? 'Campeonatos com jogos entre ontem e amanhã' : 'Escolha um canal para ver os jogos que ele transmite';
    $('#cat-grid').innerHTML = itens.map(x => `<a class="card" href="#/${tipo === 'ligas' ? 'liga' : 'canal'}/${encodeURIComponent(x.n)}"><span class="badge" style="background:hsl(${hue(x.n)} 55% 40%)">${esc(sigla(x.n))}</span><span><b>${esc(x.n)}</b><small>${x.total} ${palavra(x.total)}</small></span>${x.ao ? `<span class="ao">${x.ao} ao vivo</span>` : ''}</a>`).join('');
    $('#cat-vazio').hidden = itens.length > 0;
  }

  function rota() {
    const [, tipo, arg] = (location.hash || '#/').match(/^#\/([^/]*)\/?(.*)$/) || [];
    const val = arg ? decodeURIComponent(arg) : '';
    escopo = null; termo = $('#q').value = '';
    const nav = tipo === 'ligas' || tipo === 'liga' ? 'ligas' : tipo === 'canais' || tipo === 'canal' ? 'canais' : 'jogos';
    document.querySelectorAll('[data-nav]').forEach(a => a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    const cat = tipo === 'ligas' || tipo === 'canais';
    $('#catalogo').hidden = !cat; $('#vista-jogos').hidden = cat;
    $('#destaques').hidden = cat || !!val || !$('#destaques-lista').children.length;
    if (cat) { vista = tipo; catalogo(tipo); document.title = (tipo === 'ligas' ? 'Ligas' : 'Canais') + ' · Esportes na TV'; return scrollTo(0, 0); }
    vista = 'jogos';
    const v = $('#voltar'), h1 = $('#titulo-jogos');
    if ((tipo === 'liga' || tipo === 'canal') && val) {
      escopo = tipo === 'liga' ? { liga: val } : { canal: val };
      h1.textContent = tipo === 'liga' ? `${val} — ${soEventos() ? 'eventos' : 'jogos'}` : `Jogos no ${val}`;
      v.hidden = false; v.href = tipo === 'liga' ? '#/ligas' : '#/canais'; v.textContent = tipo === 'liga' ? '← Todas as ligas' : '← Todos os canais';
      document.title = h1.textContent + ' · Esportes na TV';
    } else { h1.textContent = tituloPadrao(); v.hidden = true; document.title = tituloPadrao(); }
    selecionar(dia || iso(hoje)); scrollTo(0, 0);
  }
  addEventListener('hashchange', rota);

  document.addEventListener('click', e => {
    const t = e.target;
    const d = t.closest('[data-d]'); if (d) return selecionar(d.dataset.d);
    const f = t.closest('[data-f]'); if (f) { filtro = f.dataset.f; document.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b === f)); return render(); }
    const g = t.closest('[data-g]'); if (g) { agrupar = g.dataset.g; store.set('agrupar', agrupar); document.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b === g)); return render(); }
    const s = t.closest('.seguir'); if (s) { const k = s.dataset.k; seguindo.has(k) ? seguindo.delete(k) : seguindo.add(k); store.set('seguindo', [...seguindo]); return render(); }
    const h = t.closest('.grupo-h'); if (h) { const n = h.parentNode.dataset.n; fechados.has(n) ? fechados.delete(n) : fechados.add(n); return render(); }
    if (t.closest('[data-soon]')) { e.preventDefault(); const x = $('#toast'); x.hidden = false; setTimeout(() => x.hidden = true, 1500); }
  });
  $('#recolher').onclick = () => {
    const ns = [...document.querySelectorAll('.grupo')].map(x => x.dataset.n);
    ns.every(n => fechados.has(n)) ? fechados.clear() : ns.forEach(n => fechados.add(n));
    render();
  };
  $('#q').oninput = e => { termo = e.target.value.trim(); vista === 'jogos' ? render() : catalogo(vista); };
  $('#tema').onclick = () => {
    const dark = document.documentElement.dataset.tema === 'escuro' || (!document.documentElement.dataset.tema && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.tema = dark ? 'claro' : 'escuro'; store.set('tema', document.documentElement.dataset.tema);
  };
  const tm = store.get('tema', null); if (tm) document.documentElement.dataset.tema = tm;
  document.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === agrupar));

  // ---------- Controle remoto + rolagem automática ----------
  const params = new URLSearchParams(location.search);
  const VEL = Math.max(10, Math.min(200, +params.get('vel') || 35));      // pixels por segundo
  const PAUSA_FIM = 4000, RETOMA = (+params.get('espera') || 20) * 1000;  // pausa nas pontas / tempo parado após tecla
  let auto = params.get('auto') !== '0';   // começa ligada; ?auto=0 no link deixa desligada
  let dir = 1, y = 0, ultimo = 0, parado = 0, pausaAte = 0;
  const ehCampo = el => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);

  function mostraAuto() { const b = $('#auto'); if (b) { b.classList.toggle('on', auto); b.textContent = auto ? '⏸ Rolagem automática' : '▶ Rolagem automática'; } }
  function setAuto(v) { auto = v; y = scrollY; pausaAte = v ? performance.now() + 1500 : 0; mostraAuto(); }
  function pausar() { pausaAte = performance.now() + RETOMA; y = scrollY; }

  function loop(t) {
    const dt = Math.min(100, t - (ultimo || t)); ultimo = t;
    if (auto && t > pausaAte && t > parado && maxY() > 0 && !sobreposto()) {
      y += dir * VEL * dt / 1000;
      if (y >= maxY()) { y = maxY(); dir = -1; parado = t + PAUSA_FIM; }
      else if (y <= 0) { y = 0; dir = 1; parado = t + PAUSA_FIM; }
      scrollTo(0, y);
    }
    requestAnimationFrame(loop);
  }

  // ---------- Controle remoto: navegação própria (setas = foco por direção, OK = clicar) ----------
  const DEBUG = params.has('debug');
  const PASSO = () => Math.round(innerHeight * 0.4);
  const ehOK = e => ['Enter', 'Select', 'Accept'].includes(e.key) || [13, 23, 66, 108].includes(e.keyCode || e.which);
  let selo = 0, selado = null;

  const sobreposto = () => document.querySelector('.escolha:not([hidden])');
  const altTopo = () => $('.topo').getBoundingClientRect().bottom;
  function focaveis() {
    const raiz = sobreposto() || document;
    return [...raiz.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]')].filter(el => {
      if (el.tabIndex < 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  }
  function foca(el) {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }
  function mover(dir) {
    const lista = focaveis(); if (!lista.length) return false;
    const at = document.activeElement;
    if (dir === 'esquerda' && at?.matches?.('.seguir')) { foca(at.closest('.jogo')); return true; }   // estrela -> volta ao jogo
    let base = lista.find(x => x === at || x.contains(at));
    if (base && !base.closest('.topo, .escolha')) { const rb = base.getBoundingClientRect(); if (rb.bottom < altTopo() + 2 || rb.top > innerHeight) base = null; }   // saiu da tela (fora o topo fixo)
    if (!base) {
      const v = lista.find(el => { const r = el.getBoundingClientRect(); return r.bottom > altTopo() + 10 && r.top < innerHeight; }) || lista[0];
      foca(v); return true;
    }
    const r = base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let melhor = null, nota = Infinity;
    for (const el of lista) {
      if (el === base || el.contains(base)) continue;
      const q = el.getBoundingClientRect(), qx = q.left + q.width / 2, qy = q.top + q.height / 2;
      let n = Infinity;
      if (base.contains(el)) { if (dir === 'direita' && qx > cx + 8) n = 0; }           // item dentro do foco (estrela do jogo)
      else {
        const gx = Math.max(0, q.left - r.right, r.left - q.right), gy = Math.max(0, q.top - r.bottom, r.top - q.bottom);
        const desv = 0.05 * Math.abs(qx - cx), desvY = 0.05 * Math.abs(qy - cy);
        if (dir === 'baixo' && q.top >= r.bottom - 4) n = (q.top - r.bottom) + 3 * gx + desv;
        else if (dir === 'cima' && q.bottom <= r.top + 4) n = (r.top - q.bottom) + 3 * gx + desv;
        else if (dir === 'direita' && q.left >= r.right - 4) n = (q.left - r.right) + 3 * gy + desvY;
        else if (dir === 'esquerda' && q.right <= r.left + 4) n = (r.left - q.right) + 3 * gy + desvY;
      }
      if (n < nota) { nota = n; melhor = el; }
    }
    if (melhor) { foca(melhor); return true; }
    return false;
  }
  const rolar = sinal => scrollBy({ top: sinal * PASSO(), behavior: 'smooth' });

  // destaque neon: ligado ao usar controle/teclado, desligado ao usar mouse ou toque
  const raizEl = document.documentElement;
  if (!matchMedia('(pointer: coarse)').matches) raizEl.classList.add('teclado');   // celular (toque) começa sem neon
  ['mousedown', 'touchstart'].forEach(t => addEventListener(t, () => raizEl.classList.remove('teclado', 'ctrl'), { passive: true, capture: true }));
  let ultimoDown = 0;
  function tecla(e, origem) {
    raizEl.classList.add('teclado', 'ctrl');
    const k = e.key, c = e.keyCode || e.which;
    const rot = `${origem}: ${k} (código ${c})`;
    if (DEBUG) mostraDebug(rot);
    if (!$('#escolha').hidden) $('#esc-tecla').textContent = `Tecla recebida ${rot}`;
    // 37-40 = setas do navegador; 19-22 = códigos de direcional do Android TV
    const dir = k === 'ArrowDown' || c === 40 || c === 20 ? 'baixo' : k === 'ArrowUp' || c === 38 || c === 19 ? 'cima'
      : k === 'ArrowRight' || c === 39 || c === 22 ? 'direita' : k === 'ArrowLeft' || c === 37 || c === 21 ? 'esquerda'
      : k === 'PageDown' || c === 34 || c === 428 ? 'pgbaixo' : k === 'PageUp' || c === 33 || c === 427 ? 'pgcima' : null;
    const campo = ehCampo(e.target);
    if (campo) {   // na caixa de busca: só sai pelos lados se estiver vazia ou com o cursor na ponta
      const t = e.target, v = t.value || '', ini = t.selectionStart ?? 0, fim = t.selectionEnd ?? 0;
      const sai = dir === 'esquerda' ? (!v || (ini === 0 && fim === 0)) : dir === 'direita' ? (!v || ini >= v.length) : !!dir;
      if (!sai) return;
    }
    if (dir) {
      e.preventDefault?.(); pausar();
      if (dir === 'pgbaixo') rolar(1); else if (dir === 'pgcima') rolar(-1);
      else if (!mover(dir) && (dir === 'baixo' || dir === 'cima') && !sobreposto()) rolar(dir === 'baixo' ? 1 : -1);
      if (campo && document.activeElement === e.target) e.target.blur();
      return;
    }
    if (ehOK(e)) {
      pausar();
      const el = document.activeElement;
      if (!el || el === document.body) { garanteFoco(); return; }
      const alvo = el.matches('.jogo') ? (el.querySelector('.seguir') || el) : el;   // OK num jogo = seguir ★
      e.preventDefault?.(); selo = performance.now(); selado = alvo; alvo.click();
    } else if (k === 'a' || k === 'A') setAuto(!auto);
  }
  addEventListener('keydown', e => { ultimoDown = performance.now(); tecla(e, 'keydown'); }, true);
  // alguns aplicativos mandam só "soltou a tecla": se nenhum keydown chegou, trata o keyup como o aperto
  addEventListener('keyup', e => { if (performance.now() - ultimoDown > 600) tecla(e, 'keyup'); else if (!$('#escolha').hidden) $('#esc-tecla').textContent = `Tecla recebida: ${e.key} (código ${e.keyCode || e.which})`; }, true);
  // garante que a página tenha um item em foco (sem isso a TV pode não mandar as setas para o site)
  function garanteFoco() {
    try { window.focus(); } catch {}
    const at = document.activeElement;
    if (at && at !== document.body && focaveis().includes(at)) return;
    const lista = focaveis(); if (!lista.length) return;
    const v = lista.find(el => { const r = el.getBoundingClientRect(); return r.bottom > altTopo() + 10 && r.top < innerHeight; }) || lista[0];
    v.focus({ preventScroll: true });
  }
  [400, 1500, 3500].forEach(t => setTimeout(garanteFoco, t));
  // se o aplicativo também gerar um clique nativo logo depois do OK, ignora (evita clicar duas vezes)
  addEventListener('click', e => {
    if (e.isTrusted && selado && performance.now() - selo < 600 && (selado === e.target || selado.contains(e.target) || e.target.contains(selado))) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  function mostraDebug(txt) {
    let d = $('#dbg');
    if (!d) { d = document.createElement('div'); d.id = 'dbg'; d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:999;background:#000;color:#4ade80;font:16px monospace;padding:8px 12px;border-radius:8px;max-width:90vw'; document.body.append(d); }
    const f = document.activeElement; d.textContent = `${txt} · foco: ${f ? f.tagName + (f.className ? '.' + String(f.className).split(' ')[0] : '') : '-'}`;
  }
  if (DEBUG) { mostraDebug('modo teste: aperte uma tecla do controle'); ['click', 'pointerdown'].forEach(t => addEventListener(t, ev => mostraDebug(`${t} em ${ev.target.tagName}`), true)); }

  ['wheel', 'touchstart', 'mousedown'].forEach(ev => addEventListener(ev, pausar, { passive: true }));
  $('#auto').onclick = () => setAuto(!auto);
  mostraAuto(); requestAnimationFrame(loop);

  // ---------- Esportes: um por vez (chips no topo + pergunta ao abrir) ----------
  const atual = () => [...escolhidos][0] || 'futebol';
  function barraEsportes() {
    const volta = guardaFoco();
    $('#esportes-chips').innerHTML = Object.entries(SPORTS).map(([id, e]) =>
      `<button type="button" class="chip${atual() === id ? ' on' : ''}" data-esp="${id}" aria-pressed="${atual() === id}">${e.emoji} ${e.nome}</button>`).join('');
    volta();
  }
  function aplicarEscolha() {
    if (!escolhidos.size) escolhidos = new Set(['futebol']);
    store.set('esportes', [atual()]);
    montaDATA(); barraEsportes(); destaques(); lateral(); barraDias();
    if (location.hash.startsWith('#/liga/') || location.hash.startsWith('#/canal/')) { location.hash = '#/'; return; }
    if (vista === 'jogos') { if (!escopo) $('#titulo-jogos').textContent = tituloPadrao(); render(); } else catalogo(vista);
  }
  let tempoEsc = null;
  function abrirEscolha() {
    const box = $('#esc-opcoes'), ov = $('#escolha'), cont = $('#esc-tempo');
    box.innerHTML = Object.entries(SPORTS).map(([id, e]) =>
      `<button type="button" class="esc-op${atual() === id ? ' on' : ''}" data-op="${id}"><span class="ico">${e.emoji}</span>${e.nome}</button>`).join('');
    ov.hidden = false;
    let resta = 25;
    const fecha = id => { clearInterval(tempoEsc); ov.hidden = true; escolhidos = new Set([id || atual()]); aplicarEscolha(); scrollTo(0, 0); if (document.activeElement) document.activeElement.blur(); setTimeout(garanteFoco, 300); };
    const mostra = () => { cont.textContent = `Continuando com ${SPORTS[atual()].nome} em ${resta}s…`; };
    mostra(); clearInterval(tempoEsc);
    tempoEsc = setInterval(() => { resta--; mostra(); if (resta <= 0) fecha(); }, 1000);
    box.onclick = e => { const b = e.target.closest('[data-op]'); if (b) fecha(b.dataset.op); };   // tocar/OK num esporte já entra nele
    $('#esc-tecla').textContent = 'Aguardando tecla do controle…';
    setTimeout(() => (box.querySelector('.esc-op.on') || box.querySelector('.esc-op')).focus(), 50);
  }
  $('#esportes-chips').onclick = e => {
    const b = e.target.closest('[data-esp]'); if (!b) return;
    escolhidos = new Set([b.dataset.esp]); aplicarEscolha();
  };
  $('#trocar-esporte').onclick = abrirEscolha;

  // ---------- Apoio (Pix) e espaços de anúncio ----------
  const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim();
  const campo = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function crc16(t) { let c = 0xFFFF; for (let i = 0; i < t.length; i++) { c ^= t.charCodeAt(i) << 8; for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
  // Pix "copia e cola" estático (sem valor: quem paga escolhe quanto)
  function pixPayload(chave, nome, cidade) {
    const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim());
    const base = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986') + campo('58', 'BR')
      + campo('59', semAcento(nome).slice(0, 25).toUpperCase() || 'APOIO') + campo('60', semAcento(cidade).slice(0, 15).toUpperCase() || 'BRASIL')
      + campo('62', campo('05', '***')) + '6304';
    return base + crc16(base);
  }
  window.__pixPayload = pixPayload;   // usado nos testes
  let apoioCfg = null;
  async function iniciaApoio() {
    try { apoioCfg = await (await fetch('apoio.json?t=' + Date.now())).json(); } catch { return; }
    const chave = apoioCfg?.pix?.chave?.trim(); if (!chave) return;
    $('#apoiar').hidden = false; $('#apoiar').textContent = apoioCfg.botao || '💚 Apoie com Pix';
    $('#ap-t').textContent = apoioCfg.titulo || 'Apoie o site'; $('#ap-texto').textContent = apoioCfg.texto || '';
    const codigo = pixPayload(chave, apoioCfg.pix.nome, apoioCfg.pix.cidade);
    $('#ap-codigo').value = codigo;
    try { const qr = qrcode(0, 'M'); qr.addData(codigo); qr.make(); $('#ap-qr').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true }); } catch { $('#ap-qr').textContent = ''; }
  }
  const abreApoio = () => { $('#ap-aviso').textContent = ''; $('#apoio').hidden = false; setTimeout(() => $('#ap-copiar').focus(), 50); };
  const fechaApoio = () => { $('#apoio').hidden = true; setTimeout(() => $('#apoiar').focus({ preventScroll: true }), 50); };
  $('#apoiar').onclick = abreApoio;
  $('#ap-fechar').onclick = fechaApoio;
  $('#ap-copiar').onclick = async () => {
    const cod = $('#ap-codigo').value;
    try { await navigator.clipboard.writeText(cod); $('#ap-aviso').textContent = '✅ Código copiado! Cole no app do seu banco (Pix → Copia e Cola).'; }
    catch { const t = $('#ap-codigo'); t.removeAttribute('tabindex'); t.focus(); t.select(); try { document.execCommand('copy'); $('#ap-aviso').textContent = '✅ Código copiado!'; } catch { $('#ap-aviso').textContent = 'Selecione o código acima e copie.'; } }
  };
  $('#apoio').addEventListener('keydown', e => { if (e.key === 'Escape') fechaApoio(); });

  // Espaços de anúncio: só aparecem se o arquivo anuncios/esquerda.html (ou direita.html) tiver conteúdo além de comentários.
  async function iniciaAnuncios() {
    let algum = false;
    for (const [id, arq] of [['#anuncio-esq', 'anuncios/esquerda.html'], ['#anuncio-dir', 'anuncios/direita.html']]) {
      try {
        const txt = await (await fetch(arq + '?t=' + Date.now())).text();
        if (!txt.replace(/<!--[\s\S]*?-->/g, '').trim()) continue;
        const el = $(id); el.querySelector('iframe').src = arq; el.hidden = false; algum = true;
      } catch {}
    }
    if (algum) document.documentElement.classList.add('tem-anuncio');
  }

  // ---------- Dados (recarrega sozinho a cada 5 min) ----------
  const pega = e => fetch(`data/${SPORTS[e].arq}.json?t=${Date.now()}`).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  async function carregar(primeira) {
    const lista = Object.keys(SPORTS);
    (await Promise.all(lista.map(pega))).forEach((j, i) => ALL[lista[i]] = j);
    // usa a data "central" do arquivo como hoje se a data real não existir nele
    const ks = [...new Set(Object.values(ALL).flatMap(datasDe))].sort();
    if (ks.length && !ks.includes(iso(hoje))) hoje.setTime(new Date(ks[Math.floor(ks.length / 2)] + 'T12:00:00').getTime());
    if (primeira) {
      const p = new URLSearchParams(location.search).get('esporte');
      const pedido = (p || '').split(',').map(x => x.trim()).filter(x => SPORTS[x]);
      const salvo = store.get('esportes', []).filter(x => SPORTS[x]);
      escolhidos = new Set([pedido[0] || salvo[0] || 'futebol']);
    }
    montaDATA(); barraEsportes(); destaques(); lateral();
    if (primeira) { if (location.hash) history.replaceState(null, '', location.pathname + location.search); dia = iso(hoje); rota(); if (!new URLSearchParams(location.search).get('esporte')) abrirEscolha(); }
    else { barraDias(); vista === 'jogos' ? render() : catalogo(vista); }
  }
  iniciaApoio(); iniciaAnuncios();
  carregar(true).catch(e => { console.error(e); $('#lista').innerHTML = '<p class="vazio">Não foi possível carregar os dados.</p>'; });
  setInterval(() => carregar(false).catch(() => {}), 5 * 60 * 1000);
})();
