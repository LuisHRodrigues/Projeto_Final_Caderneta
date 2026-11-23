# Confirmação de e-mail e publicação da V13

Estado: instruções para a alteração local; não indica publicação realizada.

## Preparação de 23/11/2026

- Provedor escolhido: Zoho CPaaS/ZeptoMail via SMTP (`smtp.zeptomail.com`, porta 587, STARTTLS,
  usuário `emailapikey`, remetente `avisos@caderneta.site`). O domínio apareceu verificado no painel.
- Senha cadastrada pelo responsável no Secret Manager como `caderneta-smtp-senha`, versão 1.
  Referência preparada no formulário do Cloud Run como `CADERNETA_SMTP_SENHA`; não foi publicada.
- As seis variáveis SMTP/URL foram preparadas na interface; a revisão foi bloqueada por falta de
  `artifactregistry.repositories.downloadArtifacts`. O formulário aberto não substitui configuração implantada.
- A imagem de produção observada era `7df1b22`, anterior ao adaptador SMTP. O exemplo Java HTTP da Zoho
  é uma alternativa de transporte; não é necessário adicioná-lo ao adaptador `EmailSmtp` existente.
- O primeiro pipeline após o push parou antes da compilação por HTTP 429 do Maven Central.
  CI e Docker passam a usar o mirror HTTPS do Central documentado pelo Google Cloud.
- Enviar o frontend à `main` agora só testa e gera o build. Depois de publicar e validar a API,
  executar manualmente `frontend`, na `main`, com `confirmo_backend`, para publicar o site.
- Não foram enviados e-mails reais nem executadas migrations de produção nesta preparação.

## Configuração de envio

A API usa um adaptador SMTP por meio do suporte de e-mail do Spring. As credenciais vêm do ambiente; nenhum provedor foi contratado ou configurado em produção nesta tarefa.

| Variável | Uso |
|---|---|
| `CADERNETA_URL_PUBLICA` | URL HTTPS pública do frontend, sem barra final. No teste local, `http://localhost:3000`. Define o destino do link enviado. |
| `CADERNETA_SMTP_HOST` | Host fornecido pelo serviço de envio. Vazio deixa confirmação pendente, sem simular sucesso de entrega. |
| `CADERNETA_SMTP_PORT` | Porta SMTP; padrão 587. |
| `CADERNETA_SMTP_USUARIO` | Usuário do serviço, quando exigir autenticação. |
| `CADERNETA_SMTP_SENHA` | Segredo do serviço; em produção, Secret Manager. Não versionar. |
| `CADERNETA_SMTP_REMETENTE` | Endereço remetente autorizado pelo provedor. |
| `CADERNETA_SMTP_STARTTLS` | Padrão `true`; manter em produção. `false` somente para servidor SMTP local de teste. |

O Compose principal repassa essas variáveis ao backend. Configure as mesmas no Cloud Run antes da publicação. Nunca colocar senha na URL, em parâmetros de linha de comando ou na documentação.

O endereço fica pendente até confirmar. Se o envio falhar ou não houver SMTP, o cadastro permanece recuperável por reenvio; logs registram somente a indisponibilidade e o ID da loja, sem token ou endereço. Há timeout de conexão, leitura e escrita; solicitação adicional da mesma loja exige um minuto de intervalo.

## Transição das lojas existentes

A V13 acrescenta estado de cliente, configuração de crédito, catálogo e confirmação de e-mail. Contatos existentes não são confirmados artificialmente. Até regularizar o endereço, a loja terá a operação bloqueada pela API.

Após a atualização, o gerente entra com o login atual, informa o e-mail da loja na tela de confirmação, recebe o link e confirma. Funcionários e clientes da loja pendente recebem orientação para procurar o gerente. Depois de confirmado, o estado é conferido em cada requisição. Trocar o endereço nas configurações volta a exigir confirmação.

Antes de publicar: disponibilizar SMTP e remetente, testar um destinatário autorizado pelo responsável e comunicar a regularização aos gerentes pelos canais que o responsável escolher. Esta tarefa não enviou mensagens à equipe nem e-mails reais.

## Banco e pipeline

O guia `INSTRUCOES-banco-producao.md`, fornecido pelo usuário em 16/11, foi usado como referência operacional. O acesso direto de produção serve a consulta, inspeção e backup; DDL é executado pelo Flyway no pipeline. Credenciais e captura da conversa não foram copiadas para o repositório.

1. Conferir mudanças concorrentes na `main` e consultar o histórico real de produção com TLS e verificação de identidade. Em 16/11, a `origin/main` consultada ainda terminava na V12; isso não substitui a consulta do banco na publicação.
2. Conferir que V13 está livre. Não editar migrations que já tenham sido aplicadas em algum ambiente compartilhado.
3. Executar `mvn verify` em MySQL e a suíte de integração com `-Dtest=NONE -Dsurefire.failIfNoSpecifiedTests=false -Dcaderneta.it.imagem-banco=pingcap/tidb:v8.5.7 -Dspring.jpa.database-platform=org.hibernate.community.dialect.TiDBDialect`. Não usar `-DskipTests` para alegar aprovação da integração.
4. Revisar API, frontend, migrations e configurações. As instruções antigas da conversa não autorizam apagar dados ou rodar DDL diretamente no banco.
5. Fazer backup restrito e verificar sua integridade antes de autorizar o job de migração. No procedimento atual do projeto para TiDB, não usar `--single-transaction`; seguir as opções e TLS documentados pelo responsável. O backup contém dados pessoais e fica fora do Git.
6. Publicar pelo workflow do backend com a confirmação de backup exigida pelo pipeline; implantar o frontend compatível e conferir saúde, cookies, mesma origem e fluxos afetados.
7. Conferir histórico do Flyway, estado dos jobs e operação da loja confirmada. Voltar imagem não desfaz a migration; eventual recuperação de dados precisa do backup e de compatibilidade de versões.

## Recuperação de falhas

- E-mail não chega: conferir configuração/remetente e disponibilidade do serviço, respeitar intervalo e reenviar. Não marcar `email_confirmado` manualmente para contornar o fluxo.
- Link expirado ou já utilizado: entrar como gerente e solicitar outro.
- Migration falha: não apagar histórico do Flyway nem reescrever versão aplicada; inspecionar a etapa e preparar correção incremental com o responsável.
- Falha após implantação: avaliar revisão anterior e esquema compatível; não remover tabelas novas ou histórico para “limpar” o ambiente.

Referência técnica do adaptador: [Spring Framework — Email](https://docs.spring.io/spring-framework/reference/integration/email.html). A decisão de domínio (bloqueio até confirmação) veio do usuário; o transporte SMTP configurável é a implementação desta tarefa.
