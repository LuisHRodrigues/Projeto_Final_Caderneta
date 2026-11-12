import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.CADERNETA_TEST_URL||'http://127.0.0.1:3000/api';
const contas=JSON.parse(fs.readFileSync(process.env.CADERNETA_SMOKE_CONTAS||'.homologacao/contas-locais.json','utf8'));
class Sessao {
 cookies=new Map();token=null;
 async req(method,path,body,status=200){
  const res=await fetch(base+path,{method,headers:{Accept:'*/*',Cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'Content-Type':'application/json'}),...(this.token?{'X-CSRF-TOKEN':this.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  for(const s of res.headers.getSetCookie()){const pair=s.split(';')[0],i=pair.indexOf('=');this.cookies.set(pair.slice(0,i),pair.slice(i+1));}
  assert.equal(res.status,status,method+' '+path);
  const text=await res.text();try{return JSON.parse(text);}catch{return text;}
 }
 async csrf(){this.token=(await this.req('GET','/auth/csrf')).token;}
 async entrar(conta){await this.csrf();await this.req('POST','/auth/login',{login:conta.login,senha:conta.senha});await this.csrf();}
 async sair(){await this.req('POST','/auth/logout',undefined,204);await this.req('GET','/auth/me',undefined,401);this.token=null;}
}
const s=new Sessao(),resultado=[];let primeiroCliente=null;
await s.req('GET','/saude');
await s.req('GET','/auth/me',undefined,401);
for(const conta of contas){
 await s.entrar(conta);
 const me=await s.req('GET','/auth/me'),u=me.usuario??me;
 assert.equal(u.perfil,conta.perfil);
 if(conta.perfil==='CLIENTE'){
  const v=await s.req('GET','/me/vendas'),d=await s.req('GET','/me/dividas');
  assert(v.content.every(x=>x.clienteId===u.pessoaId));
  assert(d.content.every(x=>x.clienteId===u.pessoaId));
  await s.req('GET','/vendas',undefined,403);
  if(primeiroCliente&&primeiroCliente.cliente!==u.pessoaId)await s.req('GET','/me/vendas/'+primeiroCliente.venda+'/comprovante',undefined,404);
  if(v.content.length){primeiroCliente??={cliente:u.pessoaId,venda:v.content[0].id};assert((await s.req('GET','/me/vendas/'+v.content[0].id+'/comprovante')).includes('Venda #'));}
  await s.req('GET','/me/resumo');
 }else{
  const v=await s.req('GET','/vendas');
  if(conta.perfil==='GERENTE'){await s.req('GET','/auditoria');}
  else{
   assert(v.content.every(x=>x.funcionarioId===u.pessoaId));
   await s.req('GET','/usuarios',undefined,403);
   // A venda alheia é escolhida pelos dados efetivos, sem depender de IDs fixos.
   const g=contas.find(x=>x.perfil==='GERENTE');const t=new Sessao();await t.entrar(g);const todas=await t.req('GET','/vendas');const outra=todas.content.find(x=>x.funcionarioId!==u.pessoaId);await t.sair();
   if(outra){await s.req('GET','/vendas/'+outra.id,undefined,404);await s.req('GET','/vendas/'+outra.id+'/comprovante',undefined,404);}
   await s.req('GET','/dividas');
  }
  await s.req('GET','/resumo');
 }
 await s.sair();
 resultado.push({perfil:conta.perfil,status:'aprovado'});
}
fs.writeFileSync(process.env.CADERNETA_SMOKE_RESULTADO||'.homologacao/smoke-local.json',JSON.stringify({base,resultado,financeiroAlterado:false},null,2));
console.log('Prontidão, quatro contas, isolamento e logout aprovados; nenhuma escrita financeira.');
