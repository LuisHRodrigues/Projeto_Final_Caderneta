# Variáveis de ambiente — Caderneta

Toda configuração que muda por ambiente entra por variável de ambiente. **Segredo** = vai para o
Secret Manager (nuvem) ou para o `.env` local (ignorado pelo Git). Nunca em arquivo versionado, nunca no
Flutter Web (tudo que é compilado para o navegador é público).

## API (Spring Boot) — `backend-repo/src/main/resources/application.yml`

| Variável | Segredo? | Padrão | Onde usar | Observação |
|---|---|---|---|---|
| `CADERNETA_DB_URL` | não* | `jdbc:mysql://mysql:3306/api_caderneta_database?serverTimezone=UTC` | API, tarefas | Em banco gerenciado, incluir TLS: `...?sslMode=VERIFY_IDENTITY&serverTimezone=UTC`. *Não contém senha, mas trate o host como informação interna. |
| `CADERNETA_DB_USER` | não | `caderneta_app` | API, tarefa de lembretes | Usuário só de DML. |
| `CADERNETA_DB_PASSWORD` | **sim** | — (obrigatória) | API, tarefa de lembretes | |
| `CADERNETA_MIGRATION_USER` | não | `caderneta_migracao` | tarefa `migracao` | Usuário de DDL. Nunca configurar na API. |
| `CADERNETA_MIGRATION_PASSWORD` | **sim** | — | tarefa `migracao` | Nunca configurar na API. |
| `CADERNETA_DB_POOL_MAX` | não | `5` | API | Conexões por instância. Conta: `POOL_MAX × máximo de instâncias + 2 (tarefas) + 2 (administração)` deve ficar abaixo do limite do banco (TiDB Cloud Starter: 400). |
| `CADERNETA_DB_POOL_MIN` | não | `1` | API | |
| `CADERNETA_DB_MAX_LIFETIME_MS` | não | `280000` | API | Abaixo de 5 min (recomendação do TiDB Cloud; o Starter corta conexões ociosas em 340 s). |
| `SPRING_PROFILES_ACTIVE` | não | vazio (produção) | todos | `migracao` (Job), `tarefa-lembretes` (Job), `dev` só local em HTTP. **Nunca** `dev`/`dev-fixtures` em servidor. |
| `SPRING_JPA_DATABASE_PLATFORM` | não | vazio (detecção automática) | API e tarefas | **TiDB Cloud: `org.hibernate.community.dialect.TiDBDialect`**. Sem ele, os locks pessimistas (venda e pagamento) geram `FOR UPDATE OF <apelido>`, que o TiDB Cloud recusa (erro 1146). MySQL: deixar vazio. |
| `CADERNETA_SESSAO_COOKIE` | não | `SESSION` | API | **Produção atrás do Firebase Hosting: `__session`** (o Hosting descarta qualquer outro cookie). |
| `CADERNETA_AGENDAMENTO_INTERNO` | não | `true` | API | **Cloud Run: `false`** (escala a zero; o cron interno não é confiável). Os lembretes rodam pela tarefa `tarefa-lembretes` disparada por agendador. |
| `CADERNETA_LOGIN_MAX_FALHAS` | não | `5` | API | Falhas por login dentro da janela antes do bloqueio. |
| `CADERNETA_LOGIN_MAX_FALHAS_IP` | não | `30` | API | Falhas por IP (o IP atrás de proxy pode ser forjado; o limite por login é o principal). |
| `CADERNETA_LOGIN_JANELA` / `CADERNETA_LOGIN_BLOQUEIO` | não | `15m` / `15m` | API | Formato de duração do Spring (`15m`, `1h`). |
| `CADERNETA_BOOTSTRAP_LOGIN` / `_SENHA` / `_NOME` / `_CPF` | **senha sim** | vazio | **só na tarefa `migracao`**, uma vez | Cria o primeiro gerente se não houver gerente ativo. Depois de criado, **remova** as variáveis e o segredo. |
| `PORT` | não | `8080` | API | Injetada pelo Cloud Run. |

Memória da JVM: a imagem define `JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"`.
Testado com limite de 512 MiB (carga de 20 usuários simultâneos: 389 MiB usados, sem erro).

## Compose local — `.env` na raiz (ver `.env.example`)

| Variável | Segredo? | Uso |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | **sim** | Root do MySQL local (só administração; nenhuma aplicação usa root). |
| `CADERNETA_DB_PASSWORD` | **sim** | Senha do `caderneta_app`. |
| `CADERNETA_MIGRATION_PASSWORD` | **sim** | Senha do `caderneta_migracao`. |
| `CADERNETA_FLYWAY_LOCATIONS` | não | Local, para carregar dados fictícios: `classpath:db/migration,classpath:db/dev`. |
| `CADERNETA_SESSAO_COOKIE` | não | Local: `SESSION` (padrão). Para simular a produção: `__session`. |

## Frontend (Flutter Web) — `--dart-define`

| Define | Padrão | Observação |
|---|---|---|
| `API_URL` | vazio | Vazio = mesma origem (`/api/...`), usado em **todos** os ambientes publicados (nginx local e Firebase Hosting). Só preencher em `flutter run` de desenvolvimento. |
| `MOCK_API` | `false` | `true` só em desenvolvimento/testes; o app recusa iniciar em release com `MOCK_API=true`. |

Não existe nenhum segredo no frontend, e o CI verifica isso com gitleaks no `build/web`.
