# Versionamento da entrega homologada

Em 06/11/2026, o usuário autorizou expressamente criar commits descritivos e enviar diretamente à branch **main** dos três repositórios. Esta autorização substitui a restrição anterior de não fazer commit/push. Não houve abertura de pull request nem alteração de hospedagem externa.

| Repositório | Destino | Commit |
|---|---|---|
| Backend | [api-caderneta/main](https://github.com/EduardoBR2003/api-caderneta/tree/main) | [8f894b5](https://github.com/EduardoBR2003/api-caderneta/commit/8f894b5792f55981b8aedb148a4bc542764d9ae3) |
| Frontend | [Caderneta/main](https://github.com/Artur-Duarte17/Caderneta/tree/main) | [065f4e2](https://github.com/Artur-Duarte17/Caderneta/commit/065f4e2efaf9fdd8d429d095f3d8e7a4b1027d17) |
| Integrador | [Projeto_Final_Caderneta/main](https://github.com/LuisHRodrigues/Projeto_Final_Caderneta/tree/main) | Commit que adiciona este registro e atualiza os ponteiros dos submódulos |

O backend foi enviado antes do integrador; o frontend ganhou main a partir de seu histórico atual, mantendo master intacta. Os submódulos passam a declarar main em .gitmodules para futuras atualizações remotas.

## Mensagens dos commits

- Backend: feat: concluir regras financeiras e isolamento da Caderneta. Corpo descreve itens opcionais, propriedade das vendas, crédito, versão, bloqueios, idempotência, fiador, recebimentos, relatórios, auditoria, B7/V8 e 65 testes.
- Frontend: feat: concluir fluxos, permissões e interface da Caderneta. Corpo descreve cadastro rápido, edição autorizada, cobrança, comprovantes, paginação, enquadramento, fontes/goldens, login após logout, nginx e 66 testes.
- Integrador: feat: integrar versão homologada e operação local da Caderneta. Corpo descreve submódulos, Compose isolado/local/HTTPS, preparação, atualização com preservação de dados, backup e documentação.

## Validação e arquivos preservados

Antes do versionamento, os arquivos foram comparados ao manifesto caderneta-local-20261106-ffdf8c1b693a: nenhuma diferença no conteúdo homologado. As mudanças adicionais desta etapa são documentais e de controle de versão: registro da autorização, acompanhamento de main e exclusão das imagens temporárias de falhas do Git.

Foram aproveitadas as validações concluídas da mesma implementação: 65 testes backend, 66 Flutter, 23 cenários HTTP repetidos e homologação dos três perfis. O B7 foi mantido exatamente como homologado, inclusive a linha vazia final, para preservar o arquivo de migration.

Credenciais locais, contas de teste, dumps, evidências privadas, builds e imagens em test/failures não integram os commits. Esses arquivos permanecem locais. Os oito CPFs históricos inválidos e as demais limitações seguem descritos no [relatório de entrega](entrega-homologacao-2026-11-05.md).
