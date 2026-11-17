# Especificação de requisitos do software — Caderneta

Revisão 1.0 — 16/11/2026. Especificação mantida no repositório para a evolução local desta entrega. Não substitui nem afirma editar o PDF acadêmico que foi citado no treinamento e não foi disponibilizado.

## Objetivo e regras preservadas

Registrar vendas a prazo com agilidade, controlar dívidas e pagamentos e permitir consulta do cliente. Cada registro pertence a uma loja. Gerente, funcionário e cliente mantêm as permissões descritas em [Contratos e permissões](contratos-e-permissoes.md), com os acréscimos abaixo.

| ID | Requisito e critério de aceite |
|---|---|
| RF01 | Manter login atual e ativação por convite. CPF não se torna login global. Entrada respeita o perfil e não reaproveita dados da sessão anterior. |
| RF02 | Exigir e-mail válido no cadastro da loja e confirmação antes de operações. Loja pendente permite login, consulta da situação, confirmação/reenvio e logout; chamadas diretas à API também são bloqueadas. Gerente regulariza o contato; funcionário/cliente recebem orientação para procurar o gerente. |
| RF03 | Confirmação usa token de uso único, validade de 24 h e hash no banco. Reenvios da mesma loja têm intervalo mínimo de um minuto. Troca de endereço exige nova confirmação; endereço antigo e token anterior não liberam a loja. |
| RF04 | Manter cliente desativado apenas para consulta, com histórico e comprovantes. Bloquear alterações cadastrais, financeiras, itens de vendas e novos recebimentos. Gerente desativa; gerente e funcionário reativam na própria loja, sem mudar limites ou histórico nessa ação. |
| RF05 | Gerente configura limite padrão por loja, não negativo e com precisão compatível com o cadastro. Somente novos clientes herdam o padrão; funcionário não envia limite individual. Clientes existentes conservam condições anteriores. |
| RF06 | Buscar clientes por nome parcial, partes do nome, CPF ou telefone com/sem máscara. Resposta e total paginado pertencem ao servidor; a interface não descarta um resultado por aplicar critérios diferentes. Digitação tem debounce e respostas antigas são ignoradas. |
| RF07 | Selecionar cliente por sugestões no próprio campo, com teclado e retorno de erro/vazio/carregamento. Cliente inativo não aparece como opção para novas vendas. |
| RF08 | Registrar venda somente com total continua possível. Itens são opcionais e podem ser avulsos ou preenchidos por sugestões do catálogo. Soma dos itens nunca ultrapassa o total; diferença permanece não detalhada. |
| RF09 | Gerente mantém itens frequentes da própria loja: descrição de até 200 caracteres, preço sugerido opcional e estado ativo/inativo. Equipe consulta sugestões ativas. Não há estoque. Vendas guardam descrição e preço próprios; alterações no catálogo não mudam registros antigos. |
| RF10 | “Usar soma dos itens” preenche total por ação explícita, sem ajuste silencioso. Venda com pagamentos preserva bloqueios financeiros. Responsável pela venda vem da sessão e pode ser identificado pelo gerente. |
| RF11 | Editar, selecionar, colar e apagar valores monetários em qualquer posição. Aceitar ponto decimal e formato pt-BR; validar valor final e precisão ao enviar. Estados temporários de edição não travam o campo. |
| RF12 | Oferecer mostrar/ocultar senha e confirmação com feedback durante interação nos cadastros/restauração. Preservar Unicode e limite de 72 bytes UTF-8; rejeitar senhas comuns previstas na política. Login de conta antiga não passa pelo validador de criação. |
| RF13 | Apresentar auditoria com autor, perfil, ação, recurso, resultado e campos antes/depois. Dados técnicos opcionais permanecem sanitizados, inclusive alterações codificadas em JSON. |
| RF14 | Guardar rascunhos de novos clientes/vendas somente em memória e na sessão correspondente. Salvar/cancelar/logout limpam; mudança de usuário impede restauração. Nunca guardar senha, convite ou CSRF em rascunho persistente. |
| RF15 | Emitir comprovante próprio de compra/pagamento e imprimir sem JavaScript inline. Permissões pessoais e por loja continuam válidas; documento não é fiscal. |
| RNF01 | Preservar transação, idempotência, ordem de bloqueio do cliente e versão de venda. Inativação concorre com operações financeiras usando a mesma linha bloqueada. |
| RNF02 | Oferecer interface em computador/celular, foco visível, teclado, alvos acessíveis e texto ampliado. Histórico operacional e auditoria mantêm objetivos e permissões distintos. |
| RNF03 | Preparação de relatórios usa índices em memória e agregados sem alterar resultado. Consulta de clientes agrega saldos por página; não adicionar Redis, novos serviços ou índices SQL sem evidência. |
| RNF04 | Separar políticas e transporte onde há variação real: confirmação versus SMTP, consulta versus manutenção do catálogo e dados do relatório versus apresentação. Não criar arquitetura paralela para cumprir SOLID. |

## Fora desta entrega e limites

Pagamento do cliente pelo site, login por CPF, score entre lojas e controle de estoque ficam para o futuro. Investigação histórica de possível exposição/CORS foi adiada pelo usuário. Novos índices SQL e paginação da carga completa de relatórios permanecem condicionados a medição representativa; não foram impostos como mudanças de contrato.

O SMTP real depende de configuração externa. A implantação exige regularização dos e-mails das lojas existentes: a migration não inventa contatos nem os confirma. O roteiro de testes e as evidências ficam em [Execução e validação](execucao-plano-2026-11-16.md).

## Histórico de revisão

| Revisão | Data | Alteração |
|---|---|---|
| 1.0 | 16/11/2026 | Requisitos consolidados do treinamento, biblioteca e decisões do usuário, com critérios verificáveis e limites da entrega. |
