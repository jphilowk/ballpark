import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile('src/ballpark.js','utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const basePoints='),source.indexOf('const CLIPS='))+source.slice(source.indexOf('const routeCache='),source.indexOf('function animate('))+';globalThis.routes={routePoint,runnerRoute};',context);
const {routePoint,runnerRoute}=context.routes;
test('portrait runner endpoints align with the stadium bags and fit iPhone framing',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(source.slice(source.indexOf('const portraitX='),source.indexOf('function portraitPlayer'))+';globalThis.project=(x,y)=>[portraitX(x),portraitY(y)];',ctx);
 const bagCenters=[[605,884],[376,790],[141,884],[376,1028]];
 for(let steps=1;steps<=4;steps++){
  const {x,y}=routePoint(0,steps,1,true);
  const [px,py]=ctx.project(x,y);
  const [bagX,bagY]=bagCenters[steps-1];
  assert.ok(Math.hypot(px-bagX,py-bagY)<5);
  for(const [width,height] of [[440,956],[375,667],[320,568]]){
   const scale=Math.max(width/752,height/1344);
   assert.ok(Math.abs((px-376)*scale)<width/2-20);
   assert.ok(Math.abs((py-672)*scale)<height/2-20);
  }
 }
});
test('second to third and third to home face toward the camera and touch bases',()=>{
 for(const [start,end,dx] of [[2,[185,375],-1],[3,[480,480],1]]){const mid=routePoint(start,1,.5);assert.ok(mid.dy>0);assert.equal(Math.sign(mid.dx),dx);const finish=routePoint(start,1,1);assert.equal(finish.x,end[0]);assert.equal(finish.y,end[1]);}
});
test('distance traversal has uniform speed, continuous rounded turns and exact endpoints',()=>{
 for(let steps=1;steps<=4;steps++){const route=runnerRoute(0,steps,true);let prev=routePoint(0,steps,0,true);assert.equal(prev.x,422);assert.equal(prev.y,507);for(let i=1;i<=2000;i++){const next=routePoint(0,steps,i/2000,true);const distance=Math.hypot(next.x-prev.x,next.y-prev.y);assert.ok(distance<=route.length/2000+1e-7);assert.ok(distance>route.length/2000*.90);prev=next;}const expected=[[772,375],[480,307],[185,375],[480,480]][steps-1];assert.ok(Math.abs(prev.x-expected[0])<1e-8);assert.ok(Math.abs(prev.y-expected[1])<1e-8);}
});
test('Higgsfield frames face correctly on all four legs without deforming sprites',()=>{
 const calls=[];const c={save(){},restore(){},translate(){},scale(...args){calls.push(['flip',...args]);},drawImage(...args){calls.push(['draw',...args]);}};
 const front={},back={},idle={};const ctx=vm.createContext({c,art:{runnerFront:front,runnerBack:back,runnerIdle:idle},matchMedia:()=>({matches:false})});
 vm.runInContext(source.slice(source.indexOf('const CLIPS='),source.indexOf('function draw('))+';globalThis.runner=runningPlayer;',ctx);
 for(const [dx,dy,image,flipped] of [[292,-105,back,false],[-292,-68,back,true],[-295,68,front,false],[295,105,front,true]]){calls.length=0;ctx.runner({x:480,y:380,dx,dy,moving:true,id:0},240);const draw=calls.find(x=>x[0]==='draw');assert.equal(draw[1],image);assert.equal(draw[2],0);assert.equal(draw[3],384);assert.equal(draw[4],384);assert.equal(draw[5],384);assert.equal(calls.some(x=>x[0]==='flip'),flipped);}
 calls.length=0;ctx.runner({x:480,y:380,moving:false},999);assert.equal(calls.find(x=>x[0]==='draw')[1],idle);
});

const timelineContext=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const basePoints='),source.indexOf('const CLIPS='))+source.slice(source.indexOf('const routeCache='),source.indexOf('function walkUp('))+';globalThis.timeline={playScene,playDuration,runnerRoute,pitcherReaction,MOTION};',timelineContext);
const {playScene,playDuration,MOTION}=timelineContext.timeline;
test('ball rolls after landing and remains on the field except on a home run',()=>{
 const bases=[false,false,false];
 const scene=(score,time,index=0)=>playScene(score,bases,MOTION.contact+time,false,index).ball;
 assert.equal(playScene(500,bases,MOTION.release-1).ball,null);
 assert.ok(Math.abs(scene(500,0).x-playScene(500,bases,MOTION.contact-1).ball.x)<1);
 const left=scene(500,1800,0),right=scene(500,1800,3);
 assert.ok(left.x<474&&right.x>474);
 assert.notEqual(scene(500,430).x,scene(500,900).x);
 assert.equal(left.y,left.groundY);
 assert.deepEqual(left,scene(500,10000));
 for(const score of [0,250,500,700,900])assert.ok(scene(score,10000));
 assert.ok(scene(1000,500));
 assert.equal(scene(1000,10000),null);
});

test('singles, doubles and triples stay on the field in every hit lane',()=>{
 const bases=[false,false,false];
 for(let atBat=0;atBat<5;atBat++){
  let previousDepth=Infinity;
  for(const score of [500,700,900]){
   const end=playDuration(score,bases);
   const ballAt=time=>playScene(score,bases,time,false,atBat).ball;
   for(let time=MOTION.contact;time<end;time+=8){
    const {x,y,groundY,size}=ballAt(time);
    // Leave clearance from the outfield wall and the portrait crop.
    assert.ok(x-size-1>=150&&x+size+1<=800);
    assert.ok(Math.min(y,groundY)-size-1>=272);
   }
   const settled=ballAt(end);
   assert.deepEqual(settled,ballAt(Infinity));
   assert.ok(settled.groundY<previousDepth);
   previousDepth=settled.groundY;
  }
 }
});

test('pitcher plays the matching reaction after the result',()=>{
 const {pitcherReaction}=timelineContext.timeline;
 for(const score of [0,250]){
  assert.equal(pitcherReaction(score,MOTION.contact),null);
  assert.equal(pitcherReaction(score,MOTION.outStart).clip,'pitcherCheer');
 }
 assert.equal(pitcherReaction(1000,MOTION.outStart),null);
 assert.equal(pitcherReaction(1000,MOTION.contact+970).clip,'pitcherCry');
 for(const [score,clip,flight] of [[500,'pitcherSingle',430],[700,'pitcherDouble',620],[900,'pitcherTriple',740]]){
  const landing=MOTION.contact+flight;
  assert.equal(pitcherReaction(score,landing-1),null);
  assert.equal(pitcherReaction(score,landing).clip,clip);
  assert.equal(pitcherReaction(score,landing+110).time,110);
 }
});

test('each scorer celebrates at home, then walks fully offscreen',()=>{
 for(const score of [500,700,900,1000]){
  const previous=[true,true,true];
  const sceneBefore=playScene(score,previous,899);
  assert.equal(sceneBefore.hideBatter,false);
  assert.equal(sceneBefore.runners.length,3);
  const departure=playScene(score,previous,900);
  assert.equal(departure.hideBatter,true);
  assert.equal(departure.runners.filter(r=>r.id===0).length,1);
  const steps=score===1000?4:score>=800?3:score>=600?2:1;
  for(let start=1;start<=3;start++){
   if(start+steps<4)continue;
   const arrival=MOTION.runStart+timelineContext.timeline.runnerRoute(start,4-start).length/MOTION.speed;
   const celebrating=playScene(score,previous,arrival+1).runners.find(r=>r.id===start);
   assert.equal(celebrating.mode,'celebrate');assert.equal(celebrating.x,480);assert.equal(celebrating.y,480);
   const walking=playScene(score,previous,arrival+MOTION.celebrate+100).runners.find(r=>r.id===start);
   assert.equal(walking.mode,'walk');assert.ok(walking.x>480);
   const lastStep=playScene(score,previous,arrival+MOTION.celebrate+MOTION.exit-1).runners.find(r=>r.id===start);
   assert.ok(lastStep.x>1040);
   assert.equal(playScene(score,previous,arrival+MOTION.celebrate+MOTION.exit+1).runners.some(r=>r.id===start),false);
  }
  const final=playScene(score,previous,playDuration(score,previous));
  assert.ok(final.runners.every(r=>!r.moving&&!r.mode));
  assert.equal(final.runners.length,4-steps);
 }
});
test('out walks batter out; third out also walks occupied runners out',()=>{
 for(const score of [0,100]){
  const normal=playScene(score,[true,true,true],MOTION.outStart+100,false);
  assert.equal(normal.hideBatter,true);
  assert.equal(normal.runners.find(r=>r.id===0).mode,'walk');
  assert.equal(normal.runners.filter(r=>r.id>0&&!r.mode).length,3);
  const cleared=playScene(score,[true,true,true],MOTION.outStart+100,true);
  assert.equal(cleared.runners.length,4);assert.ok(cleared.runners.every(r=>r.mode==='walk'));
  assert.equal(playScene(score,[true,true,true],playDuration(score,[true,true,true]),true).runners.length,0);
 }
});
test('celebration plays once and reduced motion freezes all clips',()=>{
 let reduced=false;const calls=[];const image={};const c={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
 const ctx=vm.createContext({c,art:{runnerCelebrate:image,runnerIdle:image},matchMedia:()=>({matches:reduced})});
 vm.runInContext(source.slice(source.indexOf('const CLIPS='),source.indexOf('function draw('))+';globalThis.atlas=atlasPlayer;',ctx);
 ctx.atlas('runnerCelebrate',480,480,91,5000);assert.equal(calls.at(-1)[1],3*384);assert.equal(calls.at(-1)[2],384);
 reduced=true;ctx.atlas('runnerIdle',480,480,91,5000);assert.equal(calls.at(-1)[1],0);assert.equal(calls.at(-1)[2],0);
});

const sceneryContext=vm.createContext({reducedMotion:()=>false,MOTION:{contact:720}});
vm.runInContext(source.slice(source.indexOf('const SCENERY='),source.indexOf('function draw('))+';globalThis.scenery={skyScene,beginCrowdReaction,crowdScene,crowdLevel,CROWD_PROFILES};',sceneryContext);
const {skyScene,beginCrowdReaction,crowdScene,crowdLevel,CROWD_PROFILES}=sceneryContext.scenery;
test('clouds drift continuously, wrap fully offscreen, and freeze for reduced motion',()=>{
 const first=skyScene(0),later=skyScene(1000);
 for(let i=0;i<first.clouds.length;i++)assert.ok(later.clouds[i].x>first.clouds[i].x);
 for(let t=0;t<1000000;t+=2137)for(const cloud of skyScene(t).clouds)assert.ok(cloud.x>=-cloud.width&&cloud.x<960);
 assert.equal(JSON.stringify(skyScene(1000,true)),JSON.stringify(skyScene(999999,true)));
});
test('bird flocks are occasional and enter and exit beyond the screen edges',()=>{
 assert.equal(skyScene(5000).bird,null);
 assert.equal(skyScene(6000).bird.x,-120);
 assert.ok(skyScene(12000).bird.x>0);
 assert.equal(skyScene(19000).bird,null);
 assert.equal(skyScene(48000).bird.reverse,true);
 assert.equal(skyScene(12000,true).bird,null);
});
test('crowd reactions begin at contact and grow from single through home run',()=>{
 for(const [score,level] of [[500,1],[700,2],[900,3],[1000,4]]){
  beginCrowdReaction(score,1000);
  assert.equal(crowdScene(1719).level,0);
  assert.equal(crowdScene(2000).level,level);
  assert.equal(crowdScene(1720+CROWD_PROFILES[level].duration).level,0);
  assert.equal(crowdScene(2000,true).level,0);
 }
 for(let i=1;i<4;i++){
  assert.ok(CROWD_PROFILES[i].fraction<CROWD_PROFILES[i+1].fraction);
  assert.ok(CROWD_PROFILES[i].duration<CROWD_PROFILES[i+1].duration);
  assert.ok(CROWD_PROFILES[i].ms>CROWD_PROFILES[i+1].ms);
 }
});
test('outs and strikeouts never trigger or restart crowd reactions',()=>{
 assert.equal(crowdLevel(0),0);assert.equal(crowdLevel(399),0);
 const before=JSON.stringify(crowdScene(2000));
 beginCrowdReaction(0,2000);beginCrowdReaction(399,2000);
 assert.equal(JSON.stringify(crowdScene(2000)),before);
});

const lightingContext=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const SCENERY='),source.indexOf('const SKY_CLOUDS='))+';globalThis.lighting={solarPosition,lightingAt};',lightingContext);
const {solarPosition,lightingAt}=lightingContext.lighting;
test('Chicago skyline follows seasonal daylight without a running client',()=>{
 const summerEvening=Date.parse('2026-06-21T00:00:00Z'); // 7 PM Chicago
 const winterEvening=Date.parse('2026-12-22T01:00:00Z'); // 7 PM Chicago
 assert.ok(solarPosition(summerEvening).elevation>10);
 assert.ok(solarPosition(winterEvening).elevation<-12);
 assert.equal(lightingAt(summerEvening).skyAlpha,0);
 assert.ok(lightingAt(winterEvening).skyAlpha>.8);
 assert.ok(lightingAt(winterEvening).stars>.9);
 const winterNoon=lightingAt(Date.parse('2026-12-21T18:00:00Z'));
 assert.equal(winterNoon.skyAlpha,0);
});
test('Chicago dusk blends between daylight and night',()=>{
 const day=lightingAt(Date.parse('2026-11-06T18:00:00Z'));
 const dusk=lightingAt(Date.parse('2026-11-06T22:00:00Z'));
 const night=lightingAt(Date.parse('2026-11-07T01:00:00Z'));
 assert.ok(day.skyAlpha<dusk.skyAlpha&&dusk.skyAlpha<night.skyAlpha);
 assert.equal(Object.hasOwn(dusk,'fieldAlpha'),false);
});
