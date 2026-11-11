import {test} from 'node:test';import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {chicagoDate,validateBank,loadBank,getPuzzle,createSession,getQuestion,scoreQuestion,readToken,signToken,SPORTS} from './lib/daily.mjs';
const env={BALLPARK_SIGNING_KEY:'test-only-signing-key-with-more-than-32-chars'};
const now=Date.parse('2026-11-06T18:00:00Z');
function fixture(){const questions=SPORTS.map((sport,i)=>({id:'question-'+sport.toLowerCase(),factId:'fact/'+sport.toLowerCase(),sport,q:'How many points did this team score?',answer:10+i,unit:'points',fact:'An exact historical match.',source:'Official league',url:'https://example.com/official',status:'approved',evidence:'Fixture evidence',verifiedAt:'2026-11-06',approvedAt:'2026-11-06',approvedBy:'Test'}));return {schemaVersion:1,questions,schedule:[{date:'2026-11-06',ids:questions.map(q=>q.id)}],ledger:questions.map(q=>({factId:q.factId,date:'2026-11-06'}))};}
test('Central date respects both DST changes and midnight',()=>{assert.equal(chicagoDate(new Date('2026-11-06T05:59:59Z')),'2026-11-05');assert.equal(chicagoDate(new Date('2026-11-06T06:00:00Z')),'2026-11-06');assert.equal(chicagoDate(new Date('2026-07-06T05:00:00Z')),'2026-07-06');assert.equal(chicagoDate(new Date('2026-11-01T07:01:00Z')),'2026-11-01');assert.equal(chicagoDate(new Date('2026-03-08T08:01:00Z')),'2026-03-08');});
test('published set is shared, approved, and contains all sports',()=>{const bank=validateBank(fixture());const a=getPuzzle(bank,'2026-11-06'),b=getPuzzle(bank,'2026-11-06');assert.deepEqual(a,b);assert.equal(a.mode,'daily');assert.deepEqual(a.questions.map(q=>q.sport).sort(),[...SPORTS].sort());assert.equal(getPuzzle(bank,'2026-11-07').mode,'practice');});
test('invalid banks reject duplicate facts, unapproved schedules, missing sports and ledger changes',()=>{for(const mutation of [b=>b.questions[1].factId=b.questions[0].factId,b=>b.questions[0].status='verified',b=>b.questions[0].answer=0,b=>b.questions[1].sport='NFL',b=>b.ledger=[],b=>b.schedule.push({...b.schedule[0],date:'2026-11-07'}),b=>b.questions[0].q='What year was this game played?']){const b=fixture();mutation(b);assert.throws(()=>validateBank(b));}});
test('question response never exposes answers, sources or future rounds',()=>{const bank=fixture(),game=createSession(bank,env,now),q=getQuestion(bank,game.token,env,now);assert.equal(q.index,0);assert.equal('answer'in q,false);assert.equal('fact'in q,false);assert.equal('url'in q,false);assert.equal('questions'in game,false);});
test('guesses reveal only this answer and advance the signed round',()=>{const bank=fixture(),game=createSession(bank,env,now),puzzle=getPuzzle(bank,game.date),q=puzzle.questions[0];const result=scoreQuestion(bank,{token:game.token,guess:q.answer,timed:false},env,now);assert.equal(result.score,1000);assert.equal(result.answer,q.answer);assert.equal(readToken(result.token,env,now).round,1);assert.equal(getQuestion(bank,result.token,env,now).index,1);assert.throws(()=>scoreQuestion(bank,{token:game.token,guess:null,timed:false},env,now));assert.equal(scoreQuestion(bank,{token:game.token,guess:null,timed:true},env,now).score,0);for(const guess of [-1,NaN,Infinity,'10',undefined])assert.throws(()=>scoreQuestion(bank,{token:game.token,guess},env,now));});
test('tampered, expired and wrong-puzzle tokens fail; started games survive midnight',()=>{const bank=fixture(),game=createSession(bank,env,now);assert.throws(()=>getQuestion(bank,game.token+'x',env,now));assert.throws(()=>getQuestion(bank,game.token,env,now+37*3600000));assert.equal(getQuestion(bank,game.token,env,now+18*3600000).index,0);const wrong=signToken({...readToken(game.token,env,now),puzzleId:'wrong'},env);assert.throws(()=>getQuestion(bank,wrong,env,now));});
test('private environment packing loads and rejects corruption',()=>{const bank=fixture();assert.deepEqual(loadBank({...env,BALLPARK_BANK_GZIP_BASE64:gzipSync(JSON.stringify(bank)).toString('base64')}),bank);assert.throws(()=>loadBank({BALLPARK_BANK_GZIP_BASE64:'not-a-bank'}));});
test('finishing five rounds closes the token; exact retry is deterministic',()=>{const bank=fixture(),game=createSession(bank,env,now);let token=game.token;const body={token,guess:5,timed:false};assert.deepEqual(scoreQuestion(bank,body,env,now),scoreQuestion(bank,body,env,now));for(let i=0;i<5;i++)token=scoreQuestion(bank,{token,guess:5,timed:false},env,now).token;assert.throws(()=>getQuestion(bank,token,env,now));});

test('an existing session keeps its scoring curve after a scoring update',()=>{
 const bank=fixture(),game=createSession(bank,env,now);
 const question=getPuzzle(bank,game.date).questions[0];
 const payload=readToken(game.token,env,now);
 delete payload.scoringVersion;
 const guess=question.answer*1.25;
 const oldRound=scoreQuestion(bank,{token:signToken(payload,env),guess},env,now);
 const newRound=scoreQuestion(bank,{token:game.token,guess},env,now);
 assert.equal(oldRound.score,368);
 assert.equal(newRound.score,625);
 assert.equal(readToken(newRound.token,env,now).scoringVersion,2);
 assert.equal(readToken(oldRound.token,env,now).scoringVersion,undefined);
});

test('daily scoring uses the current question’s sport',()=>{
 const bank=fixture(),game=createSession(bank,env,now);
 const questions=getPuzzle(bank,game.date).questions;
 const round=questions.findIndex(question=>question.sport==='MLB');
 const token=signToken({...readToken(game.token,env,now),round},env);
 const scored=scoreQuestion(bank,{token,guess:questions[round].answer*1.3},env,now);
 assert.equal(scored.score,625);
});
