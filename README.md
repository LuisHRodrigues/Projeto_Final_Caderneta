# Sistema de Caderneta - Vendas a Prazo

Sistema completo para gerenciamento de vendas a prazo ("fiado"), com controle de
clientes, dívidas, pagamentos, notificações e relatórios gerenciais.

Este repositório é o **projeto integrador (guarda-chuva)**: reúne o backend e o
frontend como **submódulos Git** e orquestra tudo via Docker Compose.

## 🧩 Repositórios (submódulos)

| Submódulo        | Caminho          | Repositório                                         | Stack                         |
|------------------|------------------|----------------------------------------------------|-------------------------------|
| Backend (API)    | `backend-repo/`  | https://github.com/EduardoBR2003/api-caderneta     | Spring Boot 3 / Java 21 / MySQL |
| Frontend (Web)   | `frontend-repo/` | https://github.com/Artur-Duarte17/Caderneta        | HTML / CSS / JS (Vanilla) + NGINX |

### Clonar o projeto com os submódulos

```bash
git clone --recurse-submodules <url-deste-repo>
# ou, se já clonou sem os submódulos:
git submodule update --init --recursive
```

### Atualizar os submódulos para a última versão das branches remotas

```bash
git submodule update --remote --merge
```

## 🏗️ Arquitetura

```
┌────────────┐      HTTP/JSON      ┌──────────────┐      JDBC      ┌──────────┐
│  Frontend  │  ───────────────▶   │   Backend    │  ──────────▶   │  MySQL   │
│  NGINX :80 │   localhost:8080    │ Spring Boot  │   mysql:3306   │   8.0    │
│  (host 3000)│                    │    :8080     │                │(host 3307)│
└────────────┘                     └──────────────┘                └──────────┘
```

- **Backend**: Spring Boot 3 (Java 21), Spring Web, Spring Data JPA, Flyway,
  Bean Validation, ModelMapper, MySQL Connector, springdoc-openapi (Swagger UI).
- **Frontend**: HTML + CSS + JavaScript puro, servido por NGINX. Toda a
  comunicação com a API é centralizada em `js/api-service.js`.
- **Banco**: MySQL 8.0. Schema versionado com migrations Flyway
  (`src/main/resources/db/migration`) e `hibernate.ddl-auto=update`.
- **Documentação da API**: Swagger UI em `http://localhost:8080/swagger-ui.html`.

## 🚀 Como Executar

### Pré-requisitos

- Docker
- Docker Compose

### Executar com Docker (recomendado)

```bash
docker-compose up -d --build
```

**Acessos:**

| Serviço   | URL                                            |
|-----------|------------------------------------------------|
| Frontend  | http://localhost:3000                          |
| Backend   | http://localhost:8080                          |
| Swagger   | http://localhost:8080/swagger-ui.html          |
| MySQL     | `localhost:3307` (user `root` / senha `admin123`) |

Serviços definidos em [`docker-compose.yml`](docker-compose.yml):
`mysql` → `backend` (aguarda o healthcheck do MySQL) → `frontend`.

### Executar manualmente (desenvolvimento)

**Pré-requisitos adicionais:** Java 21+, Maven 3.6+, MySQL 8.0+.

1. **Banco** — crie o database e ajuste as credenciais em
   `backend-repo/src/main/resources/application.yml`
   (por padrão espera o host `mysql`; para rodar local, troque para `localhost:3306`
   ou `localhost:3307`):

   ```sql
   CREATE DATABASE api_caderneta_database;
   ```

2. **Backend:**

   ```bash
   cd backend-repo
   mvn spring-boot:run
   ```

   O Flyway aplica as migrations automaticamente na inicialização.

3. **Frontend:** sirva a pasta `frontend-repo/` com qualquer servidor estático
   (ex.: `npx serve frontend-repo`) ou abra `frontend-repo/index.html` no
   navegador. A API é consumida em `http://localhost:8080/api`.

## 📋 Funcionalidades

### Frontend (páginas)

| Página        | Arquivo                       | Descrição |
|---------------|-------------------------------|-----------|
| Visão Geral   | `index.html`                  | Dashboard com métricas, vendas recentes e clientes em atraso |
| Clientes      | `Paginas/clientes.html`       | CRUD de clientes, limite de crédito, prazo de pagamento e fiadores |
| Vendas        | `Paginas/vendas.html`         | Registro de vendas com múltiplos itens, edição e filtros |
| Pagamentos    | `Paginas/pagamentos.html`     | Gestão de cobranças e registro de pagamentos de dívidas |
| Relatórios    | `Paginas/relatorios.html`     | Relatórios de vendas a prazo, débitos pendentes e pagamentos, com exportação CSV |
| Notificações  | `Paginas/notificacoes.html`   | Timeline de eventos, filtros e marcação como lida |

Scripts em `frontend-repo/js/`: `api-service.js` (integração com a API),
`app.js` (utilidades gerais), `dashboard.js`, `clientes.js`, `vendas.js`,
`pagamentos.js`, `relatorios.js`, `notificacoes.js`, `notificacoes-global.js`.

### Backend (domínio)

Entidades JPA: `Pessoa` (base), `Cliente`, `Funcionario`, `Proprietario`,
`Fiador`, `Venda`, `ItemVenda`, `Divida`, `Pagamento`, `Notificacao`.

Enums: `StatusDivida` (ABERTA, PAGA_PARCIALMENTE, PAGA_TOTALMENTE, VENCIDA),
`MetodoPagamento` (DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, PIX, BOLETO_BANCARIO),
`TipoNotificacao` (LEMBRETE_PAGAMENTO, AVISO_DIVIDA_VENCIDA, CONFIRMACAO_COMPRA,
CONFIRMACAO_PAGAMENTO, CADASTRO_CLIENTE, PAGAMENTO_RECEBIDO, COMPRA_REALIZADA).

Regras de negócio: geração automática de dívida a partir da venda, cálculo de
`valorPendente`, atualização de status da dívida ao registrar pagamentos e
disparo de notificações em eventos (cadastro de cliente, venda, pagamento).

## 🛠️ Estrutura do projeto

```
Projeto_Final_Caderneta/
├── docker-compose.yml         # Orquestração (mysql + backend + frontend)
├── .gitmodules                # Definição dos submódulos
├── backend-repo/              # Submódulo: API Spring Boot
│   ├── Dockerfile             # Build multi-stage (Maven → JRE 21 Alpine)
│   ├── pom.xml
│   └── src/main/
│       ├── java/br/com/api_caderneta/
│       │   ├── config/            # CorsConfig, ModelMapperConfig, OpenApiConfig
│       │   ├── controller/        # Controllers REST
│       │   ├── services/          # Lógica de negócio
│       │   ├── repository/        # Spring Data JPA
│       │   ├── model/             # Entidades + enums
│       │   ├── dto/               # Request/Response DTOs
│       │   ├── mapper/            # DataMapper (ModelMapper)
│       │   └── exceptions/        # Exceções e handler global
│       └── resources/
│           ├── application.yml
│           └── db/migration/      # V1..V4 (Flyway)
└── frontend-repo/             # Submódulo: interface web
    ├── Dockerfile             # NGINX Alpine
    ├── nginx.conf
    ├── index.html
    ├── theme.css
    ├── js/                    # Lógica das páginas + api-service.js
    ├── Paginas/               # Páginas HTML internas
    ├── components/            # Sidebar, topbar, breadcrumb (parciais)
    └── Documentação/          # Termo de abertura, casos de uso
```

## 🔗 Endpoints da API

Base: `http://localhost:8080`

### Clientes — `/api/clientes`
- `GET /` · `POST /` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`
- `PATCH /{id}/limite-credito`
- `PATCH /{id}/prazo-pagamento`

### Vendas — `/api/vendas`
- `GET /` · `POST /` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

### Dívidas — `/api/dividas`
- `GET /` · `GET /{id}` · `GET /cliente/{clienteId}`
- `POST /{dividaId}/pagamentos` — registrar pagamento
- `PUT /{id}` · `DELETE /{id}`

### Fiadores — `/api/fiadores`
- `GET /` · `GET /{id}` · `POST /`
- `POST /associar/cliente/{clienteId}/fiador/{fiadorId}`

### Funcionários — `/api/funcionarios`
- `GET /` · `POST /` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

### Proprietários — `/api/v1/proprietarios`
- `GET /` · `POST /` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

### Notificações — `/api/notificacoes`
- `GET /` · `GET /cliente/{clienteId}`
- `POST /manual` — criar notificação manual
- `PATCH /{id}/marcar-lida`
- `PATCH /marcar-todas-lidas`

### Relatórios — `/api/relatorios`
- `GET /vendas-a-prazo?dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD`
- `GET /debitos-pendentes?dataInicio=...&dataFim=...` (filtro opcional por status)
- `GET /pagamentos?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` — dados para gráficos

> A referência completa e testável está no Swagger UI.

## 🐛 Solução de problemas

### Sistema não inicia
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs mysql
docker-compose down && docker-compose up -d --build
```

### Frontend não carrega dados
1. Verifique se a API responde: `http://localhost:8080/api/clientes`.
2. Console do navegador (F12) → procure por erros de CORS ou `Failed to fetch`.
3. Confirme que as requisições vão para `http://localhost:8080/api`.

### Erros 404 / 405 em endpoints
- Reinicie o backend após mudanças: `docker-compose restart backend`.
- Confira o caminho exato na tabela de endpoints acima (ex.: proprietários usa
  `/api/v1/proprietarios`, notificação manual usa `/api/notificacoes/manual`).

### Problemas de CORS
- Configuração em `backend-repo/.../config/CorsConfig.java`
  (libera `http://localhost:3000`). Adicione outras origens se necessário.

### Banco / migrations
- Migrations ficam em `backend-repo/src/main/resources/db/migration`.
- `spring.flyway.baseline-on-migrate=true` está habilitado.
- Para recriar do zero: `docker-compose down -v` (remove o volume `mysql_data`).

## 🎯 Status do projeto

🚧 **Em desenvolvimento** — funcionalidades principais implementadas e integradas.

| Módulo         | Status |
|----------------|--------|
| Backend API    | ✅ Endpoints REST implementados |
| Clientes       | ✅ CRUD completo (limites, prazos, fiadores) |
| Dashboard      | ✅ Métricas e vendas recentes |
| Vendas         | ⚠️ Listagem e registro OK; edição/detalhes em ajuste |
| Dívidas        | ✅ CRUD e pagamentos; cálculo de `valorPendente` |
| Pagamentos     | ✅ Registro integrado com atualização de status |
| Relatórios     | ✅ Vendas, débitos e pagamentos com exportação CSV |
| Notificações   | ✅ Eventos em tempo real e marcação de leitura |
| Infra          | ✅ Docker, Flyway, CORS |

### Próximas implementações
- Corrigir bugs remanescentes nas vendas (valores `NaN`, descrição `undefined`).
- Persistência/agendamento de notificações; envio por e-mail/SMS.
- Paginação, ordenação e filtros mais granulares nas listagens.
- Relatórios em PDF e dashboard com gráficos avançados.
- Autenticação e permissões por usuário.
