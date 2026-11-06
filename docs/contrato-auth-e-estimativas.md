# Registro histórico das estimativas do frontend

O contrato vigente é o [plano compartilhado de 05/11/2026](plano-execucao-caderneta-atualizado.md), recebido como anexo do usuário. Este arquivo preserva informações úteis do rascunho anterior; não define contratos ou decisões pendentes.

As propostas anteriores de JWT, cookie `CADERNETA_SESSAO`, leitura de cookie CSRF pelo JavaScript e autenticação automática após ativação foram substituídas pelas decisões do plano compartilhado. A implementação e os resultados estão no [relatório do frontend](../frontend-repo/docs/integracao-frontend.md); os DTOs publicados pelo backend estão em [backend-integracao.md](backend-integracao.md).

## Contexto da inspeção anterior

Na inspeção que originou o rascunho, o frontend ainda usava o funcionário fixo, polling de notificações e não havia a suíte de testes atual. O backend ainda não tinha a infraestrutura de sessão publicada. Esses registros descrevem o ponto de partida, não o estado atual.

A referência de tamanho usada naquela estimativa era aproximadamente 1.290 linhas em `core/` e `widgets/` e 1.425 em `pages/`. O primeiro total era cerca de 34–51 horas, com 15–23 horas de tarefas independentes. São estimativas históricas anteriores ao escopo consolidado; não constituem compromisso nem cálculo do trabalho restante.

## Intervalos originais de esforço

| Tarefa considerada no rascunho | Estimativa histórica |
|---|---|
| Renomear Notificações → Histórico | 1–2 h |
| Espaçamentos | 3–5 h |
| Camada de sessão (modelo `Sessao`/`Perfil`, cliente HTTP com credenciais + CSRF, interceptação 401/403) | 5–7 h |
| Tela de login | 2–3 h |
| Redirecionamento por perfil (`GoRouter.redirect`, menus por perfil, "Acesso negado") | 3–4 h |
| Logout e limpeza (parar polling, limpar `NotificacoesService`) | 1–2 h |
| Tela de cadastro (cliente com convite) | 2–3 h |
| Gestão de funcionários (gerente) | 3–4 h |
| Área do cliente (compras, dívidas, vencimentos, pagamentos, histórico) | 6–9 h |
| Remover `funcionarioPadraoId` | 0,5 h |
| Integração real + correções | 4–6 h |
| Investigação do bot (documento) | 2–3 h, com limite |

A execução atual inclui sessão JDBC, CSRF explícito, proxy, paginação remota e Auditoria separada. O trabalho independente do frontend foi implementado e os testes constam no relatório. A validação integrada depende de um ambiente estável e não deve ser confundida com validação por simulação.

A troca de branch, commits e atualização de ponteiros de submódulos continuam fora deste pedido.
