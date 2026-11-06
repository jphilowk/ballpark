import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import './scripts/build-site.mjs';
import daily from './api/daily.js';import question from './api/question.js';import score from './api/score.js';
try{process.loadEnvFile('.env.local');}catch{}
const root=fileURLToPath(new URL('./public/',import.meta.url));
const handlers={'/api/daily':daily,'/api/question':question,'/api/score':score};
http.createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(handlers[path])return await handlers[path](req,res);
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root)||path.split('/').some(part=>part.startsWith('.')))throw Error();
  const body=await readFile(file);res.setHeader('Content-Type',({'.css':'text/css','.js':'text/javascript','.png':'image/png','.html':'text/html','.txt':'text/plain'})[extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('Local: http://localhost:'+(process.env.PORT||3000)));
