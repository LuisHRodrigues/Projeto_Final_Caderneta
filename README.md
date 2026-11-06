# Caderneta — vendas a prazo

Integrador da API Spring Boot (backend-repo) e da interface Flutter Web (frontend-repo), mantidas como submódulos Git. A versão local usa MySQL e nginx.

A venda possui total financeiro próprio e itens opcionais. Itens não recalculam a dívida. A soma pode ser menor ou igual ao total; a diferença aparece como **Valor não detalhado**.

- [Contrato e permissões vigentes](docs/contratos-e-permissoes.md)
- [Entrega e evidências de homologação](docs/entrega-homologacao-2026-11-05.md)
- [Análise anterior e referências da biblioteca](docs/analise-biblioteca-pendencias-2026-11-05.md)

## Ferramentas e preparação

Use JDK 21 e Maven 3.9.9 (imagem maven:3.9.9-eclipse-temurin-21), Flutter **3.47.6** / Dart 3.13.5 e Docker Compose com suporte a !reset e !override. O frontend tem pubspec.lock e .fvmrc; a compilação não deve atualizar dependências automaticamente.

Copie .env.example para .env e gere três senhas diferentes, alfanuméricas, com no mínimo 32 caracteres. Não versione .env, dumps, contas de homologação ou certificados. Para a primeira instalação, preencha os dados do gerente de bootstrap com CPF válido. Em bases existentes, mantenha as contas já registradas. O usuário caderneta_app recebe DML; caderneta_migracao recebe os privilégios necessários às migrations. Nenhum datasource da aplicação usa root.

O script abaixo testa e empacota usando banco **isolado**. Ele gera .env.homologacao se necessário. Não substitui a revisão do histórico de uma base existente.

~~~powershell
./scripts/Preparar-Entrega.ps1
~~~

O Dockerfile do frontend consome build/web já validado pelo script. O Dockerfile.local do backend consome o JAR validado. Para build independente da API, o Dockerfile normal também compila com Maven/JDK 21.

## Ambiente local HTTP

~~~powershell
docker compose up -d --build
~~~

| Serviço | Endereço |
|---|---|
| Aplicação | http://localhost:3000 |
| API direta | http://localhost:8082/api/saude |
| MySQL local | 127.0.0.1:3307 |

As portas locais são publicadas somente em loopback. O navegador utiliza /api na mesma origem do frontend. O perfil dev permite cookie em HTTP; fora dele, o cookie exige HTTPS. O backend aguarda o banco e o frontend aguarda a prontidão da API. Logs operacionais: docker compose logs --tail=100 backend.

Para atualizar o ambiente existente **após** homologação, restauração de backup e preparação dos artefatos:

~~~powershell
./scripts/Atualizar-Local.ps1
~~~

Esse script exige histórico reconciliado até V7/V8, verifica colisões normalizadas de CPF, faz backup, preserva as imagens anteriores, separa usuários de banco e troca as credenciais antes de recriar os containers. Compara contagens e impressões digitais financeiras. Não remove o volume mysql_data.

## Homologação isolada

~~~powershell
./scripts/Preparar-Homologacao.ps1
docker compose --env-file .env.homologacao -f docker-compose.homologacao.yml -p caderneta-homologacao up -d --build
node scripts/testar-homologacao.mjs
node scripts/testar-financeiro.mjs
~~~

API :18082, frontend :13000, volume homologacao_mysql. O primeiro teste exige instalação vazia e cria dados sintéticos exclusivamente nesse ambiente. Para repetir sem apagar dados de teste, use CADERNETA_REPETIR=1; essa opção apenas dispensa a asserção de instalação inicialmente vazia. Os cenários financeiros criam temporariamente um trigger de falha no banco isolado para provar rollback.

## Migrations e dados existentes

B7 é uma baseline cumulativa **sem demonstrações** para instalações novas; V8 acrescenta versão, operador, idempotência, unicidade normalizada de CPF e índices. V1–V7 permanecem intactas para não invalidar checksums de instalações existentes. Hibernate apenas valida o esquema.

Não aplique V2–V4 antigas pendentes em base de uso corrente: contêm cargas/destruições históricas. Restaure primeiro um dump em outro banco e reconcilie seu histórico. Colisões antigas de CPF impedem V8 e precisam de análise explícita; não são renumeradas nem mescladas automaticamente. CPFs históricos inválidos também são relatados, sem fabricação de identidade.

Fixtures são exclusivas do perfil dev-fixtures e identificam pessoas por CPF/login. A exceção Flyway repeatable:missing é exclusiva de dev; produção exige histórico compatível. Não habilite fixtures em uma base com dados reais.

## Backup e recuperação

~~~powershell
./scripts/Backup-Caderneta.ps1
./scripts/Agendar-Backup.ps1
~~~

Backups padrão em C:/Dev/Backups/Caderneta/diarios, com SHA-256 e retenção inicial de 30 dias. A tarefa Windows executa às 03h e tenta recuperar execuções perdidas quando disponível. Depende do Windows, da sessão configurada e do Docker Desktop em funcionamento.

Restauração: mantenha o dump original, restaure em **outro banco/volume isolado**, confira o histórico Flyway e inicie a mesma imagem da API apontando para esse banco. Verifique prontidão, login, IDs, contagens e saldos. Somente depois planeje a recuperação da base de uso corrente. Nunca execute down -v como procedimento de atualização.

Imagens anteriores desta entrega: caderneta-backend:antes-20261105 e caderneta-frontend:antes-20261105. V8 é aditiva; não tente desfazê-la apagando colunas ou histórico. Em falha, interrompa novas escritas, preserve os logs e use as imagens/configuração preservadas ou uma restauração previamente verificada.

## HTTPS separado

docker-compose.producao.yml remove as portas diretas de API/MySQL e publica nginx em 80/443. Defina TLS_CERT_DIR com fullchain.pem e privkey.pem e use um .env próprio de produção. O nginx aplica TLS 1.2/1.3 e encaminha host/protocolo; os endpoints públicos de login e ativação têm limitação de tentativas.

A configuração HTTPS foi validada localmente. Domínio, certificado público e publicação externa não fazem parte desta entrega.

## Escopo adiado

Offline, conta própria do fiador, bot com envio real, pagamentos online, estorno e recuperação de senha. Não há commit ou push automático.
