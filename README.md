# Esportes na TV (sem anúncios)

Guia de jogos de futebol: horários, canais de transmissão, ao vivo/hoje/ontem/amanhã,
agrupamento por liga ou horário, busca, seguir jogos (★) e tema claro/escuro.

## Rodar
    python3 -m http.server 8000   # abrir http://localhost:8000

HTML/CSS/JS puro, sem build. Funciona em qualquer hospedagem estática.

## Dados
Tudo vem de `data/futebol.json`, `data/basquete.json`, `data/volei.json` e `data/handebol.json` (`{ "AAAA-MM-DD": [ {liga, rodada, casa, fora, status, hora, tempo?, placar?, canais:[{nome, obs?}]} ] }`).
`status`: `agendado` | `aovivo` | `encerrado`. O arquivo atual é só um **exemplo** (snapshot de 23–25/11/2026).
Para manter atualizado, alimente esse JSON de uma fonte licenciada (ex.: API-Football, football-data.org).

## Observação
Layout e código próprios; escudos são siglas coloridas (não usa imagens do site original,
cujo conteúdo tem reprodução proibida). Páginas Vídeos/Times/Ligas/Canais ainda não existem.

## Atualização automática (GitHub Actions + Pages)
- `scripts/atualizar.mjs` busca ontem/hoje/amanhã na API football-data.org (plano grátis) e regrava `data/jogos.json`.
- `canais.json`: canais por campeonato (editável; `jogos` sobrescreve por partida).
- `.github/workflows/esportes-na-tv.yml`: roda a cada 30 min, atualiza e publica o site.

Configuração (uma vez):
1. Repo > Settings > Secrets and variables > Actions > New secret: nome `FOOTBALL_DATA_KEY`, valor = sua chave.
2. Repo > Settings > Pages > Source: **GitHub Actions**.
3. O workflow agendado só roda na branch padrão (main): faça o merge para ela.
4. Link final: `https://SEUUSUARIO.github.io/NOME-DO-REPO/` (Pages em repo privado exige plano pago).

## Libertadores, Sul-Americana, Copa do Brasil e Série B (opcional)
Vêm da API-Football (plano grátis, 100 chamadas/dia). Crie o segredo `API_FOOTBALL_KEY` no GitHub
(mesmo caminho do `FOOTBALL_DATA_KEY`). Sem ele, essas competições simplesmente não aparecem.
Hoje é buscado a cada execução; ontem/amanhã só a cada ~6 h (o resto reaproveita o site já publicado).

## Páginas
`#/` jogos · `#/ligas` · `#/liga/NOME` · `#/canais` · `#/canal/NOME`

## TV / controle remoto
- Setas movem o foco entre itens (ligas e jogos são focáveis); se nada se move, a tela rola. OK/Enter recolhe/expande a liga.
- Rolagem automática (desce e sobe): botão no topo, tecla **A**, ou no link: `?auto=1`.
  Ajustes no link: `&vel=35` (pixels/segundo) e `&espera=20` (segundos parado após apertar uma tecla).
  Ex.: `https://suportetecsolutions-coder.github.io/esportes-na-tv/?auto=1&vel=30`
- A página recarrega os dados sozinha a cada 5 minutos.

## Vários esportes
- Ao abrir o link o site pergunta o que ver (futebol, basquete, vôlei ou handebol — **um por vez**). Tocar/OK num esporte já entra nele. Continua sozinho em 25 s com a última escolha. Os botões no topo trocam de esporte.
- Para pular a pergunta, use no link `?esporte=basquete`.
- Basquete/vôlei/handebol vêm da API-Sports (mesma chave `API_FOOTBALL_KEY`). Quais ligas entram: `esportes.json` (países + nomes de liga). Não mostram canais de TV.
- Escudos: vêm da própria API (imagem); se não carregar, aparecem as iniciais coloridas.

## Controle remoto (navegação própria)
Setas movem o foco pela direção; OK/Enter clica (num jogo = seguir ★; numa liga = recolher). Códigos aceitos para OK: 13, 23, 66, 108.
A pergunta de esportes não trava: continua sozinha (15 s; 10 s após marcar algo).
Teste de teclas na TV: abra o link com `?debug=1` — mostra na tela a última tecla recebida e o item em foco.

## Controle remoto (v3)
Navegação por bordas (padrão de TV): setas movem para o vizinho na direção; ▶ num jogo vai para a estrela ★, ◀ volta. OK clica em qualquer botão.
Aceita códigos de teclado (37–40) e de direcional Android (19–22), OK = 13/23/66/108, e só `keyup` se o aplicativo não mandar `keydown`.
O foco é mantido no mesmo item quando a lista é redesenhada.

## Destaque e rolagem (v4)
- Item em foco ganha contorno neon (ciano) quando se usa controle/teclado; some ao usar mouse/toque.
- Rolagem automática começa ligada. Desligar pelo botão vale até fechar; `?auto=0` no link deixa desligada.
- Na caixa de busca, ◀ ▶ saem dela quando está vazia (ou com o cursor na ponta).

## Ligas extras e controle de cota (v5)
- Futebol (API-Football, busca por data): todas as competições do Brasil (menos Série A, que vem da football-data, e as de base) + Libertadores, Sul-Americana, Liga Europa, Conference League, Copa América e Mundial de Clubes.
- O plano grátis só libera ontem/hoje/amanhã. O robô consulta "hoje" no máximo a cada 20 min (futebol) / 55 min (outros esportes) e ontem/amanhã a cada 6 h, guardando os horários em `data/meta.json`.
- Se a API responder conta suspensa/cota estourada, o robô pausa as chamadas por 6 h e mantém os dados anteriores.

## Reserva grátis: TheSportsDB (v6)
- Quando a API-Sports está sem chave ou bloqueada (conta suspensa/cota), basquete, vôlei e handebol vêm do TheSportsDB (chave pública `123`, sem cadastro).
- Ligas usadas: campo `tsdb` em `esportes.json` (id da liga → nome em português).
- Limites do plano grátis: no máximo 3 jogos por liga por dia, sem placar ao vivo em tempo real, ~1 consulta a cada 4 s (o robô espera sozinho).
- Ligas brasileiras (NBB, Superliga) não estão disponíveis no TheSportsDB grátis.

## Apoio (Pix) e anúncios laterais (v7)
- **Botão "Apoie com Pix"**: preencha `apoio.json` (`pix.chave`, `pix.nome`, `pix.cidade`). Mostra QR Code + "copia e cola" gerados no próprio navegador (sem serviço externo). Enquanto `chave` estiver vazia, o botão não aparece. Use de preferência uma **chave aleatória**; o nome do recebedor continua aparecendo para quem paga, e a chave fica pública neste repositório.
- **Anúncios laterais** (160x600): cole o código do banner em `anuncios/esquerda.html` e/ou `anuncios/direita.html`. Enquanto só houver comentários, o espaço não aparece. Só aparecem em telas largas (≥1640 px) de computador com mouse; nunca em celular, TV ou ao usar controle remoto. Cada banner é carregado num iframe isolado, sem foco de teclado.
- Antes de ativar anúncios, confira os termos de uso comercial das fontes de dados gratuitas (football-data.org, TheSportsDB, API-Sports).
- Biblioteca de QR Code: `vendor/qrcode.js` (qrcode-generator 1.4.4, licença MIT).
