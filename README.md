# Esportes na TV

Guia gratuito e sem anúncios de jogos e eventos: futebol, basquete, vôlei, handebol, Fórmula 1,
MMA/UFC e rúgbi. Mostra horários, placares e, no futebol, os canais de TV. Funciona no celular, no
computador e na TV (navegação por controle remoto, rolagem automática).

Site: https://suportetecsolutions-coder.github.io/esportes-na-tv/

## Como funciona
- **Site** estático (HTML/CSS/JS puro, sem build): `index.html`, `app.js`, `style.css`, `sobre.html`
  (sobre, termos de uso e privacidade).
- **Robô** `scripts/atualizar.mjs`, rodado pelo workflow `.github/workflows/esportes-na-tv.yml`,
  grava `data/*.json` (ontem/hoje/amanhã no horário de Brasília) e publica no GitHub Pages.
  Disparo a cada 30 min pelo cron-job.org; o agendamento do GitHub fica só como reserva.
- **Fontes de dados**: football-data.org (futebol, segredo `FOOTBALL_DATA_KEY`), API-Sports
  (segredo `API_FOOTBALL_KEY`, opcional) e TheSportsDB (chave pública, sem cadastro).
- Se uma fonte falhar, o robô mantém os dados já publicados daquele esporte e segue com os outros.
  O site mostra a hora da última atualização e avisa quando os dados estão atrasados.

## Arquivos editáveis
- `esportes.json`: ligas de cada esporte (ids do TheSportsDB, filtros da API-Sports, próximos eventos).
- `canais.json`: canais de TV por campeonato (`jogos` sobrescreve por partida).
- `apoio.json`: botão de apoio por Pix (vazio = escondido).
- `anuncios/esquerda.html` e `direita.html`: espaços de banner (só comentários = escondido).

## Rodar localmente
    python3 -m http.server 8000   # abrir http://localhost:8000

## Link para a TV
- `?esporte=f1` (ou `futebol`, `basquete`, `volei`, `handebol`, `mma`, `rugbi`) pula a pergunta inicial.
- `?auto=0` desliga a rolagem automática; `&vel=35` e `&espera=20` ajustam velocidade e pausa.
- `?debug=1` mostra na tela a tecla do controle recebida.

## Licenças
- Código do projeto: próprio. Biblioteca de QR Code: `vendor/qrcode.js` (qrcode-generator 1.4.4,
  MIT, ver `vendor/LICENSE.txt`).
- Nomes, marcas e escudos pertencem aos seus donos; o projeto não tem vínculo com ligas, clubes ou emissoras.
