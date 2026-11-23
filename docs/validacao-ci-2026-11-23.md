# Validação e sincronização de 23/11/2026

## Problema e correção

O pipeline do backend no commit `1fe7c33` falhou antes de compilar: Maven Central respondeu HTTP 429
ao baixar o parent do Spring Boot. Não foi falha de teste da aplicação.

O commit `a77d8c0` configura `config/maven-settings.xml` no CI e no Docker. Usa o mirror HTTPS
do Maven Central documentado pelo [Google Cloud](https://docs.cloud.google.com/docs/buildpacks/java#google_cloud_hosted_maven_central_mirror).
Versões das dependências, exigência de testes e trava de migrations foram preservadas.

O commit `f9fd9f8` do frontend mantém análise, testes, build e varredura a cada push, mas exige
execução manual com `confirmo_backend` para publicar. Isso permite sincronizar o código sem
colocar o site novo em produção antes da API e do banco compatíveis.

## Evidências

- [Backend no GitHub](https://github.com/EduardoBR2003/api-caderneta/actions/runs/45284840458):
  92 unitários aprovados; 20 integrações MySQL aprovadas; 19 integrações TiDB aprovadas e 1 caso
  legado ignorado pela suíte; gitleaks e Trivy aprovados. Os dois comandos Maven terminaram em
  `BUILD SUCCESS`. O job `implantar` ficou vermelho exclusivamente na trava de migrations novas,
  antes do build/publicação da imagem e antes de executar Flyway em produção.
- [Frontend no GitHub](https://github.com/Artur-Duarte17/Caderneta/actions/runs/45284849042):
  análise sem problemas, 140 testes aprovados (incluindo 5 goldens), build de produção e gitleaks
  aprovados. Workflow concluído com sucesso; publicação ignorada por se tratar de push.
- Local: `mvn -B -s config/maven-settings.xml verify`: 92 unitários e 20 integrações MySQL aprovados.
  A suíte TiDB com as mesmas opções do CI aprovou 19 casos e ignorou 1 caso legado.
- Local: build Docker da etapa `build` aprovado com o novo settings, inclusive os testes unitários.
- Local Windows: `flutter analyze` aprovado; 135 testes funcionais aprovados. Os 5 goldens diferiram
  em pixels da rasterização de fontes. Conferência em Linux: 5 goldens aprovados; no CI Linux, a
  suíte completa de 140 casos passou. Referências visuais não foram alteradas para esconder a diferença.

Logs locais ficam em `output/ci-*-2026-11-23.log`, ignorados pelo Git. Os testes SMTP usam servidor
local, sem senha de produção nem envio a destinatários reais.

## O que ainda falta para produção

1. Concluir a revisão SMTP do Cloud Run: falta a permissão de leitura da imagem no Artifact Registry.
   As variáveis preenchidas no formulário ainda não equivalem a uma revisão implantada.
2. Conferir histórico real do Flyway/V13 e backup do banco, e combinar regularização dos e-mails
   das lojas existentes. A nova API exige confirmação do contato.
3. Executar o workflow `backend`, `main`, com `confirmo_migracao` após cumprir esses requisitos.
4. Validar a API e executar `frontend`, `main`, com `confirmo_backend`.
5. Validar envio real autorizado, confirmação da loja e operação do site.

O exemplo HTTP da Zoho não foi incorporado: o projeto já usa `EmailSmtp` com `EnviarEmail`.
Não foram executadas migrations nem publicados backend/frontend em produção nesta tarefa.
