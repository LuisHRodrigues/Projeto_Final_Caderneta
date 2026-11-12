# Teste exploratório de usabilidade — 07/11/2026

**Atualização posterior:** os quatro achados abaixo foram corrigidos e retestados. Consulte [correções e resultados finais](correcoes-usabilidade-2026-11-07.md). Este documento conserva as observações da avaliação inicial.

## Resultado

Sistema executado em **http://localhost:13000**, API em http://localhost:18082/api, usando exclusivamente o Compose de homologação e seu banco isolado. Os serviços foram deixados em execução. Nenhuma correção de código, commit ou push foi feita nesta avaliação.

Foram aprovados **66 testes do frontend e 23 cenários HTTP**. A exploração no navegador encontrou quatro problemas, descritos abaixo. A aprovação da suíte existente não cobre os defeitos descobertos manualmente.

## Ambiente e método

- Windows, Microsoft Edge via Playwright; viewports de desktop (incluindo 1280 × 900) e celular (360 × 800).
- Interface e API reais; dados sintéticos de homologação. As duas suítes HTTP criaram funcionários, clientes, vendas e pagamentos. A execução manual acrescentou a venda #57, de R$ 10,00, com item de R$ 6,00.
- Integrador: `6cc0cdaef7395d47e44073c13d500430e4253716`.
- Frontend: `065f4e2efaf9fdd8d429d095f3d8e7a4b1027d17`.
- Backend: `8f894b5792f55981b8aedb148a4bc542764d9ae3`.
- O SHA-256 do `main.dart.js` local foi comparado ao arquivo servido pelo container; ambos: `397db142cd110e396f74419c283ffeb3777afd4eda289d0f6da0bf1648f67bb0`.
- Inspeção exploratória por agente, sem participantes humanos. Não representa medição de satisfação, tempo de tarefa ou teste com leitor de tela real. O celular foi avaliado por viewport; teclado virtual e aparelho físico não foram testados.

## Achados reproduzidos

### U01 — P2: busca perde texto e foco enquanto mantém o filtro

**Confirmado em Clientes e Vendas.** Em Pagamentos há o mesmo padrão no código, mas sua reprodução específica deve ser incluída no reteste.

Passos:

1. Abrir Vendas e preencher a busca com `57`.
2. Aguardar a resposta da consulta.
3. Observar que a lista fica filtrada (neste teste, de 50 para 5 vendas), enquanto a busca volta a ficar vazia e sem foco.
4. Em Clientes, clicar na busca e digitar `Cliente` com intervalo de 250 ms entre letras. O campo também é recriado e perde foco/texto durante a digitação.

**Impacto:** digitação normal é interrompida; o usuário vê uma lista reduzida sem indicação do filtro ativo. Apagar um campo já vazio não oferece um caminho claro para remover esse filtro.

**Causa identificada:** `AsyncView` usa uma `ValueKey` que inclui `_busca`; cada alteração desmonta também o `SearchField`, que está dentro de seu builder e não recebe controller nem valor inicial persistente. Referências: `frontend-repo/lib/pages/clientes_page.dart:26`, `frontend-repo/lib/pages/vendas_page.dart:41`, `frontend-repo/lib/pages/pagamentos_page.dart:27` e `frontend-repo/lib/widgets/common.dart:502`.

**Correção proposta:** manter os filtros e seus controllers fora da subárvore reconstruída pelo carregamento; atualizar somente os resultados. Acrescentar ação de limpar e, se adotado debounce, preservar foco e seleção durante toda a consulta.

**Reteste:** digitar lentamente sem precisar clicar novamente; texto permanece após resposta, paginação e atualização; limpar recupera a lista completa nas três telas.

Evidências: `../output/playwright/usabilidade-2026-11-07/filtro-invisivel.png` e `../output/playwright/usabilidade-2026-11-07/busca-clientes-teclado.png`. A inspeção do campo retornou `textoVisivel: ""` e `campoComFoco: false` após preencher a consulta.

### U02 — P2: erro do cadastro fica fora do diálogo e da árvore acessível

Passos:

1. Abrir Novo cliente e preencher os dados exigidos.
2. Enviar um e-mail malformado ou um CPF que já exista na homologação.
3. A API responde 400, respectivamente com validação de e-mail ou CPF duplicado.
4. O diálogo permanece aberto e conserva os campos, mas a mensagem é exibida em um SnackBar da página atrás da barreira modal.

**Observado:** a mensagem fica visualmente escurecida. Enquanto o diálogo está aberto, o snapshot da árvore de acessibilidade contém os campos e botões do formulário, mas não a mensagem de erro. Isso é uma barreira observada na árvore acessível; anúncio por leitor de tela real não foi medido.

**Impacto:** o usuário pode não perceber por que o cadastro falhou; a mensagem é temporária e não identifica o campo dentro do formulário. A validação local de e-mail também está ausente, fazendo o usuário depender desse retorno.

**Causa identificada:** o catch de `_salvar()` chama `toast(context, ...)`, que usa o `ScaffoldMessenger` da página (`frontend-repo/lib/pages/clientes_page.dart:413` e `frontend-repo/lib/widgets/common.dart:11`).

**Correção proposta:** apresentar erro persistente dentro do diálogo, com semântica de anúncio, e associar erros específicos aos campos. Validar o formato de e-mail localmente sem substituir a validação do servidor.

**Reteste:** erro de e-mail, CPF duplicado e indisponibilidade de rede permanecem legíveis e acessíveis dentro do diálogo; dados preenchidos são preservados.

Evidência: `../output/playwright/usabilidade-2026-11-07/erro-cpf-duplicado.png`.

### U03 — P3: campo promete CNPJ, mas só aceita CPF

Passos: em Novo cliente, informar o CNPJ válido `11.222.333/0001-81` no campo **CPF/CNPJ \*** e tentar cadastrar com os demais campos válidos.

**Observado:** o validador exibe **Informe um CPF válido**. O contrato documentado suporta CPF, e o formulário usa `cpfValido()` (`frontend-repo/lib/pages/clientes_page.dart:477`).

**Impacto:** a interface promete uma modalidade de cadastro que não existe, levando a tentativas que nunca serão aceitas.

**Correção proposta:** trocar o rótulo e os detalhes para CPF, respeitando o contrato atual. Aceitar CNPJ exigiria decisão de escopo e implementação do contrato correspondente.

**Reteste:** todas as referências ao documento identificam corretamente os documentos aceitos.

Evidência: `../output/playwright/usabilidade-2026-11-07/cnpj-valor.png`. Essa imagem também registra a rejeição de `1.000` no limite; nesse caso a mensagem sobre casas decimais não explica como escrever um milhar. Melhorar máscara/exemplo é uma oportunidade adicional de usabilidade, sem evidência de valor incorreto persistido.

### U04 — P3: histórico apresenta dinheiro fora do padrão brasileiro

Passos: entrar como cliente após a compra de teste e observar os últimos eventos do resumo.

**Observado:** o evento mostra `Nova compra de R$ 10.00`, enquanto os cards e o comprovante mostram `R$ 10,00`. O evento de pagamento mostra `R$ 1`, sem os centavos.

**Impacto:** representação inconsistente de valores em informações financeiras; não foi constatada alteração do saldo por esse problema.

**Origem:** concatenação direta de valores nos textos dos eventos, em `backend-repo/src/main/java/br/com/api_caderneta/services/VendaService.java:148` e `DividaService.java:159`.

**Correção proposta:** padronizar a apresentação monetária dos eventos para pt-BR com duas casas, preservando a estrutura dos dados financeiros.

**Reteste:** compras e pagamentos de R$ 1,00, R$ 10,00 e R$ 1.234,56 exibidos de forma consistente no histórico, resumo e comprovantes.

## Verificações aprovadas

| Execução | Resultado | Cobertura principal |
|---|---|---|
| `flutter test --no-pub --concurrency=1` | 66 aprovados | Sessão, permissões, HTTP, paginação, formulários, layouts, escala de texto e referências visuais existentes |
| `CADERNETA_REPETIR=1 node scripts/testar-homologacao.mjs` | 15 aprovados | Perfis, vendas sem/com itens, isolamento, crédito, fiador, idempotência, concorrência, ativação, logout e desativação |
| `node scripts/testar-financeiro.mjs` | 8 aprovados | Pagamentos concorrentes, edição/exclusão concorrentes, relatório por recebimento, comprovante, rollback e CPF concorrente |

O modo de repetição foi necessário porque a homologação já continha dados. A asserção de instalação inicialmente vazia foi deliberadamente dispensada e não foi contada entre os 23 cenários.

Na exploração de interface:

- Login vazio mostrou campos obrigatórios; login de gerente e posterior troca para cliente funcionaram.
- Diálogo de venda coube em 360 × 800; a soma de itens acima do total foi bloqueada preservando os dados.
- Venda #57 foi registrada após corrigir o item de R$ 11,00 para R$ 6,00, mantendo total de R$ 10,00.
- Cliente visualizou sua compra e os R$ 4,00 não detalhados; comprovante abriu em nova aba com os mesmos valores e opção Imprimir / Salvar PDF. A impressão física e a gravação de PDF pelo diálogo do sistema não foram executadas.
- Pagamento de R$ 81,00 para saldo de R$ 80,00 foi bloqueado no celular, juntamente com a exigência do método de pagamento. Não se confirmou esse pagamento inválido.
- Relatórios carregaram; a exportação gerou CSV com cabeçalho e linhas de vendas no período. A suíte HTTP validou o resumo financeiro.

As contas e resultados HTTP foram gravados pelos scripts no diretório ignorado `.homologacao/`; as credenciais não são reproduzidas neste relatório. Screenshots estão em `output/playwright/usabilidade-2026-11-07/`, também ignorado pelo Git. O ambiente de uso corrente não foi usado para criar os dados de teste.

## Limites e sequência recomendada

Priorizar U01 e U02, depois U03 e U04. Criar regressões específicas para digitação real e acessibilidade do erro modal quando essas correções forem implementadas. Repetir a exploração com funcionário na interface, aparelho físico, teclado virtual e leitor de tela. Os perfis de funcionário e cliente já foram exercitados pelos cenários HTTP, mas isso não equivale à cobertura completa de interface de cada perfil.

Não foram realizados estudo com usuários reais, testes de carga, auditoria exaustiva de segurança, indisponibilidade prolongada, teste em Safari/Firefox nem reexecução da suíte Maven nesta rodada. A execução atual usa as imagens de homologação existentes; o JavaScript servido foi conferido contra o artefato local.
