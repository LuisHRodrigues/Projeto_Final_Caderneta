# Operação local e testes — Caderneta

## Pré-requisitos

- Docker com Compose v2. Nesta máquina o contexto `desktop-linux` está quebrado; use
  `docker --context default ...` ou `docker context use default`.
- Flutter **3.47.9** (versão fixada; `flutter upgrade`) e JDK 21 (opcional: o Maven roda em container).

## Subir o sistema

1. Copie `.env.example` para `.env` e preencha **três senhas diferentes** (`openssl rand -base64 24`).
   Para acessar por `http://localhost:3000`, acrescente `SPRING_PROFILES_ACTIVE=dev`.
   Para criar o primeiro gerente, preencha `CADERNETA_BOOTSTRAP_*`, suba uma vez e depois apague essas linhas.
2. `docker compose up -d --build` (ou `./subir.sh`, que compila o Flutter fora do Docker e usa menos memória).
3. Ordem automática: `mysql` (saudável) → `migracao` (aplica o Flyway e termina com código 0) → `backend` → `frontend`.
4. Acesse `http://localhost:3000`.

### Volume antigo (MySQL 8.0)

O compose agora usa MySQL **8.4** no volume **novo** `mysql84_data`. O volume antigo
`projeto_final_caderneta_mysql_data` (MySQL 8.0, só dados de teste) foi **preservado e não é usado**:
abrir um diretório 8.0 com o 8.4 converte os dados sem volta. Para apagá-lo, quando quiser:
`docker volume rm projeto_final_caderneta_mysql_data`. A decisão é sua; nenhum processo o remove.

### Usuários do banco num servidor que já existe

O script `backend-repo/scripts/criar-usuarios-mysql.sh` roda sozinho apenas em volume novo. Para outro
servidor MySQL (ou para trocar as senhas):

```bash
export MYSQL_HOST=... MYSQL_ROOT_USER=root MYSQL_ROOT_PASSWORD=... \
       CADERNETA_DB_PASSWORD=... CADERNETA_MIGRATION_PASSWORD=...
backend-repo/scripts/criar-usuarios-mysql.sh
```

Ele é idempotente: cria ou atualiza a senha. A aplicação recebe só `SELECT/INSERT/UPDATE/DELETE`, e a migração
recebe DDL.

### Tarefas avulsas (iguais aos Jobs do Cloud Run)

```bash
docker compose run --rm migracao                                   # aplica migrations
docker compose run --rm --no-deps -e SPRING_PROFILES_ACTIVE=tarefa-lembretes backend   # gera lembretes
```

Ambas encerram com código 0 em sucesso e diferente de 0 em falha.

## Testes

| O quê | Comando | Observação |
|---|---|---|
| Backend: unitários | `mvn test` (em `backend-repo/`) | Não exige Docker. |
| Backend: unitários + integração (MySQL 8.4) | `mvn verify` | Testcontainers; exige Docker. Não usa o banco do compose. |
| Backend: compatibilidade TiDB | `mvn verify -Dtest=NONE -Dsurefire.failIfNoSpecifiedTests=false -Dcaderneta.it.imagem-banco=pingcap/tidb:v8.5.7` | Mesmos testes de integração contra o TiDB. |
| Frontend | `flutter analyze && flutter test --concurrency=1` (em `frontend-repo/`) | As imagens de referência (goldens) são do Flutter 3.47.9. |
| nginx (cabeçalhos, SPA, proxy) | `frontend-repo/scripts/verify_nginx.sh` | Exige `build/web`. |
| Navegador ponta a ponta | ver `e2e/` | Playwright (Chromium) contra a pilha do compose. |
| Carga | `e2e/carga/leitura.js` | k6; 20 usuários por 60 s por padrão. |

Exemplo E2E + carga (com a pilha no ar e o gerente de teste criado). Com `SPRING_PROFILES_ACTIVE=dev`
(HTTP local, cookie sem `Secure`), acrescente `-e E2E_COOKIE_SEGURO=false -e E2E_COOKIE=SESSION`;
as contas fictícias (`dev.gerente`) servem como `E2E_LOGIN`/`E2E_SENHA`:

```bash
set -a; . ./.env; set +a
docker run --rm --network host -e E2E_LOGIN="$CADERNETA_BOOTSTRAP_LOGIN" -e E2E_SENHA="$CADERNETA_BOOTSTRAP_SENHA" \
  -v "$PWD/e2e:/e2e" -w /e2e mcr.microsoft.com/playwright:v1.64.1-noble bash -c 'npm install && npx playwright test'
docker run --rm --network host -v "$PWD/e2e/carga:/s" grafana/k6:1.3.0 run \
  -e LOGIN="$CADERNETA_BOOTSTRAP_LOGIN" -e SENHA="$CADERNETA_BOOTSTRAP_SENHA" /s/leitura.js
```
