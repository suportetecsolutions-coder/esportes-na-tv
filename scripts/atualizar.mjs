// Gera data/futebol.json, basquete.json, volei.json e handebol.json (ontem, hoje, amanha - horario de Brasilia).
// Chaves (secrets do GitHub): FOOTBALL_DATA_KEY (futebol) e API_FOOTBALL_KEY (API-Sports: Libertadores/Copa do Brasil/Serie B + basquete/volei/handebol).
// Sem chave, o arquivo correspondente nao e alterado.
import { readFile, writeFile } from 'node:fs/promises';

const FD_KEY = process.env.FOOTBALL_DATA_KEY, AKEY = process.env.API_FOOTBALL_KEY;
const COMPETICOES = (process.env.COMPETICOES || 'BSA,CL,PL,PD,BL1,SA,FL1,ELC,PPL,DED,WC,EC').split(',');
const TZ = 'America/Sao_Paulo';
const raiz = new URL('../', import.meta.url);

const dataSP = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);          // AAAA-MM-DD
const horaSP = d => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
const dia = n => new Date(Date.now() + n * 864e5);
const alvo = [dataSP(dia(-1)), dataSP(dia(0)), dataSP(dia(1))];
const vazio = () => Object.fromEntries(alvo.map(d => [d, []]));
const ler = async (p, pad) => { try { return JSON.parse(await readFile(new URL(p, raiz), 'utf8')); } catch { return pad; } };
const ordena = out => { for (const d of alvo) out[d].sort((a, b) => a.hora.localeCompare(b.hora) || a.liga.localeCompare(b.liga)); };
const agoraMs = Date.now();
const MIN = 60e3, HORA = 3600e3;

const canais = await ler('canais.json', { campeonatos: {}, jogos: {} });
const esportes = await ler('esportes.json', {});

// dados ja publicados no site (para reaproveitar ontem/amanha e poupar a cota da API)
const repo = process.env.GITHUB_REPOSITORY;
async function publicado(nome) {
  if (!repo) return {};
  const [o, n] = repo.split('/');
  for (const f of [nome, nome === 'futebol' ? 'jogos' : null].filter(Boolean)) {
    try { const r = await fetch(`https://${o.toLowerCase()}.github.io/${n}/data/${f}.json`, { signal: AbortSignal.timeout(15000) }); if (r.ok) return await r.json(); } catch {}
  }
  return {};
}
// horários das últimas consultas à API-Sports (para não gastar a cota se o robô rodar duas vezes)
const meta = { ...(await publicado('meta')) };
const pausaApi = () => (meta.apiPausadaAte || 0) > agoraMs;
const apiErro = e => { if (/suspend|access|requests/i.test(String(e))) { meta.apiPausadaAte = agoraMs + 6 * HORA; console.warn('API-Sports bloqueada (conta suspensa ou cota) — pausando chamadas por 6 h.'); } };
const salva = (nome, out) => writeFile(new URL(`data/${nome}.json`, raiz), JSON.stringify(out, null, 1));

// ================= FUTEBOL =================
if (!FD_KEY) console.log('FOOTBALL_DATA_KEY ausente: futebol nao alterado.');
else {
  const url = `https://api.football-data.org/v4/matches?dateFrom=${dataSP(dia(-2))}&dateTo=${dataSP(dia(2))}&competitions=${COMPETICOES.join(',')}`;
  const r = await fetch(url, { headers: { 'X-Auth-Token': FD_KEY } });
  if (!r.ok) { console.error('Erro football-data', r.status, await r.text()); process.exit(1); }
  const { matches = [] } = await r.json();
  const out = vazio();
  for (const m of matches) {
    const quando = new Date(m.utcDate), d = dataSP(quando);
    if (!out[d]) continue;
    const nome = t => t.shortName || t.name || 'A definir';
    const g = {
      liga: m.competition.name,
      rodada: m.matchday ? `Rodada ${m.matchday}` : (m.stage || '').replaceAll('_', ' '),
      casa: nome(m.homeTeam), fora: nome(m.awayTeam), hora: horaSP(quando),
      logos: [m.homeTeam.crest || null, m.awayTeam.crest || null],
      canais: canais.jogos[`${nome(m.homeTeam)} x ${nome(m.awayTeam)}`] || canais.campeonatos[m.competition.code] || []
    };
    const s = m.status, ft = m.score?.fullTime;
    if (s === 'IN_PLAY' || s === 'PAUSED') { g.status = 'aovivo'; g.tempo = s === 'PAUSED' ? 'INT' : (m.minute ? `${m.minute}'` : 'AO VIVO'); }
    else if (s === 'FINISHED' || s === 'AWARDED') { g.status = 'encerrado'; g.tempo = 'FIM'; }
    else if (s === 'POSTPONED' || s === 'CANCELLED' || s === 'SUSPENDED') { g.status = 'agendado'; g.rodada += ` (${s.toLowerCase()})`; }
    else g.status = 'agendado';
    if (ft && ft.home != null) g.placar = [ft.home, ft.away];
    out[d].push(g);
  }

  // Suplemento: API-Football (busca por data = todas as ligas do mundo em 1 chamada; o plano grátis só libera ontem/hoje/amanhã).
  // Entram: competições brasileiras (menos Série A, que já vem da football-data, e as de base) + internacionais abaixo.
  // Hoje: no máximo 1 consulta a cada 20 min; ontem/amanhã: a cada 6 h. O resto reaproveita o site publicado.
  if (AKEY) {
    const INTER = { 13: 'LIB', 11: 'SUL', 3: 'UEL', 848: 'UECL', 9: 'CAM', 15: 'MUN' };
    const CODIGO = { 72: 'BSB', 73: 'CDB', 75: 'BSC', 76: 'BSD' };
    const NOMES = { 'CONMEBOL Libertadores': 'Copa Libertadores', 'CONMEBOL Sudamericana': 'Copa Sul-Americana', 'Copa Do Brasil': 'Copa do Brasil',
      'Serie B': 'Brasileirão Série B', 'Serie C': 'Brasileirão Série C', 'Serie D': 'Brasileirão Série D', 'UEFA Europa League': 'Liga Europa',
      'UEFA Europa Conference League': 'Conference League', 'Copa America': 'Copa América', 'FIFA Club World Cup': 'Mundial de Clubes' };
    const BASE = /U-?1\d|U-?2\d|Sub-?\d|Youth|Junior|Júnior|Aspirantes/i;
    const escolhe = l => INTER[l.id] ? INTER[l.id] : (l.country === 'Brazil' && l.id !== 71 && !BASE.test(l.name)) ? (CODIGO[l.id] || 'BR') : null;
    const anterior = await publicado('futebol');
    const doAnterior = d => (anterior[d] || []).filter(g => g.fonte === 'apif');
    const buscaHoje = agoraMs - (meta.futebolHoje || 0) > 20 * MIN, buscaOutros = agoraMs - (meta.futebolOutros || 0) > 6 * HORA;
    const status = (s, el) => ['1H', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(s) ? { status: 'aovivo', tempo: el ? `${el}'` : 'AO VIVO' }
      : s === 'HT' ? { status: 'aovivo', tempo: 'INT' } : ['FT', 'AET', 'PEN'].includes(s) ? { status: 'encerrado', tempo: 'FIM' } : { status: 'agendado' };
    for (const d of alvo) {
      const hojeD = d === alvo[1];
      if (pausaApi() || (hojeD ? !buscaHoje : !buscaOutros) && anterior[d]) { out[d].push(...doAnterior(d)); continue; }
      try {
        const r2 = await fetch(`https://v3.football.api-sports.io/fixtures?date=${d}&timezone=${TZ}`, { headers: { 'x-apisports-key': AKEY } });
        const j = await r2.json();
        if (!r2.ok || (j.errors && Object.keys(j.errors).length)) throw new Error(JSON.stringify(j.errors || r2.status));
        for (const f of j.response || []) {
          const cod = escolhe(f.league); if (!cod) continue;
          const liga = NOMES[f.league.name] || f.league.name;
          const g = { liga, rodada: (f.league.round || '').replace('Regular Season - ', 'Rodada '), casa: f.teams.home.name, fora: f.teams.away.name,
            hora: horaSP(new Date(f.fixture.date)), logos: [f.teams.home.logo || null, f.teams.away.logo || null],
            canais: canais.jogos[`${f.teams.home.name} x ${f.teams.away.name}`] || canais.campeonatos[cod] || [], fonte: 'apif',
            ...status(f.fixture.status.short, f.fixture.status.elapsed) };
          if (f.goals.home != null) g.placar = [f.goals.home, f.goals.away];
          out[d].push(g);
        }
        if (hojeD) meta.futebolHoje = agoraMs; else meta.futebolOutros = agoraMs;
      } catch (e) { apiErro(e); console.warn('API-Football (futebol) falhou para', d, String(e).slice(0, 200)); out[d].push(...doAnterior(d)); }
    }
  } else console.log('API_FOOTBALL_KEY ausente: sem Libertadores/Copa do Brasil/Serie B.');
  ordena(out);
  await salva('futebol', out);
  console.log('futebol:', alvo.map(d => `${d}: ${out[d].length}`).join(' | '));
}

// ================= BASQUETE / VOLEI / HANDEBOL (API-Sports) =================
const VIVO = ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'BT', 'S1', 'S2', 'S3', 'S4', 'S5', '1H', '2H', 'ET', 'PT', 'LIVE'];
const FIM = ['FT', 'AOT', 'AET', 'PEN', 'AWD', 'AW', 'WO'];
const rotulo = (s, timer) => /^S\d$/.test(s) ? `Set ${s[1]}` : s === '1H' ? '1º T' : s === '2H' ? '2º T' : timer ? `${s} ${timer}'` : s;
const total = x => (x && typeof x === 'object') ? x.total ?? null : x ?? null;

// Reserva grátis: TheSportsDB (chave pública 123; limite 3 jogos por liga por dia, ~30 consultas/min)
const espera = ms => new Promise(r => setTimeout(r, ms));
async function tsdb(caminho) {   // pausa entre consultas e, se vier página de bloqueio, espera 1 min e tenta de novo
  for (let t = 0; t < 2; t++) {
    await espera(t ? 60000 : 4000);
    try {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/123/${caminho}`, { signal: AbortSignal.timeout(20000) });
      const txt = await r.text();
      if (txt.trim().startsWith('{')) return JSON.parse(txt);
      console.warn('TheSportsDB pediu pausa (', r.status, ') em', caminho);
    } catch (err) { console.warn('TheSportsDB falhou em', caminho, String(err).slice(0, 100)); }
  }
  return null;
}
async function viaTSDB(id, cfg, anteriorBruto) {
  const anterior = {};
  for (const d of alvo) { const l = (anteriorBruto[d] || []).filter(g => g.fonte === 'tsdb'); if (l.length) anterior[d] = l; }
  const out = vazio(); const ligas = Object.entries(cfg.tsdb || {});
  const renovaHoje = agoraMs - (meta[id + 'Hoje'] || 0) > 55 * MIN, renovaOutros = agoraMs - (meta[id + 'Outros'] || 0) > 6 * HORA;
  const renovar = alvo.filter(d => !anterior[d] || (d === alvo[1] ? renovaHoje : renovaOutros));
  for (const d of alvo) if (!renovar.includes(d)) out[d] = anterior[d];
  if (!renovar.length) return out;
  // a API trabalha em UTC: busca cada data UTC uma vez (as escolhidas + o dia seguinte) e separa pela data de Brasília
  const prox = d => new Date(new Date(d + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10);
  const utc = [...new Set(renovar.flatMap(d => [d, prox(d)]))];
  const vistos = new Set(); let falhas = 0;
  for (const [lid, nome] of ligas) for (const dia of utc) {
    const j = await tsdb(`eventsday.php?d=${dia}&l=${lid}`);
    if (!j) { falhas++; continue; }
    for (const e of j.events || []) {
      if (vistos.has(e.idEvent)) continue; vistos.add(e.idEvent);
      const ts = e.strTimestamp ? new Date(e.strTimestamp.replace(/(\+00:00)?$/, '') + 'Z') : new Date(`${e.dateEvent}T${e.strTime || '00:00:00'}Z`);
      const d = isNaN(ts) ? null : dataSP(ts);
      if (!renovar.includes(d)) continue;
      const st = (e.strStatus || '').trim(), h = e.intHomeScore, a = e.intAwayScore;
      const g = { liga: nome, rodada: e.intRound && e.intRound !== '0' ? `Rodada ${e.intRound}` : '', casa: e.strHomeTeam, fora: e.strAwayTeam, hora: horaSP(ts),
        logos: [e.strHomeTeamBadge ? e.strHomeTeamBadge + '/small' : null, e.strAwayTeamBadge ? e.strAwayTeamBadge + '/small' : null], canais: [], fonte: 'tsdb' };
      if (/^(FT|AOT|AET|PEN|Match Finished|Finished)$/i.test(st)) { g.status = 'encerrado'; g.tempo = 'FIM'; }
      else if (!st || /^(NS|Not Started|TBD|Postponed|Cancelled)$/i.test(st)) g.status = 'agendado';
      else { g.status = 'aovivo'; g.tempo = /^HT$/i.test(st) ? 'INT' : st; }
      if (h != null && h !== '' && a != null && a !== '') g.placar = [+h, +a];
      out[d].push(g);
    }
  }
  for (const d of renovar) if (!out[d].length && anterior[d]) out[d] = anterior[d];   // não apaga o que já tinha se a fonte falhar
  if (falhas < ligas.length * utc.length) for (const d of renovar) meta[id + (d === alvo[1] ? 'Hoje' : 'Outros')] = agoraMs;
  if (falhas) console.warn(`TheSportsDB (${id}): ${falhas} consultas sem resposta`);
  return out;
}

for (const [id, cfg] of Object.entries(esportes)) {
  if (id.startsWith('_')) continue;
  if (!AKEY || pausaApi()) {
    const out = await viaTSDB(id, cfg, await publicado(id)); ordena(out); await salva(id, out);
    console.log(`${id} (TheSportsDB):`, alvo.map(d => `${d}: ${out[d].length}`).join(' | ')); continue;
  }
  const anterior = await publicado(id);
  const renovaHoje = agoraMs - (meta[id + 'Hoje'] || 0) > 55 * MIN, renovaOutros = agoraMs - (meta[id + 'Outros'] || 0) > 6 * HORA;
  const filtro = new RegExp(cfg.ligas || '$^', 'i');
  const out = vazio(); let erro = false;
  for (const d of alvo) {
    const hojeD = d === alvo[1];
    if ((pausaApi() || !(hojeD ? renovaHoje : renovaOutros)) && anterior[d]) { out[d] = anterior[d]; continue; }
    if (pausaApi()) continue;
    try {
      const r = await fetch(`https://${cfg.host}/games?date=${d}&timezone=${TZ}`, { headers: { 'x-apisports-key': AKEY } });
      const j = await r.json();
      if (!r.ok || (j.errors && Object.keys(j.errors).length)) throw new Error(JSON.stringify(j.errors || r.status));
      for (const x of j.response || []) {
        const pais = x.country?.name || x.league?.country?.name || '';
        if (!(cfg.paises || []).includes(pais) && !filtro.test(x.league?.name || '')) continue;
        const st = x.status?.short || 'NS', quando = new Date(x.date || (x.timestamp ? x.timestamp * 1000 : NaN));
        if (isNaN(quando)) continue;
        const g = { liga: x.league.name, rodada: x.week || x.stage || '', casa: x.teams.home.name, fora: x.teams.away.name, hora: horaSP(quando),
          logos: [x.teams.home.logo || null, x.teams.away.logo || null], canais: [] };
        if (VIVO.includes(st)) { g.status = 'aovivo'; g.tempo = rotulo(st, x.status?.timer); }
        else if (st === 'HT' || st === 'BTS') { g.status = 'aovivo'; g.tempo = 'INT'; }
        else if (FIM.includes(st)) { g.status = 'encerrado'; g.tempo = 'FIM'; }
        else g.status = 'agendado';
        const h = total(x.scores?.home), a = total(x.scores?.away);
        if (h != null && a != null) g.placar = [h, a];
        if (dataSP(quando) === d) out[d].push(g);
      }
      meta[id + (hojeD ? 'Hoje' : 'Outros')] = agoraMs;
    } catch (e) { erro = true; apiErro(e); console.warn(`API-Sports (${id}) falhou para ${d}:`, String(e).slice(0, 200)); out[d] = anterior[d] || out[d]; }
  }
  if (pausaApi()) { const o2 = await viaTSDB(id, cfg, anterior); for (const d of alvo) out[d] = o2[d]; }   // bloqueou agora: usa a reserva no lugar
  ordena(out);
  await salva(id, out);
  console.log(`${id}:`, alvo.map(d => `${d}: ${out[d].length}`).join(' | '), erro ? '(com falhas)' : '');
}

meta.atualizado = new Date().toISOString();
await salva('meta', meta);
