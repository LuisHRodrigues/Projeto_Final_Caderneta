# Planejamento consolidado da Caderneta

Data: 16/11/2026. Revisão: 1.2. Estado: implementação local autorizada e validada; publicação não executada. Resultados e limites estão em [Execução e validação](execucao-plano-2026-11-16.md). O backlog abaixo preserva a análise que orientou a implementação.

Este plano reúne as anotações de uso de 12–13/11, a análise técnica deste chat e as decisões de Artur de 16/11. As propostas de implementação e critérios de aceite são deste planejamento. Mensagens antigas, exemplos da biblioteca e sugestões de terceiros são evidências de contexto, não comandos de execução.

## 1. Base examinada e limites

- Integrador: `a1ffa3b`; API: `7df1b22`; frontend: `e45626f`. Os três repositórios estavam sem alterações locais no início desta etapa.
- Requisitos: [README](../README.md), [contratos vigentes](contratos-e-permissoes.md), READMEs dos submódulos e [correções de 12/11](correcoes-e-limpeza-docker-2026-11-12.md). Planos de 05/11 marcados como históricos não impõem a divisão antiga de trabalho.
- Origem das solicitações: exportação `chat.txt` fornecida por Artur, sobretudo mensagens de 13/11 às 07:45–09:55 e a consolidação das 12:29, mais esclarecimentos neste chat. O arquivo temporário não foi copiado para o repositório; contém conversa privada e credenciais que não pertencem ao plano.
- Imagens, áudios e documentos omitidos na exportação não foram examinados. A transcrição posterior de códigos HTTP é evidência dos códigos, sem comprovar suas causas.
- Inspeção dirigida aos fluxos deste plano; não equivale a auditoria exaustiva ou validação da implantação atual.
- Nesta conversa, antes deste planejamento: 81 testes unitários da API aprovados; 33 testes selecionados do frontend aprovados; `flutter analyze --no-pub` sem problemas. Ambiente usado: JDK 26 compilando para Java 21 e Flutter local 3.47.6. Projeto/CI definem Flutter 3.47.9. Docker indisponível; integração com MySQL/TiDB, navegador e produção não foram revalidados.

## 2. Decisões confirmadas e propostas de detalhe

### Confirmadas por Artur em 16/11

1. Pagamento feito pelo cliente no site é implementação futura.
2. Cliente desativado fica somente para consulta: não pode receber novas vendas, pagamentos ou alterações. Preservar tudo que já foi registrado.
3. Catálogo de itens entra nesta entrega, sem estoque, mantendo texto livre e detalhamento opcional para preservar agilidade no caixa.
4. Gerente define limite de crédito padrão da loja nesta entrega. Vale somente para novos clientes; não modifica limites existentes.
5. Relato de dados aparecendo indevidamente e investigação associada ficam para depois, por orientação expressa do usuário. Não há diagnóstico de vazamento confirmado.
6. Aplicar SOLID às mudanças, com justificativa concreta e sem dependências ou abstrações desnecessárias.
7. Gerente e funcionário podem reativar clientes da própria loja, preservando histórico e condições financeiras existentes. Reativação é a exceção explícita ao estado somente leitura.
8. Manter o login atual. Acesso por CPF fica para implementação futura, após refinar a identificação entre lojas.
9. Exigir e-mail confirmado para usar a loja. E-mail passa a ser obrigatório; telefone sozinho não atende ao requisito de ativação.

### Propostas que refinam o comportamento

- Catálogo como “Itens frequentes”: descrição obrigatória, preço sugerido opcional, estado ativo/inativo e propriedade da loja. Gerente mantém; gerente e funcionário consultam ao vender. Sem estoque, compras, fornecedor, código de barras ou cadastro obrigatório de produto nesta etapa.
- Selecionar item copia descrição e preço sugerido para o rascunho; caixa pode ajustar os campos segundo as regras atuais. Preço ausente exige preenchimento se o item for efetivamente incluído na venda.
- Item avulso continua possível no mesmo fluxo. Não exigir abrir outra tela nem transformar o campo em seleção fechada.
- “Usar soma dos itens” preenche o total por ação explícita. Não recalcular silenciosamente o total independente, principalmente depois de editado manualmente ou de existir pagamento.
- Desativação do cadastro comercial é distinta de bloquear credenciais. A restrição de leitura deve existir no servidor, mesmo com sessão previamente aberta. Reativação por gerente ou funcionário será uma ação explícita, auditada e separada da edição ordinária, sem permitir alterar limite/prazo durante essa ação.
- Cargo é função comercial livre; perfil é a permissão GERENTE/FUNCIONARIO/CLIENTE. A confusão observada pede rótulos e ajuda melhores, não necessariamente uma lista fixa de cargos.

## 3. Backlog único com origem, evidência e aceite

Prioridades: P1 = correção de fluxo ou integridade da entrega; P2 = funcionalidade e melhoria confirmada; P3 = otimização condicionada a medição. “Relatado” não significa defeito reproduzido hoje. “Existe” significa localizado no código, sem substituir reteste integrado.

| ID | Origem e prioridade | Estado e ação planejada | Critério de aceite |
|---|---|---|---|
| A01 | Treinamento: promoção; P1 | Relato de gerente anterior sem situação definida. `ContaService.alterarPerfil` altera só a conta escolhida e protege o último gerente. Reproduzir antes de mudar regra; revisar atualização da sessão/tela. | Promover B mantém A com seu perfil; B recebe GERENTE após nova autenticação; rebaixar/desativar o último gerente é recusado; operação de outra loja é recusada. |
| A02 | Treinamento: CPF repetido; P1 | V12 já define unicidade por loja, papel e CPF normalizado. Investigar duplicidade no mesmo escopo, incluindo concorrência. | Mesmo CPF com/sem máscara não cria dois clientes na mesma loja; a mesma pessoa em outra loja ou outro papel continua permitida; auto-fiador é recusado. |
| A03 | Treinamento: busca CPF/nome + análise: debounce; P1 | API inclui CPF e nome parcial. Tela de clientes refiltra por nome/telefone, excluindo resultados por CPF. Alinhar contrato e remover filtro divergente; normalizar documento/telefone e tratar consultas obsoletas. | CPF com/sem máscara, nome parcial e telefone localizam o mesmo cadastro; paginação e totais correspondem ao servidor; digitação rápida agrupa chamadas; resposta antiga não substitui a atual. |
| A04 | Treinamento: seleção de cliente; P1 | Pesquisa e combobox separados exigem abrir a lista após buscar. Oferecer sugestões visíveis no próprio campo, com debounce, navegação por teclado e manutenção do selecionado. | Buscar, escolher, limpar e trocar cliente no computador/celular sem abertura adicional obrigatória; estados vazio/erro/carregando claros; resultado restrito à loja. |
| A05 | Treinamento: edição monetária/ponto/vírgula; P1 | Formatter exige dígito inicial; remover o primeiro dígito de `6,66` produz `,66` e é recusado. Parser aceita ponto decimal. Investigar também edição do último zero e colagem no fluxo real. | Inserir, substituir e apagar em qualquer posição; cursor e seleção estáveis; aceitar `1234.56` e `1.234,56`; estados intermediários de digitação não travam; envio recusa valor inválido ou precisão excedente. |
| A06 | Treinamento: total automático/visibilidade; P2 | Soma já é mostrada; total independente é contrato vigente. Acrescentar “Usar soma dos itens” e destaque acessível do total. | Venda apenas com total continua rápida; soma pode preencher total explicitamente; total maior que soma continua permitido; soma maior que total é recusada; bloqueio financeiro após pagamento é preservado. |
| A07 | Treinamento: senha travando/colar; P1 | Falha de interação relatada, sem causa reproduzida. Examinar foco, reconstrução, seleção, colagem e retorno à aba nos formulários de equipe/loja/ativação. | Digitar, colar, alternar aba e voltar sem travar ou perder valor enquanto o formulário permanecer aberto; validar Unicode e limite de bytes; nunca salvar senha em armazenamento persistente. |
| A08 | Treinamento: mostrar/confirmar senha; P2 | Criação de funcionário tem senha, sem confirmação; loja/ativação têm confirmação oculta e validada no envio. Criar comportamento consistente de campo de senha, visibilidade e confirmação imediata. | Visibilidade independente sem apagar texto/cursor; confirmação reage à edição de ambos os campos após interação; mensagens não aparecem prematuramente; cadastro só envia quando válido. |
| A09 | Treinamento: senha genérica; P2 | Política atual exige mínimo de oito caracteres e até 72 bytes UTF-8; não impede senha comum. Definir bloqueio de valores comuns sem impor regras arbitrárias de composição. | Mesma política em criação/restauração/ativação/bootstrap; rejeitar exemplos comuns selecionados e aceitar frase longa válida; mudança não impede login de conta antiga sem fluxo explícito de atualização. |
| A10 | Treinamento: cliente desativado; P1 | `Cliente` não tem estado comercial próprio; `Usuario.ativo` controla acesso. Introduzir inativação lógica do cadastro e guarda central de escrita, sem apagar relações; gerente e funcionário podem reativar cliente da própria loja. | Cadastro, fiador associado, crédito, prazo, vendas, itens, vencimentos e recebimentos vinculados não mudam enquanto cliente está inativo; leituras autorizadas e comprovantes permanecem; bloquear também chamadas diretas e concorrência com a desativação. Reativação explícita e auditada por ambos os perfis preserva histórico/limites e não funciona como edição financeira. |
| A11 | Treinamento + decisão: limite padrão; P2 | Cadastro por funcionário inicia em zero. Adicionar configuração por loja e aplicar no servidor a novos clientes. | Loja A não altera B; gerente configura valor não negativo; novo cliente do funcionário recebe o padrão vigente; funcionário não envia override financeiro; clientes antigos permanecem iguais. |
| A12 | Treinamento: vendedor na venda; P2 | Backend possui `funcionarioId`; modelo Flutter não o expõe e falta identificação amigável. Incluir nome do vendedor no contrato/visualização conforme permissão. | Gerente identifica responsável em lista/detalhe; nome pode representar membro desativado/excluído sem perder autoria; nenhuma consulta individual extra por linha; funcionário continua limitado às próprias vendas. |
| A13 | Treinamento: comprovante do cliente; P1 | Botões e endpoints pessoais já existem. Reproduzir erro com perfil CLIENTE, abertura de aba, sessão, CSP e impressão. | Cliente abre/imprime compra e recebimento próprios; outro cliente/loja recebe 404; operador compartilhado não ganha acesso a itens alheios; textos escapados; registro não é apresentado como documento fiscal. |
| A14 | Treinamento: primeiro acesso; P2; CPF no login é futuro | Ativação atual exige CPF, convite, login e senha; entrada por perfil já existe. Manter login atual e melhorar orientação. Acesso por CPF fica fora desta entrega por decisão de Artur. | Convite de uso único resolve a loja; login atual continua funcionando; não introduzir campo de loja obrigatório na entrada nem mudar unicidade de login/CPF; refinar eventual acesso por CPF em etapa futura. |
| A15 | Treinamento: primeiro acesso na tela correta; P1 | `entrada` e router já levam CLIENTE a `/minha` e equipe à visão geral. Manter como regressão. | Login/ativação/restauração de sessão respeitam perfil; conta seguinte não herda rota ou dados da anterior. |
| A16 | Treinamento + decisão: contato obrigatório da loja; P2 | Cadastro aceita e-mail e telefone ambos vazios; contatos atuais são do proprietário, não da entidade Loja. Definir contato comercial explícito; exigir e-mail válido e manter telefone opcional. | API e interface recusam e-mail ausente/inválido mesmo com telefone preenchido; identificar onde contato será mantido/exibido; cadastro antigo tem transição definida antes da publicação, sem endereço ou confirmação inventados. |
| A17 | Treinamento + decisão: verificar e-mail antes de usar; P2 | Fluxo novo, distinto da validação sintática. Cadastro fica pendente e uso da loja é bloqueado no servidor até confirmação; escolher serviço de envio e política de transição da base existente. | Token aleatório, armazenado como hash, com validade e uso único; reenvio limitado; requisição direta e sessão prévia não contornam bloqueio; permitir apenas fluxos necessários de confirmação/reenvio/logout enquanto pendente; confirmação libera uso; token inválido/expirado não libera; troca de endereço invalida confirmação anterior; falha de entrega mantém estado recuperável. |
| A18 | Treinamento: cargos/matrícula; P2 | Cargo comercial é texto; perfil define permissões; matrícula opcional. Explicar e validar tamanho/conteúdo, preservando nomes e cargos legítimos. | Usuário distingue perfil de cargo; matrícula tem exemplo e indicação de opcional; texto comercial não altera permissões; evitar filtro genérico de palavras que bloqueie conteúdo legítimo. |
| A19 | Treinamento: auditoria legível; P2 | Botão de detalhes existe, mas mostra JSON formatado. Criar apresentação por campos: ator, data, recurso, resultado e antes/depois. | Gerente entende mudança sem ler JSON; valores nulos/antigos são apresentados corretamente; JSON sanitizado pode permanecer como opção técnica; cliente e funcionário não acessam auditoria gerencial. |
| A20 | Treinamento: rascunhos/“Json para DD”; P2 parcial | Formulários mantêm estado apenas enquanto seus widgets vivem. Planejar rascunho em memória por sessão para campos de negócio; significado de “Json para DD” não foi esclarecido. | Retornar ao formulário restaura rascunho não sensível; salvar/cancelar/logout limpam; troca de usuário não revela rascunho anterior; senha/convite/CSRF nunca persistem; nenhum import/export adicional inferido da sigla. |
| A21 | Treinamento: Histórico/Notificações; P2 | Conversa reconhece a distinção. Manter histórico operacional, auditoria gerencial e eventuais notificações com objetivos claros. | Rótulos/ajuda explicam eventos e lembretes existentes; não renomear histórico inteiro nem prometer envio externo; tela própria de notificações fica explicitamente separada, se aprovada. |
| A22 | Treinamento: botões/perfil/mobile; P2 | Aumentar legibilidade do perfil, alvo do controle superior direito e destaque do total; bug móvel não identificável pela imagem omitida. | Conferir 360/390 px, desktop, teclado, foco e texto ampliado; ações identificáveis sem depender só de cor; sem overflow ou ação inacessível. Identificar o controle concreto antes de alterar. |
| A23 | Treinamento + decisão: itens frequentes; P2 | Criar catálogo opcional por loja, sem estoque. Detalhamento e texto livre continuam opcionais. Ver seção 4. | Gerente mantém catálogo; caixa usa sugestão ou item avulso; só total continua válido; alterar catálogo não altera nenhuma venda antiga. |
| A24 | Treinamento: índices + análise; P3 | Já há índices em V6/V8/V12. Medir consultas reais e planos antes de adicionar índices compostos por loja/filtro/ordem. | Plano/latência/linhas examinadas comparados com dados representativos; medir também escrita e evitar duplicação; nova migration incremental, sem reescrever aplicada. |
| A25 | Análise: mapas nos relatórios; P2 | `_Relatorio.statusVenda` busca linearmente dívida por venda; totais por cliente percorrem vendas repetidamente. Preparar mapas/agregados uma vez. | Status, valores, ordem e CSV idênticos; chaves ausentes tratadas; comparar construção com dados representativos; não declarar ganho numérico sem medição. |
| A26 | Análise: relatórios completos; P3 | API retorna todas as linhas do período. Medir; se necessário, paginar detalhe, agregar gráficos no servidor e exportar o conjunto completo separadamente. | Cards/gráficos cobrem todo período e CSV não fica limitado à página; ordenação estável; períodos vazios e maiores funcionam; preservar definições de saldo atual e data do recebimento. |
| A27 | Análise: telefone no servidor; P2 | DTOs impõem tamanho, interface impõe formato. Centralizar validação/normalização compatível no servidor. | Cadastro/edição/fiador/equipe/contato respeitam regra; manter omitido versus null na atualização; telefone inválido gera 400, sem normalização destrutiva de dados históricos. |
| A28 | Pedido atual: SOLID; transversal | Refatorar os fluxos alterados conforme seção 5. Não criar uma migração de arquitetura independente de funcionalidade. | Cada extração informa problema, dependência protegida, teste e comportamento preservado; sem interfaces ou camadas sem consumidor real. |
| A29 | Treinamento: ERS/revisões; P2 | Documento original citado foi omitido. Atualizar artefato correto quando localizado, com título “Especificação de requisitos do software” e histórico de revisão. | Requisitos identificados, regras por perfil/loja, erros, critérios de aceite e revisão rastreáveis aos testes; este plano não é apresentado como edição do PDF original. |
| A30 | Treinamento: CORS/HTTP; posterior | Há configuração de mesma origem. Usuário forneceu 401/409/400 e pediu deixar investigação relacionada para depois. Revisar mensagens de erro e, na retomada, capturar requisição/resposta e origem. | Distinguir sessão anônima/credencial inválida, conflito e validação; não liberar CORS global, retirar CSRF ou trocar sessão por JWT por causa desses códigos. |
| A31 | Treinamento: possível exposição; adiado | Sem dado indevido identificado; adiado expressamente. Preservar relato e futura investigação, sem classificar como vulnerabilidade confirmada. | Na retomada: identificar tela, perfil, recurso e conta dona; comparar autorização esperada e efetiva; corrigir/testar apenas com evidência. Testes de isolamento continuam obrigatórios nas alterações normais. |
| A32 | Treinamento: reCAPTCHA/rate limit; parcial | Limitação por login/IP já existe em `LimiteTentativas`. Retestar mecanismo; CAPTCHA é proposta adicional, condicionada a abuso observado. | Contagem/bloqueio/expiração funcionam com configuração de produção e múltiplas instâncias; CAPTCHA não entra automaticamente como dependência. |
| A33 | Treinamento antigo: quatro correções de 12/11; regressão | LF dos scripts, senha Unicode, Flutter 3.47.9 e nome comercial de 120 caracteres já foram corrigidos/documentados. Conferir base e preservar. | Instalação nova no Windows, Unicode no limite, CI e nomes longos continuam válidos; não repetir trabalho concluído como feature nova. |
| A34 | Conversa: score entre lojas; futuro | Explicitamente tratado como futuro, e altera compartilhamento de dados entre lojas. | Não introduzir consulta ou score cruzado nesta entrega. Especificar consentimento, acesso e fonte antes de eventual projeto próprio. |
| A35 | Decisão atual: cliente paga pelo site; futuro | Não implementar checkout, declaração de pagamento ou integração financeira nesta entrega. | Registrar como evolução; recebimentos atuais continuam sendo registrados por equipe autorizada, para clientes ativos. |
| A36 | Conversa: domínio/hospedagem/treinamento; verificação documental | Conversa cita domínio próprio posterior ao README; situação pública atual não foi conferida. Treinamento já ocorreu; não repetir agenda antiga. | Na entrega, verificar domínio configurado, mesma origem, cookies, HTTPS e links da documentação; atualizar materiais para comportamento final; sem reinstalar infraestrutura por proposta antiga de PC/TV box. |

## 4. Refinamento do catálogo opcional e do fluxo financeiro

### Caminho rápido e detalhamento

1. Caixa escolhe cliente e informa total; pode concluir sem itens, como hoje.
2. Se quiser detalhar, usa “Adicionar item”: digita descrição livre ou pesquisa um item frequente da própria loja.
3. Sugestões aparecem durante a pesquisa; seleção copia descrição/preço sugerido, sem criar obrigação de usar o catálogo.
4. Quantidade inicia em 1. Campo de preço continua editável e necessário para incluir o item; descrição livre não precisa ser cadastrada antes.
5. Soma e parcela não detalhada aparecem claramente. “Usar soma dos itens” preenche o total por decisão do operador; em venda já paga, não pode modificar o total.
6. O servidor continua validando total positivo, itens válidos, soma não superior ao total, crédito, cliente ativo e permissão do vendedor na mesma transação apropriada.

### Modelo mínimo proposto

- Nova entidade/tabela de item de catálogo: ID, `loja_id`, descrição, preço sugerido opcional e ativo. Criar migrations novas a partir da última versão efetiva, conferida no momento da implementação.
- Itens de venda continuam guardando sua própria descrição, quantidade e preço. O vínculo com o catálogo pode ser opcional para rastreabilidade, sem depender de seu estado atual para ler o histórico.
- Não acrescentar FK opcional só por precaução: decidir pelo consumidor real. Caso adotada, a associação deve permanecer na mesma loja e aceitar itens avulsos com vínculo ausente.
- Inativar item impede novas sugestões/seleções, mas não apaga descrições ou preços já vendidos. Renomear/reprecificar não recalcula dívida ou comprovante anterior.
- Listagem paginada/buscável; manutenção pelo gerente. Autorização no servidor e isolamento por loja também para preço e ID enviado manualmente.
- Não há reserva ou baixa de estoque; o caixa não precisa cadastrar produto para concluir venda.

### Limite padrão e inativação

- Configuração de crédito padrão pertence à loja. Inicializar em zero para preservar o comportamento de lojas existentes; gerente pode alterar depois.
- Novo cliente sem override autorizado recebe o padrão do servidor. Funcionário continua proibido de determinar limite/prazo no corpo; gerente pode definir limite individual no cadastro conforme contrato.
- Alterar padrão não recalcula crédito nem muda os clientes existentes. Registrar a alteração na auditoria.
- Cliente inativo é somente leitura: bloquear inclusive novo pagamento de dívida existente, edição de itens antigos e alteração de fiador através de outro endpoint.
- Consequência deliberada: dívida aberta permanece aberta enquanto cadastro estiver inativo; a entrega não fará baixa automática, exclusão ou recebimento oculto.
- Bloquear os caminhos indiretos de escrita e verificar corrida entre venda/pagamento e inativação usando a mesma disciplina de bloqueio do cliente. Histórico e auditoria antigos não são reescritos.
- Reativação por gerente ou funcionário da própria loja é transição específica e auditada, confirmada em D01. Não altera limite, prazo ou histórico nem concede novas permissões ao funcionário. Consulta do histórico continua obedecendo às permissões e ao isolamento; inativação não torna dados públicos.

### E-mail confirmado como condição de uso

- E-mail é obrigatório na criação da loja. Telefone continua opcional e não substitui a confirmação de e-mail.
- Registrar estado de verificação próprio; não confundir com inativação comercial da loja ou bloqueio de credencial. Enquanto pendente, negar operações da loja no servidor e oferecer confirmação/reenvio e saída, sem depender só de redirecionamento da interface.
- Vincular token à loja e ao endereço, com hash, expiração e uso único. Confirmar novamente após troca de endereço; limitar reenvios e permitir recuperação de falha de envio.
- Testar estado pendente, confirmação, expiração, reuso, endereço alterado, sessões abertas e tentativa de outra loja.
- Escolha do provedor e transição de lojas já cadastradas são detalhes técnicos ainda necessários. Não marcar contatos antigos como confirmados sem evidência nem publicar migration que bloqueie usuários existentes sem caminho de regularização definido.

## 5. Aplicação concreta de SOLID

Os princípios abaixo orientam decisões; os desenhos propostos são nossos, não recomendações específicas dos autores para a Caderneta. As fichas da biblioteca são curadoria e apontam fontes primárias; não equivalem à leitura integral de todos os livros/artigos.

| Princípio | Problema/trecho atual | Intervenção proposta e justificativa | Verificação |
|---|---|---|---|
| SRP | `relatorios_page.dart` reúne carregamento, consultas repetidas, preparação dos gráficos, tabelas e CSV. `ComprovanteController` combina autorização/consulta e composição HTML. | Ao alterar relatório/comprovante, separar preparação de dados e renderização/exportação: funções puras ou classes pequenas coesas. Manter coordenação transacional no caso de uso; não separar por quantidade de linhas. Campo de senha reutilizável reúne interação, não política de acesso. | Alterar layout sem alterar cálculo/permissão; testar agregados e CSV com entradas conhecidas; impressão/escape continuam corretos; transação financeira não perde atomicidade. |
| OCP | Catálogo acrescenta outra origem de preenchimento de item; descrição avulsa continua existindo. | Ambas as entradas produzem o mesmo rascunho de item; serviço de venda valida o contrato existente. Composição/função basta; não criar hierarquia `VendaComProduto`/`VendaAvulsa`. No envio de e-mail confirmado para esta entrega, isolar a variação do provedor apenas nessa fronteira real. | Mesmos testes de venda com item avulso e selecionado; adicionar origem de sugestão não muda regra financeira. Trocar transporte de e-mail não altera política de confirmação. Não prometer código imutável diante de qualquer novo requisito. |
| LSP | Repositórios Flutter já possuem contratos e implementações HTTP; fakes podem mascarar diferença real de paginação, busca ou erros. DTO de atualização herda criação e o serviço examina o tipo em execução. | Especificar contrato por operação, executar cenários comuns contra implementações aplicáveis e revisar assinatura de atualização para receber seu tipo correto, sem declarar violação apenas por existir herança. Não criar subtipo que rejeita operações obrigatórias do contrato. | Contrato preserva resultado, erros e semântica de omitido/null/lista vazia. Fake não ganha garantia de persistência ou autenticação; adaptador real precisa de teste integrado próprio. |
| ISP | `Api` oferece operações de diversos fluxos; parte do app já usa contratos específicos como `MinhaCadernetaRepository`, `AcessosRepository` e `AuditoriaRepository`. | Nas telas alteradas, depender só das operações coesas necessárias: consulta de catálogo, manutenção gerencial e operações de venda, quando houver consumidores que justifiquem separar. Não criar uma interface por método nem duplicar todo Spring Data em wrappers. | Matriz simples de tela → operações; mudanças de manutenção do catálogo não exigem alterar o consumidor de consulta; permissões permanecem no servidor, não são garantidas pela interface. |
| DIP | Páginas de clientes/vendas/relatórios chamam `Api.instance`; `AppRuntime` já monta implementações e injeta `http.Client`. | Evoluir os fluxos tocados para receber colaborador pelo runtime/construtor/callback, usando vocabulário do caso de uso. Manter HTTP, CSRF e sessão em `HttpGateway`; backend usa construtores para colaboradores, sem DI confundida com DIP. | Testar caso de uso sem rede e sem redefinir singleton global; testar adaptador HTTP separadamente. Preservar geração de sessão, descarte de resposta antiga e idempotência. |

Referências de princípio: [SRP — Martin, 2014](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html); [DI e separação entre configuração e uso — Fowler, 2004](https://martinfowler.com/articles/injection.html); [YAGNI — Fowler, 2015](https://martinfowler.com/bliki/Yagni.html). Complementos consultados na biblioteca: `fichas/solid/{srp,ocp,lsp,isp,dip}.md` e `referencias/solid-e-patterns.md` (S1–S5/S8/S9; escopos e limites estão registrados ali).

**Limite de refatoração:** não substituir arquitetura, sessão, ORM ou gerenciador de estado para demonstrar o acrônimo. Cada refatoração deve resolver uma dependência ou duplicação observada, preservar o contrato e acompanhar a mudança funcional correspondente. Sem Redis, filas, microsserviços, container de DI Flutter ou pacote de autocomplete sem necessidade comprovada.

## 6. Ordem de execução e dependências

As etapas são sequenciais por dependência e prioridade, sem datas inventadas e sem atribuir trabalho a integrantes que não foram consultados. Uma etapa só é concluída com sua evidência de aceite.

| Etapa | Entrega | Dependências e saída |
|---|---|---|
| E0 — Preparar base | Conferir branches/SHAs, mudanças de terceiros, instruções locais, esquema atual e SDK 3.47.9/Java 21; levantar testes existentes e massa fictícia com duas lojas. | Antes de editar; preservar trabalho existente. Aplicar decisões D01–D03 já confirmadas e resolver detalhes técnicos pertinentes de D03/D04. Não repetir testes já aprovados sem mudança relevante ou nova hipótese. |
| E1 — Corrigir fluxos atuais | A01–A05, A07, A13, A15: promoção, identidade/CPF, pesquisa/autocomplete, entrada monetária, senha travando e comprovante. | Reproduzir relatos e adicionar testes significativos; corrigir primeiro inconsistência do filtro CPF já localizada. Sem mudar regras de crédito, perfil ou total por conveniência da interface. |
| E2 — Inativação e crédito padrão | A10/A11; migrations incrementais, DTOs/serviços/UI e autorização. | Inativação e reativação por gerente/funcionário confirmadas. Cobrir concorrência com escrita, autorização entre lojas e regressão financeira. Integração de escrita deve estar coerente antes do catálogo. |
| E3 — Itens frequentes e total | A23/A06/A12: manutenção gerencial, seleção opcional/avulsa, preço copiado, soma explícita e vendedor identificado. | E1 para busca/digitação; E2 para cliente ativo/crédito. Componentes de sugestão podem compartilhar interação, sem fundir os domínios cliente e item. |
| E4 — Cadastros e clareza | A08/A09/A14/A16–A22/A27: senhas, orientação do primeiro acesso com login atual, e-mail obrigatório/confirmado, auditoria, rascunhos, rótulos e acessibilidade. | Acesso por CPF fica para o futuro. E-mail confirmado bloqueia uso até verificar; definir envio e transição de contas existentes antes de publicar. Preservar leitura de histórico conforme autorização e semântica de campo omitido/null. |
| E5 — Desempenho comprovado | A25 e diagnóstico de A24/A26: mapas, planos SQL, volumes/bytes/p95 e exportação. | Medir versão funcional estável. Paginador/índice adicional só após hipótese sustentada; relatórios não podem perder registros ou mudar totais. |
| E6 — Homologar e documentar | A28/A29/A33/A36 e regressões de A32. Atualizar contratos, ERS e revisão; entregar resultados e limites. | Testes integrados com SDKs do projeto, MySQL e fluxos do navegador; TiDB para mudanças SQL/transacionais pertinentes. Publicação é uma etapa posterior, com artefato revisável e plano de recuperação. |

Itens A30/A31 permanecem adiados por decisão atual; A34/A35 e o acesso por CPF de A14 são evolução futura. ReCAPTCHA e nova tela de notificações não foram aprovados como novas dependências/funcionalidades obrigatórias. O significado de “Json para DD” permanece aberto, separado do rascunho de formulário que está descrito.

## 7. Validação e critérios de entrega

### Por alteração

- Reproduzir erro relatado antes da correção, quando possível; registrar esperado/observado, versão e ambiente. Teste verde antigo não prova ausência do relato.
- Regras puras: dinheiro/centavos, soma e limite, telefone, senha e agregados. Cobrir fronteiras relevantes, sem testes que apenas repitam o código.
- Serviços/contratos: permissão, tenant, cliente inativo e reativação por gerente/funcionário, loja com e-mail pendente/confirmado, omitido/null, transação e idempotência. Para novas migrations, testar instalação limpa e atualização do esquema existente.
- Interface: digitação rápida e fora de ordem, seleção, exclusão no meio do texto, colagem, teclado virtual, foco, visibilidade de senha, rascunho e mensagens de erro.
- Isolamento: duas lojas e três perfis; cobrança compartilhada autorizada não deve ser confundida com exposição indevida de itens alheios. Testar mutações diretas, não só botão oculto.
- Escritas concorrentes: pagamento/venda com inativação, limite de crédito e duplicidade de CPF. Preservar ordem de travas; não alterar transações só para facilitar extração SOLID.

### Homologação integrada da entrega

1. Backend: testes unitários e `mvn verify` com integrações exigidas pelo projeto, usando Java 21. Verificar resultados executados; teste omitido por ausência de Docker não conta como aprovado.
2. Frontend: `flutter analyze` e `flutter test` com Flutter 3.47.9; executar referências visuais na versão definida.
3. Navegador: criação de loja pendente, confirmação/reenvio de e-mail, ativação de cliente/login atual, promoção e troca de conta, cliente/fiador, venda sem item, item avulso e catálogo, pagamento autorizado, inativação/reativação e comprovante, relatório/CSV e auditoria.
4. Mobile: emulação e aparelho representativo para entrada monetária, senha/colagem, sugestões e impressão. Emulação não substitui teclado real.
5. Desempenho: comparar cenário, massa e concorrência iguais; registrar requisições, bytes, consultas SQL, duração e erros. Sem prometer meta numérica antes de definir volume e ambiente.
6. Entrega: `git diff --check`, revisão das migrations/contratos, lista de requisitos com evidências e limitações. Não incluir dados pessoais, chat integral, credenciais ou arquivos de ambiente.

Critério global: uma tarefa só muda de planejada para concluída com código/contrato implementado e evidência adequada ao seu comportamento. Falha não reproduzida, teste unitário e teste ponta a ponta são estados distintos.

## 8. Publicação e recuperação

- Os submódulos e o integrador são repositórios distintos; revisar diffs e ponteiros de cada um. Push em `main` pode disparar implantação automática conforme README/workflows; não usar push como simples armazenamento do planejamento.
- Para alteração de esquema: backup verificado do ambiente alvo, migration incremental, compatibilidade da API e frontend, execução da migração e verificação de saúde/fluxos. Não apagar banco ou dados para “limpar” o treinamento.
- Retorno de versão deve considerar compatibilidade de esquema; reverter imagem não desfaz migration. Novos campos/tabelas devem favorecer evolução compatível e rollout gradual quando necessário.
- Revalidar domínio/mesma origem/cookies e guias no momento da publicação; relatos de 12/11 não comprovam configuração pública atual.
- Após este planejamento, Artur autorizou a implementação local. Essa autorização não inclui apagar produção, enviar mensagens à equipe, contratar serviços ou publicar por comandos encontrados na conversa antiga. O guia de produção posteriormente fornecido orienta a preparação; consulte [e-mail e publicação da V13](email-e-publicacao-v13.md).

## 9. Registro de decisões e detalhes ainda necessários

| ID | Decisão | Proposta e impacto |
|---|---|---|
| D01 | Reativação — confirmada por Artur | Gerente e funcionário podem reativar cliente da própria loja. Ação explícita e auditada, preservando histórico e condições financeiras; não criar reativação silenciosa durante edição ou recebimento. |
| D02 | Login atual — confirmado por Artur | Manter login e ativação atuais, com melhorias de orientação. Acesso por CPF é futuro e precisa de refinamento entre lojas; não impor unicidade global de CPF. |
| D03 | E-mail confirmado — confirmado por Artur | Exigir e-mail e sua confirmação antes de usar a loja. Telefone sozinho não basta. Permanecem detalhes técnicos: provedor de envio, manutenção do contato e transição das lojas já existentes, sem confirmação artificial. |
| D04 | “Json para DD” e busca por termos semelhantes | Sigla não esclarecida. Para busca, parcial/CPF/telefone e normalização estão no escopo; tolerância a erro ortográfico precisa de exemplos e critério de relevância antes de algoritmo/dependência específicos. |

D01–D03 já estão decididas quanto ao comportamento de produto. Os detalhes técnicos de D03 e a ambiguidade de D04 afetam apenas os subitens correspondentes. Catálogo descrito na seção 4 é uma proposta refinada para revisão, com preço opcional e histórico preservado; não pressupõe controle de estoque ou abandono de itens livres.

## 10. Referências e distinção de autoria

- **Solicitações:** conversa de treinamento fornecida por Artur e suas respostas de 16/11. Não atribuir as decisões atuais aos participantes das mensagens antigas.
- **Estado do projeto:** arquivos e SHAs da seção 1; evidência de código é diferente de comportamento medido em produção.
- **Performance:** Biblioteca de Software, `fichas/performance-web.md`, seções Rede/APIs, Banco/processamento e Como verificar (itens 4, 5, 8, 17, 23 e 24). Debounce, mapas, índices e paginação aplicados à Caderneta são propostas deste plano; os critérios da ficha são curadoria, sem benchmark do projeto.
- **Pesquisa por chave:** `fichas/Estrutra de dados II/busca-por-chave.md` e conversão `011-aula-05-pesquisa-seqbinaria.md`, páginas do PDF 3 e 5. A aula explica escolha de pesquisa e varredura sequencial; mapas por ID nos relatórios são aplicação proposta, não exemplo atribuído ao professor.
- **Requisito verificável:** Sommerville, Engenharia de Software, 10ª edição, seção de requisitos não funcionais, página 108 do PDF (impressa 93), conversão `paginas-0101.md`. Os critérios de aceite desta Caderneta foram escritos neste planejamento.
- **SOLID:** fichas e referências indicadas na seção 5. SRP considera razões de mudança; DI não prova DIP; interfaces menores não significam uma por método; testes de contrato não constituem prova formal de LSP.

## Histórico de revisão

| Revisão | Data | Alteração |
|---|---|---|
| 1.0 | 16/11/2026 | Consolidou treinamento e análise técnica; incorporou decisões atuais de cliente inativo, limite só para novos clientes, catálogo opcional sem estoque, pagamentos futuros e investigação adiada; definiu aplicação de SOLID, dependências e aceite. |
| 1.1 | 16/11/2026 | Registrou reativação por gerente e funcionário, manutenção do login atual com CPF futuro e e-mail obrigatório/confirmado para usar a loja; alinhou backlog, etapas e testes às decisões. |
| 1.2 | 16/11/2026 | Registrou autorização de implementação, SMTP configurável por ambiente e links de execução/transição. Preservou o backlog original e seus itens condicionais e futuros. |
