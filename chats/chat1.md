# Análise de desempenho fut7

_Started 2026-08-06 12:07 UTC_

---

## User

Prototipar interface de um app de análise de desempenho de futebol society (fut7).

CONTEXTO: app pra registrar eventos de partida (gols, cartões, passes, cruzamentos, 
lançamentos) em tempo real assistindo vídeo, e depois visualizar em dashboard.

TELA 1 — Registro mobile (prioridade máxima):
- Bottom sheet fixo, botões grandes na zona do polegar
- Fluxo: toca "Gol" → mini-campo com 9 zonas clicáveis → escolhe perna/cabeça/bola 
  parada → lista de jogadores do time em campo pra marcar assistência (opcional) → salvo
- Sem hover, tudo touch-first, feedback visual instantâneo de "salvo"

TELA 2 — Registro PC (modo replay):
- Mesma lógica, mas com atalhos de teclado visíveis na tela (tecla pra cada tipo de evento)
- Layout mais denso, pensado pra quem revisa vídeo com calma

TELA 3 — Dashboard:
- KPIs gerais do time no topo (gols por origem de jogada: contra-ataque/bola 
  parada/transição/jogo organizado)
- Evolução individual do atleta (gráfico de linha ao longo de partidas)
- Mapa de zona de finalização (heatmap simplificado, 9 setores)

RESTRIÇÃO IMPORTANTE DE COR: o usuário é daltônico (vermelho-verde). NÃO usar 
vermelho/verde como par "negativo/positivo" em nenhum gráfico ou indicador. 
Usar paleta com azul/laranja ou azul/dourado pra contraste positivo/negativo, 
e nunca depender só de cor — usar também ícone ou posição pra diferenciar.

IDENTIDADE VISUAL: dark theme, estética de dado esportivo real (tipo Opta/Sofascore), 
não infantil, não "gamer" — é uma ferramenta de análise séria.

## Assistant

_[tool: list_files]_

_[tool: read_skill_prompt]_

_[tool: questions_v2]_

## User

Questions answered:
- navegacao: Abas/menu fixo simples no topo para trocar entre as telas
- escopo_interacao: Fluxo completo + outros eventos (cartão, passe, cruzamento, lançamento) também clicáveis
- video_mock: Decide para mim
- dados_dashboard: Serão adicionados a mão, então nesse primeiro momento somente visualmente e ficticio
- interatividade_dashboard: Com filtros funcionais (ex: trocar jogador no gráfico de evolução, trocar partida)

## Assistant

_[tool: dc_write]_

_[tool: show_html]_

_[tool: get_webview_logs]_

Loads cleanly with no console errors.

_[tool: ready_for_verification]_

Protótipo criado com 3 telas navegáveis por abas: registro mobile (fluxo completo Gol→zona→perna/cabeça/bola parada→assistência, mais cartão/passe/cruzamento/lançamento), registro PC com atalhos de teclado reais (G/C/P/X/L, espaço para play/pause, Esc para voltar) e log da partida, e dashboard com KPIs de origem de gol, gráfico de evolução individual filtrável por jogador/partida e heatmap de zona de finalização — tudo em azul/laranja, sem depender de cor isolada (ícones, texto e números redundantes). Aguardando verificação.

