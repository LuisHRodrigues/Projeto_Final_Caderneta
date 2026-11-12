# Correções e limpeza do Docker — 12/11/2026

## Entrega

Os quatro problemas identificados na análise foram corrigidos. A aplicação corrigida está em execução em http://localhost:3000; a API retorna `{"status":"UP"}` em `/api/saude`.

### Scripts no Windows

Adicionadas regras `*.sh text eol=lf` em `.gitattributes` nos três repositórios. Os scripts existentes foram normalizados para LF. Isso impede que o checkout com `core.autocrlf=true` reintroduza o erro `/bin/bash^M`.

Foi executada uma instalação de MySQL 8.4 em volume vazio, montando o script real da máquina Windows na pasta de inicialização. O servidor iniciou e criou `caderneta_app` e `caderneta_migracao`. O container e o volume desse teste foram removidos.

### Senhas Unicode

O backend agora usa uma validação compartilhada: mínimo de oito caracteres e máximo de 72 bytes UTF-8, antes do BCrypt. A validação cobre cadastro de loja, funcionário, ativação de cliente, restauração de conta e bootstrap do gerente.

O frontend aplica a mesma regra e informa quando acentos e emojis ultrapassam o limite. A senha é validada sem normalizar ou remover seus caracteres. O transporte simulado de restauração e a documentação também foram alinhados.

Reprodução na aplicação corrigida:

- Senha com 40 letras `á` (80 bytes): HTTP 400 com `VALIDACAO`, em lugar de erro 500.
- Senha com 36 letras `á` (72 bytes): cadastro HTTP 201 e login HTTP 200.
- A mensagem de limite também foi conferida na interface real pelo Edge.

### Flutter

`.fvmrc`, script de entrega e documentação agora apontam Flutter 3.47.9, a mesma versão do Docker, CI e imagens de referência. A compilação e os testes desta entrega usaram essa versão em Docker. O SDK global da máquina não foi atualizado.

### Nome da loja

O formulário deixou de reutilizar o filtro de cargo. O nome comercial tem filtro próprio, aceita até 120 caracteres e preserva acentos e símbolos comerciais. Um nome de 59 caracteres com `&` foi digitado integralmente no navegador e persistido pela API.

## Testes concluídos

| Verificação | Resultado |
|---|---|
| Backend: unitários | 81 aprovados |
| Backend: integração MySQL | 18 aprovados |
| Backend: `mvn verify` | BUILD SUCCESS |
| Frontend: análise estática | Sem problemas |
| Frontend: suíte completa em Flutter 3.47.9 | 118 aprovados |
| Playwright no Edge | 4 aprovados |
| Build Docker de backend e frontend | Aprovado |
| Instalação MySQL com volume vazio e script montado do Windows | Aprovada |
| Regressão HTTP: senha Unicode inválida/válida e login | 400 / 201 / 200 |
| `git diff --check` nos três repositórios | Sem erros |

Logs e resultados: `output/correcoes-2026-11-12/`.

## Limpeza do Docker

Conforme a instrução expressa de apagar sem arquivar, foram removidos os ambientes antigos de homologação, recuperação, clone e instalação anterior, seus volumes sem uso, imagens antigas e caches de build. Os arquivos de backup iniciados antes dessa instrução foram apagados; nenhum backup dessa limpeza foi mantido.

Estado final conferido:

- Três containers em execução: frontend, backend e MySQL atual.
- Três imagens: frontend atual, backend atual e `mysql:8.4`.
- Um volume: `caderneta-analise-20261112_mysql84_data`, usado pelo banco atual.
- Cache de build: zero.
- Imagens: aproximadamente 1,678 GB; volume atual: aproximadamente 224 MB.
- A etapa final de `docker system prune --all` informou **24,45 GB recuperados**, além das remoções anteriores de imagens e volumes antigos. Essa é a métrica reportada pelo Docker, não uma medição de compactação do disco virtual no Windows.

Os bancos antigos foram excluídos. O banco atual foi mantido. A aplicação em execução recebeu as imagens corrigidas.

O `.env` local passou a selecionar o projeto atual com `COMPOSE_PROJECT_NAME=caderneta-analise-20261112`. Assim, executar `docker compose up -d` na raiz usa o ambiente existente, em vez de recriar os projetos anteriores. A tarefa de migração será recriada pelo Compose quando necessária.

O código corrigido e os relatórios desta entrega são versionados nos três repositórios. Credenciais, arquivos `.env`, logs e artefatos de execução permanecem locais e ignorados pelo Git.
