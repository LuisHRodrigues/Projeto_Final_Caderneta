# Execução e validação do plano consolidado

Revisão 1.2 — 16/11/2026, com verificações finais em 17/11 UTC (16/11 em Brasília). Implementação validada no integrador, backend e frontend. Por decisão posterior do usuário, a entrega foi registrada somente em commits locais na `main`, sem push. Backend: `c4d6412`; frontend: `aabf3ec`. Migração e implantação em produção permanecem pendentes. Este registro precede a refatoração geral de SOLID solicitada em seguida.

Base: integrador `a1ffa3b`, backend `7df1b22`, frontend `e45626f`. O [plano consolidado](planejamento-consolidado-2026-11-16.md) reúne a conversa, a Biblioteca de Software e as decisões do usuário. Os requisitos implementados estão na [especificação](especificacao-requisitos-software.md); contratos, em [permissões e API](contratos-e-permissoes.md).

Etapa posterior: [refatoração geral com SOLID](refatoracao-solid-2026-11-16.md). As contagens e os caminhos de código neste relatório representam o checkpoint funcional anterior à refatoração; o novo relatório registra a organização e os testes posteriores.

## Comportamento implementado

| Área | Resultado |
|---|---|
| Cliente inativo | Desativação preserva registros; API bloqueia alterações no cadastro, fiador associado e operações financeiras vinculadas, inclusive itens de vendas e recebimentos. Bloqueio transacional da linha do cliente coordena a operação com a desativação. Gerente e funcionário reativam sem alterar condições anteriores; apenas gerente desativa. |
| Limite padrão | Configuração por loja, mantida pelo gerente; novos clientes recebem o padrão no servidor. Clientes antigos não mudam. Funcionário não pode sobrescrever condição financeira. |
| Itens frequentes | Catálogo da loja com descrição, preço sugerido opcional e estado; gerente mantém, equipe consulta ativos. Sugestões copiam valores para a venda, preservando texto livre, venda sem itens e histórico. Não há estoque. “Usar soma dos itens” exige ação explícita. |
| E-mail | Cadastro exige contato válido; API bloqueia operação até confirmar. Hash de token, validade de 24 horas, uso único e intervalo de um minuto para reenvio. Troca de endereço exige nova confirmação. SMTP configurado por ambiente, com timeouts e falha recuperável. Link usa fragmento; frontend preserva o fragmento e navega após atualizar a sessão. |
| Busca e caixa | CPF/telefone normalizados, partes do nome, debounce e remoção do filtro local que descartava CPF. Sugestões no próprio campo, seleção por teclado e cancelamento de resultados obsoletos. Consulta com o mesmo texto reaproveita a busca para mudanças apenas de cursor. |
| Entrada e orientação | Campos de senha compartilhados, visibilidade independente, confirmação durante interação, bloqueio de senhas comuns e validação de telefone no servidor. Login atual e Unicode preservados. Cargo comercial e matrícula têm ajuda explícita. |
| Consulta e histórico | Vendedor identificado, auditoria por campos antes/depois com JSON sanitizado opcional, rascunhos de cliente/venda somente em memória por sessão e limpeza no logout. Perfil, fechamento de diálogos e total receberam ajustes de legibilidade. |
| Comprovante | Impressão por script externo, compatível com a CSP sem handlers inline. Autorizações pessoais e por loja preservadas. Corrigido também o status do detalhe da venda quando a página traz o status resumido, sem carregar todas as dívidas. |
| Consultas e relatórios | Saldos/atrasos de clientes agregados em uma consulta por página; vendedor carregado com a venda. Relatórios preparam mapas e totais uma vez, mantendo resultados e CSV. Não foi alegado ganho numérico de latência sem benchmark representativo. |

Migration nova: `V13__clientes_catalogo_e_confirmacao.sql`. Não foram reescritas migrations aplicadas. Campos novos usam expansão compatível de esquema; contatos antigos não são inventados nem confirmados. A mudança de comportamento de bloqueio exige preparar SMTP e regularização antes da publicação.

## SOLID aplicado a problemas reais

As recomendações e limites das fontes estão identificados na seção 5 do plano. As extrações abaixo são decisões de implementação desta tarefa, não código atribuído aos autores da biblioteca.

| Mudança | Problema resolvido e limite |
|---|---|
| `EnviarEmail` e `EmailSmtp` | Confirmação decide token/estado; adaptador decide transporte. Permite testar domínio sem e-mail externo e testar SMTP separadamente. Uma interface para um ponto externo real; única dependência nova: suporte de e-mail do Spring. |
| Consulta e manutenção do catálogo | Formulário de venda depende de consulta, tela gerencial de manutenção; interfaces não obrigam o consumidor a conhecer operações que não usa. Implementações HTTP são injetadas pelo runtime. |
| `DadosRelatorio` | Preparação de dados e busca por ID independem dos widgets; totais e status são verificáveis sem montar a tela. |
| `ComprovanteHtml`, `CampoSenha`, `BuscaSugestoes` e `DetalhesAuditoria` | Apresentação reutilizável deixa de disputar responsabilidade com autorização e persistência. Componentes têm consumidores concretos; não foi criada uma camada genérica de repositórios ou uma reescrita global. |
| Estado ativo e regras de entrada | Regra compartilhada no domínio/validador evita versões divergentes entre endpoints. Permissões continuam no servidor, mesmo se a interface for contornada. |

Não há alegação de prova formal de LSP nem de que toda classe do projeto foi reformulada. A orientação foi aplicar os princípios nos caminhos alterados, preservando contratos e verificando regressões.

## Evidências de validação

Ambiente isolado: Java 21.0.13, Maven 3.9.16, Flutter 3.47.9/Dart 3.13.7, MySQL 8.4 e TiDB 8.5.7 em Docker. Navegador Edge com API real e banco descartável; SMTP de captura em loopback, sem destinatários externos.

| Verificação | Resultado e alcance |
|---|---|
| Backend unitário | 85 testes aprovados. Inclui regras de cadastro e envio efetivo pelo adaptador a um SMTP local. |
| `mvn verify` — MySQL | 20 testes de integração aprovados, além dos unitários: 15 de API e 5 de migration. Inclui confirmação, expiração/uso único, catálogo, padrão de crédito, inativação e permissões de reativação. Suíte existente cobre isolamento, idempotência e concorrência dos fluxos financeiros. |
| Integração — TiDB 8.5.7 | 20 casos relatados: 19 executados/aprovados, um ignorado por ser de migration legada específica de MySQL; zero falhas/erros. Usado `TiDBDialect`. Não usado `skipTests` nessa verificação. |
| Flutter | Análise estática sem problemas e 138 testes aprovados em Linux, incluindo cinco referências visuais. Referências não foram regeneradas. No Windows, diferenças de rasterização de fontes impedem usar os mesmos pixels como evidência de regressão; por isso a conferência visual automatizada usa Linux compatível com o CI. |
| Build web | Release compilado com `MOCK_API=false` e recursos web locais. |
| Navegador real | Cadastro de loja pendente; login bloqueado; recebimento SMTP local; confirmação; troca de contato e nova confirmação; liberação e navegação; configuração de limite; criação de cliente herdando R$ 250; cadastro de item; cliente selecionado pelo teclado; item sugerido a R$ 25, quantidade 2, soma explícita e venda de R$ 50 com vendedor correto; comprovante com itens/valores. |
| Impressão | Botão de comprovante acionou `window.print` interceptado no teste do navegador; zero erros de CSP nesse fluxo. Isso não valida impressora física ou diálogo de PDF do sistema. |
| Revisão final | `git diff --check` aprovado nos três repositórios e `docker compose config --quiet` aprovado. Conferido detalhe da venda em viewport de 390 px, incluindo status pendente corrigido. |

Logs locais ficam em `output/plano-2026-11-16`, fora do Git; capturas do navegador em `output/playwright`. O material de teste usa dados fictícios. Credenciais reais fornecidas na conversa não foram usadas nem copiadas para arquivos versionados. A captura SMTP contém token de teste e permanece fora do Git.

## Rastreabilidade e limites

- A03–A12, A16–A20, A23, A25, A27–A28: alterações de implementação descritas acima; testes não equivalem a reteste físico de cada combinação de dispositivo.
- A01–A02, A14–A15, A32–A33: regras existentes preservadas e suíte de regressão executada. Não atribuir novamente como funcionalidade criada nesta tarefa. O relato antigo de promoção/teclado não comprova uma causa específica; a suíte não substitui reprodução do cenário original.
- A13: ajuste de impressão e validação de comprovante da equipe no navegador; autorização pessoal é coberta pela integração existente, sem repetir todo o fluxo do cliente final manualmente.
- A21–A22: orientação e legibilidade ajustadas; testes incluem larguras e texto ampliado. Navegação móvel foi conferida por viewport; teclado e impressão em aparelho físico não foram validados. A automação das sugestões com a árvore de acessibilidade habilitada apresentou perda de foco; seleção normal por mouse/teclado foi conferida em outra aba. Isso não permite afirmar validação com leitor de tela real.
- A24/A26: novos índices e mudança de carga completa dos relatórios permanecem condicionados à medição, como no plano; não foram acrescentados por suposição.
- A29: criada especificação Markdown com revisão e requisitos identificados. O PDF original omitido na exportação não foi editado.
- A30/A31: investigação histórica de CORS/possível exposição continua adiada por decisão do usuário; não há diagnóstico novo de vazamento confirmado.
- A34/A35 e login por CPF: futuro. A sigla “Json para DD” continua sem significado confirmado; não foi inventado um importador/exportador.
- A36: configuração pública atual, domínio, cookies em HTTPS e produção não foram revalidados. Não houve envio à equipe nem publicação.

## Preparação de publicação

Consulte [e-mail e publicação da V13](email-e-publicacao-v13.md), `.env.example` e [variáveis de ambiente](variaveis-de-ambiente.md). Ainda é necessário disponibilizar provedor SMTP/remetente e combinar a regularização dos e-mails existentes. Sem isso, a regra exigida de confirmação bloqueará a operação das lojas pendentes.

O guia de produção enviado pelo usuário foi tratado como referência, distinguindo instruções do documento da autorização atual. TLS com verificação de identidade, inspeção/backup e DDL por Flyway no pipeline estão previstos no procedimento. A `origin/main` consultada terminava em V12; o histórico real de produção e eventual concorrência devem ser conferidos antes de publicar. Nenhuma credencial de produção foi testada nesta execução.
