const ASSETS={"skyClouds":"./assets/skyClouds.png","skyMask":"./assets/skyMask.png","skyBirds":"./assets/skyBirds.png","crowdCheer":"./assets/crowdCheer.png","batterIdle":"./assets/batterIdle.png","runnerIdle":"./assets/runnerIdle.png","runnerCelebrate":"./assets/runnerCelebrate.png","batterWalk":"./assets/batterWalk.png","playerWalk":"./assets/playerWalk.png","runnerFront":"./assets/runnerFront.png","runnerBack":"./assets/runnerBack.png","stadium": "./assets/stadiumAmbient.png", "batterReady": "./assets/batterReady.png", "batterSwing": "./assets/batterSwing.png", "batterFollow": "./assets/batterFollow.png", "batterCelebrate": "./assets/batterCelebrate.png", "pitcherReady": "./assets/pitcherReady.png", "pitcherThrow": "./assets/pitcherThrow.png", "fielder": "./assets/fielder.png", "runner": "./assets/runner.png"};
function points(guess,answer){if(guess===null||!Number.isFinite(guess)||guess<0)return 0;if(guess===answer)return 1000;return Math.min(999,Math.round(1000*Math.exp(-4*Math.abs(guess-answer)/answer)));}
function result(score){return score===1000?'Home run':score>=800?'Triple':score>=600?'Double':score>=400?'Single':score>0?'Out':'Strikeout';}
function advance(bases,outs,score){const label=result(score);const steps=label==='Home run'?4:label==='Triple'?3:label==='Double'?2:label==='Single'?1:0;let runs=0;let next=[false,false,false];if(!steps){outs++;return {bases:outs===3?next:[...bases],outs:outs===3?0:outs,runs:0,cleared:outs===3};}for(let i=0;i<3;i++)if(bases[i]){if(i+steps>=3)runs++;else next[i+steps]=true;}if(steps===4)runs++;else next[steps-1]=true;return {bases:next,outs,runs,cleared:false};}
function chicagoDate(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
function shuffle(items,seed){let n=[...seed].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0)>>>0;const out=[...items];for(let i=out.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}

const bank=[{"sport": "NFL", "q": "How many regular-season punt-return touchdowns did Devin Hester score in his NFL career?", "answer": 14, "unit": "punt-return touchdowns", "fact": "Hester finished with 14 punt-return touchdowns in the regular season.", "source": "Pro Football Hall of Fame", "url": "https://www.profootballhof.com/players/devin-hester"}, {"sport": "NBA", "q": "How many points did Kobe Bryant score against Toronto on January 22, 2006?", "answer": 81, "unit": "points", "fact": "Bryant scored 81 points in the Lakers’ win over Toronto.", "source": "NBA", "url": "https://jr.nba.com/the-81-point-game/"}, {"sport": "MLB", "q": "How many stolen bases did Rickey Henderson record in his MLB regular-season career?", "answer": 1406, "unit": "stolen bases", "fact": "Henderson finished his major league career with 1,406 stolen bases.", "source": "Baseball Hall of Fame", "url": "https://baseballhall.org/discover/henderson-remembered-as-electrifying-legend-of-the-game"}, {"sport": "CBB", "q": "How many NCAA men’s basketball championships did Duke win under Mike Krzyzewski?", "answer": 5, "unit": "championships", "fact": "Duke won five NCAA championships under Coach K.", "source": "Duke Athletics", "url": "https://goduke.com/honors/hall-of-fame/mike-krzyzewski/26"}, {"sport": "CFB", "q": "How many touchdown passes did Joe Burrow throw in LSU’s 2019 season, including the postseason?", "answer": 60, "unit": "touchdown passes", "fact": "Burrow threw 60 touchdown passes during LSU’s unbeaten 2019 championship season.", "source": "LSU Athletics", "url": "https://lsusports.net/sports/fb/roster/season/2019/player/joe-burrow"}];
const $=s=>document.querySelector(s),panel=$('#panel');
let date=chicagoDate(),key='ballpark-fullfield-v4-'+date,questions=shuffle(bank,date),daily=null,contentReady=false,contentError='';
const initial=()=>({phase:'welcome',index:0,history:[],bases:[false,false,false],outs:0,runs:0,deadline:null,draft:'',token:null,questions:[],pendingGuess:null,pendingTimed:false});let state=initial(),saved=true;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function apiCall(path,body){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.error||'Game unavailable');return data;}finally{clearTimeout(timeout);}
}
function restore(){
 try{const old=JSON.parse(localStorage.getItem(key));if(old&&Array.isArray(old.history)&&old.index>=0&&old.index<5&&(!daily||old.token))state={...initial(),...old};}catch{saved=false;}
 if(daily){if(!state.token)state.token=daily.token;questions=Array.from({length:5},(_,i)=>state.questions[i]||null);}
 if(state.phase==='animating')state.phase='reveal';
 if(['entering','loading'].includes(state.phase))state.phase='welcome';
 if(state.phase==='scoring')state.phase='submit-error';
}
async function bootstrap(){
 contentReady=false;contentError='';
 try{
  if(location.protocol!=='file:'){
   daily=await apiCall('/api/daily');date=daily.date;key='ballpark-daily-v1-'+daily.puzzleId;
  }
  restore();contentReady=true;render();
 }catch{contentError='Today’s game couldn’t load. Please try again.';render();}
}
function refreshStartButton(){const button=$('#start');if(!button)return;button.disabled=!artReady||(!contentReady&&!contentError);button.textContent=contentError?'Try again':!contentReady?'Loading…':artReady?'Play':'Loading…';}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{saved=false;}}
const total=()=>state.history.reduce((n,h)=>n+h.score,0);
const abbr=r=>({'Home run':'HR',Triple:'3B',Double:'2B',Single:'1B',Out:'OUT',Strikeout:'K'}[r]);
const UI_FADE={enter:140,leave:100};
function fadeOutPanels(){
 const layer=$('#panel-transitions');layer.replaceChildren();
 if(reducedMotion())return;
 for(const child of panel.children){
  const ghost=child.cloneNode(true);ghost.classList.add('ui-ghost');ghost.inert=true;ghost.setAttribute('aria-hidden','true');
  ghost.removeAttribute('id');for(const node of ghost.querySelectorAll('[id]'))node.removeAttribute('id');
  layer.append(ghost);
  const opacity=getComputedStyle(child).opacity;
  const animation=ghost.animate([{opacity},{opacity:0}],{duration:UI_FADE.leave,easing:'ease-out',fill:'forwards'});
  animation.finished.then(()=>ghost.remove(),()=>ghost.remove());
 }
}
function fadeInPanels(){
 if(reducedMotion())return;
 for(const child of panel.children)child.animate([{opacity:0},{opacity:1}],{duration:UI_FADE.enter,easing:'ease-out'});
}
function openHelp(){
 const dialog=$('#rules');if(dialog.open)return;
 dialog.showModal();if(!reducedMotion())dialog.animate([{opacity:0},{opacity:1}],{duration:UI_FADE.enter,easing:'ease-out'});
}
function closeHelp(){
 const dialog=$('#rules');if(!dialog.open||dialog.classList.contains('is-closing'))return;
 if(reducedMotion()){dialog.close();return;}
 dialog.classList.add('is-closing');
 const animation=dialog.animate([{opacity:1},{opacity:0}],{duration:UI_FADE.leave,easing:'ease-out',fill:'forwards'});
 const done=()=>{dialog.close();dialog.classList.remove('is-closing');animation.cancel();};animation.finished.then(done,done);
}
function hud(){$('#rounds').dataset.label=state.phase==='welcome'?'5 AT-BATS':state.phase==='finished'?'FINAL':'AT BAT '+(state.index+1)+' OF 5';$('#score').textContent=String(total()).padStart(4,'0');$('#runs').textContent=state.runs;$('#outs').textContent=Array.from({length:3},(_,i)=>i<state.outs?'●':'○').join(' ');$('#atbat').textContent=state.phase==='welcome'?'— / 5':(state.index+1)+' / 5';$('#rounds').innerHTML=Array.from({length:5},(_,i)=>`<div class="round ${state.history[i]?'done':i===state.index&&state.phase!=='welcome'?'current':''}">${state.history[i]?abbr(result(state.history[i].score)):String(i+1)}</div>`).join('');draw();}
async function start(){
 if(!artReady||['entering','loading'].includes(state.phase))return;
 if(!contentReady)return bootstrap();
 contentError='';state.deadline=null;state.draft='';
 if(daily&&!questions[state.index]){
  state.phase='loading';save();render();
  try{questions[state.index]=await apiCall('/api/question',{token:state.token});state.questions[state.index]=questions[state.index];}
  catch{state.phase='welcome';contentError='This at-bat couldn’t load. Try again.';save();render();return;}
 }
 state.phase='entering';save();render();
 walkUp(()=>{state.phase='question';state.deadline=Date.now()+20000;save();render();});
}
function render(){fadeOutPanels();document.body.dataset.phase=state.phase;hud();$('#play-call').textContent='';
if(state.phase==='welcome'){panel.innerHTML=`<div class="prompt-card welcome"><h1>Ballpark</h1><p class="welcome-copy">${escapeHtml(contentError||(!contentReady?"Loading today’s game…":daily?.mode==='daily'?"Five sports. Five at-bats.":"Practice · Five sports. Five at-bats."))}</p><button class="primary" id="start">Play</button></div>`;refreshStartButton();$('#start').onclick=contentError&&!contentReady?bootstrap:start;}
else if(state.phase==='question'){const q=questions[state.index];panel.innerHTML=`<div class="prompt-card"><div class="sport">${escapeHtml(q.sport)} · AT BAT ${state.index+1} OF 5</div><h2>${escapeHtml(q.q)}</h2></div><form id="guess-form" class="answer-dock"><span class="timer" role="timer" aria-label="Seconds remaining">20</span><div class="input-wrap"><input id="guess" type="text" inputmode="decimal" autocomplete="off" aria-label="Your guess in ${escapeHtml(q.unit)}" placeholder="Enter a number"/><div class="track"><div></div></div></div><button class="primary" type="submit">Swing</button><div class="error" id="error" role="alert"></div></form>`;$('#guess').value=state.draft;$('#guess').oninput=e=>{state.draft=e.target.value;save();};$('#guess-form').onsubmit=e=>{e.preventDefault();submit(false);};$('#guess').focus({preventScroll:true});tick();}
else if(state.phase==='reveal'){const last=state.history.at(-1),q=questions[state.index];panel.innerHTML=`<div class="prompt-card reveal"><div class="sport">${result(last.score).toUpperCase()} · +${last.score}</div><div class="answers"><div><small>YOUR GUESS</small><strong>${last.guess===null?'—':last.guess.toLocaleString()}</strong></div><div><small>ANSWER</small><strong>${q.answer.toLocaleString()}</strong></div></div><details><summary>Details</summary><p>${escapeHtml(q.fact)}</p><a href="${escapeHtml(q.url)}" target="_blank" rel="noopener">${escapeHtml(q.source)}</a></details></div><div class="answer-dock single"><button class="primary" id="next">${state.index===4?'Results':'Next'}</button></div>`;$('#next').onclick=()=>{if(state.index===4){state.phase='finished';save();render();}else{state.index++;start();}};}
else if(['animating','entering'].includes(state.phase)){panel.innerHTML='';}
else if(['loading','scoring'].includes(state.phase)){panel.innerHTML=`<div class="prompt-card welcome"><p class="welcome-copy">${state.phase==='loading'?'Getting the next at-bat…':'Saving your swing…'}</p></div>`;}
else if(state.phase==='submit-error'){panel.innerHTML=`<div class="prompt-card welcome"><p class="welcome-copy">That swing couldn’t be saved. Try again.</p><button class="primary" id="retry-swing">Retry</button></div>`;$('#retry-swing').onclick=()=>submit(state.pendingTimed);}
else{panel.innerHTML=`<div class="prompt-card final"><div class="sport">FINAL</div><h1>${total().toLocaleString()}<small> / 5,000</small></h1><div class="finish-runs">${state.runs} RUN${state.runs===1?'':'S'}</div><div class="finish-hits">${state.history.map(h=>abbr(result(h.score))).join(' · ')}</div></div><div class="answer-dock single"><button class="primary" id="share">Share</button>${daily?.mode==='daily'?'':'<button class="secondary" id="again">Play again</button>'}<div id="share-status" role="status"></div></div>`;$('#share').onclick=async()=>{const text=`BALLPARK ${daily?.mode==='daily'?date:'PRACTICE'}\n${total().toLocaleString()} / 5,000 · ${state.runs} runs\n${state.history.map(h=>abbr(result(h.score))).join(' · ')}`;try{await navigator.clipboard.writeText(text);$('#share-status').textContent='Copied';}catch{$('#share-status').textContent=text;}};const again=$('#again');if(again)again.onclick=()=>{state=initial();if(daily){state.token=daily.token;questions=Array(5).fill(null);}save();render();};}fadeInPanels();}

function parse(raw){if(!/^\d+(\.\d+)?$/.test(raw.trim()))return null;const n=Number(raw);return Number.isFinite(n)?n:null;}
async function submit(timed){
 if(!['question','submit-error'].includes(state.phase))return;
 const retry=state.phase==='submit-error';
 if(!retry&&!timed&&Date.now()>=state.deadline)return submit(true);
 const guess=retry?state.pendingGuess:parse(state.draft);
 if(!retry&&!timed&&guess===null){$('#error').textContent='Enter a positive number or zero.';return;}
 const previousBases=[...state.bases];let score;
 if(daily){
  state.pendingGuess=guess;state.pendingTimed=timed;state.phase='scoring';state.deadline=null;save();$('#guess')?.blur();render();
  try{const response=await apiCall('/api/score',{token:state.token,guess,timed});score=response.score;Object.assign(questions[state.index],{answer:response.answer,fact:response.fact,source:response.source,url:response.url});state.questions[state.index]=questions[state.index];state.token=response.token;}
  catch{state.phase='submit-error';save();render();return;}
 }else score=points(guess,questions[state.index].answer);
 const play=advance(state.bases,state.outs,score);
 state.history.push({guess,score,timed,runs:play.runs,cleared:play.cleared});state.bases=play.bases;state.outs=play.outs;state.runs+=play.runs;state.phase='animating';state.pendingGuess=null;save();$('#guess')?.blur();render();animate(score,previousBases,play.cleared);
}
function tick(){if(state.phase!=='question')return;const left=Math.max(0,state.deadline-Date.now());if(left===0){submit(true);return;}const timer=$('.timer'),track=$('.track');if(timer){timer.textContent=Math.ceil(left/1000);timer.classList.toggle('urgent',left<=5000);track.classList.toggle('urgent',left<=5000);track.firstElementChild.style.width=left/200+'%';}}
setInterval(tick,100);document.addEventListener('visibilitychange',tick);$('#help').onclick=openHelp;$('#close-help').onclick=closeHelp;$('#rules').oncancel=e=>{e.preventDefault();closeHelp();};
const canvas=$('#field'),c=canvas.getContext('2d');canvas.width=960;canvas.height=540;c.imageSmoothingEnabled=false;
const skyCanvas=document.createElement('canvas');skyCanvas.width=960;skyCanvas.height=540;
const skyContext=skyCanvas.getContext('2d');skyContext.imageSmoothingEnabled=false;
const ambientEpoch=performance.now();
const art={};let artReady=false,animationPose=0;
const artEntries=Object.entries(ASSETS);
Promise.all([document.fonts.load('700 24px BallparkPixel'),...artEntries.map(([name,url])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{art[name]=im;resolve();};im.onerror=()=>resolve();im.src=url;}))]).then(()=>{artReady=Object.keys(art).length===artEntries.length;draw();refreshStartButton();});
const basePoints=[[480,488],[772,383],[480,315],[185,383],[480,488]];
function player(name,x,y,h){const im=art[name];if(!im)return;const ref=name.startsWith('batter')?art.batterReady:name.startsWith('pitcher')?art.pitcherReady:im;const ratio=h/ref.naturalHeight;const w=im.naturalWidth*ratio,actualH=im.naturalHeight*ratio;c.drawImage(im,Math.round(x-w/2),Math.round(y-actualH),Math.round(w),Math.round(actualH));}
// Every pose comes from a Higgsfield clip; canvas only selects and places frames.
const CLIPS={
 runnerFront:{ms:80},runnerBack:{ms:80},
 batterIdle:{ms:110},runnerIdle:{ms:110},
 runnerCelebrate:{ms:45,once:true},batterWalk:{ms:45},playerWalk:{ms:45}
};
function atlasPlayer(name,x,y,height,time=0,mirror=false,offset=0){
 const im=art[name];if(!im)return;
 const clip=CLIPS[name],freeze=reducedMotion();
 const step=freeze?0:Math.floor(Math.max(0,time)/clip.ms+offset);
 const frame=clip.once?Math.min(15,step):step%16,scale=height/362;
 c.save();c.translate(Math.round(x),Math.round(y));if(mirror)c.scale(-1,1);
 c.drawImage(im,(frame%4)*384,Math.floor(frame/4)*384,384,384,-192*scale,-374*scale,384*scale,384*scale);
 c.restore();
}
function runnerHeight(y){return 43+Math.max(0,Math.min(1,(y-310)/197))*48;}
function runningPlayer(r,time){
 const height=runnerHeight(r.y);
 if(r.mode==='celebrate'){atlasPlayer('runnerCelebrate',r.x,r.y,height,r.clipTime);return;}
 if(r.mode==='walk'){atlasPlayer(r.clip||'playerWalk',r.x,r.y,r.clip==='batterWalk'?91:height,r.clipTime,r.dx<0);return;}
 if(!r.moving){atlasPlayer('runnerIdle',r.x,r.y,height,time,false,(r.id||0)*3);return;}
 const toward=(r.dy||0)>0,side=r.dx||1;
 atlasPlayer(toward?'runnerFront':'runnerBack',r.x,r.y,height,time,(toward&&side>0)||(!toward&&side<0),(r.id||0)*4);
}
function reducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
// Original Higgsfield clouds are separate layers; new birds and crowd use generated frames.
const SCENERY={birdDelay:6000,birdInterval:42000,birdDuration:12000};
const SKY_CLOUDS=[
 {sx:864,sy:0,w:162,h:40,x:-95,y:33.75,speed:2.5},
 {sx:288,sy:0,w:257,h:62,x:187.857,y:10.053,speed:2.9},
 {sx:576,sy:0,w:140,h:36,x:115,y:63.191,speed:3.3},
 {sx:864,sy:0,w:162,h:40,x:421.429,y:17.234,speed:3.7},
 {sx:0,sy:128,w:231,h:62,x:659.286,y:10.053,speed:4.1},
 {sx:288,sy:128,w:96,h:30,x:777.143,y:67.5,speed:4.5},
 {sx:288,sy:0,w:257,h:62,x:902.857,y:33.75,speed:2.7}
];
function skyScene(elapsed,reduced=false){
 const seconds=reduced?0:Math.max(0,elapsed)/1000;
 const clouds=SKY_CLOUDS.map(cloud=>{const width=cloud.w*960/1344;return {...cloud,width,height:cloud.h*540/752,x:((cloud.x+seconds*cloud.speed+width)%(960+width))-width};});
 let bird=null;
 if(!reduced&&elapsed>=SCENERY.birdDelay){
  const cycle=Math.floor((elapsed-SCENERY.birdDelay)/SCENERY.birdInterval);
  const age=(elapsed-SCENERY.birdDelay)%SCENERY.birdInterval;
  if(age<SCENERY.birdDuration){const reverse=cycle%2===1,u=age/SCENERY.birdDuration;bird={x:reverse?1080-u*1200:-120+u*1200,y:[27,49,65][cycle%3],width:110,height:110/3,reverse,frame:Math.floor(age/100)%16};}
 }
 return {clouds,bird};
}
function drawSky(now){
 if(!art.skyClouds||!art.skyMask)return;
 const scene=skyScene(now-ambientEpoch,reducedMotion()),ctx=skyContext;
 ctx.clearRect(0,0,960,540);
 for(const cloud of scene.clouds)ctx.drawImage(art.skyClouds,cloud.sx,cloud.sy,cloud.w,cloud.h,cloud.x,cloud.y,cloud.width,cloud.height);
 if(scene.bird&&art.skyBirds){
  const b=scene.bird;ctx.save();ctx.translate(b.x,b.y);if(b.reverse){ctx.translate(b.width,0);ctx.scale(-1,1);}
  ctx.drawImage(art.skyBirds,(b.frame%4)*384,Math.floor(b.frame/4)*128,384,128,0,0,b.width,b.height);ctx.restore();
 }
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(art.skyMask,0,0,960,540);ctx.globalCompositeOperation='source-over';
 c.drawImage(skyCanvas,0,0);
}
const CROWD_PROFILES=[null,
 {duration:1800,fraction:.22,ms:125},
 {duration:2800,fraction:.44,ms:100},
 {duration:4000,fraction:.7,ms:80},
 {duration:6800,fraction:1,ms:60}
];
let crowdReaction=null;
function crowdLevel(score){return score===1000?4:score>=800?3:score>=600?2:score>=400?1:0;}
function beginCrowdReaction(score,now){
 const level=crowdLevel(score);
 if(level&&!reducedMotion())crowdReaction={level,start:now+MOTION.contact};
}
function crowdScene(now,reduced=false){
 if(!crowdReaction||reduced)return {level:0,alpha:0,frame:0,fraction:0};
 const age=now-crowdReaction.start,profile=CROWD_PROFILES[crowdReaction.level];
 if(age<0||age>=profile.duration)return {level:0,alpha:0,frame:0,fraction:0};
 const envelope=Math.min(1,age/180,(profile.duration-age)/700);
 return {level:crowdReaction.level,alpha:envelope*.92,frame:Math.floor(age/profile.ms)%16,fraction:profile.fraction};
}
// Polygon masks preserve roofs, stairs, railings, buildings, and the scoreboard.
const CROWD_AREAS=[
 [[0,132],[204,163],[208,188],[0,177]],
 [[0,204],[198,207],[225,231],[0,239]],
 [[244,195],[374,195],[374,229],[244,232]],
 [[960,132],[756,163],[752,188],[960,177]],
 [[960,204],[762,207],[735,231],[960,239]],
 [[716,195],[586,195],[586,229],[716,232]]
];
function drawCrowd(now){
 const reaction=crowdScene(now,reducedMotion());if(!reaction.alpha||!art.crowdCheer)return;
 c.save();c.globalAlpha=reaction.alpha;
 for(let area=0;area<CROWD_AREAS.length;area++){
  const polygon=CROWD_AREAS[area],left=Math.min(...polygon.map(p=>p[0])),top=Math.min(...polygon.map(p=>p[1])),right=Math.max(...polygon.map(p=>p[0]));
  c.save();c.beginPath();polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
  for(let row=0;row<2;row++)for(let x=left,tile=0;x<right;x+=124,tile++){
   const selection=((area*7+row*5+tile*3)%17)/17;if(selection>=reaction.fraction)continue;
   const frame=(reaction.frame+area*2+row*3+tile)%16;
   c.drawImage(art.crowdCheer,(frame%4)*384,Math.floor(frame/4)*128,384,128,x,top-12+row*23,128,128/3);
  }
  c.restore();
 }
 c.restore();
}
function draw(ball=null,pose=0,movers=null,options={}){c.clearRect(0,0,960,540);if(!art.stadium){c.fillStyle='#244a35';c.fillRect(0,0,960,540);return;}c.drawImage(art.stadium,0,0,960,540);drawSky(performance.now());drawCrowd(performance.now());c.textAlign='center';c.fillStyle='#e5d9a2';c.font='700 10px BallparkPixel';c.fillText('POINTS',480,119);c.fillStyle='#ffcf64';c.font='700 30px ui-monospace, monospace';c.fillText(String(total()).padStart(4,'0'),480,146);c.fillStyle='#a8b68d';c.fillRect(401,153,158,1);c.fillStyle='#fff2c9';c.font='700 12px ui-monospace, monospace';c.fillText('RUNS '+state.runs,434,169);c.fillText('OUTS '+state.outs,525,169);c.font='400 10px BallparkPixel';c.fillStyle='#c6c69e';c.fillText(state.phase==='finished'?'FINAL':'AT BAT '+(state.phase==='welcome'?0:state.index+1)+' / 5',480,184);
player('fielder',252,320,38);player('fielder',707,321,38);player('fielder',480,280,32);player('pitcher'+(pose===1?'Throw':'Ready'),480,381,69);
const runners=movers||state.bases.flatMap((on,i)=>on?[{x:basePoints[i+1][0],y:basePoints[i+1][1]-8}]:[]);
for(const r of [...runners,...(options.actors||[])].sort((a,b)=>a.y-b.y)){c.fillStyle='#14352455';c.beginPath();c.ellipse(r.x,r.y+1,9,3,0,0,Math.PI*2);c.fill();runningPlayer(r,options.time??performance.now());}
if(!options.hideBatter&&['question','scoring','submit-error','animating'].includes(state.phase)){if(pose<2)atlasPlayer('batterIdle',422,507,125,options.time??performance.now());else player(['batterReady','batterReady','batterSwing','batterFollow','batterCelebrate'][pose]||'batterReady',422,507,125);}

if(ball){c.fillStyle='#fff9dc';c.beginPath();c.arc(ball.x,ball.y,ball.size||3,0,Math.PI*2);c.fill();c.fillStyle='#ae4434';c.fillRect(Math.round(ball.x),Math.round(ball.y-1),1,2);}}
// Sample rounded corners once, then traverse by actual distance at a shared speed.
const routeCache=new Map();
function runnerRoute(start,steps,batter=false){
 const key=[start,steps,batter].join(':');if(routeCache.has(key))return routeCache.get(key);
 const points=[batter?[422,515]:basePoints[start],...Array.from({length:steps},(_,i)=>basePoints[Math.min(4,start+i+1)])];
 const samples=[points[0]];
 for(let i=1;i<points.length;i++){
  const p=points[i],prev=points[i-1],next=points[i+1];
  if(!next){samples.push(p);continue;}
  const entry=[p[0]+(prev[0]-p[0])*.025,p[1]+(prev[1]-p[1])*.025];
  const exit=[p[0]+(next[0]-p[0])*.025,p[1]+(next[1]-p[1])*.025];samples.push(entry);
  for(let j=1;j<=8;j++){const t=j/8,u=1-t;samples.push([u*u*entry[0]+2*u*t*p[0]+t*t*exit[0],u*u*entry[1]+2*u*t*p[1]+t*t*exit[1]]);}
 }
 let length=0;const segments=samples.slice(1).map((b,i)=>{const a=samples[i],size=Math.hypot(b[0]-a[0],b[1]-a[1]);const seg={a,b,size,offset:length};length+=size;return seg;});
 const route={segments,length};routeCache.set(key,route);return route;
}
function routePoint(start,steps,t,batter=false){
 const route=runnerRoute(start,steps,batter),distance=Math.max(0,Math.min(1,t))*route.length;
 const seg=route.segments.find(s=>distance<=s.offset+s.size)||route.segments.at(-1);
 const u=Math.min(1,(distance-seg.offset)/seg.size),{a,b}=seg;
 return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u-8,dx:b[0]-a[0],dy:b[1]-a[1]};
}
const MOTION={contact:720,runStart:900,speed:.29,celebrate:720,exit:650,entry:650,outStart:1100};
const hitSteps=s=>s===1000?4:s>=800?3:s>=600?2:s>=400?1:0;
function baseRunners(bases){return bases.flatMap((on,i)=>on?[{x:basePoints[i+1][0],y:basePoints[i+1][1]-8,id:i+1}]:[]);}
function walkActor(id,from,to,t,clip='playerWalk'){
 const u=Math.max(0,Math.min(1,t));
 return {id,x:from[0]+(to[0]-from[0])*u,y:from[1]+(to[1]-from[1])*u,dx:to[0]-from[0],dy:to[1]-from[1],mode:'walk',clip,clipTime:u*MOTION.exit};
}
function scoringActor(id,elapsed){
 if(elapsed<MOTION.celebrate)return {id,x:480,y:480,mode:'celebrate',clipTime:elapsed};
 const exitTime=elapsed-MOTION.celebrate;
 return exitTime<MOTION.exit-1e-7?walkActor(id,[480,480],[1050,555],exitTime/MOTION.exit):null;
}
function playDuration(score,previousBases){
 const steps=hitSteps(score);if(!steps)return MOTION.outStart+MOTION.exit;
 let end=MOTION.runStart+runnerRoute(0,steps,true).length/MOTION.speed+(steps===4?MOTION.celebrate+MOTION.exit:180);
 for(let i=0;i<3;i++)if(previousBases[i]&&i+1+steps>=4){
  const arrival=MOTION.runStart+runnerRoute(i+1,3-i).length/MOTION.speed;
  end=Math.max(end,arrival+MOTION.celebrate+MOTION.exit);
 }
 return end;
}
function playScene(score,previousBases,elapsed,cleared=false){
 const steps=hitSteps(score),scene={ball:null,pose:0,runners:baseRunners(previousBases),hideBatter:false};
 if(elapsed<MOTION.contact){
  scene.pose=elapsed<300?0:1;
  const u=Math.max(0,(elapsed-300)/(MOTION.contact-300));
  if(elapsed>300)scene.ball={x:480-9*u,y:332+143*u-9*Math.sin(u*Math.PI),size:2+2*u};
  return scene;
 }
 scene.pose=elapsed<MOTION.contact+130?2:3;
 const flight=Math.min(1,(elapsed-MOTION.contact)/900);
 if(!steps){
  if(flight<1)scene.ball={x:471+55*flight,y:475+55*flight,size:4};
  if(elapsed>=MOTION.outStart){
   scene.hideBatter=true;
   const progress=(elapsed-MOTION.outStart)/MOTION.exit;
   scene.runners=cleared?scene.runners.filter(r=>progress<1).map(r=>walkActor(r.id,[r.x,r.y],[1050,555],progress)):scene.runners;
   if(progress<1)scene.runners.push(walkActor(0,[422,507],[-100,555],progress));
  }
  return scene;
 }
 const end=steps===4?{x:650,y:95}:steps===3?{x:790,y:275}:steps===2?{x:685,y:302}:{x:595,y:342};
 if(flight<1)scene.ball={x:471+(end.x-471)*flight,y:475+(end.y-475)*flight-110*Math.sin(Math.PI*flight),size:4-flight*2};
 if(elapsed<MOTION.runStart)return scene;
 scene.hideBatter=true;scene.runners=[];
 const runTime=elapsed-MOTION.runStart;
 function runner(start,travel,id,batter=false){
  const duration=runnerRoute(start,travel,batter).length/MOTION.speed;
  if(start+travel===4&&runTime>=duration){const actor=scoringActor(id,runTime-duration);if(actor)scene.runners.push(actor);return;}
  const progress=Math.min(1,runTime/duration);
  scene.runners.push({...routePoint(start,travel,progress,batter),id,moving:progress<1});
 }
 for(let i=0;i<3;i++)if(previousBases[i])runner(i+1,Math.min(steps,3-i),i+1);
 runner(0,steps,0,true);
 return scene;
}
function walkUp(done){
 if(reducedMotion()){done();return;}
 const start=performance.now();
 function frame(now){
  const progress=Math.min(1,(now-start)/MOTION.entry);
  draw(null,0,null,{hideBatter:true,time:now,actors:[walkActor(0,[-100,555],[422,507],progress,'batterWalk')]});
  if(progress<1)requestAnimationFrame(frame);else done();
 }
 requestAnimationFrame(frame);
}
function animate(score,previousBases,cleared=false){
 const reduced=reducedMotion(),duration=reduced?90:playDuration(score,previousBases),startTime=performance.now();beginCrowdReaction(score,startTime);
 function frame(now){
  const elapsed=Math.min(duration,now-startTime);
  const scene=reduced?{ball:null,pose:0,runners:baseRunners(state.bases),hideBatter:true}:playScene(score,previousBases,elapsed,cleared);
  if(elapsed>MOTION.contact+200||reduced)$('#play-call').textContent=result(score).toUpperCase()+'!';
  draw(scene.ball,scene.pose,scene.runners,{hideBatter:scene.hideBatter,time:elapsed});
  if(elapsed<duration)requestAnimationFrame(frame);else{state.phase='reveal';save();render();}
 }
 requestAnimationFrame(frame);
}
// Keep ambient idle clips alive without repainting over play/entrance animations.
let lastAmbientFrame=-Infinity;
function ambientFrame(now){
 if(artReady&&!document.hidden&&!reducedMotion()&&!['animating','entering'].includes(state.phase)&&now-lastAmbientFrame>=1000/30){draw(null,0,null,{time:now});lastAmbientFrame=now;}
 requestAnimationFrame(ambientFrame);
}
render();requestAnimationFrame(ambientFrame);bootstrap();
