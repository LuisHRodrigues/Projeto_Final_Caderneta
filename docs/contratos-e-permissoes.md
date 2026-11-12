# Contratos e permissões vigentes

Decisão aprovada pelo usuário em 05/11/2026. Substitui regras divergentes de documentos anteriores. Os materiais da Biblioteca de Software são referências de engenharia; não acrescentam funcionalidades ao escopo aprovado.

## Perfis

| Operação | Gerente | Funcionário | Cliente |
|---|---|---|---|
| Lista/detalhe/edição/comprovante de venda | Todas | Próprias | Consulta das próprias compras |
| Itens depois de pagamento | Sim | Próprias | Não |
| Cliente/total/data de venda | Sem pagamentos | Próprias, sem pagamentos | Não |
| Dívidas e recebimentos | Carteira compartilhada | Carteira compartilhada | Consulta própria |
| Limite e prazo padrão | Sim | Não | Não |
| Renegociar vencimento/excluir venda | Sim; exclusão sem pagamentos | Não | Não |
| Acessos/relatórios/auditoria | Sim | Não | Não |

Venda alheia para funcionário retorna 404, inclusive comprovante e PUT. Cliente utiliza /api/me/*; recurso de outro cliente retorna 404. Sessões sem login recebem 401; perfil proibido recebe 403. Cobrança compartilhada expõe cliente, valores, vencimentos e eventos operacionais, sem itens das vendas de outro funcionário.

## Sessão, erros e listas

Cookie HttpOnly de sessão e CSRF obrigatório em mutações. GET /api/auth/csrf informa token/headerName; renovar após login/logout. O frontend descarta respostas da conta anterior pela geração da sessão. API e nginx não armazenam respostas financeiras em cache.

GET /api/clientes, /api/vendas e /api/dividas usam page (base zero), size (máximo 100), busca q e filtros aplicáveis. Envelope: content, number, size, totalElements, totalPages. Histórico, auditoria, acessos e área do cliente mantêm seu envelope paginado. O frontend usa a página corrente, e /api/resumo e /api/me/resumo calculam os cards no servidor.

Erros de validação retornam 400; conflitos de versão, pagamento ou idempotência, 409. Campos preenchidos são conservados para correção. No conflito de venda, recarregue a versão atual e compare as alterações antes de reenviar.

## Venda e itens opcionais

POST /api/vendas exige clienteId e valorTotal positivo. itens omitido ou [] representa venda sem detalhamento. funcionarioId no corpo é recusado; o responsável vem da sessão.

~~~json
{"clienteId":20,"valorTotal":100,"itens":[{"descricaoProduto":"Produto","quantidade":1,"precoUnitario":60}]}
~~~

Total R$ 100, itens R$ 60, valor não detalhado R$ 40. Nenhum item fictício, desconto ou ajuste automático de dívida é criado. Subtotais usam quantidade × preço; o servidor usa BigDecimal, até duas casas decimais e os limites de precisão do banco. Soma acima do total é inválida.

PUT /api/vendas/{id} usa contrato de atualização e exige versao retornada no GET/POST. Campo omitido não muda. itens:[] remove o detalhamento; uma lista substitui todos os itens atomicamente. A resposta inclui versao, temPagamentos e dataNegocio (data comercial em America/Sao_Paulo).

~~~json
{"versao":2,"itens":[]}
~~~

Antes de pagamentos, gerente e vendedor proprietário podem mudar cliente, total e data. Crédito e dívida são revalidados na mesma transação. Alterar só itens não muda total, dívida nem vencimento. Alterar só total conserva data/hora e eventual vencimento renegociado. Mudar cliente/data recalcula emissão/vencimento segundo o prazo aplicável, preservando a hora local original. Com pagamentos, campos financeiros ficam bloqueados; itens continuam editáveis e auditados.

DELETE /api/vendas/{id}: gerente, somente sem pagamentos. Dívida vinculada não é excluída isoladamente. Operações financeiras bloqueiam clientes (ordem crescente em transferências), venda/dívida conforme o fluxo e usam READ_COMMITTED para evitar grafos antigos de pagamentos sob concorrência.

## Idempotência

POST de venda e POST /api/dividas/{id}/pagamentos exigem Idempotency-Key, de 16 a 80 caracteres alfanuméricos/hífen. Mesma chave, usuário e conteúdo retornam a resposta original; conteúdo diferente retorna 409. Registro da chave e operação financeira pertencem à mesma transação.

O navegador preserva a chave da solicitação incerta em armazenamento local, usando identidade do usuário e hash do conteúdo. Não armazena corpo nem senha nesse registro e não repete mutações automaticamente. Na confirmação, remove a chave para permitir outra operação igual. Depois de timeout, consulte o estado e reenvie a mesma operação; não altere arbitrariamente o conteúdo para tentar a mesma chave.

## Cadastro e fiador

Funcionário cria cliente sem condições financeiras: limite inicial zero e prazo 30 dias. Campos de limite/prazo enviados por funcionário são recusados, tanto pelo PUT geral quanto pelos PATCH específicos.

CPF novo é validado/normalizado e possui unicidade normalizada no banco. Nomes só com espaços, precisão monetária inválida, prazo negativo ou acima do limite e crédito negativo são recusados.

POST/PUT de cliente aceita fiador aninhado para salvar e associar atomicamente. PUT: fiador omitido mantém, null remove, objeto cadastra/associa/edita; identificação por ID ou CPF normalizado evita dependência de IDs de fixtures. email, telefone e endereco omitidos mantêm os valores; null limpa. Auditoria registra antes/depois.

## Cobrança, relatórios e comprovantes

POST /api/dividas/{id}/pagamentos registra valorPago e metodoPagamento, mais operador autenticado. PUT /api/dividas/{id} permite ao gerente dataVencimento, recusando dívidas quitadas/canceladas e datas inválidas. Vencimento efetivo é calculado nas consultas, sem exigir edição.

- GET /api/relatorios/pagamentos?inicio=AAAA-MM-DD&fim=AAAA-MM-DD usa a data do recebimento, inclusive compra anterior.
- GET /api/relatorios/resumo?inicio=...&fim=... calcula vendido, recebido, saldo, vencido, inadimplencia, quantidadeVendas e clientesAtivos no servidor.
- A carteira selecionada usa emissão da dívida no período. Seu saldo é **atual**, não histórico. Inadimplência = saldo vencido atual / saldo atual da carteira × 100; carteira sem saldo resulta em zero.
- Relatórios detalhados do período continuam disponíveis para tabelas, gráficos e CSV.
- GET /api/vendas/{id}/comprovante e /api/me/vendas/{id}/comprovante geram HTML imprimível/Salvar PDF.
- GET /api/dividas/{dividaId}/pagamentos/{id}/comprovante e equivalente /api/me/... seguem permissões de cobrança/cliente. Um funcionário pode imprimir recebimento compartilhado sem acessar os itens da venda.
- Textos nos comprovantes são escapados. Não substituem documento fiscal.

Histórico e auditoria obrigatórios pertencem à transação financeira: falha reverte operação e chave de idempotência. Lembretes possuem chave única por dívida, situação e vencimento; o endpoint manual devolve o evento realmente persistido. Não há envio externo por bot.
