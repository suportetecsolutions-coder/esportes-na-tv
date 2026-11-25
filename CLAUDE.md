# Regras do projeto Esportes na TV (leia antes de qualquer coisa)

Este arquivo é lido automaticamente a cada chat novo. **Depois dele, leia `docs/ESTADO.md`**
(onde paramos, pendências, próximos passos) antes de responder ao dono do projeto.

> ⚠️ Este repositório é **PÚBLICO**. Nunca grave aqui chaves, tokens, senhas, e-mails,
> CPF/CNPJ, nomes de empresas do dono ou qualquer dado pessoal. Segredos ficam só em
> *Settings → Secrets* do GitHub ou no cron-job.org.

## Como falar com o dono
- Sempre em **português do Brasil**, linguagem simples, passo a passo numerado.
- Ele usa muito o **celular**: dê **links diretos** para cada tela (GitHub, cron-job.org etc.)
  e diga exatamente o que tocar/escrever. Quando ele precisar colar algo com um valor dele,
  mostre o texto com `*` no lugar do valor (ex.: `Bearer *`) e explique que deve trocar o `*`.
- Seja honesto: diga o que foi testado e o que não foi; não prometa o que não verificou.
- **Antes de cada tarefa, indique o modelo e o esforço** recomendados:
  - Sonnet / esforço baixo → rotina: guiar em painéis, textos, cores, canais, conferir execuções.
  - Sonnet / esforço médio → ajustes de layout/código simples.
  - Opus / esforço médio → pesquisa (fontes de dados, termos de uso), integrações novas.
  - Opus / esforço alto → bugs difíceis (ex.: navegação por controle remoto na TV).
  - Haiku → só perguntas rápidas, nunca mexer no código.

## Gestão do chat (contexto)
- Quando o chat passar de **~40% do contexto**, avisar o dono, fazer a **verificação geral**
  e encerrar para começar um chat novo.
- **Verificação geral (no fim de TODO chat):** revisar a conversa inteira e atualizar
  `docs/ESTADO.md` com: o que foi feito, decisões novas, pendências do dono, pendências do
  assistente, próximos passos, sugestões. Nada pode se perder. Commitar e enviar.
- No começo de cada chat: ler `docs/ESTADO.md`, resumir em poucas linhas onde paramos e
  perguntar por onde seguir (ou seguir a próxima pendência óbvia).

## Regras do produto (decididas pelo dono)
- Site **sem anúncios de terceiros indesejados**, inspirado no futebolnatv.com.br, mas com
  **layout e código próprios**. **Nunca copiar/raspar** o futebolnatv nem outros sites
  (termos de uso proíbem). Dados só de **fontes que permitem uso** (APIs).
- Escolha de esporte: **um por vez** (pergunta ao abrir + botões no topo).
- **Rolagem automática ligada por padrão** (desce e sobe; `?auto=0` desliga).
- **Destaque neon** (ciano) no item em foco ao usar controle/teclado.
- **Escudos** dos times (imagem; iniciais coloridas só como reserva).
- **Canais de TV só no futebol** (outros esportes não mostram canais).
- Tudo precisa ser **navegável e clicável pelo controle remoto** da TV/TV Box.
- Proteger o **CPF e a empresa** do dono: este projeto fica separado de qualquer outro
  negócio dele (não usar e-mail, conta, CNPJ ou nome de outra empresa aqui).

## Regras técnicas
- Site estático (HTML/CSS/JS puro) publicado no **GitHub Pages** a partir da branch `main`.
- Robô: `scripts/atualizar.mjs`, rodado pelo workflow `.github/workflows/esportes-na-tv.yml`,
  disparado a cada 30 min pelo **cron-job.org** (o agendamento do GitHub falha/pula horários
  e fica só como reserva). O robô controla a cota pelas datas em `data/meta.json`.
- **NUNCA chamar a API-Sports (API-Football etc.) a partir do ambiente de teste do assistente.**
  IP compartilhado foi a provável causa da suspensão da conta. Testes do robô: sempre com
  respostas simuladas (stub de `fetch`), em uma cópia da pasta fora do repositório.
- Não rodar `node scripts/atualizar.mjs` "de verdade" sem necessidade: sem chave ele consulta
  o TheSportsDB por vários minutos (limite de ~1 consulta a cada 4 s).
- Testar mudanças visuais com Playwright (Chromium já instalado), em desktop, celular e
  simulando teclas do controle (setas, Enter, keyCode 23 e 19–22).
- Mudanças: commit com mensagem clara; o dono tem aprovado que o assistente envie para a
  `main` depois de testar. Avisar sempre o que foi publicado.
- Ligas/canais editáveis: `esportes.json` (filtros e ligas do TheSportsDB), `canais.json`
  (canais por campeonato), `apoio.json` (Pix), `anuncios/*.html` (banners).
