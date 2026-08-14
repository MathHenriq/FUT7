import type { AreaIdeia, Escala, Ideia, StatusIdeia } from './types';

export const areasIdeia: { key: AreaIdeia; label: string; nota: string }[] = [
  { key: 'captura', label: 'Captura', nota: 'Vídeo, evento ao vivo, sensor' },
  { key: 'codificacao', label: 'Codificação', nota: 'Transformar o lance em dado estruturado' },
  { key: 'analise', label: 'Análise', nota: 'Filtrar, cruzar, medir' },
  { key: 'devolucao', label: 'Devolução', nota: 'Clipe, apresentação, conversa com o time' },
  { key: 'ia', label: 'IA', nota: 'Reconhecimento e sugestão automática' },
  { key: 'fisico', label: 'Físico', nota: 'Velocidade, distância, carga' },
  { key: 'scouting', label: 'Scouting', nota: 'Observar e comparar jogadores de fora do elenco' },
  { key: 'engajamento', label: 'Engajamento', nota: 'O que faz o elenco abrir o app' },
  { key: 'plataforma', label: 'Plataforma', nota: 'Base técnica, visual, exportação' },
];

export const statusIdeia: { key: StatusIdeia; label: string; ordem: number }[] = [
  { key: 'fazendo', label: 'Fazendo', ordem: 0 },
  { key: 'estudando', label: 'Estudando', ordem: 1 },
  { key: 'ideia', label: 'Ideia', ordem: 2 },
  { key: 'feito', label: 'Feito', ordem: 3 },
  { key: 'descartado', label: 'Descartado', ordem: 4 },
];

export function labelArea(a: AreaIdeia): string {
  return areasIdeia.find((x) => x.key === a)?.label ?? a;
}

export function labelStatus(s: StatusIdeia): string {
  return statusIdeia.find((x) => x.key === s)?.label ?? s;
}

export const escalaLabel: Record<Escala, string> = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };

/** Impact over effort. Higher score sorts first inside a status group. */
export function prioridade(i: Ideia): number {
  return i.impacto / i.esforco;
}

/** Bumped whenever the seeded backlog gains items, so they reach installs that already
 *  have a stored list — without touching anything the user edited or moved. */
export const SEED_IDEIAS_VERSAO = 5;

type Semente = Omit<Ideia, 'id' | 'criadoEm' | 'atualizadoEm'>;

const sementes: Semente[] = [
  // ---- Fundação de scouting (o pilar novo) -------------------------------------
  {
    titulo: 'Times e jogadores fora do elenco',
    descricao: 'Clube vira entidade, e o nosso é apenas um deles. Sem isso o app não consegue nem representar um jogo profissional, porque tudo hoje assume que existe um "nós". O lado do evento deixa de ser possessivo e vira posicional: a sessão declara quem é o time A e quem é o B. Nos jogos do nosso time A continua sendo ele, então o histórico migra sem tocar em nada.',
    area: 'scouting', status: 'fazendo', impacto: 3, esforco: 2,
    referencia: 'Pré-requisito de todo o pilar de scouting',
  },
  {
    titulo: 'Sessão de observação',
    descricao: 'Assistir um jogo do qual não participamos, para observar alguém. Mesmo motor de marcação, mas sem escalação nossa e com dois times de fora. É o que transforma o app de ferramenta do time em ferramenta de análise de qualquer jogo.',
    area: 'scouting', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Wyscout — acervo de partidas',
  },
  {
    titulo: 'Modo foco: rastrear um jogador',
    descricao: 'Escolher um jogador e registrar tudo que ele faz durante a partida gravada — perde, recupera, passa, finaliza, cria chance. A marcação some do resto do jogo e fica só nele, o que deixa a codificação muito mais rápida e é exatamente como o olheiro trabalha.',
    area: 'scouting', status: 'feito', impacto: 3, esforco: 2,
    referencia: 'Spiideo AutoFollow — seguir o jogador, não a bola',
  },
  {
    titulo: 'Comparação de jogadores por percentil',
    descricao: 'Colocar dois ou mais jogadores lado a lado nas mesmas métricas, normalizados por tempo jogado. É o núcleo de qualquer decisão de scouting: sem comparação, número isolado não diz se é bom.',
    area: 'scouting', status: 'feito', impacto: 3, esforco: 2,
    referencia: 'StatsBomb radars · Wyscout advanced search',
  },
  {
    titulo: 'Relatório de observação exportável',
    descricao: 'Fechar a observação num documento: quem foi visto, contra quem, o que fez, pontos fortes e fracos, e o parecer. É o entregável do olheiro — sem ele o trabalho fica preso no app.',
    area: 'scouting', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Wyscout · Driblab',
  },
  {
    titulo: 'Busca por critério de estatística',
    descricao: 'Filtrar jogadores observados por número, posição, idade e faixa de métrica. É o que faz o banco de observações virar ferramenta de decisão em vez de arquivo morto.',
    area: 'scouting', status: 'ideia', impacto: 2, esforco: 2,
    referencia: 'Wyscout Advanced Search',
  },
  {
    titulo: 'Câmera ao vivo',
    descricao: 'Captura em tempo real com câmera dedicada ou celular transmitindo. Adiado de propósito para o fim do projeto: todo o resto funciona com vídeo gravado, e câmera ao vivo traz um custo de hardware e sincronização que não paga agora.',
    area: 'captura', status: 'ideia', impacto: 1, esforco: 3,
    referencia: 'Adiado — Veo, Spiideo, Pixellot',
  },
  // ---- A visão de longo prazo -------------------------------------------------
  {
    titulo: 'Treino prescrito para a dificuldade do jogador',
    descricao: 'A partir do que o dado mostra (perde bola na saída, finaliza mal de fora da área, erra passe sob pressão), sugerir exercícios específicos. Base: pesquisa própria ligando padrão de erro a exercício com evidência. Fecha o laço observação → exercício → critério para a próxima sessão — que é justamente o que nenhuma plataforma grande faz, porque nenhuma controla o treino.',
    area: 'devolucao', status: 'ideia', impacto: 3, esforco: 3,
    referencia: 'Visão do produto · nenhuma plataforma fecha esse laço',
  },
  {
    titulo: 'IA assistente dentro do vídeo',
    descricao: 'A IA propõe os lances da gravação e o analista confirma. O modelo já reserva origem, confiança e confirmado, então o palpite da máquina nunca entra na estatística confundido com marcação humana. Roda sobre gravação, não sobre transmissão ao vivo — o vídeo gravado já existe no app.',
    area: 'ia', status: 'ideia', impacto: 3, esforco: 3,
    referencia: 'Metrica Smart Tagging 3.0 · Veo',
  },
  {
    titulo: 'IA sobre as estatísticas',
    descricao: 'Leitura automática do que os números dizem: onde perdemos mais bola, contra quem o aproveitamento cai, qual jogador regrediu. Diferente da IA de vídeo — aqui o dado já está estruturado, então é bem mais viável a curto prazo.',
    area: 'ia', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Visão do produto',
  },
  {
    titulo: 'Recomendação de profissionais',
    descricao: 'Ligar a dificuldade identificada a quem sabe resolver: preparador físico, fisioterapeuta, treinador de goleiro, nutricionista. Encerra o ciclo fora do app, que é onde o problema do atleta de verdade se resolve.',
    area: 'devolucao', status: 'ideia', impacto: 2, esforco: 3,
    referencia: 'Visão do produto',
  },

  // ---- Prioridades saídas da pesquisa ----------------------------------------
  {
    titulo: 'Minutos jogados por jogador',
    descricao: 'Sem isso nenhuma métrica normaliza e todo ranking premia quem joga mais, não quem joga melhor. Destrava o "por 40" e o tempo efetivo. É o buraco que mais contamina o resto do app hoje.',
    area: 'codificacao', status: 'feito', impacto: 3, esforco: 1,
    referencia: 'Wyscout — normalização por 90',
  },
  {
    titulo: 'Attack Momentum',
    descricao: 'Gráfico da oscilação de pressão ao longo do jogo. Calculável hoje: já registramos lado, minuto e local de cada evento. Melhor retorno visual por linha de código de todo o projeto, e vira assinatura do app.',
    area: 'analise', status: 'feito', impacto: 3, esforco: 1,
    referencia: 'Sofascore',
  },
  {
    titulo: 'Playlists e apresentação',
    descricao: 'Filtrar eventos, virar sequência de clipes com alguns segundos antes e depois, e mostrar para o time. Fecha o quarto tempo do ciclo — que é onde produto amador morre.',
    area: 'devolucao', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Nacsport · LongoMatch',
  },
  {
    titulo: 'Matriz cruzada clicável',
    descricao: 'Tabela tipo de evento × jogador, ou zona × resultado, que serve ao mesmo tempo de leitura estatística e de filtro: clicou na célula, achou os lances. Barata e de alto valor.',
    area: 'analise', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Sportscode Matrix · Nacsport Data Matrix',
  },
  {
    titulo: 'xT calibrado com o nosso histórico',
    descricao: 'Valor de cada setor calculado pela nossa própria taxa de conversão, não importado do futebol de campo — que mentiria numa quadra menor. Com origem e destino do passe já gravados, passe progressivo e valor da ação saem quase de graça.',
    area: 'analise', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Expected Threat · StatsBomb OBV',
  },
  {
    titulo: 'Card do jogador e craque do jogo',
    descricao: 'Imagem compartilhável no WhatsApp e votação do craque pelos companheiros. Nenhuma ferramenta profissional faz. No amador o engajamento não é consequência do dado — é a fonte dele.',
    area: 'engajamento', status: 'ideia', impacto: 3, esforco: 2,
    referencia: 'Tonsser — 2M+ usuários',
  },
  {
    titulo: 'Descritores configuráveis pelo analista',
    descricao: 'Tirar o vocabulário de dentro do código: o analista cria seus próprios tipos de evento e qualificadores. Maior salto de valor por esforço do produto, e o que faz a ferramenta durar além do vocabulário que escolhemos.',
    area: 'codificacao', status: 'ideia', impacto: 3, esforco: 3,
    referencia: 'Nacsport — categorias × descritores',
  },
  {
    titulo: 'Receptor do passe',
    descricao: 'Já temos de onde saiu e para onde foi. Falta quem recebeu — e aí a rede de passes fica completa: quem serve quem, e por onde.',
    area: 'codificacao', status: 'ideia', impacto: 2, esforco: 1,
    referencia: 'StatsBomb — pass maps',
  },
  {
    titulo: 'Vocabulário de quadra',
    descricao: 'Superioridade numérica (3v2, 4v3) e bola parada como categorias de primeira classe. No campo grande são secundárias; na quadra decidem jogo. Nosso vocabulário ainda é futebol de campo encolhido.',
    area: 'codificacao', status: 'ideia', impacto: 2, esforco: 2,
    referencia: 'Once Sport — template de futsal',
  },
  {
    titulo: 'PSV-99 no lugar da velocidade máxima',
    descricao: 'Usar o percentil 99 da velocidade em vez do pico bruto, para um erro de medição não virar recorde. Só faz sentido quando houver série temporal, mas a definição já fica fechada.',
    area: 'fisico', status: 'ideia', impacto: 2, esforco: 1,
    referencia: 'SkillCorner',
  },
  {
    titulo: 'Traçado do passe por arrasto',
    descricao: 'Arrastar de A até B no campo, em vez de dois toques. Colapsa dois passos num gesto e preenche exatamente os campos de origem e destino que já existem — a marcação de passe fica mais rápida do que é hoje.',
    area: 'codificacao', status: 'ideia', impacto: 2, esforco: 1,
    referencia: 'Pedido do analista',
  },
  {
    titulo: 'Telestração no vídeo',
    descricao: 'Desenhar sobre o frame: seta, círculo, linha. E principalmente seta animada — seta parada mostra posição, seta animada mostra intenção. Para explicar movimentação sem bola, vale mais que número.',
    area: 'devolucao', status: 'ideia', impacto: 2, esforco: 3,
    referencia: 'Dartfish · Once Sport',
  },
  {
    titulo: 'Tempo efetivo de jogo',
    descricao: 'Normalizar por bola rolando, não por tempo corrido. Em quadra a bola fica parada demais para minutagem bruta significar alguma coisa.',
    area: 'analise', status: 'ideia', impacto: 2, esforco: 2,
    referencia: 'Literatura de futsal (Frontiers)',
  },
  {
    titulo: 'Exportar CSV e XML',
    descricao: 'XML no formato Sportscode é a moeda de troca do setor; planilha é a língua franca do amador. Serve para o analista levar o dado embora — e ninguém confia em ferramenta que aprisiona dado.',
    area: 'plataforma', status: 'ideia', impacto: 2, esforco: 1,
    referencia: 'Sportscode · Wyscout',
  },
  {
    titulo: 'Comentário livre no evento',
    descricao: 'Campo de texto no lance. Trivial de implementar, e é o que o analista mais sente falta quando o vocabulário fechado não cobre o caso.',
    area: 'codificacao', status: 'ideia', impacto: 2, esforco: 1,
    referencia: 'LongoMatch',
  },
  {
    titulo: 'Separação visual dos três modos',
    descricao: 'Ao vivo, estúdio e análise têm ergonomias diferentes: polegar na beira do campo, teclado na mesa, leitura densa. Hoje têm a mesma cara — e é por isso que parece tudo junto. Densidades diferentes é a correção real; paleta é acabamento em cima disso.',
    area: 'plataforma', status: 'feito', impacto: 3, esforco: 3,
    referencia: 'Wyscout · FotMob',
  },
  {
    titulo: 'Identidade visual própria',
    descricao: 'Sem envolver marca de terceiros, o app precisa de nome e paleta próprios. Fica pendente da decisão de nome.',
    area: 'plataforma', status: 'fazendo', impacto: 2, esforco: 2,
    referencia: 'Decisão pendente',
  },

  // ---- Descartado com motivo ---------------------------------------------------
  {
    titulo: 'Packing',
    descricao: 'Quantos adversários um passe elimina. Depende de saber a posição de todos os jogadores no instante do passe. Sem tracking, é impossível — e estimar seria inventar.',
    area: 'analise', status: 'descartado', impacto: 2, esforco: 3,
    referencia: 'Exige tracking completo',
  },
  {
    titulo: 'PPDA',
    descricao: 'Mede intensidade de pressão contando os passes que o adversário completa antes da nossa ação defensiva. Exigiria marcar passe a passe do adversário — marcação ao vivo não sustenta esse volume.',
    area: 'analise', status: 'descartado', impacto: 2, esforco: 3,
    referencia: 'Volume de marcação inviável',
  },
  {
    titulo: 'Velocidade calculada por vídeo',
    descricao: 'Só sai confiável com câmera fixa e linhas do campo visíveis, porque depende de homografia calibrada pelas linhas. Com câmera na mão o número vira ficção — e ficção com duas casas decimais é pior que não ter. O caminho é GPS do celular no bolso.',
    area: 'fisico', status: 'descartado', impacto: 3, esforco: 3,
    referencia: 'Limite técnico real',
  },

  // ---- Já entregue ------------------------------------------------------------
  { titulo: 'Elenco editável', descricao: 'Cadastro real de jogadores com número, posição e ativo/inativo, no lugar dos nomes cravados no código.', area: 'codificacao', status: 'feito', impacto: 3, esforco: 2 },
  { titulo: 'Lado do evento (nós × adversário)', descricao: 'Sem isso não existia gol sofrido nem leitura defensiva.', area: 'codificacao', status: 'feito', impacto: 3, esforco: 2 },
  { titulo: 'Coordenada x,y no lugar do índice de setor', descricao: 'Setor virou derivado da coordenada, então alternar entre 9 e 12 re-agrupa o histórico inteiro sem perder nada. Verificado: total de gols idêntico nas duas grades.', area: 'plataforma', status: 'feito', impacto: 3, esforco: 2, referencia: 'Opta Vision · SkillCorner' },
  { titulo: 'Finalização com resultado', descricao: 'Gol virou resultado de finalização, não tipo de evento. Deu lugar ao chute que não entrou e tornou o aproveitamento calculável.', area: 'codificacao', status: 'feito', impacto: 3, esforco: 2 },
  { titulo: 'Vocabulário defensivo', descricao: 'Perda de bola, recuperação e falta — as métricas que a literatura de futsal aponta como centrais.', area: 'codificacao', status: 'feito', impacto: 3, esforco: 2 },
  { titulo: 'Origem e destino do passe', descricao: 'Base para trajetória, rede de passes e passe progressivo.', area: 'codificacao', status: 'feito', impacto: 2, esforco: 1 },
  { titulo: 'Seletor de campo', descricao: 'Campo desenhado com marcações, toque grava a coordenada exata do ponto — a grade é guia de mira, não destino.', area: 'codificacao', status: 'feito', impacto: 2, esforco: 2 },
  { titulo: 'Campo 3D', descricao: 'Visualização dos setores em três dimensões, com órbita limitada de propósito e carregamento sob demanda para não pesar o registro ao vivo.', area: 'analise', status: 'feito', impacto: 2, esforco: 3 },
  { titulo: 'Vídeo real com passo de frame', descricao: 'Upload, transporte de 0,25× a 3×, linha do tempo com marcadores e apito inicial separando o segundo da mídia do minuto de partida.', area: 'captura', status: 'feito', impacto: 3, esforco: 3, referencia: 'Sportscode · Nacsport' },
  { titulo: 'Proveniência do evento', descricao: 'Todo evento carrega se veio de marcação ao vivo, manual em vídeo ou IA. Nenhuma plataforma expõe isso tão explicitamente.', area: 'plataforma', status: 'feito', impacto: 3, esforco: 1 },
  { titulo: 'Exercícios de treino', descricao: 'Blocos dentro da sessão, com o exercício ativo carimbando cada evento. É a base do treino prescrito.', area: 'codificacao', status: 'feito', impacto: 3, esforco: 2 },
  { titulo: 'Métricas físicas', descricao: 'Velocidade, distância e sprints como entidade própria, não como evento — medição sobre período é coisa diferente de lance num instante.', area: 'fisico', status: 'feito', impacto: 2, esforco: 2 },
  { titulo: 'Perfil do jogador', descricao: 'Evolução em doze métricas, mapa de finalizações e tabela sessão a sessão. Lacuna aparece como lacuna, não como zero.', area: 'analise', status: 'feito', impacto: 3, esforco: 3 },
];

/** Adds seed items the install has never seen, matched by title. User edits survive,
 *  and an item the user deliberately deleted stays deleted only until the seed bumps —
 *  a deliberate trade for keeping the roadmap in sync. */
export function fundirIdeias(existentes: Ideia[] | undefined, versaoGuardada: number): Ideia[] {
  if (!existentes) return criarIdeiasIniciais();
  if (versaoGuardada >= SEED_IDEIAS_VERSAO) return existentes;
  const titulos = new Set(existentes.map((i) => i.titulo));
  const novas = criarIdeiasIniciais().filter((i) => !titulos.has(i.titulo));
  return [...novas, ...existentes];
}

export function criarIdeiasIniciais(): Ideia[] {
  const agora = Date.now();
  return sementes.map((s, i) => ({
    id: `ideia-seed-${i}`,
    criadoEm: agora - (sementes.length - i) * 1000,
    atualizadoEm: agora - (sementes.length - i) * 1000,
    ...s,
  }));
}
