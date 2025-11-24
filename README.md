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

### ✅ Implementadas

- **Clientes**
  - ✅ Cadastro, edição e visualização
  - ✅ Controle de limite de crédito
  - ✅ Gestão de fiadores
  - ✅ Busca e filtros

- **Vendas**
  - ✅ Registro de vendas a prazo
  - ✅ Múltiplos itens por venda
  - ✅ Controle de status (Pendente/Pago/Cancelado)

- **Dívidas**
  - ✅ Controle automático de dívidas
  - ✅ Registro de pagamentos
  - ✅ Histórico de transações

- **Relatórios**
  - ✅ Relatório de vendas
  - ✅ Relatório de dívidas
  - ✅ Filtros por período e status

- **Notificações**
  - ✅ Alertas de vencimento
  - ✅ Notificações de pagamento

### 🔄 Integração Frontend-Backend

- ✅ Serviço de API (`api-service.js`)
- ✅ Gerenciador de clientes (`clientes.js`)
- ✅ Gerenciador de vendas (`vendas.js`)
- ✅ Configuração CORS
- ✅ Tratamento de erros
- ✅ Loading states

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
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes/{id}` - Buscar cliente
- `PUT /api/clientes/{id}` - Atualizar cliente
- `DELETE /api/clientes/{id}` - Excluir cliente
- `PATCH /api/clientes/{id}/limite-credito` - Atualizar limite
- `PATCH /api/clientes/{id}/prazo-pagamento` - Atualizar prazo

### Vendas
- `GET /api/vendas` - Listar vendas
- `POST /api/vendas` - Criar venda
- `GET /api/vendas/{id}` - Buscar venda
- `PUT /api/vendas/{id}` - Atualizar venda
- `DELETE /api/vendas/{id}` - Excluir venda

### Dívidas
- `GET /api/dividas` - Listar dívidas
- `GET /api/dividas/{id}` - Buscar dívida
- `POST /api/dividas/{id}/pagamentos` - Registrar pagamento

### Relatórios
- `GET /api/relatorios/vendas` - Relatório de vendas
- `GET /api/relatorios/dividas` - Relatório de dívidas

## 🎯 Próximos Passos

1. **Completar integração das demais páginas**
   - Relatórios dinâmicos
   - Notificações em tempo real
   - Dashboard com métricas

2. **Melhorias de UX**
   - Paginação
   - Ordenação de tabelas
   - Filtros avançados

3. **Funcionalidades avançadas**
   - Backup automático
   - Exportação de relatórios
   - Sistema de permissões

## 🐛 Solução de Problemas

### Backend não inicia
- Verifique se o MySQL está rodando
- Confirme as credenciais no `application.yml`
- Execute `mvn clean install` novamente

### Frontend não carrega dados
- Verifique se o backend está rodando na porta 8080
- Abra o console do navegador para ver erros
- Confirme a configuração CORS

### Erro de CORS
- Verifique se a configuração `CorsConfig.java` está correta
- Confirme se o frontend está rodando na porta permitida (3000)

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Logs do backend no console
2. Console do navegador (F12)
3. Documentação da API no Swagger
4. Este README para configurações