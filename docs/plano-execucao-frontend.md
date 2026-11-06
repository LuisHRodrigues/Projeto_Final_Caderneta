# Plano completo de execução — Frontend (Flutter Web) da Caderneta

Versão de 05/11/2026. Responsável: Artur (com Codex/Claude no VS Code). Escopo: `frontend-repo/`.
Este documento complementa o [plano compartilhado](plano-execucao-caderneta-atualizado.md) e o detalha do lado do frontend. **Em qualquer divergência de contrato HTTP, vale o plano compartilhado**; as divergências encontradas estão na seção 9.

---

## 1. Pedido e modo de trabalho

Executar, no frontend, tudo o que o plano compartilhado atribui a Artur: Histórico, espaçamentos, sessão/login/logout, nginx e URL da API, ativação por convite, gestão de acessos, área do cliente, Auditoria do gerente, atualização periódica, remoção do funcionário fixo, testes e validação integrada. Avançar nas tarefas que não dependem do backend e deixar explícita a fronteira das que dependem.

Limites:

- Alterar somente `frontend-repo/` (incluindo `nginx.conf` e `Dockerfile`) e a documentação em `docs/`. Ler o backend para conferir contratos, mas **não modificá-lo**: `backend-repo/`, `docker-compose.yml`, ponteiros de submódulos e Compose são do outro lado.
- Sem reset, limpeza de arquivos, troca de branch automática ou push. Commits só quando Artur pedir; commits pequenos, por fase.
- Preservar alterações existentes. Se o estado local divergir do descrito aqui, registrar a evidência e propor o menor ajuste; não reescrever em silêncio.
- Não criar estorno, pagamento on-line, edição de permissões, recuperação de senha nem WebSocket. Se existir algo assim localmente, preservar e documentar.
- Mensagens para o responsável do backend são redigidas em arquivo (seção 9 e `docs/integracao-frontend.md`); nada é enviado automaticamente.

---

## 2. Resultado esperado no frontend

1. Login, restauração da sessão ao recarregar e logout, sem mostrar conteúdo protegido antes da validação.
2. Menus, rotas e botões coerentes com `GERENTE`, `FUNCIONARIO` e `CLIENTE` (a autorização real é do servidor).
3. Tela **Histórico** com filtros e paginação no servidor; `/notificacoes` redireciona para `/historico`.
4. Área do cliente com compras, dívidas/vencimentos, pagamentos e histórico próprios (`/api/me/*`).
5. Ativação de acesso do cliente por convite; geração de convite por gerente/funcionário; gestão de acessos pelo gerente.
6. Aba **Auditoria** (somente gerente), separada do Histórico.
7. Espaçamentos e responsividade revisados (celular, tablet, desktop).
8. Atualização após operação confirmada, botão manual e consulta periódica (30 s) só com usuário autenticado e aba visível.
9. Frontend servido pelo nginx da mesma origem, chamando `/api/...` (nunca `backend:8080` direto do navegador).
10. Testes automatizados de sessão, rotas por perfil, paginação/filtros e limpeza entre contas.
11. Investigação do bot com limite de 2–3 h.

---

## 3. Estado verificado do workspace (05/11/2026)

| Fato | Evidência | Consequência |
|---|---|---|
| `frontend-repo` é submódulo (`Artur-Duarte17/Caderneta`) e está na branch **`master`**, commit `21ea9d6`; o repositório principal está em `feat/frontend-flutter-web` | `git branch --show-current` em cada um | Decidir (Artur) em que branch do submódulo trabalhar **antes** de commitar; não trocar sozinho |
| `pubspec.lock` aparece modificado (20 linhas) no submódulo | `git diff --stat` | Não é meu; o `Dockerfile` ignora o lock. Não commitar sem entender; perguntar a Artur |
| Repositório principal: `docs/` não rastreada | `git status` | Documentos novos ficam sem commit até pedido |
| Não há `AGENTS.md` no workspace | `find` | Nenhuma instrução local extra além deste plano |
| Flutter 3.44.4 / Dart no PATH; `docker`, `podman`, `node` presentes; **sem Chrome/Chromium no PATH**, sem `nginx` local | `which` | `flutter run -d chrome` e capturas reais exigem instalar Chrome/Chromium (ou `CHROME_EXECUTABLE`); `nginx -t` e proxy só via Docker/Podman. Registrar como pendência de ambiente, não improvisar |
| `go_router ^18.1.0`, `http ^1.6.0`, `web ^1.1.1`, `intl`, `fl_chart`; dev: `flutter_test`, `flutter_lints` | `pubspec.yaml` | `BrowserClient` e `MockClient` já vêm no `http`; `package:web` já existe. **Nenhuma dependência nova prevista** |
| Não há pasta `test/` | `ls` | Criar a suíte do zero |
| `relatorios_page.dart` importa `package:web` | grep | Importar essa página (direta ou indiretamente via `main.dart`) quebra `flutter test` na VM. Isolar o que é específico de navegador atrás de import condicional |
| `Api` usa `http.Client()` sem credenciais, `apiBaseUrl` default `http://localhost:8080`, `funcionarioPadraoId = 1` | `lib/core/api.dart` | Trocar cliente, base relativa, remover o id fixo |
| `Dockerfile` do frontend: `ARG API_URL=http://localhost:8080`; `nginx.conf` só serve a SPA | arquivos | Base padrão passa a ser relativa; proxy `/api/` |
| `NotificacoesService.iniciar()` roda em `main()`; polling 30 s em `GET /api/notificacoes`; modelo lê `tipoNotificacao`, `id`, `lida` | `notificacoes_service.dart`, `models.dart` | Iniciar só após login; novo contrato usa `tipo` e não tem `lida` |
| `AsyncView` recarrega quando `NotificacoesService.revisao` muda | `common.dart` | Manter esse mecanismo de "dados mudaram" sob novo nome |
| `Snapshot.load()` (clientes + vendas + dívidas de todos) é usado por Dashboard, Clientes, Vendas e Pagamentos | grep | Aceitável para gerente/funcionário; **proibido** na área do cliente |
| `vendas_page.dart` tem **editar** venda (`atualizarVenda`) mas **não** tem excluir venda (o ícone `delete_outline` remove um item dentro do formulário); não há UI para editar/excluir dívida | leitura | Restrição de gerente se aplica ao botão **Editar** da venda; não criar tela de exclusão (fora de escopo) |
| `clientes_page.dart` cria cliente e fiador (`POST /fiadores` + `POST /fiadores/associar/...`), edita cliente | leitura | Precisa confirmar que `/api/fiadores/**` está liberado a gerente e funcionário (a matriz não os cita) — pergunta ao backend |
| Dashboard mostra: Saldo a receber, Vendas no mês, Recebido no mês, Dívidas vencidas, vendas recentes, clientes em atraso | `dashboard_page.dart` | Definir o que é "indicador exclusivo dos relatórios gerenciais" para o funcionário (seção 5.3) |
| Datas: `_date()` aceita string ISO ou array do Jackson; espaçamentos: `Gap` (4/8/16/24/32) usado ~90×, ~22 valores soltos, e expressões `Gap.lg - 4` / `Gap.md - 4` | `models.dart`, grep | Normalizar instantes UTC → local; criar degraus 12 e 20 na escala |

Registrar no relatório final qualquer divergência encontrada ao executar a F0.

---

## 4. Decisões técnicas do frontend (fechadas)

### 4.1 Camadas e estrutura de arquivos

Separar apresentação de acesso a dados e de regras de sessão. As telas dependem de interfaces; a implementação HTTP e a simulada ficam atrás delas.

```
lib/
  main.dart                    # raiz de composição: escolhe HTTP real (padrão) ou simulado (dev), inicia o app
  app_router.dart              # GoRouter, redirect, refreshListenable, rotas por perfil
  core/
    api.dart                   # Api (REST legado/atual) usando HttpGateway
    api_error.dart             # ApiException e subtipos
    http_gateway.dart          # envia requisições: cookies, CSRF, época da sessão, tratamento 401/403
    http_client_factory.dart   # export condicional: BrowserClient(withCredentials) | http.Client (testes)
    csrf.dart                  # CsrfStore: token em memória, renovação deduplicada
    session.dart               # SessaoController (ChangeNotifier): estado, usuário, época
    auth_repository.dart       # interface + implementação HTTP (csrf, login, me, logout, registro)
    permissoes.dart            # Perfil, Rota, Acao e a matriz de UI
    pagina.dart                # Pagina<T> (envelope paginado)
    historico_repository.dart  # /api/historico e /api/me/historico
    historico_service.dart     # consulta periódica + "dados alterados" (substitui notificacoes_service.dart)
    minha_caderneta_repository.dart
    auditoria_repository.dart
    acessos_repository.dart    # usuários, funcionários, convite
    models.dart                # + Usuario, EventoHistorico, AuditoriaEvento, ContaAcesso, Convite…
    format.dart, theme.dart    # existentes (+ helpers de instante e degraus de Gap)
  dev/                         # SOMENTE desenvolvimento/testes (seção 4.9)
    fakes.dart
  pages/
    login_page.dart, ativar_page.dart, acesso_negado_page.dart
    historico_page.dart        # substitui notificacoes_page.dart
    auditoria_page.dart, acessos_page.dart
    minha/ resumo_page.dart, compras_page.dart, dividas_page.dart, pagamentos_page.dart
    (existentes) dashboard, clientes, vendas, pagamentos, relatorios
  widgets/ app_shell.dart, common.dart (+ Paginador, PageSizePicker, BotaoAtualizar, BannerNovos)
test/                          # seção 10
```

Nomes são orientação; manter se a leitura do código real sugerir algo menor, desde que cada responsabilidade tenha um dono.

### 4.2 Cliente HTTP e cookies

- `http_client_factory.dart` com import condicional: no navegador, `BrowserClient()..withCredentials = true` (`package:http/browser_client.dart`); fora dele (testes na VM), `http.Client()`. Assim os testes rodam com `flutter test` sem Chrome.
- `Api`/`HttpGateway` recebem o `http.Client` por construtor (injeção), permitindo `MockClient` (`package:http/testing.dart`) nos testes.
- O navegador administra o cookie `SESSION` (`HttpOnly`). O Flutter **não** lê, não grava e não loga cookie. Nada de `localStorage`/`sessionStorage` para autenticação. Em memória: usuário, estado da sessão, token CSRF e época.
- Base da API: `String.fromEnvironment('API_URL', defaultValue: '')`. Vazio = relativo (`/api/...`). Montar a URL sem duplicar prefixo (`/api/api`) e sem barra dupla; teste cobre `''`, `'http://localhost:8080'` e `'http://localhost:8080/'`.
- Resposta não-JSON (HTML de erro do nginx: 502/504) nunca vai para a tela; vira "Servidor indisponível. Tente novamente."

### 4.3 CSRF

- `CsrfStore` guarda `{token, headerName}` em memória (`GET /api/auth/csrf`, sem cache).
- Enviar `headerName: token` em `POST`, `PUT`, `PATCH`, `DELETE` — inclusive login, ativação, convite e logout.
- Obter token: ao iniciar o app, **após login** e **após logout** (a autenticação e o encerramento invalidam o token anterior).
- Renovação deduplicada: várias chamadas simultâneas esperam o mesmo `Future`.
- `403` com `code == CSRF_INVALID`: renovar o token **uma vez**, verificar a sessão (`/me`) se preciso, e **devolver erro à tela** pedindo nova tentativa. **Nenhuma mutação (venda, pagamento, convite…) é repetida automaticamente** — nem por CSRF, nem por 401, nem por rede.
- `GET` nunca precisa de CSRF.

### 4.4 Sessão

`SessaoController` (`ChangeNotifier`) com estados `verificando | autenticado | naoAutenticado`, `Usuario? usuario` e `int epoca`.

- Início: `csrf` → `GET /api/auth/me`. `200` → autenticado; `401` → não autenticado (silencioso); erro de rede → estado `naoAutenticado` com aviso "sem conexão" e botão de tentar de novo (não confundir com "deslogado").
- **Época**: incrementa em login, logout e expiração. Toda requisição captura a época ao iniciar; ao responder, se a época mudou, o resultado é **descartado** (não atualiza serviço nem tela). Evita misturar dados de duas contas.
- Expiração durante o uso (`401` em rota autenticada): transição única e idempotente → limpa estado, para o polling, vai a `/login` com aviso "Sua sessão expirou. Entre novamente." Vários `401` simultâneos geram uma só transição.
- Logout: `POST /api/auth/logout`. `204` ou `401` (sessão já expirada) → limpeza local normal. **Falha de rede**: limpar a sessão **localmente** (a tela não pode continuar mostrando dados) e informar "Você saiu neste dispositivo, mas não foi possível confirmar o encerramento no servidor." Nunca apresentar isso como revogação confirmada. Após o logout, renovar o CSRF.
- Ao trocar de usuário ou sair: parar timers, limpar `HistoricoService`, caches de repositórios, estados de filtros e qualquer `Snapshot` guardado; destruir a árvore de páginas autenticadas (o redirect para `/login` já faz isso — conferir que nenhum singleton retém dados).
- Usuário desativado/sessão invalidada pelo servidor: aparece como `401` → mesmo fluxo de expiração.

### 4.5 Permissões na interface (apenas UX)

`permissoes.dart` define `enum Perfil { gerente, funcionario, cliente }` (parse de `GERENTE`/`FUNCIONARIO`/`CLIENTE`; valor desconhecido → tratado como sem permissão e tela de erro), `enum Acao` e a função `bool pode(Perfil, Acao)`. Menus, rotas e botões consultam **somente** essa função. O servidor continua sendo a fonte da verdade: `403` é tratado com "Acesso negado" sem deslogar.

### 4.6 Rotas

`GoRouter(redirect: ..., refreshListenable: sessao)`; versão 18 instalada — conferir a assinatura real na documentação do pacote antes de usar.

| Rota | Quem | Observação |
|---|---|---|
| `/login`, `/ativar` | Público (não autenticado) | Fora do `ShellRoute`. Autenticado que abrir `/login` vai para a entrada do perfil |
| `/` | Gerente, funcionário | Painel. Cliente que abrir `/` é redirecionado a `/minha` |
| `/clientes`, `/vendas`, `/pagamentos` | Gerente, funcionário | Existentes |
| `/relatorios` | Gerente | Funcionário/cliente → Acesso negado |
| `/historico` | Gerente, funcionário | `/notificacoes` redireciona para cá |
| `/auditoria`, `/acessos` | Gerente | |
| `/minha`, `/minha/compras`, `/minha/dividas`, `/minha/pagamentos`, `/minha/historico` | Cliente | Gerente/funcionário → Acesso negado |
| `/acesso-negado` | Autenticado | Mensagem + botão para a entrada do perfil |

Regras do `redirect`:

1. `verificando` → mostrar tela de carregamento (splash), **sem** redirecionar nem renderizar conteúdo protegido.
2. `naoAutenticado` em rota protegida → `/login?next=<caminho>`.
3. `next` só é aceito se for um **caminho interno**: começa com `/`, não começa com `//`, não contém `:` antes de `/`, e corresponde a uma rota conhecida **permitida ao perfil**; caso contrário, entrada padrão do perfil. Nunca redirecionar a URL externa.
4. Perfil sem permissão para a rota → `/acesso-negado`.

Entrada padrão: gerente/funcionário `/`; cliente `/minha`.

### 4.7 Datas e instantes

- Instantes do servidor (`dataEnvio`, `ocorridoEm`, `expiraEm`) chegam em ISO 8601 com `Z`/offset: converter para horário local ao exibir (`.toLocal()`); datas puras (`dataVencimento`, `dataEmissao`) permanecem como data (sem conversão que desloque o dia).
- Filtros de período: o calendário é **local**. `inicio` = 00:00 local do primeiro dia → `toUtc().toIso8601String()`; `fim` = 00:00 local do **dia seguinte** ao último dia (limite exclusivo). Presets: Hoje, Últimos 7 dias (hoje e 6 anteriores), Últimos 30 dias, Personalizado.
- Reaproveitar `_date()` para o legado, mas cobrir por teste: string com `Z`, com offset, sem fuso, array do Jackson e `null`.
- Endpoint legado `PUT /api/vendas/{id}` continua enviando `dataHora` como hoje (`T00:00:00`); não alterar o formato sem combinar.

### 4.8 Erros

`ApiException(message, status, code)` com especializações: `SessaoExpirada` (401 em uso), `CredenciaisInvalidas` (401 em `/login`), `AcessoNegado` (403), `CsrfInvalido` (403 + `CSRF_INVALID`), `ConflitoNegocio` (409), `NaoEncontrado` (404), `ValidacaoApi` (400), `SemConexao`. Parse de `{"code","message"}`; sem corpo JSON → mensagem genérica por status. Exibição:

| Status | Comportamento |
|---|---|
| 400 | Mensagem no formulário/filtro; preserva o que foi digitado |
| 401 | Login: erro genérico ("Login ou senha inválidos"), nunca diz se a conta existe/está inativa. Em uso: expiração (4.4) |
| 403 | Tela/aviso "Acesso negado"; sessão mantida |
| 403 `CSRF_INVALID` | 4.3 |
| 404 | Mensagem genérica, sem confirmar existência de dado alheio |
| 409 | Explica o conflito (login em uso, convite já usado, exclusão incompatível) e preserva o formulário |
| 429 (se existir) / 5xx / rede | "Muitas tentativas…" / "Servidor indisponível" / "Sem conexão"; botão tentar de novo |

### 4.9 Simulação (somente desenvolvimento e testes)

- `const kMockApi = bool.fromEnvironment('MOCK_API')`, padrão `false`. A raiz de composição escolhe as implementações simuladas só quando `kMockApi` for verdadeiro; o código de `lib/dev/` não é referenciado em nenhum outro caminho (o compilador remove em release).
- Salvaguarda dupla: em `kReleaseMode && kMockApi` o app aborta na inicialização com erro explícito; e a verificação de entrega confere que o build de produção **não contém** os marcadores da simulação (`grep` em `build/web/main.dart.js`).
- A simulação cobre os três perfis e dois clientes com dados distintos, páginas, filtros, `403`, `401`, `409` e latência. Aceita qualquer senha não vazia para logins conhecidos (não há credencial real no código).
- **Simulação não comprova nada sobre a API.** Todo critério de aceite de isolamento e autorização é verificado também contra a API real (seção 11).

### 4.10 Dev vs. produção

- Validação final sempre pelo nginx da mesma origem (`http://localhost:3000` via Docker).
- Desenvolvimento rápido (`flutter run`) tem duas opções: (a) modo simulado; (b) API real com `--dart-define=API_URL=http://localhost:8080` **e porta fixa** (`--web-port=5000`), exigindo CORS de origem explícita e credenciais no backend (pendência da outra parte). `localhost` com portas diferentes é *same-site*, então o cookie `SameSite=Lax` funciona. Se (b) não estiver pronto, usar (a) e validar via Docker.

---

## 5. Matriz de interface por perfil

### 5.1 Menus

| Item | Gerente | Funcionário | Cliente |
|---|---|---|---|
| Visão Geral (`/`) | ✔ | ✔ (reduzida, 5.3) | — |
| Clientes | ✔ | ✔ | — |
| Vendas | ✔ | ✔ | — |
| Pagamentos | ✔ | ✔ | — |
| Relatórios | ✔ | — | — |
| Histórico (`/historico`) | ✔ (8 tipos) | ✔ (3 tipos) | — |
| Auditoria | ✔ | — | — |
| Acessos | ✔ | — | — |
| Resumo / Compras / Dívidas / Pagamentos / Histórico (`/minha/...`) | — | — | ✔ |

Rodapé do menu para todos: nome, perfil, **Sair**.

### 5.2 Ações dentro das telas

| Ação | Gerente | Funcionário | Cliente |
|---|---|---|---|
| Cadastrar/editar cliente (dados cadastrais) | ✔ | ✔ | — |
| Gerar convite de acesso | ✔ | ✔ | — |
| Registrar venda | ✔ | ✔ | — |
| **Editar** venda existente | ✔ | **oculto** | — |
| Registrar recebimento | ✔ | ✔ | — |
| Relatórios, Auditoria, Acessos, criar funcionário | ✔ | oculto | — |

Não há botão de excluir venda/dívida hoje; não criar.

### 5.3 Painel (decisão assumida — confirmar com Artur/gerente)

O plano diz que o funcionário vê o painel "sem indicadores exclusivos dos relatórios gerenciais", sem listar quais. **Assunção:** funcionário vê *Saldo a receber*, *Dívidas vencidas*, *Vendas recentes* e *Clientes em atraso* (operacionais); **não** vê *Vendas no mês* e *Recebido no mês* (totais financeiros do período, equivalentes aos relatórios). Implementar por flag em `permissoes.dart` (`Acao.verIndicadoresGerenciais`) para trocar sem refatorar.

### 5.4 Tipos de histórico por perfil

- Cliente: os 8 tipos (apenas seus eventos).
- Gerente: os 8 tipos.
- Funcionário: **apenas** `CADASTRO_CLIENTE`, `COMPRA_REALIZADA`, `PAGAMENTO_RECEBIDO`. O seletor de tipo só oferece esses três; o frontend não filtra páginas recebidas para "esconder" outros — a restrição é do servidor (o front só evita pedir o proibido).

---

## 6. Contrato consumido pelo frontend

Resumo do que o frontend depende (detalhes e exemplos no plano compartilhado, seção 8).

| Endpoint | Uso no frontend |
|---|---|
| `GET /api/auth/csrf` | Token + `headerName` em memória |
| `POST /api/auth/login` `{login,senha}` | `200 {usuario:{id,pessoaId,nome,perfil}}` + cookie `SESSION` |
| `GET /api/auth/me` | Mesmo envelope; `401` = sem sessão |
| `POST /api/auth/logout` | `204` |
| `POST /api/auth/registro-cliente` `{cpf,codigoConvite,login,senha}` | `201 {message}`; **não autentica**; segue ao login |
| `POST /api/clientes/{id}/convite` | `201 {codigo, expiraEm}` |
| `POST /api/auth/funcionarios` | Cria `FUNCIONARIO`; **DTO ainda a documentar pelo backend** |
| `GET /api/usuarios` (paginado) / `PATCH /api/usuarios/{id}/ativo` `{ativo}` | Gestão de acessos; `204` |
| `GET /api/me/vendas|dividas|pagamentos|historico` (paginados) | Área do cliente |
| `GET /api/historico` | Gerente/funcionário (recorte pelo servidor) |
| `GET /api/auditoria` | Gerente |
| Legados: `/api/clientes`, `/vendas`, `/dividas`, `/relatorios/**`, `/fiadores/**` | Seguem como arrays simples (não paginados) |
| `GET /api/notificacoes` (+ `PATCH` marcar lida) | **Deixam de ser usados** pela interface; remover do `Api` só ao final (F10) |

Paginação: `page` (0+), `size` (padrão 20, 1–100), `tipo`, `inicio` (inclusivo), `fim` (exclusivo); ordenação fixa do servidor. Envelope: `content, number, size, totalElements, totalPages, first, last`. Item de histórico: `id, tipo, mensagem, dataEnvio, destinatario{id,nome}`.

---

## 7. Entregas, tarefas e critérios de aceite

Horas = estimativa **preliminar** de trabalho focado, a revisar após a F0; não é compromisso. Marcação: 🟢 independe do backend · 🟡 usa simulação até haver API · 🔴 exige API real.

### F0 — Pré-voo e linha de base (🟢, 1–2 h)

1. Reconfirmar o estado da seção 3: branch do submódulo, `git status`, `pubspec.lock`, remotos.
2. Rodar `flutter pub get`, `flutter analyze`, `flutter build web --release` e anotar avisos **já existentes** (linha de base). Não corrigir o que não é do escopo.
3. Verificar disponibilidade de Chrome/Chromium; se ausente, registrar como pendência de ambiente (instalar é decisão de Artur).
4. Inspecionar `core/format.dart`, `common.dart` (`AppTable`, `showAppDialog`, `BusyButton`, `FilterField`, `Dropdown`), e o `_exportar` do relatório.
5. Conferir se existe configuração de testes e de lint (`analysis_options.yaml`).
6. Criar `docs/integracao-frontend.md` (esqueleto) onde será registrado: endpoints usados, campos consumidos, premissas e perguntas ao backend (seção 9).

**Aceite:** linha de base registrada; nenhuma alteração funcional feita.

### F1 — Infraestrutura de requisições (🟢, 5–7 h)

Arquivos: `http_client_factory.dart` (+ variantes), `http_gateway.dart`, `api_error.dart`, `csrf.dart`, `api.dart`, refatoração do `_exportar` do relatório para import condicional (`package:web` só no navegador).

1. Fábrica de `http.Client` (navegador: `withCredentials = true`; VM: padrão).
2. `HttpGateway`: monta URL (base relativa), JSON, CSRF nos métodos mutadores, época, mapeamento de erros (4.8), `Accept`/`Content-Type`, `Cache-Control` não alterado, timeouts razoáveis.
3. `Api` passa a usar o gateway. Manter as assinaturas públicas que as páginas usam, para não espalhar mudança.
4. `Pagina<T>.fromJson` e helpers de data/instante (4.7).
5. Tornar `package:web` isolado: `relatorios_page.dart` deixa de importá-lo diretamente.

**Aceite:** testes de URL, erro (400/401/403/CSRF/404/409/5xx/HTML/rede), CSRF (cabeçalho em mutadores, renovação deduplicada, nenhuma repetição de mutação) e época descartando resposta tardia passam com `MockClient` na VM; `flutter analyze` sem avisos novos.

### F2 — Sessão, permissões, login, rotas e shell (🟡→🔴, 10–14 h)

1. `models.dart`: `Usuario`, `Perfil`; `permissoes.dart` (matriz 5.1–5.4).
2. `auth_repository.dart` (interface + HTTP) e `dev/fakes.dart` (simulado).
3. `session.dart` conforme 4.4.
4. `login_page.dart`: login/senha com validação (obrigatórios), foco/Enter envia, botão ocupado enquanto envia (sem envio duplicado), mostrar/ocultar senha, `autofillHints`, erro genérico, link "Primeiro acesso" → `/ativar`, aviso de sessão expirada, layout responsivo fora do shell. Nada de senha em log/estado persistente; limpar o campo de senha após erro.
5. `acesso_negado_page.dart` e splash de verificação.
6. `app_router.dart` conforme 4.6 (inclui redirect de `/notificacoes`, `next` seguro).
7. `app_shell.dart`: itens por perfil, bloco de usuário (Avatar existente + nome + perfil) e **Sair** no menu lateral e na gaveta do celular; remover a dependência de `NotificacoesService` do shell (contador e snackbar de chegada). O aviso de chegada de eventos de outros usuários vira o banner da tela Histórico (F4); mensagens de sucesso de ações locais continuam via `toast`.
8. `main.dart`: raiz de composição; **não** iniciar polling no `main()`.

**Aceite:** com simulação, os três perfis entram, veem só o menu do seu perfil, URL digitada à mão fora do perfil leva a Acesso negado, recarregar restaura a sessão, sair limpa tudo e `next` externo é ignorado. Com API real (🔴): login/`/me`/logout funcionam pelo nginx, `401` em uso leva ao login com aviso.

### F3 — nginx, Dockerfile e base da API (🟢 para implementar, 🔴 para validar, 2–3 h)

1. `nginx.conf`: manter o bloco da SPA e **acrescentar**:

   ```nginx
   location ^~ /api/ {
       proxy_pass http://backend:8080;          # sem parte de URI: /api/x chega como /api/x
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_intercept_errors off;
   }
   ```
   Cuidados: o `^~` impede o fallback da SPA em `/api/...`; não repetir os `add_header Cache-Control` da SPA nesse bloco; sem `proxy_cache`; `/api` (sem barra) é opcional devolver 404. Se `nginx` iniciar antes do `backend` resolver no DNS e falhar com "host not found in upstream", tratar com o responsável pelo Compose (`depends_on`) ou resolver dinâmico — só se o problema aparecer.
2. `Dockerfile`: `ARG API_URL=` (vazio) para o build padrão usar caminho relativo; manter possibilidade de sobrescrever.
3. `api.dart`: base padrão `''`.
4. `README.md` do frontend: modos de execução (4.10), `API_URL`, `MOCK_API`, observação de mesma origem.
5. Validar sintaxe: `docker run --rm --add-host backend:127.0.0.1 -v …/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t` (ou `podman`). Validar encaminhamento real somente com o Compose completo.

**Aceite:** `nginx -t` ok; pelo Compose, `GET http://localhost:3000/api/auth/csrf` retorna JSON da API (não `index.html`), `Set-Cookie` chega ao navegador; erro da API chega como JSON. Se não for possível subir o Compose, registrar **pendente**, nunca "passou".

### F4 — Histórico (🟡→🔴, 8–12 h)

Renomeação e comportamento:

1. Menu "Histórico", título, ícone `Icons.history`, rota `/historico`, `/notificacoes` redireciona.
2. `models.dart`: `Notificacao` → `EventoHistorico {id, tipo, mensagem, dataEnvio, destinatario}`; `TipoNotif` → `TipoEvento` com os **8 valores exatos** do servidor (`LEMBRETE_PAGAMENTO`, `AVISO_DIVIDA_VENCIDA`, `CONFIRMACAO_COMPRA`, `CONFIRMACAO_PAGAMENTO`, `CADASTRO_CLIENTE`, `PAGAMENTO_RECEBIDO`, `COMPRA_REALIZADA`, `LEMBRETE_VENCIMENTO`), com rótulo, ícone e cor; valor desconhecido → "Evento" genérico (não quebrar). Campo externo é `tipo` (não `tipoNotificacao`). **Sem** `lida`, contador de não lidas, "marcar como lida" ou "marcar todas".
3. `historico_repository.dart`: `/api/historico` (gerente/funcionário) e `/api/me/historico` (cliente) atrás da mesma interface; simulado enquanto não existir.
4. `historico_page.dart` (reutilizável com a fonte de dados do perfil):
   - Filtros: **Tipo** (valores exatos permitidos ao perfil, rótulos amigáveis), **Período** (presets + personalizado, 4.7) e **tamanho da página** (10/20/50; padrão 20).
   - Mudou filtro/tamanho → volta a `page=0`. Falha → "Tentar novamente" **mantém filtros e página**.
   - Lista cronológica (como vem do servidor: `dataEnvio DESC, id DESC`), cabeçalhos por dia (Hoje/Ontem/data), ícone/cor por tipo, mensagem, destinatário (gerente/funcionário), data/hora local.
   - Estados: carregando, erro, vazio (com filtros ativos oferecer "Limpar filtros"), conteúdo.
   - Paginador: anterior/próxima, "Página X de Y · N eventos", desabilitado conforme `first`/`last`. Se uma página existente ficar vazia por mudança de dados (`content` vazio, `page>0`, `totalPages>0`) → carregar a última página válida.
   - Proteção contra resposta fora de ordem: cada pedido tem um número sequencial; só o mais recente atualiza a tela; mudança de época descarta.
   - Botão **Atualizar** (mantém filtros e página).
5. `historico_service.dart` (substitui `notificacoes_service.dart`):
   - `iniciar()` idempotente (um único `Timer`), só com sessão autenticada; `parar()` no logout.
   - A cada 30 s e **só com a aba visível** (`visibilitychange` via `package:web`, isolado por import condicional): consulta a primeira página (tamanho fixo pequeno, sem filtros) do endpoint do perfil, sem sobrepor consultas (flag "em andamento"), e compara com o maior `id` já visto → `novosEventos`. Ao voltar a ficar visível, faz **uma** consulta imediata.
   - Se chegarem eventos novos, incrementa `revisao` para `AsyncView` recarregar (equivale ao comportamento atual para venda/pagamento/cliente). `dadosAlterados()` continua existindo para ações locais e dispara consulta silenciosa.
   - Na tela Histórico: se estiver na página 0, recarrega mantendo filtros e tamanho; nas páginas posteriores **não pula** para a primeira — mostra `BannerNovos` ("N novos eventos · Atualizar") e preserva a posição.
   - Nunca guarda o histórico inteiro; sem crescimento ilimitado.

**Aceite:** nenhum texto "Notificações" na UI; `/notificacoes` → `/historico`; funcionário (simulado e real) só vê os 3 tipos e o total reflete só eles; troca de filtro volta à página 0; erro conserva filtros; datas locais corretas; polling para ao sair e não duplica timer; página fora do intervalo cai na última.

### F5 — Espaçamentos e responsividade (🟢, 6–9 h)

Sem lista de problemas fornecida, o método é auditável e repetível:

1. **Auditoria:** `grep` de `EdgeInsets`, `SizedBox(height|width)`, `Padding`, `spacing/runSpacing` e expressões `Gap.* ± n` em `lib/`. Planilha curta (arquivo, linha, valor, destino na escala). Hoje há ~22 valores soltos e ao menos `Gap.lg - 4` (20) e `Gap.md - 4` (12).
2. **Escala:** estender `Gap` em múltiplos de 4: `xs 4, sm 8, ms 12, md 16, ml 20, lg 24, xl 32, xxl 48`; substituir as expressões aritméticas pelos nomes. Valores fora da escala só com justificativa de layout (ex.: 40 do avatar), em constante nomeada.
3. **Componentes:** consolidar o que repete em `common.dart` (espaçamento entre campos de formulário, cabeçalhos de seção, linha de filtros, rodapé de diálogo).
4. **Ordem:** `common.dart` → `app_shell` → clientes → vendas → pagamentos → relatórios → dashboard → histórico → telas novas (login, ativar, minha, auditoria, acessos) **já nascem na escala**.
5. **Larguras de verificação:** 360, 390 (celular), 768 (tablet), 1024 e 1280+ (desktop). Em cada uma: sem overflow, alvos de toque ≥ 44 px, tabelas rolam horizontalmente em vez de estourar, diálogos cabem na tela, rodapé de ação visível.
6. **Verificação visual:** com Chrome disponível, capturas automatizadas (Chrome headless) do app em modo simulado, antes e depois. Sem Chrome: *golden tests* de widget nas larguras acima (usando os fakes) e `flutter analyze`; registrar a limitação (fonte de teste não é a final). Não depender de capturas enviadas por Artur.
7. Não mudar identidade visual (paleta/tipografia) sem necessidade.

**Aceite:** nenhum espaçamento solto sem justificativa; nenhuma expressão `Gap ± n`; sem overflow nas larguras listadas; "antes/depois" arquivados em `docs/espacamentos/` (ou descrito no relatório se não for possível capturar).

### F6 — Restrições por perfil nas telas existentes (🟡→🔴, 3–5 h)

1. `vendas_page.dart`: botão **Editar** venda só para `Perfil.gerente`; `atualizarVenda` permanece para o gerente; tratar `409` (integridade financeira) mostrando a mensagem do servidor, sem fechar o formulário.
2. `dashboard_page.dart`: aplicar 5.3 por flag.
3. `relatorios_page.dart`: rota restrita ao gerente (já pelo router); sem link para funcionário.
4. `clientes_page.dart`: ação **Gerar convite** (F7) para gerente/funcionário; confirmar com backend as rotas de fiador.
5. Formulários: confirmar que **nenhum** envia duplicado (botão ocupado + bloqueio do Enter durante envio) em cliente, venda, edição de venda, pagamento.
6. Remover do `Api` o envio de `funcionarioId` apenas na F10 (depende do backend).

**Aceite:** funcionário não vê Editar venda, Relatórios, Auditoria, Acessos nem indicadores gerenciais; gerente vê tudo; chamada direta à API por funcionário nos 4 endpoints exclusivos retorna `403` (verificado na validação integrada).

### F7 — Ativação, convites e gestão de acessos (🟡→🔴, 8–12 h)

**Ativação (`/ativar`, pública):**
1. Campos: CPF, código do convite, login, senha, confirmação. Validação local leve (CPF com 11 dígitos e dígitos verificadores; campos obrigatórios; senhas iguais; mínimo de senha **conforme o backend informar** — até lá, só exibir a mensagem `400` do servidor).
2. `201` → mensagem "Acesso criado. Entre com seu login e senha." e vai ao `/login` (não entra automaticamente).
3. Erros: convite inválido/expirado/usado (`400`/`409`, mensagem do servidor, sem detalhar qual), login em uso (`409`).
4. CPF/convite/senha nunca em logs, URLs ou estado persistente.

**Convite (clientes_page):**
5. Ação **Gerar convite** (explícita, com confirmação) → `POST /api/clientes/{id}/convite` → diálogo com código, validade (convertida para hora local) e botão **Copiar**; aviso "Este código só é exibido agora"; ao fechar, o código é descartado da memória. Gerar outro convite exige nova ação.

**Gestão de acessos (`/acessos`, gerente):**
6. Lista paginada de contas (nome, login, perfil, ativo); filtro simples; **Ativar/Desativar** com confirmação → `PATCH /api/usuarios/{id}/ativo`; `409`/`403` do servidor (último gerente ativo) exibidos como estão. Esconder o botão para a própria conta como conveniência; a regra real é do servidor.
7. **Criar funcionário:** formulário baseado nos campos reais de `Pessoa`/`Funcionario` (`nome, cpf, email, telefone, endereco, matricula, cargo`) + `login` e `senha`. **Só integrar depois que o backend documentar o DTO**; até lá ficar atrás do repositório simulado. Sem seletor de perfil; sem editor de permissões.

**Aceite:** convite inválido/expirado/reutilizado é recusado na UI com mensagem adequada; código gerado aparece uma vez; desativar usuário reflete na lista; funcionário e cliente não alcançam `/acessos`.

### F8 — Área do cliente (🟡→🔴, 9–13 h)

1. Repositório `minha_caderneta_repository.dart`: `GET /api/me/vendas|dividas|pagamentos|historico` (paginados). Reaproveitar `Venda`/`Divida`/`Pagamento` quando os DTOs coincidirem; **não** usar `Snapshot.load()`, `clientes()` nem endpoints gerais.
2. Páginas (`pages/minha/`), com `Paginador` onde houver lista:
   - **Resumo:** saldo devedor, próximo vencimento, dívidas vencidas, últimos eventos. Se a API não oferecer resumo, calcular a partir das dívidas **buscando páginas** (`size=100`) até a última, com teto de 1.000 itens e aviso de "lista parcial" se truncar. Pedido ao backend: `GET /api/me/resumo` (opcional).
   - **Compras:** lista + detalhe da venda (itens), sem editar.
   - **Dívidas/Vencimentos:** status (Pago/Pendente/Parcial/Vencida), valor original/pendente, vencimento, dias de atraso; pagamentos da dívida.
   - **Pagamentos:** pagamentos feitos (data, valor, método).
   - **Histórico:** mesma `HistoricoPage` com a fonte `/me/historico`.
3. Sem registrar recebimento, sem editar nada, sem busca de outros clientes. `404` mostra mensagem genérica.
4. Reutilizar componentes (`SectionCard`, `StatCard`, `AppTable`, `StatusBadge`, `EmptyState`…), respeitando F5.

**Aceite:** cliente A (simulação e API real) só vê os seus; alterar IDs em chamadas manuais não revela dados do B; ao sair e entrar como B, nada de A permanece em tela ou memória.

### F9 — Auditoria do gerente (🟡→🔴, 4–6 h)

1. `auditoria_repository.dart` (`GET /api/auditoria`, filtros `inicio`, `fim`, `acao`, `recursoTipo`, `page`, `size`).
2. `auditoria_page.dart` em rota/aba própria **separada** do Histórico: tabela paginada (instante local, ator, perfil, ação, recurso, resultado) e diálogo de detalhe com as alterações (antes/depois quando existirem). O formato de "alterações permitidas" ainda não está definido: tratar como mapa opaco e exibir chave/valor; ajustar quando o backend documentar.
3. Valores de `acao`/`recursoTipo`: campo de texto livre ou lista, conforme o backend documentar.
4. Nunca juntar auditoria e histórico na mesma lista; sem editar/excluir; sem exibir segredos (o servidor não deve enviá-los; se vierem, não renderizar campos como senha/hash/token/código).

**Aceite:** só gerente acessa; paginação/filtros no servidor; funcionário/cliente recebem Acesso negado.

### F10 — Atualização, integração real e limpeza (🔴, 6–9 h)

1. **Remover `funcionarioPadraoId`** e o envio de `funcionarioId` em `criarVenda` e `atualizarVenda` **somente quando** o backend confirmar que deriva o responsável da sessão. Não substituir por id escolhido no navegador.
2. Após venda/pagamento/cliente/convite/ativação: atualizar saldo, listas e histórico **depois da confirmação do servidor** (`if (ok == true) dadosAlterados()` já é o padrão — manter). O sucesso de uma consulta de histórico não substitui a confirmação da operação.
3. Auditar todo `Api.instance`/singleton para vazamento entre contas; confirmar que o polling não aplica respostas de usuário anterior.
4. Remover do `Api` `notificacoes()`, `marcarLida()`, `marcarTodasLidas()` e os restos do modelo antigo, **depois** de migrados todos os consumidores e confirmado com o backend que a interface não os usa.
5. Corrigir incompatibilidades de DTO encontradas na integração e registrá-las em `docs/integracao-frontend.md`.

**Aceite:** venda registrada aparece com o funcionário da sessão (verificado no banco/API); nenhuma referência a `funcionarioPadraoId`; build e análise limpos.

### F11 — Testes, validação e documentação (🟡/🔴, 10–15 h)

Detalhes na seção 10. Entregáveis: suíte `test/`, resultado da validação integrada (seção 11), README atualizado, `docs/integracao-frontend.md` final.

### F12 — Bot de lembretes (🟢, 2–3 h, limite fixo, só após a F11)

Entregável: `docs/bot-recomendacao.md` (1 página) com canais possíveis (WhatsApp Business API, Telegram, e-mail, Web Push), custo, credenciais necessárias, consentimento/LGPD, riscos e recomendação. Sem implementação. O bot cobre o aviso **fora** da aplicação; a área do cliente e o Histórico não dependem dele.

---

## 8. Ordem de execução e dependências

| Etapa | O que fazer | Depende do backend? |
|---|---|---|
| 0 | F0 | Não |
| 1 | F1, F5 (início), F4 (modelos/UI com simulação), F2 (sessão/login/rotas com simulação) | Não |
| 2 | F3 (implementar proxy), F6, F5 (continuação) | Não (validação final sim) |
| 3 | F2 real: login/`/me`/logout/CSRF contra a API | `auth/*` + CSRF + cookie |
| 4 | F4 real (`/api/historico`, `/me/historico`), F7, F8, F9 | endpoints correspondentes |
| 5 | F10, F11 | Backend integrado e Compose |
| 6 | F12 | Não |

Princípio: **nunca parar por um endpoint pendente** — concluir o trabalho independente, deixar a fronteira explícita (repositório simulado atrás de interface) e registrar no relatório o que falta. Reestimar após a F0.

Estimativa preliminar total: **≈ 75–110 h** (F0 1–2, F1 5–7, F2 10–14, F3 2–3, F4 8–12, F5 6–9, F6 3–5, F7 8–12, F8 9–13, F9 4–6, F10 6–9, F11 10–15, F12 2–3). Bem acima das 32–48 h anteriores porque agora inclui sessão no servidor com CSRF, proxy, paginação remota, Auditoria, gestão de acessos e suíte de testes.

---

## 9. Pendências de contrato e perguntas ao backend

Divergências entre o rascunho anterior (`docs/contrato-auth-e-estimativas.md`) e o plano compartilhado: **o plano compartilhado prevalece** — cookie `SESSION` (não `CADERNETA_SESSAO`), `GET /api/auth/csrf` com header `X-CSRF-TOKEN` (não cookie `XSRF-TOKEN`), ativação retorna `201` sem autenticar, `/api/historico` separado de `/api/auditoria`, erros `{code,message}`. Recomendação: manter **um** documento de contrato e apagar ou marcar como substituído o rascunho antigo (decisão de Artur).

Perguntas a levar ao responsável do backend (registrar em `docs/integracao-frontend.md`):

1. DTO de `POST /api/auth/funcionarios` (campos obrigatórios reais).
2. DTOs de `/api/me/vendas`, `/dividas`, `/pagamentos`: campos disponíveis e se há `GET /api/me/resumo`.
3. Forma exata das "alterações" em `/api/auditoria` e lista de valores de `acao` e `recursoTipo`.
4. Regras de senha (mínimo, composição) e tratamento de tentativas repetidas (`429`?).
5. Autorização de `/api/fiadores/**`, `/api/clientes/{id}/limite-credito` e `/prazo-pagamento`, e dos CRUD de funcionários/proprietários (não citados na matriz).
6. Confirmação de que `funcionarioId` no corpo de venda passa a ser ignorado/derivado da sessão e a partir de que versão.
7. Quando `GET /api/notificacoes` e os `PATCH` de leitura podem ser removidos do uso.
8. CORS de desenvolvimento (origem fixa `http://localhost:5000`) e perfil de desenvolvimento com `Secure=false`.
9. Nome do serviço no Compose (`backend`) e porta (`8080`) — manter ou avisar.
10. Fixtures de desenvolvimento: logins, e confirmação de que existem **dois** clientes com dados distintos.

---

## 10. Testes e verificação

Executar apenas o que tem valor; sem testes que repitam o código. Tudo na VM (`flutter test`), usando `MockClient` e os fakes; nada depende de Chrome.

**Unitários**
- `Perfil`/`Usuario.fromJson` (valores válidos, desconhecido, ausentes).
- Matriz `pode(Perfil, Acao)` e função de rotas permitidas por perfil.
- `Pagina.fromJson`; `EventoHistorico.fromJson` (8 tipos + desconhecido; `tipo` e não `tipoNotificacao`).
- Datas: `Z`, offset, sem fuso, array Jackson, `null`; limites de período (local → UTC; `fim` exclusivo); virada de dia.
- URL da API com `API_URL` vazio, com host, com barra final.
- `ApiException` para cada status e para corpo não-JSON.
- `CsrfStore`: mutadores recebem o header; GET não; renovação deduplicada; `CSRF_INVALID` não repete a mutação.
- `next` seguro: aceita `/clientes`, rejeita `//evil.com`, `https://x`, `javascript:`, rota proibida ao perfil.

**Sessão e router (widget)**
- Início `verificando` não renderiza conteúdo protegido; `/me` 401 → login; 200 → entrada do perfil.
- Login com erro `401` mostra mensagem genérica e não envia duas vezes; sucesso redireciona por perfil.
- Cada perfil: menu esperado; rota proibida → Acesso negado; funcionário sem Editar venda/Relatórios/Auditoria/Acessos.
- Expiração em uso (401) limpa estado e leva ao login com aviso, uma única vez com várias respostas simultâneas.
- Logout: para timer, limpa dados; com falha de rede mostra aviso honesto; troca A→B não exibe dados de A.
- Resposta atrasada de época anterior é descartada.

**Histórico (widget)**
- Filtro/tamanho volta à página 0; erro mantém filtros; "tentar de novo" repete com os mesmos parâmetros.
- Funcionário só oferece os 3 tipos; cliente/gerente 8.
- Página vazia além da última cai na última; estado vazio com filtros oferece limpar.
- Resposta fora de ordem não sobrescreve a mais recente.
- Banner de novos eventos fora da página 0 não salta de página.
- Polling: um único timer, sem sobreposição, para ao sair, pausa com aba oculta (simulando a visibilidade), consulta única ao voltar.

**Outras telas**
- Ativação: validação, `201` → login, convite inválido/usado/expirado, login em uso.
- Convite: código exibido uma vez; copiar; descartado ao fechar.
- Acessos: lista, ativar/desativar com confirmação, `409`/`403` exibidos.
- Área do cliente: nenhuma chamada fora de `/api/me/*` (verificar no `MockClient` que `/api/clientes`, `/api/vendas`… **não** são chamados).
- Auditoria: paginação e filtros; negada a funcionário.
- Formulários: envio duplicado bloqueado.

**Comandos**
```
flutter pub get
flutter analyze
flutter test
flutter build web --release --dart-define=MOCK_API=false     # e conferir ausência dos marcadores de simulação no JS gerado
docker run --rm --add-host backend:127.0.0.1 -v $PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t
```

Relatar separadamente: **executado e aprovado**, **falhou** (com a saída), **pendente** (por dependência ou ambiente).

---

## 11. Critérios de aceite da validação integrada (frontend)

Com o Compose subido e usuários de desenvolvimento (1 gerente, 1 funcionário, 2 clientes com dados diferentes). Cada item é conferido **pela interface e diretamente na API** (`curl` com o cookie de sessão e o header CSRF), exceto os marcados "(UI)".

Sessão, proxy, cookies
- [ ] A página é aberta em `http://localhost:3000`; chamadas do navegador vão para `/api/...` da mesma origem (DevTools/rede); nenhuma para `backend:8080` ou `localhost:8080`.
- [ ] Recarregar mantém a sessão (ou mostra login) sem exibir dados antes da validação (UI).
- [ ] Cookie `SESSION` com `HttpOnly`, `Path=/`, `SameSite=Lax` (e `Secure` quando HTTPS); o JavaScript não o lê.
- [ ] Mutação sem token CSRF válido é recusada; a UI pede nova tentativa e **não repete** venda/pagamento sozinha.
- [ ] Logout invalida a sessão no servidor (chamada posterior com o mesmo cookie dá `401`).
- [ ] Usuário desativado perde o acesso das sessões existentes (`401` na próxima requisição) e não consegue entrar.
- [ ] Erro da API chega como JSON, nunca como HTML da SPA.

Perfis e isolamento
- [ ] Gerente e funcionário registram venda e pagamento; o responsável gravado é o da sessão.
- [ ] Funcionário recebe `403` direto da API em `PUT/DELETE /api/vendas/{id}` e `PUT/DELETE /api/dividas/{id}`, em `/api/relatorios/**`, `/api/auditoria`, `/api/usuarios` e `/api/auth/funcionarios`.
- [ ] Cliente A não alcança dados de B por URL, parâmetro ou corpo alterado; rotas gerais respondem `403`.
- [ ] Convite inválido, expirado ou reutilizado não cria acesso; CPF/telefone sozinhos não dão acesso.

Histórico e Auditoria
- [ ] Funcionário só enxerga `CADASTRO_CLIENTE`, `COMPRA_REALIZADA`, `PAGAMENTO_RECEBIDO`, e `totalElements` reflete só isso; tipo proibido via API → `403`, inexistente → `400`.
- [ ] Cliente só vê eventos em que é destinatário.
- [ ] Paginação, filtro de tipo e de período (inclusivo/exclusivo), desempate por id e página vazia funcionam na API e na tela.
- [ ] Venda/pagamento geram os eventos esperados sem duplicar no recorte operacional.
- [ ] Auditoria registra ator, instante, ação e recurso das ações previstas e não aparece como notificação do cliente.

Interface e operação
- [ ] Troca de usuário não reaproveita dados da conta anterior (UI).
- [ ] Menus/botões por perfil conforme a seção 5 (UI).
- [ ] Polling para no logout, não duplica timer, não aplica resposta de usuário anterior (UI/rede).
- [ ] Layout utilizável em celular, tablet e desktop (UI).
- [ ] Falha de rede durante a navegação mostra erro com tentar de novo, sem travar (UI).
- [ ] Build de produção sem `MOCK_API`; Docker sobe sem depender de WebSocket; dados preservados após as migrations (lado backend, apenas observado).

---

## 12. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Contrato muda depois do login pronto | Repositórios atrás de interfaces; só a implementação HTTP muda |
| Cookie/CSRF falha em desenvolvimento entre portas | Validar sempre pelo nginx; opção (b) com CORS de origem fixa; ou modo simulado |
| Backend atrasa e bloqueia telas | Telas nascem contra simulação e trocam depois; fronteira registrada |
| `flutter test` quebra por `package:web`/`BrowserClient` | Imports condicionais e injeção de cliente (F1) |
| Resposta de usuário anterior aparece | Época de sessão + descarte; teste dedicado |
| Mutação repetida sem querer | Nenhuma repetição automática; botões ocupados; teste |
| Sem Chrome local | Instalar (decisão de Artur) ou usar golden tests; registrar limitação |
| Branch do submódulo (`master`) e `pubspec.lock` alterado | Confirmar com Artur antes de commitar; não incluir o lock sem entender |
| Escopo cresce (estorno, recuperação de senha, permissões dinâmicas) | Fora do pedido; só documentar se encontrado |
| `nginx` não resolve `backend` na partida | Resolver com o responsável do Compose; resolver dinâmico só se ocorrer |

---

## 13. Encerramento do trabalho

Avançar até concluir tudo que estiver disponível no frontend; se uma dependência real impedir a integração, deixar pronta a implementação atrás da interface e documentar o endpoint/contrato/ambiente que falta, seguindo com as demais tarefas.

Ao final, informar:

1. O que mudou e em quais arquivos.
2. Quais decisões do contrato foram implementadas e quais dependem do backend.
3. Comandos executados e resultados reais (aprovado / falhou / pendente).
4. O que foi testado contra a API real e o que usou simulação.
5. O que o responsável pelo backend precisa entregar (lista da seção 9 atualizada).

Sem commit, push, PR ou publicação sem pedido expresso de Artur.

---

## 14. Fontes e limites

- Fontes usadas: leitura direta de `frontend-repo/` (commit `21ea9d6`, branch `master`), do backend publicado no workspace (controllers, migrations V1–V4, `WebSocketConfig`), do `docker-compose.yml`, do plano compartilhado e de `docs/contrato-auth-e-estimativas.md`.
- A Biblioteca de Software citada no plano compartilhado **não foi consultada** aqui (está na máquina do outro lado); nenhuma decisão deste documento é atribuída a ela.
- Verificações de ambiente desta data: Flutter 3.44.4, Docker/Podman e Node presentes; Chrome/Chromium e nginx local ausentes. Nada foi executado ainda (nem build, nem testes): este documento é o plano.
- O estado não publicado da máquina do anfitrião (Live Share) não foi verificado; conferir na F0 antes de alterar arquivos.
