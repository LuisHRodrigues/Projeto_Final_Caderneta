# Entrega e homologação da Caderneta

Execução iniciada em 05/11/2026 e concluída em 06/11/2026, America/Sao_Paulo.

Identificador da entrega: **caderneta-local-20261106-ffdf8c1b693a**.

## Resultado

O plano aprovado foi implementado em backend, frontend, migrations, ambiente local e documentação. A aplicação atualizada está em **http://localhost:3000**, com API e MySQL saudáveis. O volume **projeto_final_caderneta_mysql_data** foi preservado.

A homologação aprova os cenários descritos neste relatório na versão local identificada pelas imagens e pelo manifesto de artefatos. Não equivale a afirmar ausência absoluta de erros.

| Componente | Base Git preservada |
|---|---|
| Integrador | 4163166bd83d7a77dbd6c2360f1b072aace368b1 |
| Backend | cfef53e3d46b55acc899663fed5bd6cdf70a7bd7 |
| Frontend | 5e7ad76857eb9c14cff8211252f4b71a29d2be4d |

A entrega foi inicialmente homologada sem commit, push ou publicação externa. Em 06/11/2026, o usuário autorizou expressamente commit e push diretamente para main nos três repositórios; consulte o [registro de versionamento](versionamento-2026-11-06.md). A publicação do código não altera o escopo de hospedagem externa. O manifesto em **C:/Dev/Backups/Caderneta/implementacao-20261105/manifesto-versao.json** identifica hashes do JAR, frontend, arquivos de código e imagens efetivamente servidas.

## Regras entregues

Total financeiro próprio, itens opcionais e soma de itens menor ou igual ao total. A diferença aparece como Valor não detalhado. Itens continuam editáveis após pagamento, sem alterar saldo. Campos financeiros ficam bloqueados após qualquer recebimento.

Funcionário consulta, edita e imprime somente suas vendas. Cobrança permanece compartilhada sem expor itens de vendas alheias. Gerente administra crédito, prazo, vencimento, exclusão financeira, acessos e relatórios. Cliente consulta exclusivamente seus registros. Consulte a [matriz e o contrato completos](contratos-e-permissoes.md).

Documentos antigos e a biblioteca foram tratados como referências; o escopo autorizado no chat prevaleceu, inclusive sobre a antiga divisão frontend/backend e sobre a premissa incorreta de igualdade entre itens e total.

## As 24 frentes da análise

| Frente | Entrega e evidência |
|---|---|
| 01. Isolamento de vendas | Filtro por vendedor da sessão no servidor; detalhe alheio 404; provas HTTP A/B. |
| 02. Edição do funcionário | Permitida na própria venda, com versão obrigatória e auditoria; testes de PUT próprio/alheio. |
| 03. Caminhos indiretos | Painel separa vendas próprias e cobrança compartilhada; comprovante protegido; histórico operacional sem itens alheios. |
| 04. Itens e total | DTOs separados, detalhamento opcional/substituível e validação exata; casos 0/60/100/100,01 sobre total 100. |
| 05. Crédito na edição | Revalidação transacional do destino, sem dupla contagem da dívida atual; recusa sem gravação parcial. |
| 06. Crédito concorrente | Bloqueio por cliente e ordem de ID em transferência; duas vendas de 80 para limite 100 não confirmam ambas. |
| 07. Pagamento concorrente | Mesmo protocolo de cliente/dívida; READ_COMMITTED e relações de coleção LAZY evitam saldo antigo; testes reais pagamento/pagamento, edição e exclusão. |
| 08. Data/hora | Preserva hora e data quando não alteradas; data comercial explícita no DTO; mudança de data/cliente recalcula prazo e total isolado preserva renegociação. |
| 09. Vencimento efetivo | Status calculado nas consultas, filtros, cards e área do cliente; testes com dívida vencida e renegociada. |
| 10. Relatórios | Recebimentos pela data do pagamento; saldo atual e fórmula explícita; agregados do período no servidor. |
| 11. Validações | CPF, nome, precisão/limites monetários, quantidades e prazo no servidor; unicidade normalizada concorrente no MySQL. |
| 12. Crédito/prazo gerenciais | Proteção no PATCH e PUT geral; funcionário cria com zero/30 dias; verificações HTTP de desvio. |
| 13. Fiador | Cadastro/associação atômicos e edição, troca, remoção; falha de fiador não deixa cliente parcial; opcionais distinguem omissão de limpeza. |
| 14. Operações expostas | Renegociação e exclusão sem pagamentos pelo gerente; comprovantes de venda/compra/recebimento, inclusive botões do cliente. |
| 15. Confirmação incerta | Idempotência persistida no banco e chave mantida pelo navegador; replay devolve operação original; alteração de conteúdo retorna 409. |
| 16. Histórico/auditoria | Cadastros, fiador, crédito, prazo, itens e operador de pagamento; falha de histórico provocada por trigger reverte venda, dívida e chave. |
| 17. Contratos/lembretes | Evento manual efetivamente persistido e chave única de lembrete por dívida/situação/vencimento. |
| 18. Enquadramento | Shell autenticado no topo esquerdo, largura disponível e margens; conferência navegador e teste de posição. |
| 19. Goldens/acessibilidade | Cinco referências revisadas com Roboto real e SDK fixo; overflow separado; texto a 200%, Tab e diálogos. |
| 20. Paginação/resumos | Listas operacionais paginadas/filtradas no servidor, frontend e simulações atualizados; cards agregados sem download de toda a carteira. |
| 21. Migrations | B7 limpa + V8 incremental; V1–V7 intactas; instalação sem demonstrações e atualização/restauração preservadas. |
| 22. Build | JDK 21/Maven 3.9.9, Flutter 3.47.6 e lockfile, imagens de runtime fixadas; testes antes do empacotamento. |
| 23. Operação/recuperação | Usuários SQL separados, credenciais externas, prontidão, HTTP local/HTTPS separado, limitação de autenticação, backup diário e restauração utilizável. |
| 24. Documentação/escopo | README substituído, contrato/matriz novos e relatórios antigos identificados como históricos; regra de itens corrigida. |

## Verificações executadas

- **Backend: 65 testes aprovados**, zero falhas/erros, Maven package em maven:3.9.9-eclipse-temurin-21, incluindo StartupTests contra MySQL isolado 8.0.46 e Hibernate validate.
- **Frontend: 66 testes aprovados**, incluindo cinco goldens, layout, permissões, sessão, paginação, confirmação incerta, regressão de login após logout e matriz de escala. flutter analyze --no-pub sem problemas.
- **HTTP integrado:** instalação inicialmente vazia sem demonstrações (rodada inicial de 16 cenários); após a última versão empacotada, 15 cenários operacionais repetidos e oito financeiros adicionais, todos aprovados. Scripts em scripts/testar-homologacao.mjs e scripts/testar-financeiro.mjs.
- **Navegador Edge:** oito telas do gerente, cinco do funcionário e cinco do cliente nas larguras **360, 390, 768, 1024 e 1280**, com fontes Roboto/Material Icons servidas localmente. Capturas em output/playwright. Diálogo de compra e comprovantes de compra e recebimento também conferidos.
- **Escala:** 15 rotas nas cinco larguras com texto a **200%**, fontes Roboto e navegação por Tab, sem exceções de layout. Teclado Tab/Shift+Tab/Escape conferido no diálogo real. Semântica acessível de tabelas, formulários, ações e diálogos observada no navegador.
- **Após a atualização:** novamente oito telas do gerente, cinco do funcionário e cinco do cliente no navegador local; testes HTTP das quatro contas existentes com login, propriedade, comprovantes, restrições e logout, sem mutações financeiras.
- **Restauração:** dump anterior restaurado/migrado em banco isolado, aplicação final utilizável com quatro contas e mesmos dados. Novo dump após V8 também restaurado em outro banco e aprovado no mesmo teste.
- **Operação:** nginx HTTPS validado sintaticamente com certificado local de teste; configuração de produção separada; tarefa diária acionada manualmente e LastTaskResult=0.

O teste no navegador revelou e permitiu corrigir o botão de login que podia permanecer ocupado após logout. A regressão ficou coberta por login_logout_test.dart.

Os testes concorrentes adicionais inicialmente reproduziram leitura antiga de pagamentos sob REPEATABLE_READ com grafos EAGER. A correção adotou READ_COMMITTED, coleções LAZY e o protocolo comum de bloqueio; os mesmos cenários passaram no MySQL real.

As cinco referências visuais antigas usavam condições de fonte/renderização inadequadas para aprovar legibilidade real. Os testes de overflow foram separados dos goldens, Roboto e Material Icons foram carregados explicitamente, e as cinco imagens foram inspecionadas antes de atualizar as referências. Os arquivos antigos em test/failures, já existentes, foram preservados.

## Preservação da base local

| Verificação | Antes | Depois |
|---|---|---|
| Vendas | 9 | 9 |
| Pagamentos | 5 | 5 |
| Vínculo cliente/valor entre venda e dívida inconsistente | 0 | 0 |
| Saldo diferente de original menos pagamentos | 0 | 0 |
| Soma de itens acima do total | 0 | 0 |

Impressões digitais das colunas financeiras, idênticas antes/depois e na restauração anterior:

- Vendas: 9031e48ec6a2a320576bddc8c08ff9cb29ee26bb6a46b1bcb73abe5533d78408
- Pagamentos: 73ed8942d7161ed20d5ab4ac4c5dec06b72fe2bb0c3c3ab71f535a49516eb98e

Histórico Flyway antigo mantido; somente V8 foi aplicada na base existente. MySQL permaneceu em **8.0.46**, fixado pelo digest já utilizado localmente. Contas existentes foram preservadas; a aplicação passou a usar caderneta_app e as migrations, caderneta_migracao. Credenciais SQL foram substituídas e permanecem fora do Git em .env.

## Backups, evidências e recuperação

Pasta de evidências: **C:/Dev/Backups/Caderneta/implementacao-20261105**.

- antes.sql: backup original, SHA-256 **5E160C961A380DAE14F9574D25DBB1E9D7ADA14C08927699C07ECD1A3B6326DB**.
- atualizacao/backup.json e financeiro-antes/depois.txt: backup imediatamente anterior à atualização e comparação efetiva.
- backend-completo.log, frontend-testes.log, build-frontend.log e atualizacao-local.log: resultados e empacotamento.
- homologacao-final.json, financeiro-final.json e smoke-*.json: verificações integradas e restaurações.
- manifesto-versao.json: hashes e imagens finais, sem credenciais.
- Imagens anteriores caderneta-backend:antes-20261105 e caderneta-frontend:antes-20261105 preservadas, além das tags com horário da atualização.
- Tarefa **Caderneta Backup Diario**, diariamente às **03h**, destino C:/Dev/Backups/Caderneta/diarios, retenção inicial **30 dias** e hash por arquivo.

Os dumps contêm dados de cadastro e devem permanecer na pasta privada de backup. A tarefa depende da disponibilidade do Windows/sessão configurada e Docker Desktop; StartWhenAvailable recupera execução perdida quando possível. Procedimentos e comandos estão no README.

## Retomada em 06/11/2026

Na retomada pela manhã, o Docker Desktop estava fechado e apresentou falha ao reutilizar sockets temporários antigos de Inference e Secrets Engine. Os diretórios de execução continham somente endpoints vazios; foram renomeados e preservados como *-stale-20261106-*, permitindo recriar esses endpoints e iniciar o Docker. Esse tipo de falha está descrito no [registro do Docker Desktop](https://github.com/docker/desktop-feedback/issues/460). Não houve reset do Docker nem alteração dos volumes ou dos dados por esse procedimento.

O ambiente local foi iniciado novamente e a conferência de prontidão, contas, isolamento e hashes foi repetida. Os containers de homologação/restauração ficaram desligados para liberar recursos; suas imagens, volumes e evidências permanecem disponíveis.

## Limitações remanescentes registradas

1. **Oito CPFs históricos inválidos:** pessoas de IDs **1, 2, 3, 4, 5, 6, 1001 e 1002**. Não foram inventadas correções. O responsável pelos dados deve conferir documentos reais antes de corrigir essas identidades. Não foram encontradas colisões normalizadas que impedissem V8.
2. Pagamentos antigos mantêm operador desconhecido quando esse vínculo não existia; novos recebimentos registram o operador autenticado. Não foi fabricada autoria retroativa.
3. A conferência de acessibilidade cobre semântica, teclado, foco, escala e layout automatizados. Não foi realizada uma sessão com usuário de leitor de tela nem certificação formal de acessibilidade.
4. HTTPS foi preparado e validado localmente; domínio, certificado público e publicação externa continuam fora desta execução.
5. Permanecem adiados conforme aprovado: offline, acesso próprio do fiador, bot com envio real, pagamentos online, estorno e recuperação de senha.
