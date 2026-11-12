# Testes ampliados: celular, recuperação e carga — 07/11/2026

> Registro histórico da rodada de 07/11. Os ambientes Docker antigos mencionados neste relatório foram removidos em 12/11 por solicitação do usuário; consulte [Correções e limpeza do Docker](correcoes-e-limpeza-docker-2026-11-12.md) para o estado posterior.

## Escopo

Executar as verificações possíveis sem participantes adicionais, complementando os [160 testes anteriormente aprovados](correcoes-usabilidade-2026-11-07.md). Esta rodada acrescentou sete cenários de integração de recuperação/carga, três explorações de interface por perfil/falha e observação do aparelho real. Não foi realizado estudo com usuários.

Não houve alteração no código da aplicação nesta rodada. Os dados de uso corrente não foram usados nem modificados.

## Aparelho real e rede local

- Aparelho observado: **POCO X8 Pro**, navegador **Vivaldi**, espelhado pelo **Vincular ao Celular** do Windows.
- A homologação foi disponibilizada temporariamente em `http://192.168.0.100:13001` por uma porta adicional do frontend vinculada somente ao IP Wi-Fi. A API direta e o MySQL mantiveram suas restrições anteriores.
- Override local ignorado pelo Git: `.homologacao/docker-compose.celular.yml`. O acesso padrão `http://localhost:13000` foi preservado.
- O usuário abriu o endereço no aparelho. A captura mostrou o login do Caderneta carregado no navegador real. A seleção do campo Login e sua edição com teclas físicas foram observadas.
- O teclado virtual não abriu de forma consistente. O mesmo problema de ausência automática apareceu ao focar a barra nativa de endereço do navegador. O menu flutuante de entrada ofereceu **Mostrar teclado na tela**, que efetivamente exibiu o teclado virtual.
- Após a primeira abertura, a repetição do foco/alternância de campos voltou a apresentar o problema relatado pelo usuário. O transporte de texto pela ferramenta de espelhamento também não foi confiável: teclas físicas simples chegaram ao Login, mas a digitação de texto e o ensaio de senha não permitiram concluir uma sessão autenticada.

**Situação do teclado: pendente de isolamento.** Há interferência observável do modo de teclado físico/espelhamento, mas esta avaliação não separou completamente navegador, teclado Android, espelhamento e comportamento do Flutter. Não foi aplicada uma correção especulativa ao aplicativo nem declarado que o problema foi resolvido. O próximo experimento discriminante é repetir o foco e a reabertura no aparelho sem o espelhamento/teclado físico, comparando um campo nativo do navegador e o formulário do sistema.

Uma conta temporária de funcionário foi criada somente para o ensaio do aparelho e desativada ao final. O navegador do telefone ficou no login, com os campos limpos.

Evidência local: `output/playwright/usabilidade-2026-11-07/celular-real-login.png`. Não se considera o fluxo completo de login, venda ou pagamento aprovado no aparelho real; esses fluxos foram exercitados pelos outros métodos descritos abaixo e na rodada anterior.

## Backup e recuperação isolada

Execução local: `node .homologacao/testar-recuperacao-carga.mjs`.

- Origem: `caderneta-homologacao-mysql-1`.
- Backup transacional com `mysqldump --single-transaction`, incluindo rotinas, triggers e eventos.
- SHA-256 do dump: `a2c6e00c33bc6ade9a8b6ebff9cd9c7ca4c3c05c757c0b508ae228a8c9bbe14a`.
- Restauração em **novo container e novo volume** `caderneta_recuperacao_74301595`, sem sobrescrever o banco de origem.
- Comparação aprovada das contagens de 15 tabelas de negócio/infraestrutura e dos totais de vendas, dívidas e pagamentos. As tabelas voláteis de sessão não foram usadas nessa comparação.
- Baseline restaurada: 31 clientes, 61 vendas/dívidas e 35 pagamentos; vendido/original R$ 4.185,00, saldo R$ 3.590,00 e pagamentos R$ 595,00.
- A API iniciou sobre a cópia restaurada, validou o esquema e permitiu login.

A comparação valida contagens e totais, não constitui comparação byte a byte de cada registro.

## Massa adicional e carga de leitura

Somente na cópia restaurada foram acrescentados **200 clientes, 400 vendas e 40 pagamentos**. As vendas de R$ 10,01 somaram R$ 4.004,00, os pagamentos somaram R$ 40,00 e o aumento esperado do saldo foi de R$ 3.964,00. A asserção desse saldo passou.

Paginação por filtro recuperou os 200 clientes novos em duas páginas de 100, sem repetição de IDs entre as páginas.

Foram medidas 100 requisições por nível de concorrência, alternando listagens de clientes, vendas, dívidas, resumo operacional e resumo de relatórios:

| Solicitações simultâneas | Requisições | Erros | Mediana | p95 | Máximo | Requisições/s |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 100 | 0 | 46 ms | 100 ms | 162 ms | 20,73 |
| 5 | 100 | 0 | 68 ms | 149 ms | 191 ms | 69,08 |
| 10 | 100 | 0 | 107 ms | 255 ms | 295 ms | 80,44 |

Os totais financeiros permaneceram iguais antes/depois dessas 300 consultas. A API de ensaio foi reiniciada; a prontidão, o novo login e a preservação financeira foram conferidos novamente.

Ao fim do ensaio, as contagens e totais financeiros da homologação de origem ainda coincidiam com a baseline anterior ao teste de carga. As alterações sintéticas posteriores da exploração no navegador estão explicitadas na seção seguinte.

São medições locais em uma carga finita de leitura, não um SLA ou teste de saturação de produção. A massa foi inserida sequencialmente. Concorrência de escrita em maior volume e execução prolongada não foram medidas nesta rodada.

Resultado estruturado: `.homologacao/recuperacao-carga-74301595/resultado.json`. Dump e volume foram preservados; os dois containers de ensaio foram parados após as verificações.

## Exploração no navegador com API real

1. **Funcionário e permissões:** a interface mostrou apenas o menu permitido ao funcionário. A navegação direta para `/relatorios` levou a **Acesso negado**, conservando a sessão e os caminhos permitidos.
2. **Resposta perdida depois da gravação:** como funcionário, foi enviada uma venda sintética de R$ 1,23. O interceptador deixou o servidor concluir a gravação e abortou a entrega da primeira resposta ao navegador. O formulário exibiu a falha e conservou o valor. No reenvio, a chave de idempotência foi igual e o servidor devolveu a mesma venda **#71**. A quantidade de vendas do funcionário passou de 10 para 11, comprovando uma única inclusão. A interceptação foi removida em `finally`.
3. **Cliente e consulta:** após trocar para a conta do cliente correspondente, sua área de compras exibiu a venda #71 de R$ 1,23. A consulta também foi observada em viewport de 360 × 640; isso é simulação de largura, sem teclado Android real.

A venda #71 foi mantida como evidência sintética na homologação. A criação/desativação da conta temporária também foi mantida em auditoria. Não houve transação externa, pagamento real ou escrita na base de uso corrente.

Evidências locais adicionais em `output/playwright/usabilidade-2026-11-07/`:

- `simulacao-resposta-perdida.png`.
- `simulacao-cliente-compra.png`.

## Resultado

Recuperação, paginação ampliada, leitura concorrente, preservação de saldo, reinício da API, reenvio sem duplicação e explorações de funcionário/cliente foram aprovados nos limites descritos. O acesso do celular pela LAN foi confirmado. A reabertura do teclado no aparelho continua pendente de isolamento, sem diagnóstico definitivo de defeito na aplicação.
