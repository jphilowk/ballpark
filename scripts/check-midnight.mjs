import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {getPuzzle,signToken} from '../lib/daily.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=4188;
const origin=`http://127.0.0.1:${port}`;
const signingKey='local-browser-test-key-longer-than-32-characters';
const bank={schemaVersion:1,questions:[],schedule:[],ledger:[]};
const env={BALLPARK_SIGNING_KEY:signingKey};
function dailyFor(date,exp=Date.now()+36*60*60*1000){
 const puzzle=getPuzzle(bank,date);
 return {date,puzzleId:puzzle.id,mode:puzzle.mode,questionCount:5,token:signToken({date,puzzleId:puzzle.id,round:0,scoringVersion:2,exp,nonce:'local-midnight-check'},env)};
}
const oldDaily=dailyFor('2026-11-11');
const newDaily=dailyFor('2026-11-12');
const server=spawn(process.execPath,['server.mjs'],{
 cwd:process.cwd(),env:{...process.env,PORT:String(port),BALLPARK_SIGNING_KEY:signingKey},stdio:['ignore','pipe','pipe']
});
let serverOutput='';
server.stdout.on('data',chunk=>{serverOutput+=chunk;});
server.stderr.on('data',chunk=>{serverOutput+=chunk;});
let browser;
try{
 let ready=false;
 for(let attempt=0;attempt<60;attempt++){
  if(server.exitCode!==null)throw Error(`Local server exited: ${serverOutput}`);
  try{const response=await fetch(origin+'/');if(response.ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 if(!ready)throw Error(`Local server did not start: ${serverOutput}`);
 browser=await chromium.launch({headless:true});
 async function pageFor(time){
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.clock.install({time:new Date(time)});
  let current=oldDaily,loads=0;
  await page.route('**/api/daily',async route=>{loads++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(current)});});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  return {context,page,setToday(){current=newDaily;},loads(){return loads;},errors};
 }
 async function stored(page){
  return page.evaluate(()=>{
   const pointer=JSON.parse(localStorage.getItem('ballpark-active-daily-v1'));
   return {pointer,state:pointer?JSON.parse(localStorage.getItem(pointer.key)):null};
  });
 }
 async function finish(page){
  for(let atBat=0;atBat<5;atBat++){
   await page.locator('#guess').waitFor();
   await page.locator('#guess').fill(String(atBat+14));
   await page.locator('#guess-form button').click();
   await page.locator('#next').waitFor();
   await page.locator('#next').click();
  }
  await page.locator('.box-score tbody tr').first().waitFor();
  assert.equal(await page.locator('.box-score tbody tr').count(),5);
 }

 // An untouched welcome screen moves to today's puzzle on its minute check.
 {
  const test=await pageFor('2026-11-12T05:59:30Z');
  await test.page.goto(origin+'/');
  await test.page.locator('#start').waitFor();
  test.setToday();
  await test.page.clock.runFor(61_000);
  assert.ok(test.loads()>=2,'idle tab should request the new daily puzzle');
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  assert.equal((await stored(test.page)).pointer.date,newDaily.date);
  assert.deepEqual(test.errors,[]);
  await test.context.close();
 }
 // A hidden tab also refreshes the welcome screen when it regains focus.
 {
  const test=await pageFor('2026-11-12T05:59:55Z');
  await test.page.goto(origin+'/');
  test.setToday();
  await test.page.clock.setSystemTime(new Date('2026-11-12T06:00:02Z'));
  await test.page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await test.page.waitForFunction(()=>document.body.dataset.phase==='welcome');
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  assert.equal((await stored(test.page)).pointer.date,newDaily.date);
  assert.ok(test.loads()>=2);
  assert.deepEqual(test.errors,[]);
  await test.context.close();
 }
 // A started game stays on yesterday after refresh, then offers today's game.
 {
  const test=await pageFor('2026-11-12T05:59:55Z');
  await test.page.goto(origin+'/');
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  await test.page.locator('#guess').fill('42');
  test.setToday();
  await test.page.clock.setSystemTime(new Date('2026-11-12T06:00:02Z'));
  await test.page.reload();
  await test.page.locator('#guess').waitFor();
  assert.equal(await test.page.locator('#guess').inputValue(),'42');
  assert.equal((await stored(test.page)).pointer.date,oldDaily.date);
  await finish(test.page);
  await test.page.locator('#today').waitFor();
  await test.page.locator('#today').click();
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  assert.equal((await stored(test.page)).pointer.date,newDaily.date);
  assert.deepEqual(test.errors,[]);
  await test.context.close();
 }
 // A 429 retry keeps its original signed round across midnight and refresh.
 {
  const test=await pageFor('2026-11-12T05:59:55Z');
  let first=true;const scoreBodies=[];
  await test.page.route('**/api/score',async route=>{
   scoreBodies.push(JSON.parse(route.request().postData()));
   if(first){first=false;await route.fulfill({status:429,contentType:'text/html',body:'<h1>Too Many Requests</h1>'});}
   else await route.continue();
  });
  await test.page.goto(origin+'/');
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  await test.page.locator('#guess').fill('14');
  await test.page.locator('#guess-form button').click();
  await test.page.locator('#retry-swing').waitFor();
  test.setToday();
  await test.page.clock.setSystemTime(new Date('2026-11-12T06:00:02Z'));
  await test.page.reload();
  await test.page.locator('#retry-swing').waitFor();
  assert.equal((await stored(test.page)).pointer.date,oldDaily.date);
  assert.match(await test.page.locator('#panel').innerText(),/Your guess is saved\. Too many requests/);
  await test.page.locator('#retry-swing').click();
  await test.page.locator('#next').waitFor();
  assert.deepEqual(scoreBodies[1],scoreBodies[0]);
  assert.equal((await stored(test.page)).state.history.length,1);
  assert.deepEqual(test.errors,[]);
  await test.context.close();
 }
 // An expired old token is discarded and the new puzzle is offered directly.
 {
  const test=await pageFor('2026-11-12T05:59:55Z');
  await test.page.goto(origin+'/');
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  const expired=dailyFor(oldDaily.date,Date.parse('2026-11-12T05:00:00Z')).token;
  await test.page.evaluate(token=>{
   const pointer=JSON.parse(localStorage.getItem('ballpark-active-daily-v1'));
   const state=JSON.parse(localStorage.getItem(pointer.key));state.token=token;
   localStorage.setItem(pointer.key,JSON.stringify(state));
  },expired);
  test.setToday();
  await test.page.clock.setSystemTime(new Date('2026-11-12T06:00:02Z'));
  await test.page.reload();
  await test.page.locator('#start').waitFor();
  assert.equal(await test.page.locator('#guess').count(),0);
  assert.equal((await stored(test.page)).pointer,null);
  await test.page.locator('#start').click();
  await test.page.locator('#guess').waitFor();
  assert.equal((await stored(test.page)).pointer.date,newDaily.date);
  assert.deepEqual(test.errors,[]);
  await test.context.close();
 }
 console.log('Idle and focused rollover, mid-game refresh, cross-midnight retry, expiry, and today handoff passed.');
}finally{
 await browser?.close();server.kill('SIGTERM');
}
