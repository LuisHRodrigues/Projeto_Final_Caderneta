# Análise da atualização da Caderneta — 12/11/2026

> Atualização: os problemas abaixo foram corrigidos e os ambientes antigos foram removidos por solicitação do usuário. Consulte [Correções e limpeza do Docker](correcoes-e-limpeza-docker-2026-11-12.md) para o estado final e os novos testes. Este arquivo preserva os resultados da análise anterior às correções.

## Resultado

A aplicação foi compilada e executada localmente. Backend, frontend e MySQL estão disponíveis pelo projeto Docker `caderneta-analise-20261112`, separado dos ambientes anteriores. A interface responde em http://localhost:3000 e a API em http://localhost:8082/api/saude.

Versões examinadas: integrador `c6a210e`, backend `ce37aab` e frontend `8692826`.

Os testes existentes passaram no ambiente correto, mas verificações adicionais identificaram problemas de instalação e validação descritos abaixo. Esta análise não constitui validação da implantação em produção.

## Mudanças principais

- Várias lojas no mesmo sistema: cadastro público, nome da loja na interface, CPF único por loja e papel, migração dos registros anteriores para a Loja Principal.
- Isolamento por loja nas entidades do Hibernate, conferência ao carregar entidades e filtros explícitos nas consultas SQL de resumo e auditoria.
- Promoção e rebaixamento entre funcionário e gerente, com encerramento das sessões para aplicar o novo perfil.
- Exclusão lógica e restauração de funcionários, preservando pessoa, login e histórico. Recadastrar um CPF excluído reativa a conta anterior.
- Máscaras e validações de formulários, indicadores de carregamento e retorno à página inicial do perfil após login.
- Spring Boot 4.1.2, MySQL 8.4, migração Flyway como tarefa separada, configuração de TiDB, Firebase Hosting e Cloud Run.
- Novas suítes de integração, navegador e carga, além de pipelines de verificação e publicação manual.

## Verificação executada

| Verificação | Resultado |
|---|---|
| Build Docker de backend e frontend | Aprovado |
| Backend: testes unitários | 80 aprovados |
| Backend: integração com MySQL 8.4 | 17 aprovados |
| Backend: `mvn verify` | BUILD SUCCESS |
| Frontend: análise estática com Flutter 3.47.9 | Sem problemas |
| Frontend: suíte completa com Flutter 3.47.9 | 116 aprovados |
| Imagens de referência do login com Flutter 3.47.9 | 5 aprovadas, também incluídas na suíte completa |
| Frontend: suíte com SDK local 3.47.6 | 111 aprovados; 5 imagens de referência divergiram |
| Playwright no Edge: carregamento/CSP, redirecionamento anônimo e credenciais incorretas | 3 aprovados |
| Playwright no Edge: login, cookie e sessão ao recarregar rota interna | Aprovado no reteste com conta criada pelo cadastro público |
| Cadastro público real de loja | HTTP 201; login posterior aprovado |
| nginx: SPA, bootstrap, saúde, CSRF, sessão anônima e `/api` | Respostas esperadas: 200, 200, 200, 200, 401 e 404 |
| Interface de cadastro em largura de 390 px | Captura inspecionada; parte visível sem transbordamento horizontal |
| Bootstrap do gerente em outro banco vazio | Aprovado; gerente criado antes do encerramento da tarefa |

Os testes de integração incluem isolamento entre lojas, permissões, mudança de perfil, exclusão/restauração, pagamentos concorrentes, idempotência de operações e migrations, instalação nova e atualização de um banco em V8 para V12.

Não foram executados testes de carga k6, integração com TiDB ou verificações contra Firebase/Cloud Run. O teste visual de 390 px não substitui uma avaliação completa em um celular físico.

## Problemas confirmados

### 1. Instalação pelo Windows falha com script em CRLF — prioridade alta

Arquivo: `backend-repo/scripts/criar-usuarios-mysql.sh:1`; montagem no serviço MySQL em `docker-compose.yml`.

Com `core.autocrlf=true` e sem regra `.gitattributes` para esse script, o checkout recebeu CRLF. Na primeira inicialização do volume novo, o MySQL encerrou com código 126 e a mensagem:

```text
/bin/bash^M: bad interpreter: No such file or directory
```

O banco fica parcialmente inicializado e os usuários da aplicação/migração não são criados. Reiniciar o container sozinho não reexecuta automaticamente os scripts de inicialização em um volume já inicializado.

Para continuar a análise, normalizei somente esse arquivo local para LF, recriei o container de teste preservando seu volume e executei o script de usuários manualmente. Não há diferença de conteúdo lógico no `git diff`.

Recomendação: versionar uma regra `*.sh text eol=lf` no repositório dono do script e conferir os demais scripts shell. Documentar a recuperação de uma instalação interrompida sem remover dados.

### 2. Senha Unicode aceita pela validação causa erro 500 — prioridade média

Referências: `backend-repo/src/main/java/br/com/api_caderneta/auth/Dtos.java:66`, `backend-repo/src/main/java/br/com/api_caderneta/lojas/LojaService.java:79`, `frontend-repo/lib/pages/ativar_page.dart:16` e `frontend-repo/lib/core/validacoes.dart:139`.

Reprodução real: cadastrar uma loja com senha formada por 40 letras `á`. A senha tem 40 caracteres e 80 bytes em UTF-8. Ela passa na validação de tamanho, mas o BCrypt rejeita mais de 72 bytes. A API retornou HTTP 500 com `ERRO_INTERNO`; o log confirmou `IllegalArgumentException: password cannot be more than 72 bytes`.

A incompatibilidade também está presente nas validações compartilhadas de criação/restauração de contas. O teste dinâmico desta análise foi feito especificamente no cadastro de loja.

Recomendação: validar o limite de bytes UTF-8 no backend antes do encoder e apresentar uma mensagem correspondente no frontend. Retornar erro de validação, preservando a senha informada sem truncamento silencioso. Acrescentar cobertura para letras acentuadas e emojis.

### 3. Versão do Flutter diverge entre os caminhos de execução — prioridade média

Referências: `frontend-repo/.fvmrc:1`, `scripts/Preparar-Entrega.ps1:6`, `frontend-repo/Dockerfile:8`, `subir.sh:8` e workflow do frontend.

Docker, CI e `subir.sh` usam 3.47.9. O `.fvmrc` e o script de entrega ainda exigem 3.47.6. O efeito foi reproduzido: cinco testes visuais falham com o SDK local 3.47.6 e passam com 3.47.9; a suíte completa com 3.47.9 aprovou 116 testes.

Recomendação: alinhar `.fvmrc`, scripts, documentação e imagens de referência na versão escolhida, atualmente 3.47.9 no build novo.

### 4. Nome da loja é truncado silenciosamente em 50 caracteres — prioridade baixa

Referências: `frontend-repo/lib/pages/criar_loja_page.dart:110`, `frontend-repo/lib/core/validacoes.dart:45` e `backend-repo/src/main/java/br/com/api_caderneta/auth/Dtos.java:58`.

O campo de nome da loja reutiliza `filtroCargo`, cujo limite é 50 caracteres, enquanto o contrato do backend aceita até 120. Na digitação real no navegador, `Mercado de Produtos Naturais e Alimentos da Cidade de Teste` terminou como `Mercado de Produtos Naturais e Alimentos da Cidade`, com 50 caracteres, sem mensagem de validação.

Recomendação: usar filtro próprio para nome comercial, com limite de 120 e critérios de caracteres adequados ao nome da loja.

## Observações sobre a execução

Uma execução inicial do login retornou 401 porque a primeira montagem do ambiente ficou sem o gerente de bootstrap. Essa ausência não se reproduziu ao executar a tarefa contra outro banco vazio: o gerente foi criado corretamente. Portanto, não é apresentada aqui como defeito confirmado do bootstrap.

O Docker/WSL interrompeu uma rodada de testes durante uma situação de falta de espaço. Após reiniciar o ambiente, as verificações foram repetidas com limites de memória nos containers auxiliares. Os resultados da tabela são das execuções concluídas; a exceção de JVM da rodada interrompida não foi atribuída ao código da aplicação.

Os bancos e containers anteriores não foram iniciados para aplicar as novas migrations. Os dados criados nesta análise são fictícios e pertencem ao ambiente separado.

## Acesso e evidências

- Interface: http://localhost:3000
- Conta da loja de teste: `analise.gerente`; senha gerada no arquivo local ignorado pelo Git `.env.analise-2026-11-12`, chave `CADERNETA_BOOTSTRAP_SENHA`.
- Comando de operação: `docker compose --env-file .env.analise-2026-11-12 -p caderneta-analise-20261112 ps`.
- Logs e resultados: `output/analise-2026-11-12/`, incluindo `backend-verify-final.log`, `flutter-3.47.9-completo.log`, `e2e.log`, `e2e-login-reteste.log`, `senha-unicode.json`, `cadastro-loja.json`, `http-nginx.json` e `bootstrap-banco-novo.log`.
- Captura inspecionada: `output/playwright/cadastro-loja-390.png`.

As regras de negócio e validações não foram corrigidas nesta etapa. A intervenção no código existente limitou-se à normalização local dos finais de linha do script de usuários. Nenhum commit ou push foi realizado.
