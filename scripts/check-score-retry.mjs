import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=4187;
const origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{
 cwd:process.cwd(),
 env:{...process.env,PORT:String(port),BALLPARK_SIGNING_KEY:'local-browser-test-key-longer-than-32-characters'},
 stdio:['ignore','pipe','pipe']
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
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 const requests=[];
 let rejectFirstScore=true;
 await page.route('**/api/score',async route=>{
  requests.push(JSON.parse(route.request().postData()));
  if(rejectFirstScore){
   rejectFirstScore=false;
   await route.fulfill({status:429,contentType:'text/html',body:'<h1>Too Many Requests</h1>'});
  }else await route.continue();
 });
 await page.goto(origin+'/');
 await page.locator('#start').click();
 await page.locator('#guess').waitFor();
 await page.locator('#guess').fill('14');
 await page.locator('#guess-form button').click();
 await page.locator('#retry-swing').waitFor();
 assert.match(await page.locator('#panel').innerText(),/Your guess is saved\. Too many requests right now\. Wait a moment, then retry\./);
 const saved=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(key=>key.startsWith('ballpark-daily-v1-'));
  return JSON.parse(localStorage.getItem(key));
 });
 assert.equal(saved.phase,'submit-error');
 assert.equal(saved.index,0);
 assert.equal(saved.pendingGuess,14);
 assert.equal(saved.history.length,0);
 const originalToken=saved.token;
 await page.reload();
 await page.locator('#retry-swing').waitFor();
 assert.match(await page.locator('#panel').innerText(),/Your guess is saved\. Too many requests right now/);
 await page.locator('#retry-swing').click();
 await page.locator('#next').waitFor();
 assert.equal(requests.length,2);
 assert.deepEqual(requests[1],requests[0]);
 assert.equal(requests[1].token,originalToken);
 const afterRetry=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(key=>key.startsWith('ballpark-daily-v1-'));
  return JSON.parse(localStorage.getItem(key));
 });
 assert.equal(afterRetry.index,0);
 assert.equal(afterRetry.history.length,1);
 assert.equal(afterRetry.history[0].guess,14);
 assert.equal(afterRetry.pendingGuess,null);
 for(let atBat=1;atBat<5;atBat++){
  await page.locator('#next').click();
  await page.locator('#guess').waitFor();
  await page.locator('#guess').fill(String(atBat+10));
  await page.locator('#guess-form button').click();
  await page.locator('#next').waitFor();
 }
 await page.locator('#next').click();
 await page.locator('.box-score tbody tr').first().waitFor();
 assert.equal(await page.locator('.box-score tbody tr').count(),5);
 assert.equal(requests.length,6);
 assert.deepEqual(pageErrors,[]);
 console.log('Mocked HTML 429, refresh, identical successful retry, and all five local API at-bats passed.');
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
