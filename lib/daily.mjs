import {points} from './scoring.mjs';
export {points};
import {createHash,createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {practice} from './practice.mjs';
export const SPORTS=['NFL','NBA','MLB','CBB','CFB'];
export function chicagoDate(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
}
export function shuffle(items,seed){let n=[...seed].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0)>>>0;const out=[...items];for(let i=out.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
function legacyPoints(guess, answer) {
 if (guess === null) return 0;
 if (guess === answer) return 1000;
 return Math.min(999, Math.round(1000 * Math.exp(-4 * Math.abs(guess - answer) / answer)));
}
export function validateBank(bank){
 if(!bank||bank.schemaVersion!==1||!Array.isArray(bank.questions)||!Array.isArray(bank.schedule)||!Array.isArray(bank.ledger))throw Error('Invalid question bank format');
 const ids=new Set(),facts=new Set();
 for(const q of bank.questions){
  if(!/^[a-z0-9][a-z0-9-]{2,100}$/.test(q.id)||ids.has(q.id))throw Error('Invalid or duplicate question ID');ids.add(q.id);
  if(!/^[a-z0-9][a-z0-9:/._-]{2,180}$/.test(q.factId)||facts.has(q.factId))throw Error('Duplicate or invalid underlying fact');facts.add(q.factId);
  if(!SPORTS.includes(q.sport)||!Number.isFinite(q.answer)||q.answer<=0)throw Error('Sport or numerical answer invalid');
  for(const key of ['q','unit','fact','source'])if(typeof q[key]!=='string'||!q[key].trim()||q[key].length>1000)throw Error('Missing question text or source');
  if(!/^https:\/\//.test(q.url)||new URL(q.url).protocol!=='https:')throw Error('Source must use HTTPS');
  if(/^(what|which|in what) year\b/i.test(q.q))throw Error('Year questions are not allowed');
  if(!['draft','verified','approved'].includes(q.status))throw Error('Invalid review status');
  if(q.status!=='draft'&&(!q.verifiedAt||!q.evidence))throw Error('Verified questions need dated evidence');
  if(q.status==='approved'&&(!q.approvedBy||!q.approvedAt))throw Error('Approval must be recorded');
 }
 const days=new Set(),scheduled=new Set(),questionMap=new Map(bank.questions.map(q=>[q.id,q]));
 const priorFacts=new Map();
 for(const item of bank.ledger){if(!item.factId||!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||priorFacts.has(item.factId))throw Error('Invalid publication ledger');priorFacts.set(item.factId,item.date);}
 for(const day of bank.schedule){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day.date)||new Date(day.date+'T12:00:00Z').toISOString().slice(0,10)!==day.date||days.has(day.date))throw Error('Invalid or duplicate puzzle date');days.add(day.date);
  if(!Array.isArray(day.ids)||day.ids.length!==5||new Set(day.ids).size!==5)throw Error('A day needs five unique questions');
  const qs=day.ids.map(id=>questionMap.get(id));
  if(qs.some(q=>!q||q.status!=='approved'))throw Error('Only approved questions can be scheduled');
  if(new Set(qs.map(q=>q.sport)).size!==5)throw Error('Each day must contain all five sports');
  for(const q of qs){if(scheduled.has(q.id))throw Error('Question reused on another day');scheduled.add(q.id);if(priorFacts.get(q.factId)!==day.date)throw Error('Every scheduled fact needs its original ledger date; published facts cannot repeat');}
 }
 return bank;
}
export function loadBank(env=process.env){
 const raw=env.BALLPARK_BANK_GZIP_BASE64;
 if(!raw)return validateBank({schemaVersion:1,questions:[],schedule:[],ledger:[]});
 try{return validateBank(JSON.parse(gunzipSync(Buffer.from(raw,'base64'),{maxOutputLength:2_000_000}).toString('utf8')));}catch{throw Error('Question bank configuration is invalid');}
}
export function getPuzzle(bank,date){
 const scheduled=bank.schedule.find(day=>day.date===date);
 const qs=scheduled?scheduled.ids.map(id=>bank.questions.find(q=>q.id===id)):practice;
 const mode=scheduled?'daily':'practice';
 const revision=createHash('sha256').update(JSON.stringify(qs.map(q=>[q.id,q.factId,q.q,q.answer,q.unit,q.fact,q.source,q.url]))).digest('hex').slice(0,16);
 return {date,mode,id:`${mode}-${date}-${revision}`,questions:shuffle(qs,date)};
}
function signingKey(env){const key=env.BALLPARK_SIGNING_KEY;if(!key||key.length<32)throw Error('Game signing key is not configured');return key;}
export function signToken(payload,env=process.env){const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+createHmac('sha256',signingKey(env)).update(data).digest('base64url');}
export function readToken(token,env=process.env,now=Date.now()){
 if(typeof token!=='string'||token.length>4096)throw Error('Invalid game session');
 const [data,signature,...extra]=token.split('.');if(!data||!signature||extra.length)throw Error('Invalid game session');
 const expected=createHmac('sha256',signingKey(env)).update(data).digest(),actual=Buffer.from(signature,'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('Invalid game session');
 let value;try{value=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));}catch{throw Error('Invalid game session');}
 if(!Number.isFinite(value.exp)||value.exp<now||!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||!Number.isInteger(value.round)||value.round<0||value.round>5)throw Error('Game session expired');
 return value;
}
export function createSession(bank,env=process.env,now=Date.now()){
 const puzzle=getPuzzle(bank,chicagoDate(new Date(now)));
 const token=signToken({date:puzzle.date,puzzleId:puzzle.id,round:0,scoringVersion:2,exp:now+36*60*60*1000,nonce:randomBytes(12).toString('hex')},env);
 return {date:puzzle.date,puzzleId:puzzle.id,mode:puzzle.mode,questionCount:5,token};
}
export function sessionPuzzle(bank,token,env=process.env,now=Date.now()){
 const session=readToken(token,env,now),puzzle=getPuzzle(bank,session.date);
 if(puzzle.id!==session.puzzleId)throw Error('This puzzle changed. Start a new game.');
 if(session.round>=5)throw Error('This game is finished');
 return {session,puzzle,question:puzzle.questions[session.round]};
}
export function getQuestion(bank,token,env=process.env,now=Date.now()){
 const {session,question}=sessionPuzzle(bank,token,env,now);
 return {id:question.id,index:session.round,sport:question.sport,q:question.q,unit:question.unit};
}
export function scoreQuestion(bank,body,env=process.env,now=Date.now()){
 const {session,question}=sessionPuzzle(bank,body.token,env,now);
 const guess=body.guess;
 if(guess!==null&&(typeof guess!=='number'||!Number.isFinite(guess)||guess<0))throw Error('Enter a valid nonnegative number');
 if(guess===null&&body.timed!==true)throw Error('A blank guess is allowed only on timeout');
 return {index:session.round,guess,score:(session.scoringVersion===2?points:legacyPoints)(guess,question.answer,question.sport),answer:question.answer,fact:question.fact,source:question.source,url:question.url,token:signToken({...session,round:session.round+1},env)};
}
