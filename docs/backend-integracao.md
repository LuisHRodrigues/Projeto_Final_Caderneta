# Backend: sessão, contas, histórico e auditoria

> Registro histórico da integração anterior. O contrato e os resultados atuais estão em [contratos e permissões](contratos-e-permissoes.md) e [entrega homologada](entrega-homologacao-2026-11-05.md). Funcionário agora edita suas próprias vendas, itens são opcionais e as credenciais são externas.

Implementa a seção 10 do plano compartilhado. Estado verificado em 05/11/2026. Sem commit.

## 1. O que foi feito

| Item | Onde |
|---|---|
| Spring Security + Spring Session JDBC (cookie `SESSION`, 30 min de inatividade) | `security/SecurityConfig`, `application.yml`, migration `V5` |
| CSRF explícito (`GET /api/auth/csrf`, header `X-CSRF-TOKEN`), renovado no login | `auth/AuthController`, `SecurityConfig` |
| Erros JSON `{code,message}` (401/403/`CSRF_INVALID`/400/404/409/500) | `security/ApiSecurityHandlers`, `exceptions/handler` |
| Usuários, perfis fixos, convites | `model/Usuario`, `model/ConviteCliente`, `auth/ContaService`, `V5` |
| Primeiro gerente por variável de ambiente (idempotente, sem senha padrão) | `auth/GerenteInicial` |
| Histórico paginado e área do cliente (`/api/historico`, `/api/me/*`) | `historico/`, `me/MeController`, índices em `V6` |
| Auditoria separada, na mesma transação | `audit/`, `model/AuditoriaEvento`, `V6` |
| Responsável pela venda vem da sessão | `services/VendaService` (`funcionarioId` do corpo é ignorado) |
| Integridade financeira (`409`) | `VendaService`, `DividaService` |
| WebSocket removido (config, `SimpMessagingTemplate`, dependência) | `NotificacaoService` continua persistindo os eventos |
| CORS amplo removido; origem explícita só em dev | `SecurityConfig`, `application-dev.yml` |
| Compose: perfis, bootstrap, `backend:8080` mantido | `docker-compose.yml`, `.env.example` |
| Fixtures de desenvolvimento separadas | `db/dev/R__dev_fixtures.sql`, perfil `dev-fixtures` |

## 2. Contrato (resumo; valores reais verificados)

- `POST /api/auth/login` `{login,senha}` → `200 {"usuario":{id,pessoaId,nome,perfil}}`. Credencial inválida, conta inexistente e conta inativa: o mesmo `401 CREDENCIAIS_INVALIDAS`.
- `GET /api/auth/me` → mesmo envelope; `401 NAO_AUTENTICADO` sem sessão ou com conta desativada.
- `POST /api/auth/logout` → `204`.
- Mutação sem CSRF válido: `403 CSRF_INVALID`. **Exceção deliberada:** em rota protegida com a sessão já expirada, responde `401 NAO_AUTENTICADO` (o CSRF falharia por consequência).
- `POST /api/auth/registro-cliente` `{cpf,codigoConvite,login,senha}` → `201 {"message":"Acesso criado. Entre com seu login e senha."}`. Convite inexistente, usado, expirado ou CPF diferente: `400 REGRA_DE_NEGOCIO "Convite inválido ou expirado."` (mesma mensagem). Login em uso ou cliente já ativado: `409`.
- `POST /api/clientes/{id}/convite` (gerente/funcionário) → `201 {"codigo","expiraEm"}` (UTC, 7 dias, `caderneta.convite.validade-dias`). Só o hash SHA-256 é guardado; o código aparece uma única vez. Cliente já ativado: `409`.
- **DTO de `POST /api/auth/funcionarios`** (gerente): `nome*, cpf*, email, telefone, endereco, matricula, cargo*, login*, senha*` (`*` obrigatório). `perfil` no corpo é ignorado: sempre `FUNCIONARIO`. Resposta `201 {id,pessoaId,nome,login,perfil,ativo}`. `409` para CPF, login ou matrícula já usados.
- `GET /api/usuarios?page&size` (gerente) → envelope paginado de `{id,pessoaId,nome,login,perfil,ativo}`.
- `PATCH /api/usuarios/{id}/ativo` `{"ativo":bool}` → `204`. Desativar apaga as sessões da conta. Desativar o último gerente ativo: `409`.
- Regras de credencial: login `[A-Za-z0-9._-]{3,50}`, senha de 8 a 72 caracteres (BCrypt). Não há `429` nem recuperação de senha.
- `GET /api/historico` (gerente: 8 tipos; funcionário: só `CADASTRO_CLIENTE`, `COMPRA_REALIZADA`, `PAGAMENTO_RECEBIDO`) e `GET /api/me/historico`. Parâmetros `page`, `size` (1–100), `tipo`, `inicio` (inclusivo), `fim` (exclusivo), ISO 8601 com offset. Ordem `dataEnvio DESC, id DESC`. Item: `{id,tipo,mensagem,dataEnvio (UTC),destinatario{id,nome}}`. Tipo inexistente `400`; tipo fora do perfil `403`; intervalo invertido `400`; página além da última devolve `content: []`.
- `GET /api/me/vendas|dividas|pagamentos`: mesmos DTOs de `VendaDTO`, `DividaDTO`, `PagamentoDTO` em envelope paginado. A pessoa vem da sessão; `clienteId` na query é ignorado. **Não existe `/api/me/resumo`**; o resumo deve ser calculado no cliente a partir de `/me/dividas`.
- `GET /api/auditoria` (gerente): `page,size,inicio,fim,acao,recursoTipo`. Item: `{id,ocorridoEm,ator{usuarioId,login,perfil},acao,recurso{tipo,id},resultado,alteracoes}`; `alteracoes` é uma string JSON `{campo:{antes,depois}}`.
  - Valores de `acao`: `VENDA_CRIADA`, `VENDA_EDITADA`, `VENDA_EXCLUIDA`, `DIVIDA_EDITADA`, `DIVIDA_EXCLUIDA`, `PAGAMENTO_REGISTRADO`, `ACESSO_CRIADO`, `ACESSO_ATIVADO_POR_CONVITE`, `ACESSO_DESATIVADO`, `ACESSO_REATIVADO`, `CONVITE_GERADO`.
  - Valores de `recursoTipo`: `VENDA`, `DIVIDA`, `USUARIO`, `CONVITE`.
  - `resultado` hoje é sempre `SUCESSO` (falhas revertem a transação e não geram evento).
- `/api/notificacoes/**` (legado): mantido, mas restrito a gerente; o formato não mudou.

## 3. Matriz aplicada (SecurityConfig)

- Gerente: tudo. Exclusivo: `PUT/DELETE /api/vendas/{id}` e `/api/dividas/{id}`, `/api/relatorios/**`, `/api/auditoria`, `/api/usuarios/**`, `POST /api/auth/funcionarios`, `DELETE /api/clientes/{id}`, `/api/funcionarios/**` e `/api/v1/proprietarios/**` (leitura/edição), `/api/notificacoes/**`, Swagger.
- Gerente e funcionário: `/api/clientes/**`, `/api/fiadores/**`, `/api/vendas/**`, `/api/dividas/**` (incluindo `POST` de venda e de pagamento), `/api/historico`, convite.
- Cliente: apenas `/api/me/**`.
- `POST /api/funcionarios` e `POST /api/v1/proprietarios` foram **fechados** (`denyAll`): gravavam senha fora de `usuarios`. Use `POST /api/auth/funcionarios`.
- Tudo o que não está listado é negado.

## 4. Migrations e dados existentes

- `V5`: tabelas do Spring Session, `usuarios`, `convites_cliente`. Migra `funcionarios` para `usuarios` sem duplicar pessoas; proprietário vira `GERENTE`.
  - **Atenção:** só hash BCrypt válido é aproveitado. Os funcionários do seed (`V2`, senhas em texto) foram migrados **inativos** com hash `!`. A coluna legada `funcionarios.senha_hash` passa a guardar o marcador `{migrado-para-usuarios}`.
  - Para ter um gerente, defina `CADERNETA_BOOTSTRAP_*` (ou use as fixtures de dev).
- `V6`: `auditoria_eventos` e índices do histórico.
- `spring.session.jdbc.initialize-schema=never`: só o Flyway cria o esquema da sessão. Nenhum volume é apagado.
- Eventos de histórico: criar cliente, venda e pagamento já geravam apenas os tipos `CADASTRO_CLIENTE`, `COMPRA_REALIZADA` e `PAGAMENTO_RECEBIDO`, então não há duplicidade no recorte operacional. Nenhuma migração de eventos antigos foi necessária.
- `dataEnvio` é gravada como `LocalDateTime` do servidor e **interpretada como UTC**; o contêiner roda com `-Duser.timezone=UTC` (Dockerfile). Eventos antigos criados em outro fuso ficariam deslocados.

## 5. Fixtures de desenvolvimento (somente perfil `dev-fixtures`)

As contas fictícias antigas foram preservadas somente na base local existente. Suas credenciais não integram a configuração de entrega; use os segredos do ambiente e um gerente de bootstrap em instalações novas.

O Compose atual ativa somente `dev`; `dev-fixtures` exige escolha explícita. **Para produção, mude `SPRING_PROFILES_ACTIVE`**: o padrão sem perfil usa cookie `Secure` e não carrega fixtures.

## 6. Verificação

Executado contra a API real (JAR em contêiner + MySQL 8 descartável; rede e portas próprias, sem tocar nos volumes do Compose) com `curl`:

Aprovado:
- compilação (`mvn compile` e `package`); migrations V1–V6 e fixtures aplicadas sobre os dados do V2;
- CSRF obrigatório (login incluído), token renovado após login, `Cache-Control: no-store`;
- cookie `SESSION` `HttpOnly; Path=/; SameSite=Lax` (com `dev`, sem `Secure` por ser HTTP);
- login genérico (senha errada, conta inexistente, conta inativa);
- logout invalida a sessão no servidor; desativar derrubou a sessão ativa e impediu novo login;
- convite: uso único, CPF diferente e código errado recusados com a mesma mensagem, login em uso `409`;
- funcionário: `403` em `PUT/DELETE` de venda/dívida, `DELETE` de cliente, relatórios, auditoria, usuários, funcionários, notificações; `200` em venda, pagamento e convite;
- cliente: `403` nas rotas gerais; `/api/me/*` só com os próprios dados, `clienteId` ignorado;
- histórico: funcionário vê 4 eventos de 3 tipos e o gerente 6 de 5 tipos (recorte no banco); `403`, `400` e página vazia conforme o contrato;
- venda: responsável gravado = funcionário da sessão (`funcionarioId=2` no corpo ignorado);
- integridade: excluir venda/dívida com pagamento e alterar valor com pagamento retornam `409`; editar sem pagamento sincroniza a dívida;
- auditoria: eventos registrados, sem código de convite, senha ou hash.

Também aprovado (segunda rodada):
- **Suíte completa (`mvn test`): 51 testes, 0 falhas**, com MySQL disponível (o `StartupTests` carrega o contexto inteiro e aplica V1–V6; sem banco ele falha por `UnknownHostException: mysql`, o que já ocorria antes). 18 são novos: `IntervaloTest`, `HistoricoServiceTest`, `AuditoriaServiceTest`, `ContaServiceTest` (convite inexistente/usado/expirado com a mesma mensagem, CPF diferente não consome o convite, login em uso, último gerente). Testes existentes atualizados ao novo comportamento: `VendaServiceTest` (responsável vem da sessão, `funcionarioId` do corpo ignorado, exclusão com pagamento é 409), `DividaServiceTest` (auditoria injetada) e `ProprietarioControllerTest` (agora com as regras reais de segurança: gerente, funcionário, anônimo, CSRF; a criação legada passou a ser 403 de propósito). Os novos são unitários com mocks; não há teste de integração HTTP com banco (isso foi feito por `curl`).
- **Pelo nginx** (`nginx:alpine` com o `nginx.conf` real do frontend, página estática no lugar do build Flutter, API como `backend:8080`): `/clientes` cai na SPA; `/api/...` devolve sempre JSON (inclusive 401 e rota inexistente), nunca `index.html`; `Set-Cookie` e CSRF atravessam o proxy; login, `/me` e mutação sem CSRF (`403 CSRF_INVALID`) corretos.
- **Cookie `Secure`:** presente no perfil padrão (`Secure; HttpOnly; SameSite=Lax; Path=/`), ausente apenas com `dev`.
- **Expiração por inatividade** (timeout reduzido a 60 s só no teste): atividade aos 40 s renovou a sessão (válida aos 80 s); 75 s ociosa → `401`; mutação com sessão morta → `401 NAO_AUTENTICADO`.
- **Migrations V5/V6 sobre banco já populado** (migrado até V4 pelo Flyway, mais registros inseridos à mão): contagens de pessoas, funcionários, vendas, dívidas e eventos idênticas antes e depois; funcionário com hash BCrypt válido virou conta ativa e logou (inclusive pelo nginx); contas com senha em texto ficaram inativas; aviso de "sem gerente" no log.
- **Imagem do backend** constrói pelo Compose (`docker compose build backend`).

**Não executado (de propósito ou por dependência):**
- `docker compose up` completo: usaria o volume `mysql_data` real do usuário e aplicaria V5/V6 nele. Deve ser feito por quem decidir migrar esse banco (faça backup antes).
- Frontend Flutter contra esta API (o frontend está com o Codex); o build do Flutter não foi feito aqui.
- Teste de integração HTTP automatizado com banco e teste de concorrência do uso de convite (há `PESSIMISTIC_WRITE`).
- `Secure=true` com HTTPS real e proxy TLS à frente (foi verificado apenas o atributo no cabeçalho).

## 7. Dívida técnica observada (não alterada)

- `Pessoa.notificacoesRecebidas` é `EAGER` com cascade ALL: carregar uma pessoa carrega todos os seus eventos. O histórico evita isso com projeção, mas os demais endpoints pagam o custo.
- `PUT /api/dividas/{id}` ignora o corpo (só salva e audita); mantido como estava.
- `application.yml` tem a senha do banco em texto (herdado). Mover para variável de ambiente.


## 8. Correções após a varredura de falhas (05/11/2026, noite)

Resolvem os achados F1–F5 do relatório do Codex e os itens da varredura. Verificados contra a API real (MySQL descartável) e pela suíte: backend 57 testes, frontend 55, `flutter analyze` limpo.

| Problema | Correção | Verificação |
|---|---|---|
| F1: `PUT /api/dividas/{id}` ignorava o corpo | Único campo editável: `dataVencimento` (valores, cliente e pagamentos derivam da venda e dos recebimentos). Recusa quitada/cancelada (409), vencimento anterior à emissão (400) e corpo sem o campo (400). Auditoria grava antes/depois. | `curl`: valores no corpo ignorados; auditoria `{dataVencimento:{antes,depois}}`; funcionário 403 |
| F2: venda com quantidade/preço inválidos | `@Valid` em `POST /vendas` e nos itens (`quantidade >= 1`, `precoUnitario >= 0,01`) e checagem também no serviço | `curl`: 4 combinações inválidas → 400; testes unitários |
| F4: `@CrossOrigin("*")` em `DividaController` | Removido | Preflight de origem não permitida → 403; `localhost:5000` só no perfil `dev` |
| F5: perfil vazio mantinha as fixtures | Padrão do Compose agora vazio (seguro); o `.env` local (ignorado pelo git) liga `dev,dev-fixtures` para o seu teste | `docker compose config` com e sem `.env`; backend sobe sem perfil com cookie `Secure` |
| F3: imagem local do frontend era a de setembro | Nova imagem empacotando o build atual (`Dockerfile.local`, `subir.sh`) | Imagem contém `flutter_bootstrap`, sem STOMP/SockJS |
| Fuso (vendas 3 h adiantadas, dia virando às 21h) | `Fuso` (America/Sao_Paulo) para emissão, vencimento, pagamento e "vencida"; datas-hora saem em UTC com `Z`; entrada sem offset é lida no fuso do negócio; relatórios usam os dias de Brasília | `curl`: `dataHora` com `Z`; edição `2026-11-05T00:00:00` → `2026-11-05T03:00:00Z` |
| Lembrete repetido toda noite | Um lembrete por dívida/situação (mensagem inclui nº da dívida e saldo); inclui dívidas parcialmente pagas; texto "vence hoje" | Testes unitários (a rotina só roda às 01:00 e não foi disparada ao vivo) |
| Limite de crédito ignorava o saldo | Saldo devedor em aberto + nova venda ≤ limite | `curl` e teste unitário |
| Pagamentos simultâneos | Dívida travada (`PESSIMISTIC_WRITE`) ao pagar/editar | Dois pagamentos de 80 numa dívida de 100: um 200, um 400; saldo 20, um pagamento |
| Excluir registro vinculado → 500 | `DataIntegrityViolationException` → 409 com mensagem | `curl`: 409 |
| CPF em outro formato | Verificação de duplicidade compara só os dígitos (sem alterar dados já gravados) | `curl`: `12345678909` recusado quando `123.456.789-09` existe |
| Senha legada em texto | `Funcionario.verificarSenha` removido; as rotas legadas gravam só o marcador | revisão de código |
| `lida` fora das migrations | `V7` condicional cria a coluna se faltar | `StartupTests` e banco novo |
| nginx congelava o IP do backend | `resolver 127.0.0.11` + destino em variável; gzip | Backend recriado com IP diferente (172.20.0.4 → .5): 200 sem reiniciar o nginx; nginx sobe com o backend ausente |
| Dependência de CDN no navegador | `--no-web-resources-cdn` e Roboto embutida em `assets/fonts` (Apache 2.0) | `FontManifest` com Roboto; CanvasKit local. Resta o endereço de fontes de reserva do engine (só para caracteres fora do Roboto, como emoji) |
| Portas e senha do banco | MySQL e backend publicados só em `127.0.0.1`; senha parametrizada por `MYSQL_ROOT_PASSWORD` (padrão de desenvolvimento mantido) | `docker compose config` |

### Decisões que mudaram regra de negócio (confirme)
1. **Limite de crédito** passa a valer para o total em aberto, não por venda.
2. **Dívida:** só o vencimento é editável.
3. **Dia do negócio** = Brasília.

### O que NÃO foi corrigido
- **Dados fictícios em `V2`–`V4`:** alterar uma migration já aplicada quebra o checksum do Flyway no seu volume. Para produção, comece de um banco novo e não rode estas seeds, ou crie um perfil que as exclua em instalação nova (decisão pendente).
- **HTTPS/TLS:** exige certificado e domínio. Sem HTTPS, o perfil seguro (cookie `Secure`) não mantém o login.
- **Desempenho:** `Snapshot.load()` (frontend) e `Pessoa.notificacoesRecebidas` EAGER continuam. Mexer nisso é uma refatoração maior e não foi tentada.
- **CPFs já gravados** continuam em formatos mistos (só a comparação foi normalizada).
- **Várias abas:** sair em uma aba só é percebido pela outra na próxima requisição.
- **Imagem do Flutter no Docker:** a tag `3.44.4` não existe no registro, então não foi possível fixá-la; o caminho recomendado passou a ser `./subir.sh` (build local).
- **`docker compose up` completo** com o seu volume real não foi executado por mim.
