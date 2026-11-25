# Estado do projeto — Esportes na TV

_Última verificação geral: 25/11/2026 (chat 2 — F1, MMA/UFC, Rúgbi e correções da auditoria)._

## 1. Resumo em 5 linhas
- Site de jogos (futebol, basquete, vôlei, handebol, **Fórmula 1, MMA/UFC, rúgbi**) **sem anúncios**, com horários, placares,
  canais de TV (só futebol), escudos, navegação por controle remoto e rolagem automática.
- Dados vêm de APIs; um robô no GitHub Actions atualiza a cada 30 min e publica no GitHub Pages.
- **Site novo no ar (25/11, chat 2):** https://suportetecsolutions-coder.github.io/esportes-na-tv/
  — cron-job.org já dispara a cada 30 min no repositório novo.

## 2. 🔴 Pendências do DONO (em ordem)
1. ✅ Mudança para o repositório novo **feita** (segredos, Pages e cron-job.org funcionando — conferido
   no chat 2). Link do aplicativo da TV **já trocado** pelo dono (25/11).
2. ✅ Repositório antigo deixado **privado** e **2FA** do GitHub ligado (dono, 25/11).
   Token antigo do cron (`cron-esportes`) **apagado** pelo dono (25/11). Fica só o token "Esportes na TV".
3. Guardar num lugar seguro a cópia de segurança do outro projeto (enviada no chat 1).
4. **API-Football (conta suspensa):** aguardar resposta do suporte (pedido feito pelo chat do
   painel; não há e-mail de suporte confirmado). Se reativarem, nada a fazer. Se mandarem
   chave nova, atualizar o segredo `API_FOOTBALL_KEY` no repositório novo.
5. **Decidir o Pix:** (a) chave aleatória na conta pessoal — mostra o nome/parte do CPF a quem
   paga; (b) chave aleatória de conta MEI/CNPJ separada; (c) plataforma de apoio (Apoia.se,
   Ko-fi…) — mostra o nome da plataforma. Depois: preencher `apoio.json` (ou pedir para
   adaptar o botão à plataforma) e **fazer um Pix teste de R$ 1**.
6. **Anúncios:** só ativar depois de ler os termos de uso comercial das fontes de dados
   (football-data.org, TheSportsDB, API-Sports) e, de preferência, com domínio próprio.
7. **Conferir os canais** em `canais.json` — vários são palpites (Libertadores, Sul-Americana,
   Copa do Brasil, Séries B/C, Liga Europa, Conference, ligas europeias).
8. ✅ **Controle remoto na TV:** dono confirmou em 25/11 (chat 2) que a navegação está OK (incluindo F1).
   Se aparecer problema no TV Box: abrir o link com `?debug=1` e mandar foto da faixa verde.
9. Recomendado: gerar uma chave nova da football-data.org e trocar o segredo `FOOTBALL_DATA_KEY`.
10. Recomendado: apagar o ambiente de nuvem antigo do assistente que guarda credencial de teste
    (o assistente usa só o ambiente "esportes-na-tv").
11. **Regra de proteção da `main`** (ruleset) — recomendado pela auditoria; pedir ao assistente o passo a passo.
12. Para o Contato e para o Pix: criar um **e-mail só do projeto** (por enquanto o Contato diz "em breve";
    o Pix ficou para depois — prioridade baixa, decidido pelo dono).
13. Mais para frente: domínio próprio ou conta do GitHub com nome neutro (o endereço atual mostra o
    nome da conta, ligado a outro negócio). No-IP grátis **não recomendado** (expira se não confirmar a
    cada 30 dias, não serve para anúncios). Ideia: criar primeiro o **e-mail só do projeto** — serve
    para Contato, Pix, nova conta neutra do GitHub e nova conta da football-data.

## 3. 🟡 Pendências do ASSISTENTE (próximo chat)
- Conferir a 1ª execução depois das correções da auditoria (workflow com actions novas fixadas
  por SHA: checkout v7, setup-node v7, upload-pages-artifact v5, configure-pages v6, deploy-pages v5).
- Correções da auditoria que ficaram para depois: aviso "confira o recebedor" no Pix (quando o Pix
  for ativado); anúncios (tirar `allow-popups-to-escape-sandbox`, redes confiáveis, bloquear apostas).
- Confirmar que os **escudos de basquete/vôlei/handebol** (TheSportsDB, sufixo `/small`)
  aparecem — a correção foi publicada, mas o dono ainda não confirmou.
- Se a API-Football voltar: conferir Libertadores/Copa do Brasil/Série B e as ligas extras.
- ⏰ **Conferência agendada para dom 29/11 às 15:30 (Brasília)**: F1 (GP do Qatar) e rúgbi de sábado
  aparecendo em Ontem/Hoje com placar. Se o lembrete não chegar, fazer no próximo chat.
- Conferir nos próximos dias, em https://github.com/suportetecsolutions-coder/esportes-na-tv/actions ,
  quanto dura cada execução (as que renovam tudo, a cada 6 h, levaram ~19 min por causa das
  pausas 429 do TheSportsDB) e se o rúgbi mostra os jogos do fim de semana.
- Atualizar este arquivo no fim de cada chat (verificação geral).

## 4. Como o sistema funciona
| Parte | Onde | Observação |
|---|---|---|
| Site | `index.html`, `app.js`, `style.css` | Estático, sem build. |
| Dados | `data/futebol.json`, `basquete.json`, `volei.json`, `handebol.json`, `f1.json`, `mma.json`, `rugbi.json` | `{ "AAAA-MM-DD": [jogos] }` (ontem/hoje/amanhã, horário de Brasília). F1/MMA têm também `_proximos` (eventos dos 14 dias seguintes). |
| Cota | `data/meta.json` | Horário da última consulta a cada API; pausa de 6 h se a API bloquear. |
| Robô | `scripts/atualizar.mjs` | Roda no GitHub Actions. |
| Publicação | `.github/workflows/esportes-na-tv.yml` | Jobs `montar` → `publicar` (Pages). Agendamento do GitHub (*/30) é só reserva. |
| Disparo confiável | cron-job.org | POST no endpoint *dispatches* a cada 30 min. |
| Canais | `canais.json` | Por código de campeonato; `jogos` sobrescreve por partida. |
| Ligas | `esportes.json` | Filtros da API-Sports + ligas do TheSportsDB (`tsdb`). |
| Pix | `apoio.json` | Vazio = botão escondido. QR gerado no navegador (`vendor/qrcode.js`, MIT). |
| Banners | `anuncios/esquerda.html`, `direita.html` | Só comentários = escondido. Só em tela ≥1640 px com mouse. |

### Fontes de dados
- **football-data.org** (chave grátis): Brasileirão A, Champions, Premier, La Liga, Bundesliga,
  Serie A, Ligue 1, Championship, Portugal, Holanda, Copa do Mundo, Eurocopa. Traz escudos.
- **API-Football / API-Sports** (conta grátis **SUSPENSA** em 25/11 — IPs compartilhados do
  GitHub Actions + testes do ambiente do assistente). Quando ativa: plano grátis só libera
  ontem/hoje/amanhã e 100 consultas/dia por esporte; o robô pega Brasil (exceto Série A e base),
  Libertadores, Sul-Americana, Liga Europa, Conference, Copa América, Mundial de Clubes, e
  basquete/vôlei/handebol. A temporada atual por liga é bloqueada no grátis; a busca por data funciona.
- **TheSportsDB** (chave pública `123`, sem cadastro) = **reserva** para basquete/vôlei/handebol
  quando a API-Sports está sem chave/bloqueada. Limites: **3 jogos por liga por dia**, sem NBB
  nem Superliga brasileira, placar atrasa, ~1 consulta a cada 4 s (o robô espera e tenta de novo se vier 429).

- **F1, MMA/UFC e Rúgbi (chat 2)**: só TheSportsDB grátis (sem `host` em `esportes.json`).
  F1 = liga 4370 (cada sessão é um item: Treino Livre, Classificação, Sprint, Corrida);
  MMA = UFC 4443 + Jungle Fight 4604 (um item por evento, sem lista de lutas);
  Rúgbi = Seis Nações 4714, Rugby Championship 4986, Copa do Mundo 4574, Champions Cup 4550,
  Top 14 4430, Premiership 4414, URC 4446, Super Rugby 4551, Super Liga Americana 5169 (tem o Cobras/Brasil).
  No grátis, `eventsseason` só traz os 15 primeiros eventos e `eventsnextleague` só 1 → "Próximos
  eventos" é montado consultando dia a dia (14 dias), renovado a cada 6 h (`meta.f1Prox`, `mmaProx`).
  O robô agora guarda em `meta.<esporte>Feitos` as datas já consultadas, para não repetir consultas
  em dias sem jogos (antes isso acontecia a cada execução).

### Funções do site
- Abas Agora / Ontem / Hoje / Amanhã; agrupar por Liga ou Horário; Recolher tudo; Seguir ★.
- Páginas `#/ligas`, `#/liga/NOME`, `#/canais`, `#/canal/NOME`; busca no topo.
- Pergunta "O que você quer ver?" ao abrir (um esporte; continua sozinha em 25 s; `?esporte=basquete` pula).
- Controle remoto: navegação própria por direção (bordas), OK = códigos 13/23/66/108,
  direcional Android 19–22, `keyup` de reserva, foco mantido ao redesenhar; ▶ num jogo vai à ★.
- Rolagem automática ligada (`?auto=0` desliga, `&vel=35`, `&espera=20`); pausa 20 s ao apertar tecla.
- Recarrega dados a cada 5 min; abre sempre em "Jogos"; tema claro/escuro; `?debug=1` mostra teclas.
- Celular: busca em linha própria; neon só com teclado/controle.
- F1/MMA: cartão de **evento** (nome, sessão, local 📍; sem escudos nem canais), título "Agenda de …"
  e grupo **📅 Próximos eventos** no fim da lista (com dia da semana e data); ★ e controle funcionam.

## 5. Decisões e histórico (chat 1 — 24 e 25/11/2026)
- Não replicar o futebolnatv por cópia (termos proíbem); usar APIs licenciadas.
- Site estático + GitHub Actions + Pages; cron-job.org para atualização confiável.
- Repositório antigo tinha uma pasta de outro projeto do dono; ela foi apagada da branch
  principal (cópia de segurança entregue), mas segue no histórico → por isso a mudança
  para este repositório novo, que começou com histórico limpo.
- Conta da API-Football suspensa minutos após criada; suporte (robô do chat) diz que precisa
  de revisão humana; plano B = TheSportsDB.
- Preços vistos (fontes de terceiros, confirmar antes de pagar): API-Football Pro ~US$19/mês,
  API-Basketball ~US$10/mês (assinaturas separadas por esporte); TheSportsDB Premium ~US$6–9/mês
  (não traz NBB/Superliga). Recomendação: não pagar ainda.
- OneFootball: não serve como fonte (só futebol, sem API pública); dono não quis links para ele.
- Doação via Pix: chave aleatória esconde CPF/telefone, mas o nome do recebedor aparece.

## 5c. Auditoria (chat 2, 25/11/2026 — Opus / esforço alto, só leitura)
- Sem achado crítico: nenhum segredo/dado pessoal no código nem no histórico; commits como "Claude".
- Relatório completo **não foi publicado** (repo público); ficou só no ambiente do assistente.
- **Corrigido no código:** data "HOJE" no fuso de Brasília (antes errava das 21h à meia-noite);
  "Atualizado em…" + aviso amarelo se dados tiverem mais de 2 h; robô não para mais se uma fonte
  falhar (mantém o publicado daquele esporte), timeouts em todas as consultas; validação dos dados
  antes de publicar (escudo só `https://`, placar só número); escape de todos os textos no site e
  dados nulos não derrubam a lista; CSP + referrer; sem código embutido em atributos; workflow com
  permissões por job, `persist-credentials: false`, `timeout-minutes`, actions fixadas por SHA
  (sem aviso de Node 20) e Dependabot; agendamento reserva do GitHub a cada 3 h (o cron-job.org
  continua a cada 30 min); só publica os arquivos usados; exemplo de futebol (possível cópia de
  terceiros) trocado por `{}`; página **sobre.html** (sobre, termos, privacidade/LGPD, marcas,
  fontes, contato "em breve"); rodapé com aviso de marcas e "confirme na emissora"; contraste do
  verde (#15803d), estrela e contorno escuro do neon no tema claro; `aria-label` na ★; licença MIT
  completa do qrcode.js; README reescrito; STAR+ → DISNEY+ (Star+ foi incorporado ao Disney+ em 2024).
- **Pendente (jurídico, para o dono decidir/confirmar):** termos de uso comercial das fontes de
  dados antes de anúncios; tributação de doações por Pix (contador); pesquisar a marca no INPI antes
  de domínio/anúncios.

## 5b. Chat 2 (25/11/2026)
- **Feito:** F1, MMA/UFC e Rúgbi no site e no robô (ver Fontes de dados). Testado com respostas
  simuladas + Playwright (TV 1280×720, celular, setas/OK com códigos 20/22/23). **Não testado com dados reais.**
- Ambiente do assistente: criado o ambiente de nuvem **"esportes-na-tv"** (só libera www.thesportsdb.com),
  separado do ambiente antigo (que guarda credencial de teste e não deve ser usado).

- **Conferido com dados reais (site novo no ar):** F1 mostra 10 próximos eventos (GP Qatar e
  Abu Dhabi), MMA mostra UFC 335; rúgbi sem jogos de ontem a amanhã (normal no meio da semana).
- Ajustes depois da conferência: rúgbi também ganhou **"📅 Próximos jogos"** (`"proximos": 0` =
  só o próximo jogo de cada liga, 9 consultas a cada 6 h); aviso "Nenhum evento/jogo neste dia"
  agora fica acima da lista de próximos.
- **Workflow:** `cancel-in-progress` passou para `false`. Antes, uma execução longa (1ª com os
  esportes novos, >30 min por pausas 429) era cancelada pelo disparo seguinte e perdia tudo.
  Agora o disparo novo espera na fila.
- Ambiente do assistente "esportes-na-tv" libera também `suportetecsolutions-coder.github.io`
  (para ler os dados publicados).

## 6. 💡 Sugestões para evoluir (quando o dono quiser)
- Traduzir nomes de países no local dos eventos (hoje aparece "Qatar", "United States", "Brazil").
- MMA: a fonte grátis não traz as lutas do card; só o nome do evento.
- ✅ (FEITO no chat 2) **DECIDIDO PELO DONO (fim do chat 1): incluir AGORA só Fórmula 1, MMA/UFC e Rúgbi** (NFL, MLB e NHL ficaram
  de fora por causa do limite de 3 jogos/liga/dia). Detalhes já verificados no TheSportsDB grátis:
  - **UFC**: liga id `4443`; cada evento vem como **um item só** (ex.: "UFC 335 Oliveira vs Lopes",
    horário UTC, local), sem a lista de lutas do card. Também existe **Jungle Fight** (MMA brasileiro), id `4604`.
  - Não há fonte de MMA melhor que seja grátis e permitida (API-MMA = conta suspensa; ESPN/UFC.com/
    Sherdog/Tapology não têm API liberada → não raspar).
  - **Ideia aprovada para avaliar:** F1 e UFC têm eventos poucos dias por semana → mostrar
    **"Próximos eventos"** (ex.: `eventsnextleague.php?id=`) em vez de só ontem/hoje/amanhã.
  - F1: cartão próprio (GP + treino/classificação/corrida, sem "time x time"). IDs da F1 e do rúgbi ainda a levantar.
- (Pedido original: Fórmula 1, MMA/UFC, NFL, MLB, NHL e rúgbi.)
  Plano: usar o TheSportsDB grátis (a API-Sports está suspensa e não pode ser testada do ambiente
  do assistente). F1 e UFC cabem bem no limite de 3 eventos/dia; NFL, MLB e NHL têm muitos jogos
  por dia, então só 3 por liga apareceriam. F1 precisa de um cartão diferente (GP + treino/
  classificação/corrida, sem "time x time"). Fazer em chat novo com **Opus / esforço médio**:
  levantar IDs das ligas no TheSportsDB, testar, adicionar os esportes na pergunta/botões.
- **Domínio próprio** (ex.: esportesnatv.com.br, ~R$40/ano): endereço mais fácil na TV e
  necessário para redes de anúncio.
- **Ligas brasileiras de basquete/vôlei (NBB, Superliga)**: só com fonte paga — pesquisar a
  mais barata que cubra (Opus/médio).
- Páginas **Vídeos** e **Times** ainda mostram "Em breve": decidir se faz ou se remove os botões.
- Atualizar as *actions* do workflow para versões novas (aviso de Node 20 descontinuado nos logs).
- Deixar o robô mais rápido (o TheSportsDB grátis é lento; cada execução completa leva ~10 min).
- Alerta automático se o robô falhar várias vezes seguidas (hoje o GitHub manda e-mail a cada falha).
