# Correções de usabilidade e reteste — 07/11/2026

Complementa o [teste exploratório inicial](teste-usabilidade-2026-11-07.md).

## Alterações

- **U01 — busca:** Clientes, Vendas e Pagamentos mantêm o campo montado durante a atualização dos resultados. O carregamento recebe uma identidade de consulta sem recriar a interface; respostas antigas continuam sendo descartadas. O campo conserva texto e foco e oferece **Limpar busca**. O conteúdo também mantém sua identidade quando aparece um erro de consulta.
- **U02 — cadastro:** erros do servidor permanecem dentro do diálogo, com região de anúncio acessível, preservando os dados. O conteúdo rola até a mensagem após uma falha. E-mail de cliente e fiador recebe validação local de formato; e-mail vazio continua permitido, e o servidor continua responsável pela validação definitiva.
- **U03 — documento:** cadastro e detalhes usam o rótulo **CPF**, em conformidade com o contrato existente.
- **U04 — moeda:** compras, pagamentos e lembretes novos são gerados pelo backend com separador brasileiro e duas casas decimais. A interface também formata os padrões conhecidos dos eventos legados, sem reescrever o histórico persistido ou alterar os valores financeiros. Mensagens já formatadas permanecem intactas.

## Testes automatizados

| Verificação | Resultado |
|---|---|
| `flutter analyze --no-pub` | Sem problemas |
| `flutter test --no-pub --concurrency=1` | 71 aprovados |
| Maven/JDK 21, `mvn -B package`, com banco de homologação | 66 aprovados, build concluído |
| `CADERNETA_REPETIR=1 node scripts/testar-homologacao.mjs` | 15 aprovados na API atualizada |
| `node scripts/testar-financeiro.mjs` | 8 aprovados na API atualizada |

**Total: 160 testes/cenários automatizados aprovados**, além da exploração no navegador. A asserção de instalação vazia não foi executada, pois a homologação já possuía dados sintéticos.

Foram acrescentados cinco cenários no frontend (digitação/foco/limpeza em três telas, erro modal/rótulo/e-mail e apresentação dos eventos) e um teste de moeda no backend. A primeira execução detectou uma diferença entre espaço comum e espaço não separável no texto legado; a compatibilidade foi ajustada e a suíte completa do frontend passou na execução final.

## Ambiente

Somente a homologação é atualizada: frontend `http://localhost:13000`, API `http://localhost:18082/api`. Os dados de uso corrente não são usados para os testes. Não há migrations novas nem alterações de contrato financeiro.

## Validação da versão executável

Build Flutter Web release concluído com API real e recursos locais. Imagens de frontend e backend reconstruídas e containers de homologação atualizados. Foi comparado o SHA-256 dos artefatos locais com os arquivos efetivamente presentes nos containers:

- `main.dart.js`: `b98ea57fd4de6ed60e7b8a12cb93b7d721edb20eb9c55a52fc608a5be11f2177`.
- JAR da API: `aeece676ab49164e2c477b5724864419ccbc47058222bb7e7800fefd54b8ca27`.

## Reteste no navegador

| Achado | Resultado observado |
|---|---|
| U01 | Digitação de `Cliente`, com 200 ms entre letras, preservou texto e foco em Clientes, Vendas e Pagamentos. A ação Limpar busca removeu a consulta e recuperou a listagem sem filtro. |
| U02 | CPF duplicado retornou 400 com mensagem dentro do diálogo, presente na árvore de acessibilidade. Nome, telefone, CPF, e-mail e limite permaneceram preenchidos. Conferido em desktop e em página carregada com viewport 360 × 800. |
| U02 — conexão | Abortada somente a requisição POST de cadastro para simular perda de conexão. O diálogo mostrou `Sem conexão. Tente novamente.` e conservou os campos. A interceptação foi removida em `finally`; a nova tentativa voltou a alcançar o servidor e recebeu o erro esperado de CPF duplicado. Nenhum cadastro duplicado foi criado. |
| U03 | O formulário executável mostra CPF; o teste automatizado também confirmou a ausência do rótulo CPF/CNPJ. |
| U04 | Histórico da API atualizada mostrou compras e pagamentos novos com duas casas e vírgula decimal. Na segunda página, a venda legada #57 apareceu como `R$ 10,00`, sem alteração do registro persistido. |

Screenshots no diretório ignorado `output/playwright/usabilidade-2026-11-07/`:

- `reteste-busca-clientes.png`, `reteste-busca-vendas.png`, `reteste-busca-pagamentos.png`.
- `reteste-erro-cadastro-desktop.png`, `reteste-erro-cadastro-mobile.png`, `reteste-erro-rede-mobile.png`.
- `reteste-historico-novo.png`, `reteste-historico-legado.png`.

Os quatro achados iniciais estão corrigidos e aprovados nos cenários de reteste acima. O ambiente atualizado foi deixado em execução. A avaliação usa viewport de celular e árvore de acessibilidade; não substitui teste em aparelho físico nem com leitor de tela real.
