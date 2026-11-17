# Refatoração geral de responsabilidades e dependências

Iniciada em 16/11/2026; conferência final em 17/11/2026. Estado: implementação e validação locais, sem push ou implantação.

## Ponto de recuperação anterior à refatoração

A pedido de Artur, a entrega funcional foi registrada primeiro na `main`, com descrições de comportamento, testes e pendências:

| Repositório | Commit local |
|---|---|
| Backend | `c4d6412` — regras de clientes, catálogo e confirmação de e-mail |
| Frontend | `aabf3ec` — catálogo, confirmação e melhorias do caixa |
| Integrador | `b61aa69` — ponteiros, requisitos e preparação da V13 |

As mudanças de refatoração descritas neste documento são posteriores a esses commits e, por nova solicitação de Artur, foram registradas localmente: backend `1fe7c33` e frontend `caf39f8`. O commit do integrador atualiza os dois ponteiros e inclui este relatório. As descrições registram escopo, decisões e testes. Não houve push, mudança de banco ou configuração de produção. As branches auxiliares vazias, criadas antes da orientação de manter a `main`, foram removidas; os três repositórios continuam na `main`.

## Critério da revisão

O pedido foi revisar o sistema inteiro sob SOLID, preservando requisitos e evitando novas abstrações sem necessidade. A revisão considerou autenticação, contas, clientes/fiadores, vendas/dívidas, histórico/lembretes, relatórios, catálogo/configuração, confirmação de e-mail, interface compartilhada e composição das dependências. A mudança de arquitetura não substitui a preparação operacional já documentada para a V13.

As fichas da Biblioteca de Software foram a referência de princípios: `fichas/solid/README.md`, `srp.md`, `dip.md`, `isp.md`, `lsp.md` e `ocp.md`. A consulta foi dirigida às seções pertinentes, sem declarar leitura integral dos originais. As fichas distinguem a recomendação dos autores de exemplos da curadoria. As extrações e os nomes de módulos abaixo são decisões desta implementação, não exemplos atribuídos às fontes.

## Problemas concretos e resultado

| Problema anterior | Organização resultante | Motivo |
|---|---|---|
| `Api.instance`, `HistoricoService.instance` e `CacheTelas.instance` podiam ser substituídos pela última instância criada do aplicativo. | Dependências pertencem ao `AppRuntime`/`AppScope`; widgets assíncronos religam seus listeners ao escopo correto; controladores paginados recebem seu cache. | Impedir que uma instância atualize ou consulte o estado de outra e tornar o ciclo de vida explícito. |
| Uma única `Api` reunia clientes, vendas, pagamentos, relatórios e composição de dados de tela. Algumas páginas enviavam HTTP diretamente. | Contratos e adaptadores por domínio: `ClientesRepository`, `VendasRepository`, `DividasRepository`, `RelatoriosRepository`, `OperacoesRepository`, `LojaRepository` e `ConfirmacaoEmailRepository`. `Snapshot` tornou-se um modelo de leitura sem transporte. A antiga `api.dart` foi removida. | A tela usa operações de negócio; URL, método, serialização e paginação ficam nos adaptadores. O gateway continua responsável por CSRF, idempotência, timeout e sessão. |
| Listas/navegação dividiam arquivos com formulários extensos, controladores e rascunhos. | `pages/forms/` contém formulários de clientes, vendas, pagamentos e equipe/restauração. As páginas conservam listas, navegação e detalhes. | Alterar validação ou edição deixa de disputar o mesmo módulo com filtros e composição da página. |
| `common.dart` acumulava feedback, carga assíncrona, cache, layout, formulários, tabelas e consultas de resumo. | `common.dart` é somente um ponto de exportação. Implementações ficam em `feedback.dart`, `async_view.dart`, `layout.dart`, `formularios.dart`, `tabelas.dart` e `resumo_operacional.dart`, sem importar o próprio agregador internamente. | Facilitar localização e manter responsabilidades independentes sem mudar os imports de todos os consumidores. |
| Modelos de dados conheciam cores e ícones Flutter. Pagamentos importavam regras da página de vendas; outros cadastros importavam validação da página de ativação. | `apresentacao_status.dart` concentra extensões visuais; `core/periodos.dart` concentra períodos; `validarLogin` fica em `validacoes.dart`. | Direção de dependência: apresentação conhece os modelos, e regras compartilhadas não dependem de uma página específica. |
| Dependências do backend eram divididas entre construtores e campos `@Autowired`, ocultando colaboradores obrigatórios. | As injeções em campos foram substituídas por parâmetros de construtor e campos finais, inclusive em autenticação, loja, clientes, dívidas, fiadores, relatórios e controladores afetados. | Construção válida e dependências visíveis; testes não precisam preencher esses campos por reflexão. Injeção por construtor, isoladamente, não é prova de DIP. |
| `ClienteService` também implementava especificação de busca, SQL de saldos e manutenção do fiador aninhado; `FiadorService` chamava uma regra estática daquele serviço. | `ConsultaClientes` trata paginação/busca/agregação; `FiadorDoCliente` trata o cadastro aninhado na transação do cliente; `RegrasFiador` concentra a regra de CPF distinto. | Separar leitura e escrita e remover dependência de um serviço de gerenciamento para reutilizar uma regra. Bloqueios de clientes relacionados e auditoria permanecem no mesmo fluxo transacional. |
| `ContaService` reunia gestão da equipe, convites/ativação de clientes e acesso ao armazenamento de sessões. | `ConvitesClienteService` atende convite e ativação; `ContaService` mantém gestão das contas; `EncerramentoSessoes`/`EncerramentoSessoesJdbc` isolam a invalidação após commit. | Alterar o convite ou a infraestrutura de sessão não exige reabrir todas as decisões de promoção, exclusão e restauração da equipe. |
| Confirmação de e-mail dependia diretamente de SQL para controlar estado e tokens. | `ConfirmacaoEmailService` depende de `ConfirmacoesEmail`; `ConfirmacoesEmailJdbc` implementa consultas, bloqueio e persistência. `EnviarEmail`/SMTP continuam separados. | Política de validade, uso único e reenvio pode ser exercitada sem banco; o adaptador real continua sendo verificado em MySQL/TiDB. |
| Configuração de crédito era validada e persistida dentro do controller. | `LojaConfiguracaoController` traduz HTTP; `LojaConfiguracaoService` autoriza, valida, persiste e audita; `ConfiguracaoLoja` é o contrato. | Regras não dependem do controller e o formato JSON permanece igual. |
| `NotificacaoService` misturava CRUD de eventos com agendamento, varredura de dívidas e SQL de inserção idempotente. | `LembretesVencimento` executa a rotina; o agendamento e `TarefaUnica` usam esse serviço; `NotificacaoService` mantém registro/consulta/leitura de eventos. | Evitar que uma alteração do job afete o contrato de notificações ordinárias. A propriedade que desliga agendamento interno continua válida. |
| `VendaService` incorporava detalhes de validação e montagem de itens. | `ItensVenda` contém validação e aplicação do detalhamento, sem consulta de banco ou sessão. | Exercitar limites, soma, precisão, normalização e vínculo com a venda independentemente da infraestrutura financeira. |

## Como os princípios foram usados

- **SRP:** separar razões independentes para mudança, não apenas dividir arquivos grandes. Isso fundamenta as extrações de consulta, formulário, apresentação, job e configuração.
- **DIP:** política de confirmação e de gestão de contas depende dos contratos de persistência/encerramento de sessões; adaptadores conhecem JDBC/Spring Session. No frontend, páginas usam contratos de repositório montados no runtime. Repositórios Spring Data já especializados não receberam wrappers genéricos adicionais.
- **ISP:** consumidores recebem contratos por domínio/papel; consulta e manutenção do catálogo continuam separadas. Não foi imposta uma interface por método.
- **OCP:** os pontos de variação reais são transporte, persistência e montagem de dependências. Não foram criadas hierarquias especulativas de pagamentos, perfis ou relatórios. Enums pequenos com casos conhecidos foram mantidos.
- **LSP:** contratos preservam formato de dados, erros esperados e efeitos; composição foi preferida a novas heranças. Testes de regressão sustentam exemplos de comportamento; não constituem prova formal de substituição em todas as entradas.

Referências indicadas pelas fichas: Martin, [SRP — explicação de 2014](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html); Fowler, [Dependency Injection](https://martinfowler.com/articles/injection.html), especialmente separação entre configuração e uso; Martin, [Interface Segregation](https://objectmentor.com/resources/articles/isp.pdf), introdução e Interface Pollution; Liskov/Wing, [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), seções 2 e 5; Fowler, [YAGNI](https://martinfowler.com/bliki/Yagni.html). A atribuição aqui acompanha as fichas consultadas, sem apresentar esta tarefa como nova revisão integral dessas obras.

## Cobertura da revisão e decisões de preservação

- Autenticação, contas e loja: composição explícita; convites e sessão separados. CSRF, cookies, autorização por perfil, limitação de tentativas e isolamento por loja mantidos.
- Clientes e fiadores: leitura e cadastro aninhado separados; permissões financeiras, inativação e auditoria preservadas.
- Vendas e dívidas: detalhamento extraído; transações dos casos de uso, ordenação dos bloqueios, crédito, versão e idempotência mantidos. Separar cada escrita em uma transação nova quebraria atomicidade, por isso não foi feito.
- Histórico e lembretes: rotina periódica separada; job e cron apontam para o mesmo caso de uso. Não foi criado outro agendador.
- Relatórios: dependências explícitas; preparação pura `DadosRelatorio` e contratos de relatório preservados. Não há nova paginação ou mudança de totais/CSV nesta refatoração.
- Catálogo, comprovantes e auditoria: serviços/repositórios e apresentação já separados foram preservados, usando o escopo de dependências da interface. Não houve nova biblioteca para substituir essas responsabilidades.
- Segurança, entidades, validações, migrations e infraestrutura: módulos especializados foram revisados conforme suas fronteiras; não foram convertidos em classes/interfaces artificiais. Nenhuma migration foi acrescentada ou modificada nesta etapa.

Revisar todo o sistema não significa reescrever cada classe. A evidência é a redução de dependências ocultas, responsabilidades separadas e comportamento verificado; não há uma certificação binária de “100% SOLID”.

## Validação

| Verificação após a refatoração | Resultado |
|---|---|
| Testes unitários Java | 92 aprovados, incluindo novos casos de itens, confirmação independente de JDBC e invalidação de sessões após commit/rollback. |
| `mvn verify`, MySQL 8.4 | 20 integrações aprovadas, além dos 92 unitários. Contexto Spring, migrations, isolamento, autenticação, crédito, vendas, pagamentos, concorrência e novos fluxos exercitados pela suíte existente. |
| TiDB 8.5.7, `TiDBDialect` | 19 integrações executadas/aprovadas, uma ignorada por cenário legado específico de MySQL; zero falhas/erros. Sem `skipTests`. |
| Flutter 3.47.9 em Linux | 140 testes aprovados, incluindo cinco referências visuais existentes e dois novos testes de isolamento/troca de runtime. Referências não foram regeneradas. |
| Análise Flutter | Sem problemas. |
| Release web | Compilado com API real (`MOCK_API=false`) e recursos locais. |
| Revisão de alterações | `git diff --check` aprovado nos três repositórios. Refatoração registrada em commits locais posteriores ao checkpoint funcional; sem push. |

Logs locais em `output/solid-2026-11-16` (ignorados pelo Git). Testes de interface utilizam transporte simulado; integração Java utiliza bancos reais descartáveis. O reteste manual de navegador descrito no relatório funcional ocorreu antes desta refatoração e não deve ser apresentado como uma nova rodada manual. Não foram testados aparelho físico, SMTP externo ou implantação em produção.

## Situação operacional preservada

Publicação continua dependendo de SMTP real, regularização dos e-mails das lojas, conferência da versão de migration em produção e backup verificado, conforme [guia da V13](email-e-publicacao-v13.md). Esta etapa não resolve essas dependências externas nem remove a proteção do pipeline. Não houve push.
