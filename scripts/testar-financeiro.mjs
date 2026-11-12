import {execFileSync} from 'node:child_process';
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
async function test(nome,fn){try{await fn();results.push({nome,status:'aprovado'});console.log('OK '+nome);}catch(e){results.push({nome,status:'falhou',erro:e.message});fs.writeFileSync('.homologacao/financeiro.json',JSON.stringify(results,null,2));throw e;}}

const contas=JSON.parse(fs.readFileSync('.homologacao/contas.json','utf8'));
const g=await new Client().login(contas.gerente.login,contas.gerente.senha);
const a=await new Client().login(contas.funcionarioA.login,contas.funcionarioA.senha);
const b=await new Client().login(contas.funcionarioB.login,contas.funcionarioB.senha);
const cli=await g.req('POST','/clientes',{nome:'Cenários financeiros '+runId,cpf:cpf('923'+runId.slice(-6)),limiteCredito:10000,prazoPagamentoPadraoDias:30},201);
async function venda(total=50){return a.req('POST','/vendas',{clienteId:cli.id,valorTotal:total,itens:[]},201,{'Idempotency-Key':crypto.randomUUID()});}
async function pagar(ator,v,valor){return ator.req('POST','/dividas/'+v.dividaId+'/pagamentos',{valorPago:valor,metodoPagamento:'PIX'},[200,400,404],{'Idempotency-Key':crypto.randomUUID()});}
await test('Pagamentos simultâneos não excedem saldo',async()=>{
 const v=await venda();const rr=await Promise.all([pagar(a,v,40),pagar(b,v,40)]);
 assert.equal(rr.filter(r=>r._httpStatus==200).length,1);
 const d=await g.req('GET','/dividas/'+v.dividaId);assert.equal(Number(d.valorPendente),10);assert.equal(d.pagamentos.length,1);
});
await test('Pagamento concorrente com exclusão preserva integridade',async()=>{
 const v=await venda();const rr=await Promise.all([pagar(a,v,10),g.req('DELETE','/vendas/'+v.id,undefined,[204,409])]);
 if(rr[0]._httpStatus==200){
  const d=await g.req('GET','/dividas/'+v.dividaId);assert.equal(Number(d.valorPendente),40);assert.equal(d.pagamentos.length,1);
 }else{assert.equal(rr[0]._httpStatus,404);await g.req('GET','/vendas/'+v.id,undefined,404);}
});
await test('Pagamento concorrente com edição não sobrescreve recebimento',async()=>{
 const v=await venda();const rr=await Promise.all([pagar(b,v,10),a.req('PUT','/vendas/'+v.id,{versao:v.versao,valorTotal:70},[200,409])]);
 const atual=await a.req('GET','/vendas/'+v.id),d=await g.req('GET','/dividas/'+v.dividaId);
 assert.equal(Number(atual.valorTotal)-Number(d.valorPendente),10);
 assert.equal(d.pagamentos.length,1);
});
await test('Recebimento do mês inclui compra de período anterior',async()=>{
 const v=await venda(100),antiga=new Date();antiga.setUTCMonth(antiga.getUTCMonth()-3);
 const data=antiga.toISOString();await a.req('PUT','/vendas/'+v.id,{versao:v.versao,dataHora:data});
 const d=await pagar(b,v,20);const hoje=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
 const pagos=await g.req('GET','/relatorios/pagamentos?inicio='+hoje+'&fim='+hoje);
 const pagamento=(await g.req('GET','/dividas/'+v.dividaId)).pagamentos.at(-1);
 assert(pagos.some(p=>p.id==pagamento.id));
 const vendasHoje=await g.req('GET','/relatorios/vendas-a-prazo?dataInicio='+hoje+'&dataFim='+hoje);
 assert(!vendasHoje.vendas.some(x=>x.id==v.id));
 const inicio=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(antiga);
 const filtro=await g.req('GET','/dividas?status=VENCIDA');assert(filtro.content.some(d=>d.id==v.dividaId));
 const rel=await g.req('GET','/relatorios/debitos-pendentes?dataInicio='+inicio+'&dataFim='+hoje+'&status=VENCIDA');assert(rel.dividas.some(d=>d.id==v.dividaId));
 const futura=new Date();futura.setDate(futura.getDate()+30);
 await g.req('PUT','/dividas/'+v.dividaId,{dataVencimento:futura.toISOString().slice(0,10)});
 assert.equal((await g.req('GET','/dividas/'+v.dividaId)).statusDivida,'PAGA_PARCIALMENTE');
 await a.req('PUT','/dividas/'+v.dividaId,{dataVencimento:futura.toISOString().slice(0,10)},403);
});
await test('Comprovante escapa conteúdo e respeita autorização',async()=>{
 const v=await venda(50);await a.req('PUT','/vendas/'+v.id,{versao:v.versao,itens:[{descricaoProduto:'<script>alert(1)</script>',quantidade:1,precoUnitario:10}]});
 const html=await a.req('GET','/vendas/'+v.id+'/comprovante');
 assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>alert'));
 await b.req('GET','/vendas/'+v.id+'/comprovante',undefined,404);
 const r=await pagar(b,v,10);const p=r.pagamentos.at(-1);
 assert((await b.req('GET','/dividas/'+v.dividaId+'/pagamentos/'+p.id+'/comprovante')).includes('Recebimento #'));
});
function sql(texto){return execFileSync('docker',['exec','-i','caderneta-homologacao-mysql-1','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot api_caderneta_database'],{input:texto,encoding:'utf8'});}
await test('Falha do histórico reverte venda, dívida e chave de operação',async()=>{
 const antes=(await g.req('GET','/vendas')).totalElements,chave=crypto.randomUUID();
 sql("CREATE TRIGGER teste_historico BEFORE INSERT ON notificacoes FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Falha simulada de histórico';");
 try{await a.req('POST','/vendas',{clienteId:cli.id,valorTotal:1,itens:[]},[409,500],{'Idempotency-Key':chave});}
 finally{sql('DROP TRIGGER teste_historico;');}
 assert.equal((await g.req('GET','/vendas')).totalElements,antes);
 await a.req('POST','/vendas',{clienteId:cli.id,valorTotal:1,itens:[]},201,{'Idempotency-Key':chave});
 assert.equal((await g.req('GET','/vendas')).totalElements,antes+1);
});
await test('Unicidade de CPF normalizado em cadastros concorrentes',async()=>{
 const documento=cpf('834'+runId.slice(-6)),body={nome:'Mesmo CPF '+runId,cpf:documento};
 const rr=await Promise.all([g.req('POST','/clientes',body,[201,400,409]),g.req('POST','/clientes',{...body,cpf:documento.slice(0,3)+'.'+documento.slice(3,6)+'.'+documento.slice(6,9)+'-'+documento.slice(9)},[201,400,409])]);
 assert.equal(rr.filter(r=>r._httpStatus==201).length,1);
});
await test('Resumo do relatório usa a mesma carteira e data dos recebimentos',async()=>{
 const inicio='2000-01-01',fim='2100-12-31',q='?inicio='+inicio+'&fim='+fim;
 const r=await g.req('GET','/relatorios/resumo'+q);
 const v=await g.req('GET','/relatorios/vendas-a-prazo?dataInicio='+inicio+'&dataFim='+fim);
 const d=await g.req('GET','/relatorios/debitos-pendentes?dataInicio='+inicio+'&dataFim='+fim);
 const p=await g.req('GET','/relatorios/pagamentos'+q);
 const cents=x=>Math.round(Number(x)*100);
 assert.equal(cents(r.vendido),v.vendas.reduce((s,x)=>s+cents(x.valorTotal),0));
 assert.equal(cents(r.recebido),p.reduce((s,x)=>s+cents(x.valorPago),0));
 assert.equal(cents(r.saldo),d.dividas.filter(x=>x.statusDivida!=='CANCELADA').reduce((s,x)=>s+cents(x.valorPendente),0));
 assert.equal(Number(r.quantidadeVendas),v.vendas.length);
 await a.req('GET','/relatorios/resumo'+q,undefined,403);
 await g.req('GET','/relatorios/resumo?inicio=2026-12-01&fim=2026-01-01',undefined,400);
});

fs.writeFileSync('.homologacao/financeiro.json',JSON.stringify(results,null,2));console.log('Cenários adicionais: '+results.length);
