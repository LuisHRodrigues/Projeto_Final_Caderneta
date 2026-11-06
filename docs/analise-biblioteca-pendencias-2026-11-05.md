# Análise da Caderneta com a Biblioteca de Software

> Atualização de 06/11/2026: este documento registra o diagnóstico anterior à execução. O estado validado está no [relatório de entrega](entrega-homologacao-2026-11-05.md) e as decisões atuais em [contratos e permissões](contratos-e-permissoes.md). As constatações abaixo descrevem a versão antiga; não representam pendências automaticamente ainda abertas.

Data de referência: 05/11/2026, America/Sao_Paulo.

Na data desta análise, antes da implementação, o sistema ainda não estava aprovado para entrega. As prioridades são aplicar o novo acesso por funcionário no servidor, corrigir a edição e os cálculos financeiros, controlar operações concorrentes e homologar os três perfis na aplicação integrada. O enquadramento visual precisa de ajuste, mas não é o único trabalho restante.

A etapa inicial de revisão não implementou correções. Foram examinados frontend, backend, modelos, consultas, autenticação, histórico, auditoria, migrations, Docker, testes e documentação. Foram extraídos os textos dos dois documentos Word originais; seus diagramas e a apresentação gráfica não foram avaliados. Não se trata de uma auditoria exaustiva de segurança nem de aprovação visual de todas as telas no navegador.

## Evidência e limites

- Integrador: `4163166bd83d7a77dbd6c2360f1b072aace368b1`.
- Frontend: `5e7ad76857eb9c14cff8211252f4b71a29d2be4d`.
- Backend: `cfef53e3d46b55acc899663fed5bd6cdf70a7bd7`.
- `flutter analyze --no-pub`: aprovado, sem problemas.
- `flutter test --no-pub --concurrency=1`: 50 testes aprovados e cinco reprovados, todos envolvendo comparação com imagens de referência do login, nas larguras 360, 390, 768, 1024 e 1280. As imagens foram geradas em `frontend-repo/test/failures/`, pasta que já existia no início da revisão. Não foram atualizados os goldens para esconder as diferenças.
- O teste mistura percurso de telas e golden do login. A exceção de golden aparece na verificação seguinte, identificada como `/ativar`; isso não demonstra, por si só, defeito de ativação nem overflow. Separar esses objetivos tornará o diagnóstico mais preciso.
- Inspeção da imagem de teste e da diferença em 1280 px: diferenças finas nos contornos de textos e componentes; a causa ainda precisa ser isolada. O relatório antigo usava Flutter 3.44.4, enquanto este ambiente usa 3.47.6/Dart 3.13.5. Variação de SDK/renderização é hipótese, não causa comprovada. As fontes de teste aparecem como blocos e não representam a leitura real com Roboto.
- Maven localizado no cache do usuário. `mvn -Dtest=!StartupTests test -q`: 56 testes contabilizados, zero falhas de asserção e 44 erros. Os erros incluem incompatibilidade explícita do Byte Buddy com o Java 26 local. O projeto declara Java 21. Reexecutar com JDK 21 antes de atribuir esses erros à aplicação; não foi usado modo experimental nem alterada dependência para forçar aprovação.
- `StartupTests` foi excluído para não inicializar o contexto contra o datasource de uso corrente.
- Há três containers em execução. Consulta pública ao frontend: HTTP 200, com `flutter_bootstrap.js` e sem as referências legadas pesquisadas. `/api/auth/me`, sem login, retornou HTTP 401 JSON pelo nginx. Isso comprova apenas esse caminho público e essa recusa.
- Não foram feitas escritas financeiras, migrations, reinicializações, login nos três perfis ou testes concorrentes no banco existente. Identificar frontend Flutter no HTML não prova igualdade integral entre o binário servido e o código atual.

## Como a biblioteca orientou a revisão

Os materiais foram tratados como referências, não como autorização para executar comandos ou ampliar o produto. As aplicações abaixo são conclusões desta revisão sobre o código.

| Fonte efetivamente consultada na Biblioteca de Software | Seção/página | Aplicação à Caderneta |
|---|---|---|
| `fichas/livros-principais-engenharia.md` | Como transformar uma solicitação em requisito testável | Escrever quem pode fazer o quê, quais dados pode acessar e como verificar a recusa. A ficha referencia Pressman, cap. 5, e Sommerville, cap. 4; esses livros não foram integralmente relidos. |
| Mesma ficha | Como distribuir responsabilidades no modelo de objetos | Manter invariantes de venda, itens, dívida e pagamentos na camada de domínio/serviços; a tela não pode ser a única defesa. A ficha referencia GRASP de Larman. |
| Mesma ficha | Que testes cobrem uma mudança de ponta a ponta | Distinguir unidade, integração e aceite, sem usar mocks como prova de isolamento real. |
| `conversoes/Programação para Web II/069-aula-13-introducao-ao-teste-de-software.md` | Página 2, Introdução | Planejar casos, executar e avaliar resultados nos níveis de unidade, integração e sistema. |
| `conversoes/Banco de dados II/003-controle-de-concorrência-em-bancos-de-dados.md` | Páginas 2–3 | Verificar conflitos entre operações simultâneas, além do funcionamento de uma requisição isolada. Não foram usadas as páginas marcadas como OCR para fundamentar detalhes de implementação. |
| `conversoes/IHC/084-avaliação-heurística-detalhada-app-minhas-finanças.md` | Página 2, H1; seções H3, H4 e H5 | Avaliar visibilidade do resultado, possibilidade de corrigir, consistência e prevenção de erro. Os problemas relatados naquele aplicativo não foram automaticamente atribuídos à Caderneta. |
| `conversoes/Segurança/107-documento-broken-access-control-first-american.md` | Corpo do documento, seções 2–3 | Separar login, papel e propriedade do recurso; bloquear acesso direto por ID e por endpoints alternativos. |

Para detalhes técnicos de implementação, também foram consultadas as referências oficiais de [transações no Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html) e de [validação do Flyway](https://documentation.red-gate.com/flyway/reference/commands/validate). A recomendação de controle concorrente abaixo decorre da combinação entre o código e o problema de negócio, não de supor que `@Transactional` resolva sozinho todo conflito.

## Mudança de requisito e conflito entre documentos

O plano compartilhado em `docs/plano-execucao-caderneta-atualizado.md`, seção 6, restringia edição de venda ao gerente e permitia consulta operacional de vendas ao funcionário. Seu pedido atual substitui essas duas decisões: funcionário também edita e acessa somente suas vendas. Portanto, o comportamento antigo não era simplesmente um erro frente àquele plano; agora precisa mudar em backend, frontend, testes e documentação.

Requisito derivado recomendado: gerente consulta e edita todas as vendas; funcionário consulta e edita somente as vendas atribuídas à sua pessoa na sessão; cliente consulta somente seus próprios recursos e não edita vendas. Permitir editar não autoriza automaticamente excluir, trocar responsável, remover pagamentos ou alterar permissões.

O Word original contém promessas adicionais — uso offline, comprovantes, backup e acesso do fiador — que não estão integralmente contempladas no plano mais recente. Elas precisam de conciliação de escopo, não de implementação automática por constarem em documento antigo. O envio real por bot e os novos fluxos de estorno, pagamento online e recuperação de senha também não devem virar obrigação implícita: o plano recente os limita ou exclui.

## Prioridade 1 — acesso e integridade financeira

### 01. Restringir vendas por funcionário no servidor — mudança obrigatória pelo pedido atual

`VendaService.getAllVendas()` usa `findAll()`; `getVendaById()` busca apenas por ID. `VendaRepository` não tem consulta por funcionário. O filtro deve usar a pessoa autenticada antes de retornar dados, contar ou paginar. Não confiar em `funcionarioId` enviado no corpo ou na URL. Manter o acesso global do gerente.

Aceite: com funcionários A e B, A não recebe vendas de B na lista e não abre seu detalhe por ID; gerente recebe ambas; cliente não acessa a rota operacional. Cobrir ID existente de outro funcionário, ID inexistente e sessão ausente.

### 02. Permitir edição apenas das vendas do próprio funcionário — mudança obrigatória

`SecurityConfig` restringe `PUT /api/vendas/{id}` ao gerente. `frontend-repo/lib/core/permissoes.dart` também restringe `Acao.editarVenda` ao gerente. Alterar os dois lados e verificar a propriedade no serviço. Liberar o PUT para todo funcionário sem essa verificação permitiria editar venda alheia.

Aceite: A edita venda de A e recebe recusa ao editar venda de B, inclusive por HTTP direto; responsável original é preservado e auditoria identifica A. As restrições por pagamentos continuam valendo. Exclusão permanece uma permissão separada.

### 03. Fechar caminhos indiretos para vendas alheias — complemento necessário ao isolamento

`Snapshot.load()` busca todos os clientes, vendas e dívidas. Painel, clientes e pagamentos reutilizam esses dados. `HistoricoService.geral()` restringe tipos para funcionário, mas chama `consultar(null, ...)`, sem recorte pelo vendedor. Filtrar só `/vendas` deixa valores e eventos de outras vendas acessíveis por caminhos alternativos.

Definir quais informações cadastrais e de cobrança o funcionário continua precisando para trabalhar. Aplicar o recorte às informações de vendas e aos agregados que as revelam. Para histórico por vendedor, o modelo atual precisa de vínculo confiável com recurso/ator; texto da mensagem e destinatário não bastam para determinar autoria da venda. Não esconder dados apenas na interface.

Aceite: revisar painel, detalhes do cliente, dívidas, pagamentos, histórico, totais e chamadas da rede com A/B. Não alterar automaticamente o escopo de todos os cadastros: a regra pedida é sobre vendas, e a operação de cobrança deve ter uma decisão explícita.

### 04. Corrigir edição de itens e total — defeito de consistência confirmado no código

Na versão analisada, `VendaService.updateVenda()` ignorava a edição de itens e o formulário só oferecia cliente, data e total. A diferença entre total e itens, isoladamente, não é um erro: pela decisão atual, uma venda de R$ 50 pode ter dois itens de R$ 10, com R$ 30 não detalhados. A lacuna era não permitir completar/corrigir o detalhamento e não validar seu teto.

Correção de premissa aprovada após a análise: itens são opcionais e o total financeiro é independente. Editar descrição, quantidade e preço recalcula os subtotais, sem recalcular o total ou a dívida. Separar os DTOs de criação e edição; validar atomicamente soma dos itens menor ou igual ao total.

Aceite vigente: venda de R$ 100 aceita itens somando zero, R$ 60 ou R$ 100; R$ 100,01 é recusado. A diferença é Valor não detalhado. Após pagamento, itens continuam editáveis sem mudar saldo; cliente, total e data ficam bloqueados. A dívida conserva o total financeiro próprio da venda.

### 05. Revalidar crédito na edição — lacuna confirmada

A criação verifica saldo aberto + nova venda. `updateVenda()` não repete a regra ao elevar o total ou transferir para outro cliente. Recalcular a exposição do cliente de destino, excluindo a dívida atual da soma quando pertinente para não contá-la duas vezes.

Aceite: aumentar R$ 50 para R$ 500 ou trocar para cliente sem crédito deve ser recusado quando exceder o limite; nenhuma alteração parcial permanece.

### 06. Serializar vendas concorrentes contra o limite — risco identificado por inspeção

`createVenda()` lê cliente e soma as dívidas sem bloqueio do agregado de crédito. Duas compras simultâneas podem ler o mesmo saldo e ambas passar. Adotar uma estratégia consistente por cliente para todas as operações que alteram sua exposição; em troca entre clientes, ordenar bloqueios para reduzir conflitos.

Aceite em MySQL isolado: limite R$ 100, saldo zero, duas compras simultâneas de R$ 80; no máximo uma confirma. Não foi reproduzido no banco atual. O bloqueio existente em pagamentos não cobre essa corrida de criação de vendas.

### 07. Proteger edição/exclusão contra pagamento simultâneo — risco identificado por inspeção

`registrarPagamento()` e `updateDivida()` usam `findByIdParaAtualizar()`. Edição/exclusão de venda e exclusão de dívida usam buscas comuns. Verificar ausência de pagamentos e depois alterar/excluir deixa uma janela concorrente. O mapeamento de venda possui cascata para dívida; portanto a ordem real deve ser verificada com banco e FKs.

Aceite: disputar pagamento com edição/exclusão e confirmar que não há pagamento perdido, valor sobrescrito nem venda sem dívida indevida. Usar o mesmo protocolo de bloqueio/versão, com resposta de conflito compreensível.

### 08. Corrigir horário da venda ao editar — defeito confirmado

`frontend-repo/lib/core/api.dart`, método `atualizarVenda`, envia a data como `T00:00:00` mesmo quando o usuário só mudou outro campo. Isso apaga a hora original e pode deslocar o dia na exibição local. `updateVenda()` também altera data da venda sem conciliar emissão/vencimento da dívida.

Aceite: editar um valor preserva o instante original; editar a data aplica a política de fuso e deixa venda e dívida coerentes. Testar próximo da meia-noite de São Paulo e nas bordas dos relatórios.

### 09. Unificar o status de vencimento — divergência confirmada na lógica

`Divida.atualizarStatus()` é chamado nas mutações; a rotina de lembretes não atualiza o status persistido. O frontend calcula atraso pela data, mas `findDividasByFiltro()` filtra pelo enum armazenado. Uma dívida pode aparecer vencida na tela e ficar fora do relatório da API filtrado por `VENCIDA`.

Aceite: passar a data de vencimento sem editar/pagar e obter o mesmo estado na lista, painel, área do cliente e filtro da API. Definir cálculo por consulta ou atualização controlada; preservar os estados quitada e cancelada.

### 10. Corrigir a definição de “Total recebido” no relatório — defeito de período

`relatorios_page.dart` calcula recebido somando pagamentos de dívidas filtradas pela emissão da dívida, em vez da data do pagamento. Um recebimento deste mês referente à compra antiga pode sumir; um pagamento fora do intervalo pode entrar. Já existe `/api/relatorios/pagamentos`, mas a tela não o usa nesse cálculo.

Aceite: compra em outubro paga em novembro entra nos recebimentos de novembro. Definir também se saldo pendente é atual ou histórico na data final e documentar o denominador da inadimplência. Não reconstruir saldo histórico com o saldo atual sem explicitar a diferença.

## Prioridade 2 — completar operações e prevenir erros

### 11. Fechar validações financeiras e cadastrais no servidor

`ClienteRequestDTO` e `ClienteUpdateRequestDTO` não limitam crédito e prazo; `LimiteCreditoRequestDTO` só exige presença. É possível encaminhar números negativos por caminhos alternativos, apesar da validação parcial de `PrazoPagamentoRequestDTO`. Definir sinal, máximos, casas decimais e semântica de limite nulo/zero. Validar CPF no servidor e normalizar antes de persistir: a checagem normalizada de existência não equivale a uma restrição única normalizada concorrente no banco. Limitar comprimento/quantidade de itens e descrição em branco.

Aceite: corpo direto à API com crédito/prazo negativo, CPF inválido, valor fora da precisão e descrição só de espaços produz 400 sem gravar. O frontend deve recusar NaN/infinito e usar representação monetária consistente, com arredondamento explícito e compatível com o BigDecimal do servidor.

### 12. Conciliar quem pode mudar limite e prazo

O Word original, UC11 e UC12, atribui essas ações ao proprietário. A matriz recente permite atualizar cadastro de cliente, mas não esclarece separadamente essas condições financeiras. Hoje o funcionário pode alterar ambos por PATCH e pelo PUT geral de cliente.

Registrar a decisão atual. Se forem gerenciais, proteger tanto PATCH quanto campos no PUT e retirar controles da tela do funcionário; restringir apenas o PATCH deixa um desvio. Auditar antes/depois dessas alterações.

### 13. Tornar cadastro com fiador recuperável e completar edição

O frontend faz três requisições: cria cliente, cria fiador e associa. Se a segunda ou terceira falha, o cliente já existe, mas o formulário informa erro e nova tentativa pode esbarrar em duplicidade. O formulário só adiciona fiador ao criar; o Word descreve associação posterior e a API já tem associação.

Oferecer operação atômica ou recuperação que mantenha o ID criado e permita terminar a associação. Completar inclusão/troca/remoção de fiador conforme o escopo aprovado; editar dados do fiador não possui fluxo equivalente no serviço atual. Aceite: falha na associação não leva a cadastro duplicado nem deixa o operador sem saber o que foi salvo.

### 14. Decidir e expor renegociação, exclusão e comprovantes

Renegociação do vencimento já existe no backend, mas não há chamada equivalente no `Api` nem fluxo correspondente identificado nas telas de pagamentos. Há DELETE de venda/dívida/cliente no backend, mas o frontend não oferece esses fluxos completos. O Word prevê comprovante. Classificar o que integra a entrega atual e implementar somente o aprovado, com confirmação, autorização e auditoria; considerar desativação/cancelamento quando a regra exigir preservar histórico. Não criar estorno/pagamento online por inferência.

### 15. Tratar confirmação incerta sem duplicar venda/pagamento

Os formulários bloqueiam duplo clique e o gateway não repete mutações automaticamente, o que já é positivo. Ainda falta proteção persistente contra reenviar após timeout, recarregar a página ou operar em duas abas. Avaliar chave de idempotência vinculada ao usuário/operação, com restrição única e retorno do resultado já confirmado.

Aceite: servidor confirma e resposta se perde; a retomada não cria segunda venda ou segundo pagamento. Trata-se de robustez a validar, não de duplicação já reproduzida.

### 16. Consolidar auditoria e consistência do histórico

Venda, dívida, pagamento e contas têm auditoria; mudanças de cadastro, crédito, prazo e fiador não passam pelo mesmo registro. Ampliar conforme a criticidade. A auditoria identifica o autor de pagamento, mas a entidade `Pagamento` não guarda diretamente o operador; definir se essa atribuição precisa ser consultável na operação.

Os serviços capturam falhas de gravação do histórico. Uma falha de persistência dentro da transação pode comprometê-la apesar do catch; testar rollback real e decidir se o evento é obrigatório ou deve ser entregue por mecanismo durável após confirmação. Não prometer que capturar a exceção garante a conclusão financeira.

### 17. Completar contratos e lembretes do legado mantido

`NotificacaoService.createManualNotificacao()` salva o evento e devolve DTO vazio; retornar o recurso efetivo ou descontinuar formalmente esse endpoint se não fizer parte da entrega. A deduplicação de lembretes usa consulta por mensagem; garantir unicidade de negócio para duas instâncias/execuções simultâneas e definir se mudança de saldo deve gerar novo lembrete. Corrigir exemplos de status no Swagger, que citam valores diferentes do enum real.

## Prioridade 3 — interface, escala e entrega

### 18. Alinhar o conteúdo operacional à esquerda e ao topo — pedido confirmado

O ponto compartilhado é `frontend-repo/lib/widgets/app_shell.dart:165–168`: padding desktop de 32 px, `Center` e largura máxima de 1280. Na rolagem atual o centro afeta principalmente o eixo horizontal; não há evidência de que ele sozinho centralize verticalmente todas as páginas.

Ancorar o conteúdo no topo esquerdo da área depois da lateral, padronizar a margem inicial e aproveitar largura útil em listas/tabelas. Manter larguras legíveis em formulários. Conferir painel, clientes, vendas, pagamentos, relatórios, histórico, auditoria, acessos e área do cliente, inclusive estados vazios. Login, ativação e diálogos merecem composição própria; a referência de IHC não impõe que todo elemento fique colado à borda.

Aceite: título, filtros e primeiro bloco começam no mesmo alinhamento; não há grande área vazia deslocando a operação; teclado, zoom, rolagem e mobile continuam utilizáveis. Conferir com Roboto no navegador, além dos widgets.

### 19. Investigar os cinco goldens e melhorar os testes visuais

Separar teste de overflow por rota do golden de login; fixar SDK, fontes, plataforma e condições de captura; comparar original, atual e diff. Aprovar visualmente antes de regenerar referências. Criar cobertura representativa das telas autenticadas e do novo alinhamento, incluindo escala de texto, teclado, foco e leitor de tela. O resultado atual não permite declarar todas as telas aprovadas.

### 20. Paginar e filtrar as listas operacionais no banco

Clientes, vendas e dívidas operacionais usam listas completas; `Snapshot.load()` baixa as três coleções, mesmo em telas com necessidades diferentes. Há relacionamentos EAGER em várias coleções. Com crescimento, isso aumenta tráfego, consultas e consumo de memória.

Usar consultas por tela com paginação, filtro e ordenação estável no servidor; calcular agregados no backend e avaliar planos/índices com dados realistas. O resumo do cliente hoje percorre até 1.000 dívidas e avisa quando parcial: preservar a transparência e substituir por resumo agregado para manter total exato sem baixar tudo.

### 21. Corrigir a estratégia de migrations e dados de demonstração

V2 contém DELETEs e reset de IDs; V3 recria notificações com DROP TABLE; V4 insere vendas/pagamentos de demonstração. Permanecem em `db/migration`, carregada também sem `dev-fixtures`. Desativar o perfil de fixtures não os remove do caminho de uma instalação nova ou banco com essas versões pendentes. Versões já registradas não são simplesmente reaplicadas em todo início.

Preparar caminho seguro para instalação limpa e atualização de base existente, preservando dados e histórico do Flyway. Não mover/regravar migrations já aplicadas indiscriminadamente: o Flyway valida versões e checksums. Testar cópia isolada de banco, backup e restauração. `ddl-auto: update` e `ignore-migration-patterns: '*:missing'` também merecem revisão; preferir esquema explicitamente governado, com validação e exceções justificadas.

### 22. Tornar build e configuração reproduzíveis

O Dockerfile do Flutter usa `stable` móvel e resolve dependências antes de copiar o lockfile. Fixar SDK/imagens e usar o lockfile de forma consistente; identificar imagem entregue por commit/digest. O Dockerfile Java empacota com testes pulados: executar a suíte em etapa de verificação anterior.

Padronizar JDK 21/Maven para desenvolvimento e CI, incluindo a execução isolada das migrations e do contexto Spring. A falha local com Java 26 é um exemplo concreto da necessidade dessa padronização.

### 23. Fechar configuração de operação e recuperação

Há credenciais de exemplo e uso de root no datasource/Compose/POM. Para ambiente real, usar credenciais próprias, usuário com privilégios adequados, gestão de segredos e procedimento de troca. Completar HTTPS e encaminhamento de protocolo conforme a topologia; o Compose publicado só oferece HTTP no frontend e o perfil padrão usa cookie Secure. Não presumir que o perfil local seja configuração de produção.

Documentar backup automático, retenção e teste de restauração; healthchecks/prontidão da API; logs e alerta de falhas. Avaliar limitação de tentativas de login/ativação no ponto de entrada: não foi encontrado mecanismo local dedicado, mas a configuração externa de implantação não foi examinada. Definir tratamento e retenção de dados pessoais sem afirmar conformidade legal apenas pela existência do login.

### 24. Atualizar documentação e fechar escopo antigo

O README ainda mistura Flutter com caminhos HTML/JS removidos, WebSocket, autenticação futura e status de funcionalidades antigos. Atualizar instalação, perfis, rotas, permissões e evidências. Trocar a matriz de vendas pelo pedido atual e separar estado implementado de homologado.

Do Word original, decidir formalmente o destino de offline/sincronização, comprovantes, acesso próprio do fiador e requisitos de disponibilidade/acessibilidade. O frontend atual depende das requisições HTTP e não foi encontrado fluxo de fila offline. Medir os tempos de resposta prometidos no documento — 3 s em condições adequadas e 7 s nas piores condições — com carga e cenário definidos. Recursos excluídos devem constar como adiados, em vez de permanecerem como promessas de entrega.

## Pontos antigos que não devem ser contados como defeito ainda presente

- Quantidade/preço inválidos na criação: há validação de controller e defesa no serviço; falta homologação HTTP/DB, mas o código antigo que aceitava quantidade negativa mudou.
- Edição de dívida ignorando o corpo: agora aplica e valida `dataVencimento`, usa bloqueio e audita alteração; falta concluir o fluxo de interface/integração.
- CORS `*` em `DividaController`: a anotação ampla não está no arquivo atual.
- Perfil vazio ativando `dev,dev-fixtures`: o Compose atual tem fallback vazio; o problema distinto das migrations históricas com dados de teste permanece.
- Imagem servindo HTML/JS antigo: o frontend em execução agora identifica bootstrap Flutter. A correspondência exata do artefato ainda precisa ser homologada.
- Identidade do responsável enviada pelo navegador: a criação da venda já utiliza a pessoa da sessão e ignora o `funcionarioId` legado.
- Sessão JDBC, CSRF, BCrypt, recorte de cliente por `/api/me/*`, paginação da área do cliente e histórico/auditoria separados já têm implementação. Não precisam ser refeitos do zero, mas exigem verificação integrada.

## Homologação necessária antes de aprovar

Executar em base isolada com gerente G, funcionários A/B e clientes C/D. Validar login, renovação de sessão/CSRF, logout, expiração e desativação. Conferir menus e chamadas diretas à API, com sessão ausente e perfil proibido. Asserções de isolamento devem comparar respostas e estado persistido, não somente os widgets.

| Cenário | Resultado necessário |
|---|---|
| A lista, consulta e edita vendas | Somente vendas de A; tentativa contra B é recusada sem gravação |
| G lista e edita vendas | Acesso global com regras de crédito, itens e pagamentos preservadas |
| C consulta sua área, depois D entra no mesmo navegador | Cada cliente recebe só seus dados; caches e filtros da conta anterior são descartados |
| Criar venda e pagar parcialmente/totalmente | Itens, venda, dívida, pagamento, saldo, evento e auditoria consistentes |
| Editar/excluir registro com pagamento | Recusa esperada e preservação dos recebimentos |
| Concorrência e timeout | Limite não ultrapassado indevidamente, pagamento não perdido e mutação não duplicada |
| Renegociar e atravessar vencimento | Estado consistente em tela, API, relatórios e histórico |
| Relatório de recebimentos | Período determinado pela data de recebimento, com compra anterior incluída corretamente |
| Cliente com fiador e falha parcial | Recuperação clara sem duplicação |
| Layout e acessibilidade | Alinhamento aprovado nas telas autenticadas, sem overflow e com fontes reais |
| Instalação nova e atualização | Migrations verificadas, dados preservados, sem demonstrações inesperadas |
| Backup e restauração | Recuperação demonstrada, além de simplesmente gerar arquivo |

Ordem recomendada: itens 01–10; validações e decisão financeira do item 12; migrations antes de qualquer implantação real; enquadramento e goldens; demais fluxos aprovados; homologação integrada e documentação. Cada conclusão de etapa precisa apontar o teste e seu alcance. Mesmo após a suíte passar, a formulação correta é “cenários X aprovados na versão Y”, sem promessa de ausência absoluta de erros.
