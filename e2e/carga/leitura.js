// Carga de leitura com sessão real: cada usuário virtual faz login (CSRF + cookie) e consulta telas.
// Uso: k6 run -e BASE_URL=http://localhost:3000 -e LOGIN=... -e SENHA=... leitura.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURACAO || '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],          // menos de 1% de erros
    http_req_duration: ['p(95)<800'],        // 95% abaixo de 800 ms
    checks: ['rate>0.99'],
  },
};

const COOKIE = __ENV.COOKIE || '__session';
// O cookie de produção é "Secure": o k6 não o reenvia em http://localhost, então é carregado à mão.
let sessao = null;

function guardarCookie(r) {
  const c = (r.cookies[COOKIE] || [])[0];
  if (c) sessao = c.value;
}
const cab = (extra = {}) => ({ headers: { ...extra, ...(sessao ? { Cookie: `${COOKIE}=${sessao}` } : {}) } });

function login() {
  const rc = http.get(`${BASE}/api/auth/csrf`, cab());
  guardarCookie(rc);
  const csrf = rc.json();
  const r = http.post(`${BASE}/api/auth/login`, JSON.stringify({ login: __ENV.LOGIN, senha: __ENV.SENHA }),
    cab({ 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }));
  check(r, { 'login 200': (x) => x.status === 200 });
  guardarCookie(r);
  return r.status === 200;
}

let logado = false;

export default function () {
  if (!logado) logado = login();
  for (const p of ['/api/resumo', '/api/clientes', '/api/dividas']) {
    const r = http.get(`${BASE}${p}`, cab());
    check(r, { [`${p} 200`]: (x) => x.status === 200 });
  }
  sleep(0.5);
}
