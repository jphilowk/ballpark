// Optional rendered verification: set PLAYWRIGHT_MODULE to an installed Playwright module.
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const input=resolve(process.env.BALLPARK_HTML||'Ballpark-Prototype-3.html');
const output=resolve(process.env.BALLPARK_REVIEW||'/private/tmp/ballpark-review');
await mkdir(output,{recursive:true});
const fixture=resolve(dirname(input),'.ballpark-browser-check.html');
const hook=`window.ballparkTest={rerender(){render()},get ready(){return artReady},get state(){return state},get answer(){return questions[state.index].answer},play(score,bases,outs=0){state=initial();crowdReaction=null;const play=advance(bases,outs,score);state.history=[{guess:1,score}];Object.assign(state,play,{phase:'animating'});render();animate(score,bases,play.cleared);return reducedMotion()?90:playDuration(score,bases)},sample(score,bases,time){state.phase='animating';render();const scene=playScene(score,bases,time);draw(scene.ball,scene.pose,scene.runners,{hideBatter:scene.hideBatter,time});return scene},get crowd(){return crowdScene(performance.now(),reducedMotion())},get skyTime(){return performance.now()-ambientEpoch},get sky(){return skyScene(performance.now()-ambientEpoch,reducedMotion())},skySignature(){let hash=0;for(const byte of c.getImageData(0,0,960,85).data)hash=(Math.imul(hash,31)+byte)|0;return hash},scenery(score,age=500){crowdReaction=null;state.phase='animating';render();beginCrowdReaction(score,performance.now()-MOTION.contact-age);draw(null,0,[],{hideBatter:true});return crowdScene(performance.now(),reducedMotion())},get thirdArrival(){return MOTION.runStart+runnerRoute(3,1).length/MOTION.speed}};`;
await writeFile(fixture,(await readFile(input,'utf8')).replace('</script>',hook+'</script>'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install({time:new Date('2026-11-06T14:00:00Z')});
 await page.clock.pauseAt(new Date('2026-11-06T14:00:01Z'));
 await page.goto(pathToFileURL(fixture).href);
 await page.waitForFunction(()=>window.ballparkTest?.ready);
 const skyBefore=await page.evaluate(()=>ballparkTest.skySignature());
 await page.clock.runFor(1000);
 assert.notEqual(await page.evaluate(()=>ballparkTest.skySignature()),skyBefore,'Clouds should move on the welcome screen');
 await page.screenshot({path:resolve(output,'welcome.png')});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:resolve(output,'welcome-mobile.png')});
 assert.ok(await page.locator('.welcome').evaluate(el=>el.getBoundingClientRect().width<innerWidth));
 await page.setViewportSize({width:1440,height:900});
 const fade=await page.evaluate(()=>{
  ballparkTest.rerender();const card=document.querySelector('#panel .prompt-card'),animation=card.getAnimations()[0];
  animation.pause();animation.currentTime=70;const opacity=Number(getComputedStyle(card).opacity);animation.finish();
  return {opacity,duration:animation.effect.getTiming().duration};
 });
 assert.ok(fade.opacity>0&&fade.opacity<1);assert.equal(fade.duration,140);
 const departure=await page.evaluate(()=>{
  document.querySelector('#start').click();
  const ghosts=[...document.querySelector('#panel-transitions').children];
  const result={count:ghosts.length,inert:ghosts.every(el=>el.inert),duplicateIds:ghosts.some(el=>el.id||el.querySelector('[id]'))};
  for(const ghost of ghosts)for(const animation of ghost.getAnimations()){animation.pause();animation.currentTime=50;result.opacity=Number(getComputedStyle(ghost).opacity);animation.finish();}
  return result;
 });
 assert.equal(departure.count,1);assert.equal(departure.inert,true);assert.equal(departure.duplicateIds,false);assert.ok(departure.opacity>0&&departure.opacity<1);
 await page.clock.runFor(300);
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'entering');
 assert.equal(await page.evaluate(()=>ballparkTest.state.deadline),null);
 assert.equal(await page.locator('#guess').count(),0);
 await page.screenshot({path:resolve(output,'walk-up.png')});
 await page.clock.runFor(400);
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'question');
 assert.ok(await page.evaluate(()=>ballparkTest.state.deadline-Date.now()>=19900));
 const idle1=await page.locator('canvas').screenshot();
 await page.clock.runFor(450);
 const idle2=await page.locator('canvas').screenshot();
 assert.equal(idle1.equals(idle2),false,'Idle artwork should advance frames');
 await page.screenshot({path:resolve(output,'idle.png')});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:resolve(output,'question-mobile.png')});
 assert.ok(await page.locator('.prompt-card').evaluate(el=>el.getBoundingClientRect().width<innerWidth));
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'How to play'}).click();
 await page.evaluate(async()=>{await Promise.all(document.querySelector('#rules').getAnimations().map(a=>a.finished.catch(()=>{})));});
 await page.screenshot({path:resolve(output,'help.png')});
 await page.keyboard.press('Escape');
 await page.evaluate(async()=>{await Promise.all(document.querySelector('#rules').getAnimations().map(a=>a.finished.catch(()=>{})));});
 assert.equal(await page.locator('#rules').evaluate(el=>el.open),false);
 // The real form submits an exact answer, runs a home run, and then Next walks up.
 await page.locator('#guess').fill(String(await page.evaluate(()=>ballparkTest.answer)));
 await page.getByRole('button',{name:'Swing',exact:true}).click();
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'animating');
 await page.clock.runFor(7000);
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'reveal');
 assert.equal(await page.evaluate(()=>ballparkTest.state.runs),1);
 await page.screenshot({path:resolve(output,'reveal.png')});
 await page.getByRole('button',{name:'Next',exact:true}).click();
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'entering');
 await page.clock.runFor(700);
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'question');
 for(const score of [500,700,900,1000,100,0]){
  const duration=await page.evaluate(score=>ballparkTest.play(score,[true,true,true],2),score);
  await page.clock.runFor(1000);
  const reaction=await page.evaluate(()=>ballparkTest.crowd);
  assert.equal(reaction.level,score===1000?4:score>=800?3:score>=600?2:score>=400?1:0);
  await page.clock.runFor(Math.ceil(duration)-1000+60);
  const state=await page.evaluate(()=>ballparkTest.state);
  assert.equal(state.phase,'reveal');
  if(score===1000)assert.equal(state.runs,4);
  if(score<400){assert.equal(state.outs,0);assert.deepEqual(state.bases,[false,false,false]);}
 }
 await page.evaluate(()=>ballparkTest.sample(1000,[true,true,true],ballparkTest.thirdArrival+300));
 await page.screenshot({path:resolve(output,'plate-celebration.png')});
 await page.evaluate(()=>ballparkTest.sample(1000,[true,true,true],ballparkTest.thirdArrival+720+325));
 await page.screenshot({path:resolve(output,'walk-out.png')});
 for(const [score,name] of [[0,'crowd-out'],[500,'crowd-single'],[1000,'crowd-home-run']]){
  await page.evaluate(score=>ballparkTest.scenery(score),score);
  await page.screenshot({path:resolve(output,name+'.png')});
 }
 // Force the next scheduled flock into view, preserving the live global sky clock.
 const skyTime=await page.evaluate(()=>ballparkTest.skyTime);
 const nextFlock=6000+Math.ceil((skyTime-6000)/42000)*42000+6000;
 await page.clock.fastForward(Math.max(0,nextFlock-skyTime));
 await page.evaluate(()=>ballparkTest.scenery(0));
 assert.ok(await page.evaluate(()=>ballparkTest.sky.bird));
 await page.screenshot({path:resolve(output,'sky-flyby.png')});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.clock.runFor(1000);
 // Re-render once in reduced motion, then prove the sky stays still.
 await page.evaluate(()=>ballparkTest.scenery(0));
 const frozenSky=await page.evaluate(()=>ballparkTest.skySignature());
 await page.clock.runFor(1000);await page.evaluate(()=>ballparkTest.scenery(0));
 assert.equal(await page.evaluate(()=>ballparkTest.skySignature()),frozenSky);
 assert.equal(await page.evaluate(()=>ballparkTest.crowd.level),0);
 const duration=await page.evaluate(()=>ballparkTest.play(1000,[true,true,true]));
 assert.equal(duration,90);await page.clock.runFor(150);
 assert.equal(await page.evaluate(()=>ballparkTest.state.runs),4);
 await page.getByRole('button',{name:'Next',exact:true}).click();
 assert.equal(await page.evaluate(()=>ballparkTest.state.phase),'question');
 assert.ok(await page.evaluate(()=>ballparkTest.state.deadline-Date.now()>=19990));
 assert.equal(await page.locator('#panel-transitions').evaluate(el=>el.children.length),0);
 assert.equal(await page.locator('#panel').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 assert.deepEqual(errors,[]);
 console.log('Browser passed: UI fade-in/out, inert ghosts, desktop/mobile cards, help dismissal, moving sky, occasional flyby, graded crowd/no out reaction, entry/timer, idle, real Swing/Next, all hits, loaded HR, third outs, reduced motion; no page errors.');
}finally{await browser.close();await unlink(fixture);}
