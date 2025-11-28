# Sistema de Caderneta - Vendas a Prazo

Sistema completo para gerenciamento de vendas a prazo com controle de clientes, dívidas e relatórios.

## 🏗️ Arquitetura

- **Backend**: Spring Boot (Java) com MySQL
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **API**: RESTful com documentação Swagger

## 🚀 Como Executar

### Pré-requisitos

- Docker
- Docker Compose

### Executar com Docker (Recomendado)

```bash
docker-compose up -d
```

**Acessos:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

### Executar Manualmente (Desenvolvimento)

**Pré-requisitos adicionais:**
- Java 17+
- Maven 3.6+
- MySQL 8.0+

**1. Configurar Banco:**
```sql
CREATE DATABASE api_caderneta_database;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON api_caderneta_database.* TO 'root'@'localhost';
```

**2. Backend:**
```bash
cd backend-repo
mvn spring-boot:run
```

**3. Frontend:**
Abra `frontend-repo/index.html` diretamente no navegador

## 📋 Funcionalidades

### ✅ Implementadas e Integradas

- **Dashboard**
  - ✅ Métricas em tempo real do banco de dados
  - ✅ Vendas recentes dinâmicas
  - ✅ Clientes em atraso automático
  - ✅ Cards com dados calculados

- **Clientes**
  - ✅ CRUD completo integrado com API
  - ✅ Cadastro com validação de campos obrigatórios
  - ✅ Edição de dados e limite de crédito
  - ✅ Visualização detalhada com situação financeira
  - ✅ Gestão de fiadores
  - ✅ Busca e filtros em tempo real

- **Vendas**
  - ✅ Registro de vendas com múltiplos itens
  - ✅ Seleção dinâmica de clientes do banco
  - ✅ Cálculo automático de valores
  - ✅ Controle de status (Pendente/Pago/Cancelado)
  - ✅ Visualização e edição de vendas
  - ✅ Filtros por período e status

- **Dívidas**
  - ✅ Geração automática a partir de vendas
  - ✅ Controle de status e vencimentos
  - ✅ Registro de pagamentos
  - ✅ Histórico completo de transações
  - ✅ Cálculo de saldos pendentes

- **Relatórios**
  - ✅ Relatório de vendas com dados reais
  - ✅ Relatório de dívidas por período
  - ✅ Filtros dinâmicos por data e tipo
  - ✅ Exportação CSV funcional
  - ✅ Métricas calculadas automaticamente

- **Notificações**
  - ✅ Sistema de notificações do banco
  - ✅ Filtros por tipo e status
  - ✅ Marcar como lida integrado
  - ✅ Timeline de eventos
  - ✅ Notificações em tempo real (cliente criado, venda criada, pagamento recebido)

### 🔄 Integração Frontend-Backend Completa

- ✅ **API Service** (`api-service.js`) - Centralização de todas as chamadas
- ✅ **Gerenciadores específicos** - Clientes, Vendas, Dashboard, Relatórios, Notificações
- ✅ **CORS configurado** - Comunicação entre containers Docker
- ✅ **Tratamento de erros** - Mensagens amigáveis e logs detalhados
- ✅ **Loading states** - Indicadores visuais de carregamento
- ✅ **Validação** - Client-side e server-side
- ✅ **Dados dinâmicos** - Todas as páginas consomem dados reais

## 🛠️ Estrutura do Projeto

```
Projeto_Final_Caderneta/
├── backend-repo/           # API Spring Boot
│   ├── src/main/java/
│   │   └── br/com/api_caderneta/
│   │       ├── controller/     # Controllers REST
│   │       ├── service/        # Lógica de negócio
│   │       ├── repository/     # Acesso a dados
│   │       ├── model/          # Entidades JPA
│   │       ├── dto/            # Data Transfer Objects
│   │       └── config/         # Configurações
│   └── src/main/resources/
│       ├── application.yml     # Configurações da aplicação
│       └── db/migration/       # Scripts Flyway
├── frontend-repo/          # Interface web
│   ├── js/
│   │   ├── app.js             # Funcionalidades gerais
│   │   ├── api-service.js     # Integração com API
│   │   ├── clientes.js        # Gerenciamento de clientes
│   │   └── vendas.js          # Gerenciamento de vendas
│   ├── Paginas/               # Páginas HTML
│   ├── components/            # Componentes reutilizáveis
│   └── Dockerfile             # Container do frontend
└── docker-compose.yml     # Orquestração Docker
```

## 🔗 Endpoints da API

### Clientes
- `GET /api/clientes` - Listar todos os clientes
- `POST /api/clientes` - Criar novo cliente
- `GET /api/clientes/{id}` - Buscar cliente por ID
- `PUT /api/clientes/{id}` - Atualizar dados do cliente
- `DELETE /api/clientes/{id}` - Excluir cliente
- `PATCH /api/clientes/{id}/limite-credito` - Atualizar limite de crédito
- `PATCH /api/clientes/{id}/prazo-pagamento` - Atualizar prazo de pagamento

### Vendas
- `GET /api/vendas` - Listar todas as vendas
- `POST /api/vendas` - Registrar nova venda
- `GET /api/vendas/{id}` - Buscar venda por ID
- `PUT /api/vendas/{id}` - Atualizar venda
- `DELETE /api/vendas/{id}` - Excluir venda

### Dívidas
- `GET /api/dividas` - Listar todas as dívidas
- `GET /api/dividas/{id}` - Buscar dívida por ID
- `GET /api/dividas/cliente/{clienteId}` - Listar dívidas de um cliente
- `POST /api/dividas/{id}/pagamentos` - Registrar pagamento
- `PUT /api/dividas/{id}` - Atualizar dívida
- `DELETE /api/dividas/{id}` - Excluir dívida

### Funcionários
- `GET /api/funcionarios` - Listar funcionários
- `POST /api/funcionarios` - Criar funcionário
- `GET /api/funcionarios/{id}` - Buscar funcionário
- `PUT /api/funcionarios/{id}` - Atualizar funcionário
- `DELETE /api/funcionarios/{id}` - Excluir funcionário

### Fiadores
- `GET /api/fiadores` - Listar fiadores
- `POST /api/fiadores` - Criar fiador

### Notificações
- `GET /api/notificacoes` - Listar notificações
- `POST /api/notificacoes` - Criar notificação
- `PATCH /api/notificacoes/{id}/marcar-lida` - Marcar como lida

### Relatórios
- `GET /api/relatorios/vendas-a-prazo` - Relatório de vendas (com filtros de data)
- `GET /api/relatorios/debitos-pendentes` - Relatório de dívidas (com filtros)

### Proprietário
- `GET /api/proprietario` - Dados do proprietário
- `PUT /api/proprietario` - Atualizar dados do proprietário

## 🎯 Status do Projeto

### 🚧 **EM DESENVOLVIMENTO - Funcionalidades Principais Implementadas**

Status atual do desenvolvimento:

- ✅ **Backend API** - Endpoints REST implementados
- ✅ **CRUD Clientes** - Totalmente funcional e integrado
- ✅ **Dashboard** - Métricas básicas do banco de dados
- ⚠️ **Vendas** - Listagem funcional, edição em desenvolvimento
- ✅ **Dívidas** - CRUD funcional, cálculos corrigidos
- ✅ **Relatórios** - Dados reais integrados, cálculos corretos
- ✅ **Notificações** - Integração completa com eventos em tempo real
- ✅ **Notificações** - Interface criada, integração completa com eventos em tempo real
- ✅ **Docker** - Sistema containerizado
- ✅ **CORS** - Comunicação frontend-backend configurada

### 🎯 **Próximas Implementações**

**Prioridade Alta:**
1. **Corrigir bugs nas vendas**
   - Valores NaN nos detalhes
   - Descrição undefined
   - Edição de vendas

2. **Melhorias nas notificações**
   - Persistência de notificações no backend
   - Notificações por email/SMS
   - Agendamento de notificações

### ✅ **Correções Recentes**

1. **Cálculo de Valores Pendentes**
   - ✅ Corrigido cálculo no relatório de dívidas
   - ✅ Corrigido card de "Fiados Pendentes" no dashboard
   - ✅ Agora usa `valorPendente` do backend (cálculo correto)
   - ✅ Valores zerados quando todas as dívidas são pagas

2. **Integração de Notificações em Tempo Real**
   - ✅ Notificações ao criar novo cliente
   - ✅ Notificações ao registrar nova venda
   - ✅ Notificações ao receber pagamento
   - ✅ Badge de notificações não lidas atualiza automaticamente
   - ✅ Eventos disparados em tempo real entre páginas

**Melhorias Futuras:**

1. **UX Avançado**
   - Paginação nas listagens
   - Ordenação de colunas
   - Filtros mais granulares
   - Modo escuro

2. **Funcionalidades Extras**
   - Backup automático
   - Relatórios em PDF
   - Sistema de permissões por usuário
   - Notificações por email/SMS
   - Dashboard com gráficos avançados

3. **Performance**
   - Cache de dados
   - Lazy loading
   - Otimização de consultas

## 🐛 Solução de Problemas

### Sistema não inicia
```bash
# Verificar status dos containers
docker-compose ps

# Ver logs de erro
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Restart completo
docker-compose down
docker-compose up -d --build
```

### Frontend não carrega dados
1. **Verificar se backend está respondendo:**
   - Acesse: `http://localhost:8080/api/clientes`
   - Deve retornar JSON com lista de clientes

2. **Verificar console do navegador (F12):**
   - Procure por erros de CORS ou Failed to fetch
   - Verifique se as requisições estão sendo feitas para a porta correta

3. **Testar conectividade:**
   - Acesse: `http://localhost:3000/test-api.html`
   - Clique em "Testar Backend"

### Erro 404 em endpoints
- Verifique se o backend foi reiniciado após mudanças
- Confirme se os controllers estão com as anotações corretas
- Execute: `docker-compose restart backend`

### Erro 405 (Method Not Allowed)
- Endpoint existe mas método HTTP não implementado
- Verifique se todos os métodos CRUD estão no controller

### Problemas de CORS
- Configuração está em `CorsConfig.java`
- Permite requisições de `localhost:3000`
- Se necessário, adicione outras origens

## 🔧 **Status de Desenvolvimento**

**Funcionalidades Completas:**
- ✅ **Gestão de Clientes** - CRUD completo com fiadores e limites
- ✅ **Dashboard** - Métricas básicas e vendas recentes
- ✅ **Infraestrutura** - Docker, CORS, API base

**Em Desenvolvimento:**
- ⚠️ **Vendas** - Listagem OK, edição e detalhes com bugs
- ⚠️ **Relatórios** - Estrutura criada, dados parcialmente integrados
- ⚠️ **Dívidas** - Funcionalidade básica, refinamentos necessários

**Pendente:**
- ❌ **Validações avançadas** - Campos obrigatórios e formatos
- ❌ **Tratamento de erros** - Mensagens específicas por contexto

## 📞 Suporte

### Verificações Básicas
1. **Logs do sistema:** `docker-compose logs`
2. **Console do navegador:** F12 → Console
3. **API direta:** `http://localhost:8080/api/clientes`
4. **Documentação:** `http://localhost:8080/swagger-ui.html`

### Comandos Úteis
```bash
# Status dos serviços
docker-compose ps

# Restart específico
docker-compose restart backend

# Rebuild completo
docker-compose down && docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f backend
```
