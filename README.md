# mapcidade-uptime-monitor

> Anonymized, from-scratch reconstruction of a real internal tool's architecture, built for a portfolio. Fictional services and data only — no real company, city, or monitoring infrastructure is represented here.

## English

### Problem

When a monitored service goes down, someone needs to notice fast, and whoever responds needs evidence — not just "it's down," but what the logs actually show and a first guess at why. Watching dashboards by hand doesn't scale past a handful of services, and a naive "alert on every failed check" approach pages the on-call team every few seconds for the entire length of one outage.

### Solution

Each health-check result updates a small state machine per service (`state.ts`) that is edge-triggered, not level-triggered: an alert fires exactly once when a service crosses from "up" into "down" after N consecutive failures, and again exactly once on recovery — never on every failed check in between. Crossing into "down" collects evidence and runs a small deterministic root-cause heuristic (`evidence.ts`) against the failure reason, then posts an incident report to a webhook (`alert.ts`) — or logs it in dry-run when no webhook is configured, so the tool is safe to demo or run with nothing wired up yet.

### Stack

TypeScript, Node.js, Express 5, `vitest`, `supertest`.

### How to run

```bash
npm install
npm run dev
# open http://localhost:3001
```

Click "Report failure" on any service 3 times in a row to trigger an incident (watch the terminal for the dry-run alert), then "Report success" twice to recover it.

### Demo

Screenshot/GIF of the dashboard + a triggered incident will be linked here.

### What I learned / engineering decisions

The edge-triggered state machine is the one piece of this project I was most careful to get exactly right, and it's covered by tests that specifically check the *boundary*: no alert on failure #2, exactly one alert on failure #3, no re-alert on failure #4, and a symmetric recovery threshold so a single lucky health check doesn't flip a still-flaky service back to "up." Getting this wrong in either direction is the difference between a monitor nobody trusts (too noisy) and one nobody notices (too quiet).

Root-cause guessing is a small deterministic pattern match against the failure reason, not a model call — for a demo (and honestly for a first-pass triage step in general) a fast, free, explainable heuristic beats an opaque one.

## Português

### Problema

Quando um serviço monitorado cai, alguém precisa perceber rápido, e quem for responder precisa de evidência — não só "caiu", mas o que os logs realmente mostram e um primeiro palpite do porquê. Olhar painel manualmente não escala além de um punhado de serviços, e um "alerta a cada falha" ingênuo aciona quem está de plantão a cada poucos segundos durante toda uma queda.

### Solução

Cada resultado de verificação de saúde atualiza uma pequena máquina de estados por serviço (`state.ts`) que é orientada a borda (edge-triggered), não a nível: um alerta dispara exatamente uma vez quando um serviço cruza de "up" pra "down" depois de N falhas consecutivas, e de novo exatamente uma vez na recuperação — nunca em toda falha entre uma coisa e outra. Cruzar pra "down" coleta evidência e roda uma heurística determinística pequena de causa raiz (`evidence.ts`) sobre o motivo da falha, depois posta um relatório de incidente num webhook (`alert.ts`) — ou registra em dry-run quando nenhum webhook está configurado, então a ferramenta é segura de demonstrar ou rodar sem nada plugado ainda.

### Stack

TypeScript, Node.js, Express 5, `vitest`, `supertest`.

### Como rodar

```bash
npm install
npm run dev
# abrir http://localhost:3001
```

Clique em "Report failure" em qualquer serviço 3 vezes seguidas pra disparar um incidente (olhe o terminal pro alerta em dry-run), depois "Report success" duas vezes pra recuperar.

### Demo

Screenshot/GIF do painel + um incidente disparado será linkado aqui.

### O que aprendi / decisões de engenharia

A máquina de estados orientada a borda é a peça desse projeto que mais tomei cuidado pra acertar exatamente, e tem testes que checam especificamente a *fronteira*: sem alerta na falha nº2, exatamente um alerta na falha nº3, sem realerta na falha nº4, e um limiar de recuperação simétrico pra que uma única verificação de sorte não vire um serviço ainda instável de volta pra "up". Errar isso em qualquer direção é a diferença entre um monitor em que ninguém confia (barulhento demais) e um que ninguém percebe (quieto demais).

O palpite de causa raiz é um casamento de padrão determinístico pequeno contra o motivo da falha, não uma chamada de modelo — pra uma demo (e honestamente pra uma primeira triagem em geral) uma heurística rápida, grátis e explicável ganha de uma opaca.

## License

MIT
