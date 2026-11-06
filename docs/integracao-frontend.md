# Integração do frontend com a API

> Registro inicial preservado. Para o estado atual, os contratos conferidos, testes e pendências concretas, consulte o [relatório consolidado do frontend](../frontend-repo/docs/integracao-frontend.md). O [plano compartilhado](plano-execucao-caderneta-atualizado.md) passou a estar disponível no projeto após o envio do anexo pelo usuário.

Documento vivo. Em divergência de contrato HTTP vale o plano compartilhado (`plano-execucao-caderneta-atualizado.md`).
Plano do frontend: `plano-execucao-frontend.md`.

## 1. Linha de base (F0, 05/11/2026)

| Verificação | Resultado |
|---|---|
| `flutter pub get` | passou |
| `flutter analyze` | 2 infos em `lib/core/permissoes.dart` (linhas 31 e 34, `curly_braces_in_flow_control_structures`); nenhum no código original |
| `flutter build web --release` | passou |
| `nginx -t` (Docker `nginx:alpine`, `--add-host backend:127.0.0.1`) | passou, com o bloco `/api/` |
| Testes | pasta `test/` ainda não existia |
| Chrome/Chromium | ausente do PATH (pendência de ambiente) |
| Submódulo `frontend-repo` | branch `master`, `21ea9d6`; `pubspec.lock` modificado (não é desta entrega) |

Divergência encontrada: arquivos de F1/F2 (`lib/core/api_error.dart`, `csrf.dart`, `http_gateway.dart`, `permissoes.dart`, `session.dart`…) já estavam sendo criados por outra sessão (Codex) durante a F0. Foram preservados.

## 2. Proxy e base da API (F3)

- `nginx.conf`: `location ^~ /api/ { proxy_pass http://backend:8080; ... }`, sem cache e sem `add_header` da SPA.
- `Dockerfile`: `ARG API_URL=` (vazio) → caminho relativo.
- Validado: sintaxe. **Pendente:** `GET http://localhost:3000/api/auth/csrf` pelo Compose completo (depende do backend com CSRF/cookie).

## 3. Perguntas ao responsável pelo backend

1. DTO de `POST /api/auth/funcionarios`.
2. DTOs de `/api/me/vendas`, `/dividas`, `/pagamentos`; existe `GET /api/me/resumo`?
3. Forma das "alterações" em `/api/auditoria` e valores de `acao` e `recursoTipo`.
4. Regras de senha e tentativas repetidas (`429`?).
5. Autorização de `/api/fiadores/**`, `limite-credito`, `prazo-pagamento` e CRUD de funcionários/proprietários.
6. `funcionarioId` no corpo de venda passa a ser ignorado/derivado da sessão? A partir de qual versão?
7. Quando `/api/notificacoes` e os `PATCH` de leitura podem deixar de ser usados.
8. CORS de desenvolvimento (origem `http://localhost:5000`, credenciais) e `Secure=false` em dev.
9. Serviço `backend` e porta `8080` no Compose: mantidos?
10. Fixtures de desenvolvimento: logins e dois clientes com dados distintos.

Observação do Compose: o serviço `frontend` tem `depends_on: backend` (sem healthcheck). Se o nginx falhar com "host not found in upstream", combinar com o responsável pelo Compose.

## 4. Itens pendentes de validação integrada

Ver seção 11 do plano do frontend; nada foi validado contra a API real até aqui.
