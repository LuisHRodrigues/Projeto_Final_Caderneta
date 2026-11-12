import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=process.env.CADERNETA_TEST_URL||'http://localhost:18082/api';
const env=Object.fromEntries(fs.readFileSync('.env.homologacao','utf8').trim().split(/\r?\n/).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const results=[];
const senha=crypto.randomBytes(14).toString('hex');
const runId=Date.now().toString().slice(-8);
function cpf(base){let c=base;for(let j=9;j<11;j++){let n=0;for(let i=0;i<j;i++)n+=Number(c[i])*(j+1-i);let d=(n*10)%11;c+=d==10?'0':String(d);}return c;}
class Client{
 cookies=new Map();token=null;
 async req(method,path,body,expected=200,extra={}){
  const res=await fetch(base+path,{method,headers:{Accept:'*/*',Cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'Content-Type':'application/json'}),...(this.token?{'X-CSRF-TOKEN':this.token}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
  for(const s of res.headers.getSetCookie()){const [pair]=s.split(';'),i=pair.indexOf('=');this.cookies.set(pair.slice(0,i),pair.slice(i+1));}
  const text=await res.text();let data;try{data=JSON.parse(text);}catch{data=text;}
  if(Array.isArray(expected)){assert(expected.includes(res.status),method+' '+path+' '+JSON.stringify(data));if(!data||typeof data!=="object")data={body:data};data._httpStatus=res.status;}else assert.equal(res.status,expected,method+' '+path+' '+JSON.stringify(data));
  return data;
 }
 async csrf(){const t=await this.req('GET','/auth/csrf');this.token=t.token;}
 async login(login,senha){await this.csrf();await this.req('POST','/auth/login',{login,senha});await this.csrf();return this;}
}
async function test(nome,fn){try{await fn();results.push({nome,status:'aprovado'});console.log('OK '+nome);}catch(e){results.push({nome,status:'falhou',erro:e.message});fs.writeFileSync('.homologacao/resultados.json',JSON.stringify(results,null,2));throw e;}}
const g=await new Client().login(env.CADERNETA_BOOTSTRAP_LOGIN,env.CADERNETA_BOOTSTRAP_SENHA);
const a=new Client(),b=new Client(),c=new Client(),d=new Client();
const loginA='func.a.'+runId,loginB='func.b.'+runId,loginC='cliente.c.'+runId,loginD='cliente.d.'+runId;
let ca,cb,va,vb;
async function venda(ator,cliente,total,itens=[],expected=201,chave=crypto.randomUUID()){
 return ator.req('POST','/vendas',{clienteId:cliente,valorTotal:total,itens},expected,{'Idempotency-Key':chave});
}
if(process.env.CADERNETA_REPETIR !== '1') await test('Instalação limpa sem demonstrações',async()=>{const r=await g.req('GET','/vendas');assert.equal(r.totalElements,0);});
await test('Criação de dois funcionários e dois clientes',async()=>{
 await g.req('POST','/auth/funcionarios',{nome:'Funcionário A',cpf:cpf('173'+runId.slice(-6)),login:loginA,senha,cargo:'Vendedor'},201);
 await g.req('POST','/auth/funcionarios',{nome:'Funcionário B',cpf:cpf('274'+runId.slice(-6)),login:loginB,senha,cargo:'Vendedor'},201);
 await a.login(loginA,senha);await b.login(loginB,senha);
 ca=await g.req('POST','/clientes',{nome:'Cliente C '+runId,cpf:cpf('375'+runId.slice(-6)),limiteCredito:1000,prazoPagamentoPadraoDias:30},201);
 cb=await g.req('POST','/clientes',{nome:'Cliente D '+runId,cpf:cpf('476'+runId.slice(-6)),limiteCredito:1000,prazoPagamentoPadraoDias:30},201);
});
await test('Venda sem itens, com detalhamento parcial e completo',async()=>{
 va=await venda(a,ca.id,100);
 assert.equal(va.itens.length,0);assert.equal(Number(va.valorTotal),100);
 for(const preco of [60,100]){const v=await venda(a,ca.id,100,[{descricaoProduto:'Produto',quantidade:1,precoUnitario:preco}]);assert.equal(Number(v.valorTotal),100);}
});
await test('Itens acima do total e dados inválidos não gravam',async()=>{
 const antes=(await g.req('GET','/vendas')).totalElements;
 await venda(a,ca.id,100,[{descricaoProduto:'Inválido',quantidade:1,precoUnitario:100.01}],400);
 await venda(a,ca.id,-1,[],400);
 await venda(a,ca.id,100,[{descricaoProduto:'Inválido',quantidade:-1,precoUnitario:10}],400);
 assert.equal((await g.req('GET','/vendas')).totalElements,antes);
});
await test('Isolamento por vendedor em lista, detalhe, edição e comprovante',async()=>{
 vb=await venda(b,cb.id,100);
 const lista=await a.req('GET','/vendas');assert(!lista.content.some(v=>v.id==vb.id));
 await a.req('GET','/vendas/'+vb.id,undefined,404);
 await a.req('PUT','/vendas/'+vb.id,{versao:vb.versao,itens:[]},404);
 await a.req('GET','/vendas/'+vb.id+'/comprovante',undefined,404);
 assert((await g.req('GET','/vendas')).content.some(v=>v.id==vb.id));
});
await test('Cobrança compartilhada sem itens da venda alheia',async()=>{
 const divida=await a.req('GET','/dividas/'+vb.dividaId);assert.equal(divida.itens,undefined);
 await a.req('POST','/dividas/'+vb.dividaId+'/pagamentos',{valorPago:20,metodoPagamento:'PIX'},200,{'Idempotency-Key':crypto.randomUUID()});
});
await test('Após pagamento, itens editáveis e campos financeiros bloqueados',async()=>{
 const atual=await b.req('GET','/vendas/'+vb.id);
 const r=await b.req('PUT','/vendas/'+vb.id,{versao:atual.versao,itens:[{descricaoProduto:'Detalhado depois',quantidade:1,precoUnitario:60}]});
 assert.equal(Number(r.valorTotal),100);
 assert.equal(Number((await a.req('GET','/dividas/'+vb.dividaId)).valorPendente),80);
 await b.req('PUT','/vendas/'+vb.id,{versao:r.versao,valorTotal:110},409);
 await b.req('PUT','/vendas/'+vb.id,{versao:r.versao,itens:[]});
 const ultimo=await b.req('GET','/vendas/'+vb.id);assert.equal(ultimo.itens.length,0);
});
await test('Versão desatualizada retorna conflito',async()=>{const v=await a.req('GET','/vendas/'+va.id);await a.req('PUT','/vendas/'+va.id,{versao:v.versao,itens:[]});await a.req('PUT','/vendas/'+va.id,{versao:v.versao,itens:[]},409);});
await test('Edição revalida crédito e preserva data/hora',async()=>{
 const v=await a.req('GET','/vendas/'+va.id);
 await a.req('PUT','/vendas/'+va.id,{versao:v.versao,valorTotal:5000},400);
 const editado=await a.req('PUT','/vendas/'+va.id,{versao:v.versao,valorTotal:110});
 assert.equal(editado.dataHora,v.dataHora);
});
await test('Funcionário não altera crédito/prazo por nenhum caminho',async()=>{
 await a.req('PATCH','/clientes/'+ca.id+'/limite-credito',{novoLimiteCredito:5000},403);
 await a.req('PATCH','/clientes/'+ca.id+'/prazo-pagamento',{novoPrazoPagamentoDias:90},403);
 await a.req('PUT','/clientes/'+ca.id,{limiteCredito:5000},403);
 await a.req('PUT','/clientes/'+ca.id,{prazoPagamentoPadraoDias:90},403);
 await a.req('POST','/clientes',{nome:'Crédito indevido',cpf:cpf('577'+runId.slice(-6)),limiteCredito:1},403);
});
await test('Idempotência de venda e pagamento após perda simulada da resposta',async()=>{
 const chave=crypto.randomUUID();const v1=await venda(a,ca.id,10,[],201,chave);const v2=await venda(a,ca.id,10,[],201,chave);assert.equal(v1.id,v2.id);
 await venda(a,ca.id,11,[],409,chave);
 const pk=crypto.randomUUID(),body={valorPago:1,metodoPagamento:'PIX'};
 await a.req('POST','/dividas/'+v1.dividaId+'/pagamentos',body,200,{'Idempotency-Key':pk});
 await a.req('POST','/dividas/'+v1.dividaId+'/pagamentos',body,200,{'Idempotency-Key':pk});
 assert.equal(Number((await g.req('GET','/dividas/'+v1.dividaId)).valorPendente),9);
});
await test('Duas vendas concorrentes respeitam o limite',async()=>{
 const novo=await g.req('POST','/clientes',{nome:'Concorrência '+runId,cpf:cpf('678'+runId.slice(-6)),limiteCredito:100,prazoPagamentoPadraoDias:30},201);
 const respostas=await Promise.all([a,b].map(ator=>ator.req('POST','/vendas',{clienteId:novo.id,valorTotal:80,itens:[]},[201,400],{'Idempotency-Key':crypto.randomUUID()}).then(x=>({ok:x._httpStatus==201,x})).catch(e=>({ok:false,e}))));
 assert.equal(respostas.filter(x=>x.ok).length,1);
 assert.equal(respostas.find(x=>!x.ok).x._httpStatus,400);
 const dividas=await g.req('GET','/dividas/cliente/'+novo.id);assert.equal(dividas.reduce((t,d)=>t+Number(d.valorPendente),0),80);
});
await test('Cadastro com fiador inválido reverte integralmente',async()=>{
 const antes=(await g.req('GET','/clientes')).totalElements;
 await g.req('POST','/clientes',{nome:'Não deve persistir',cpf:cpf('789'+runId.slice(-6)),fiador:{nome:'Inválido',cpf:'11111111111'}},400);
 assert.equal((await g.req('GET','/clientes')).totalElements,antes);
});
await test('Cliente com fiador e limpeza explícita de campos opcionais',async()=>{
 const r=await g.req('POST','/clientes',{nome:'Com fiador '+runId,cpf:cpf('891'+runId.slice(-6)),email:'x@example.com',fiador:{nome:'Fiador '+runId,cpf:cpf('912'+runId.slice(-6)),telefone:'11999999999'}},201);
 const cli=await g.req('GET','/clientes/'+r.id);assert(cli.fiador?.id);
 await g.req('PUT','/clientes/'+r.id,{email:null,fiador:null});
 const atual=await g.req('GET','/clientes/'+r.id);assert.equal(atual.email,null);assert.equal(atual.fiador,null);
});
await test('Dois clientes ativam contas e permanecem isolados',async()=>{
 for(const [cli,login,ator] of [[ca,loginC,c],[cb,loginD,d]]){
  const convite=await g.req('POST','/clientes/'+cli.id+'/convite',{},201);
  const anon=new Client();await anon.csrf();
  await anon.req('POST','/auth/registro-cliente',{codigoConvite:convite.codigo,cpf:cli.cpf,login,senha},201);
  await anon.req('GET','/auth/me',undefined,401);
  await ator.login(login,senha);
 }
 const cv=await c.req('GET','/me/vendas');assert(cv.content.every(v=>v.clienteId==ca.id));
 const dv=await d.req('GET','/me/vendas');assert(dv.content.every(v=>v.clienteId==cb.id));
 await c.req('GET','/vendas',undefined,403);
 await c.req('GET','/me/vendas/'+vb.id+'/comprovante',undefined,404);
 assert.equal((await c.req('GET','/me/resumo')).saldo>0,true);
});
await test('CSRF ausente, logout e desativação invalidam acessos',async()=>{
 const token=a.token;a.token=null;await a.req('POST','/vendas',{clienteId:ca.id,valorTotal:1},403,{'Idempotency-Key':crypto.randomUUID()});a.token=token;
 await c.req('POST','/auth/logout',{} ,204);await c.req('GET','/me/dividas',undefined,401);
 const contas=await g.req('GET','/usuarios?size=100');const alvo=contas.content.find(u=>u.login==loginD);
 await g.req('PATCH','/usuarios/'+alvo.id+'/ativo',{ativo:false},204);
 await d.req('GET','/auth/me',undefined,401);
});
fs.writeFileSync('.homologacao/contas.json',JSON.stringify({gerente:{login:env.CADERNETA_BOOTSTRAP_LOGIN,senha:env.CADERNETA_BOOTSTRAP_SENHA},funcionarioA:{login:loginA,senha},funcionarioB:{login:loginB,senha},clienteC:{login:loginC,senha},clienteD:{login:loginD,senha},ca,cb,va,vb},null,2));
fs.writeFileSync('.homologacao/resultados.json',JSON.stringify(results,null,2));
console.log('Homologação HTTP concluída: '+results.length+' cenários.');
