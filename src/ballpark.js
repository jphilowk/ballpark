const ASSETS={"skyClouds":"./assets/skyClouds.png","skyMask":"./assets/skyMask.png","skyBirds":"./assets/skyBirds.png","crowdCheer":"./assets/crowdCheer.png","batterIdle":"./assets/batterIdle.png","batterSwingClip":"./assets/batterSwingClip.png","runnerIdle":"./assets/runnerIdle.png","runnerCelebrate":"./assets/runnerCelebrate.png","batterWalk":"./assets/batterWalk.png","playerWalk":"./assets/playerWalk.png","runnerFront":"./assets/runnerFront.png","runnerBack":"./assets/runnerBack.png","stadium":"./assets/stadiumAmbient.png","pitcherDelivery":"./assets/pitcherDelivery.png","pitcherCheer":"./assets/pitcherCheer.png","pitcherCry":"./assets/pitcherCry.png","pitcherSingle":"./assets/pitcherSingle.png","pitcherDouble":"./assets/pitcherDouble.png","pitcherTriple":"./assets/pitcherTriple.png","defenderIdle":"./assets/defenderIdle.png"};
import {points} from '../lib/scoring.mjs';
ASSETS.stadiumPortrait='./assets/stadiumPortrait.png';
ASSETS.portraitSkyMask='./assets/portraitSkyMask.png';
function result(score){return score===1000?'Home run':score>=800?'Triple':score>=600?'Double':score>=400?'Single':score>0?'Out':'Strikeout';}
function advance(bases,outs,score){const label=result(score);const steps=label==='Home run'?4:label==='Triple'?3:label==='Double'?2:label==='Single'?1:0;let runs=0;let next=[false,false,false];if(!steps){outs++;return {bases:outs===3?next:[...bases],outs:outs===3?0:outs,runs:0,cleared:outs===3};}for(let i=0;i<3;i++)if(bases[i]){if(i+steps>=3)runs++;else next[i+steps]=true;}if(steps===4)runs++;else next[steps-1]=true;return {bases:next,outs,runs,cleared:false};}
function chicagoDate(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
function shuffle(items,seed){let n=[...seed].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0)>>>0;const out=[...items];for(let i=out.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}

const bank=[{"sport": "NFL", "q": "How many regular-season punt-return touchdowns did Devin Hester score in his NFL career?", "answer": 14, "unit": "punt-return touchdowns", "fact": "Hester finished with 14 punt-return touchdowns in the regular season.", "source": "Pro Football Hall of Fame", "url": "https://www.profootballhof.com/players/devin-hester"}, {"sport": "NBA", "q": "How many points did Kobe Bryant score against Toronto on January 22, 2006?", "answer": 81, "unit": "points", "fact": "Bryant scored 81 points in the Lakers’ win over Toronto.", "source": "NBA", "url": "https://jr.nba.com/the-81-point-game/"}, {"sport": "MLB", "q": "How many stolen bases did Rickey Henderson record in his MLB regular-season career?", "answer": 1406, "unit": "stolen bases", "fact": "Henderson finished his major league career with 1,406 stolen bases.", "source": "Baseball Hall of Fame", "url": "https://baseballhall.org/discover/henderson-remembered-as-electrifying-legend-of-the-game"}, {"sport": "CBB", "q": "How many NCAA men’s basketball championships did Duke win under Mike Krzyzewski?", "answer": 5, "unit": "championships", "fact": "Duke won five NCAA championships under Coach K.", "source": "Duke Athletics", "url": "https://goduke.com/honors/hall-of-fame/mike-krzyzewski/26"}, {"sport": "CFB", "q": "How many touchdown passes did Joe Burrow throw in LSU’s 2019 season, including the postseason?", "answer": 60, "unit": "touchdown passes", "fact": "Burrow threw 60 touchdown passes during LSU’s unbeaten 2019 championship season.", "source": "LSU Athletics", "url": "https://lsusports.net/sports/fb/roster/season/2019/player/joe-burrow"}];
const $=s=>document.querySelector(s),panel=$('#panel');
const soundButton=$('#sound'),soundKey='ballpark-sound-muted';
let muted=false,audioContext,soundOutput,noiseBuffer,unlockPending;
try{muted=localStorage.getItem(soundKey)==='1';}catch{}
function updateSoundButton(){
 soundButton.setAttribute('aria-pressed',String(muted));
}
function unlockSound(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(muted||!Audio)return;
 try{
  if(!audioContext){
   audioContext=new Audio();
   soundOutput=audioContext.createGain();
   soundOutput.connect(audioContext.destination);
   noiseBuffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*.25),audioContext.sampleRate);
   const samples=noiseBuffer.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
  }
  if(audioContext.state==='running')return;
  if(!unlockPending){
   unlockPending=audioContext.resume().catch(()=>{}).finally(()=>{unlockPending=null;});
  }
  return unlockPending;
 }catch{}
}

const CONTROL_CUES={
 start:[460,700],retry:[415,590],swing:[290,125],next:[630,810],
 results:[700,930],share:[780,1170],again:[370,560],today:[520,870],
 help:[510,650],close:[510,320],details:[585,460],link:[850,690],
 mute:[570,320],unmute:[360,650]
};
function playControlSound(cue){
 const ready=unlockSound();
 const play=()=>{
  if(muted||audioContext?.state!=='running')return;
  const [pitch,end]=CONTROL_CUES[cue];
  soundTone(audioContext.currentTime,.055,.08,pitch,end,'sine');
 };
 if(ready)void ready.then(play);else play();
}

updateSoundButton();
soundButton.onclick=()=>{
 if(!muted)playControlSound('mute');
 muted=!muted;
 if(soundOutput){
  const now=audioContext.currentTime;
  soundOutput.gain.cancelScheduledValues(now);
  soundOutput.gain.setValueAtTime(1,now);
  if(muted)soundOutput.gain.linearRampToValueAtTime(0,now+.055);
 }
 try{localStorage.setItem(soundKey,muted?'1':'0');}catch{}
 updateSoundButton();
 if(!muted)playControlSound('unmute');
};
document.addEventListener('click',event=>{
 const control=event.target.closest('button,summary,a');
 if(!control||control.disabled||control===soundButton)return;
 const cue=control.dataset.sound||'link';
 playControlSound(cue);
},true);

function soundEnvelope(source,duration,volume,when,attack,filter){
 const gain=audioContext.createGain();
 gain.gain.setValueAtTime(.001,when);
 gain.gain.linearRampToValueAtTime(volume,when+attack);
 gain.gain.exponentialRampToValueAtTime(.001,when+duration);
 source.connect(filter||gain);
 if(filter)filter.connect(gain);
 gain.connect(soundOutput);
 source.start(when);
 source.stop(when+duration);
 source.onended=()=>{
  source.disconnect();
  if(filter)filter.disconnect();
  gain.disconnect();
 };
}
function soundNoise(when,duration,volume,frequency,attack=.008){
 const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter();
 source.buffer=noiseBuffer;
 filter.type='bandpass';
 filter.frequency.value=frequency;
 filter.Q.value=.7;
 soundEnvelope(source,duration,volume,when,attack,filter);
}
function soundTone(when,duration,volume,frequency,endFrequency,type='triangle'){
 const source=audioContext.createOscillator();
 source.type=type;
 source.frequency.setValueAtTime(frequency,when);
 source.frequency.exponentialRampToValueAtTime(endFrequency,when+duration);
 soundEnvelope(source,duration,volume,when,.005);
}
function playAtBatSound(score){
 if(muted||audioContext?.state!=='running')return;
 const now=audioContext.currentTime;
 if(score===0){
  soundNoise(now,.19,.12,1000,.045);
  soundTone(now+.07,.13,.085,210,105);
 }else{
  soundNoise(now,.09,.34,2100);
  soundTone(now,.12,.14,690,170);
 }
 if(score===1000){
  [392,494,587,784].forEach((note,i)=>soundTone(now+.18+i*.095,.19,.027,note,note));
 }
}
const viewport=window.visualViewport;
let fullViewportHeight=Math.max(window.innerHeight,viewport?.height||0);
function syncMobileViewport(){
 if(!viewport)return;
 const focused=document.activeElement?.id==='guess';
 if(!focused)fullViewportHeight=Math.max(window.innerHeight,viewport.height);
 const keyboardOpen=focused&&matchMedia('(pointer:coarse)').matches&&viewport.height<fullViewportHeight-100;
 document.body.classList.toggle('keyboard-open',keyboardOpen);
 document.documentElement.style.setProperty('--game-height',keyboardOpen?`${viewport.height}px`:'100dvh');
 document.documentElement.style.setProperty('--viewport-offset',keyboardOpen?`${viewport.offsetTop}px`:'0px');
}
viewport?.addEventListener('resize',syncMobileViewport);
viewport?.addEventListener('scroll',syncMobileViewport);
window.addEventListener('resize',syncMobileViewport);
document.addEventListener('focusin',syncMobileViewport);
document.addEventListener('focusout',()=>requestAnimationFrame(syncMobileViewport));
let date=chicagoDate(),key='ballpark-fullfield-v4-'+date,questions=shuffle(bank,date),daily=null,todayDaily=null,activeSession=false,dailyCheckPending=null,contentReady=false,contentError='';
const ACTIVE_GAME_KEY='ballpark-active-daily-v1';
const initial=()=>({phase:'welcome',index:0,history:[],bases:[false,false,false],outs:0,runs:0,deadline:null,draft:'',token:null,questions:[],pendingGuess:null,pendingTimed:false,submitError:''});let state=initial(),saved=true;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const RATE_LIMIT_MESSAGE='Too many requests right now. Wait a moment, then retry.';
async function apiCall(path,body){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});if(response.status===429)throw Object.assign(new Error(RATE_LIMIT_MESSAGE),{status:429});const data=await response.json();if(!response.ok)throw Error(data.error||'Game unavailable');return data;}finally{clearTimeout(timeout);}
}
function restore(){
 try{const old=JSON.parse(localStorage.getItem(key));if(old&&Array.isArray(old.history)&&old.index>=0&&old.index<5&&(!daily||old.token))state={...initial(),...old};}catch{saved=false;}
 if(daily){if(!state.token)state.token=daily.token;questions=Array.from({length:5},(_,i)=>state.questions[i]||null);}
 if(state.phase==='animating')state.phase='reveal';
 if(['entering','loading'].includes(state.phase))state.phase='welcome';
 if(state.phase==='scoring')state.phase='submit-error';
}
function tokenExpiry(token){
 try{const payload=JSON.parse(atob(token.split('.')[0].replaceAll('-','+').replaceAll('_','/')));return Number.isFinite(payload.exp)?payload.exp:0;}catch{return 0;}
}
function savedActiveGame(){
 try{
  const game=JSON.parse(localStorage.getItem(ACTIVE_GAME_KEY));
  if(!game||game.key!==`ballpark-daily-v1-${game.puzzleId}`||typeof game.date!=='string')return null;
  const old=JSON.parse(localStorage.getItem(game.key));
  if(!old||old.phase==='finished'||!old.token||tokenExpiry(old.token)<=Date.now()){localStorage.removeItem(ACTIVE_GAME_KEY);return null;}
  return game;
 }catch{return null;}
}
function useDaily(game,active=false){
 daily=game;date=game.date;key='ballpark-daily-v1-'+game.puzzleId;state=initial();activeSession=active;
 restore();
 if(!active&&state.phase!=='welcome'&&state.phase!=='finished'){activeSession=true;save();}
 contentReady=true;contentError='';render();
}
async function bootstrap(){
 contentReady=false;contentError='';
 try{
  if(location.protocol!=='file:'){
   todayDaily=await apiCall('/api/daily');
   const active=savedActiveGame();useDaily(active||todayDaily,Boolean(active));
  }else{
   restore();contentReady=true;render();
  }
 }catch(error){contentError=error.status===429?RATE_LIMIT_MESSAGE:'Today’s game couldn’t load. Please try again.';render();}
}
async function checkDaily(){
 if(location.protocol==='file:'||!todayDaily||chicagoDate()===todayDaily.date&&(!activeSession||tokenExpiry(state.token)>Date.now()))return;
 if(dailyCheckPending)return dailyCheckPending;
 dailyCheckPending=(async()=>{
  try{
   const fresh=await apiCall('/api/daily');todayDaily=fresh;
   if(activeSession&&tokenExpiry(state.token)>Date.now())return;
   if(activeSession){activeSession=false;try{localStorage.removeItem(ACTIVE_GAME_KEY);}catch{saved=false;}}
   if(state.phase==='welcome'||state.phase!=='finished'&&daily.puzzleId!==fresh.puzzleId)useDaily(fresh);
   else if(state.phase==='finished')render();
  }catch{}
 })();
 try{await dailyCheckPending;}finally{dailyCheckPending=null;}
}
function refreshStartButton(){const button=$('#start');if(!button)return;button.disabled=!artReady||(!contentReady&&!contentError);button.textContent=contentError?'Try again':!contentReady?'Loading…':artReady?'Play':'Loading…';}
function save(){try{localStorage.setItem(key,JSON.stringify(state));if(daily){if(activeSession)localStorage.setItem(ACTIVE_GAME_KEY,JSON.stringify({key,date,puzzleId:daily.puzzleId,mode:daily.mode}));else localStorage.removeItem(ACTIVE_GAME_KEY);}}catch{saved=false;}}
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
 unlockSound();
 if(!contentReady)return bootstrap();
 if(daily&&activeSession&&tokenExpiry(state.token)<=Date.now()){
  await checkDaily();
  if(activeSession){contentError='Your previous game expired. Today’s game couldn’t load. Try again.';render();}
  return;
 }
 if(daily&&!activeSession&&chicagoDate()!==date){await checkDaily();if(chicagoDate()!==date){contentError='Today’s game couldn’t load. Please try again.';render();return;}}
 contentError='';state.deadline=null;state.draft='';
 if(daily)activeSession=true;
 if(daily&&!questions[state.index]){
  state.phase='loading';save();render();
  try{questions[state.index]=await apiCall('/api/question',{token:state.token});state.questions[state.index]=questions[state.index];}
  catch(error){state.phase='welcome';contentError=error.status===429?RATE_LIMIT_MESSAGE:'This at-bat couldn’t load. Try again.';save();render();return;}
 }
 state.phase='entering';save();render();
 walkUp(()=>{state.phase='question';state.deadline=Date.now()+20000;save();render();});
}
function render(){fadeOutPanels();document.body.dataset.phase=state.phase;hud();$('#play-call').textContent='';
if(state.phase==='welcome'){panel.innerHTML=`<div class="prompt-card welcome"><h1>Ballparkle</h1><p class="welcome-copy">${escapeHtml(contentError||(!contentReady?"Loading today’s game…":daily?.mode==='daily'?"Five sports. Five at-bats.":"Practice · Five sports. Five at-bats."))}</p><button class="primary" id="start" data-sound="${contentError?'retry':'start'}">Play</button></div>`;refreshStartButton();$('#start').onclick=contentError&&!contentReady?bootstrap:start;}
else if(state.phase==='question'){const q=questions[state.index];panel.innerHTML=`<div class="prompt-card"><div class="sport">${escapeHtml(q.sport)} · AT BAT ${state.index+1} OF 5</div><h2>${escapeHtml(q.q)}</h2></div><form id="guess-form" class="answer-dock"><span class="timer" role="timer" aria-label="Seconds remaining">20</span><div class="input-wrap"><input id="guess" type="text" inputmode="decimal" autocomplete="off" aria-label="Your guess in ${escapeHtml(q.unit)}" placeholder="Number" aria-describedby="error"/><div class="track"><div></div></div></div><button class="primary" type="submit" data-sound="swing">Swing</button><div class="error" id="error" role="alert"></div></form>`;$('#guess').value=state.draft;$('#guess').oninput=e=>{state.draft=e.target.value;$('#error').textContent='';save();};$('#guess-form').onsubmit=e=>{e.preventDefault();submit(false);};if(!matchMedia('(pointer:coarse)').matches)$('#guess').focus({preventScroll:true});tick();}
else if(state.phase==='reveal'){const last=state.history.at(-1),q=questions[state.index];panel.innerHTML=`<div class="prompt-card reveal"><div class="sport">${result(last.score).toUpperCase()} · +${last.score}</div><div class="answers"><div><small>YOUR GUESS</small><strong>${last.guess===null?'—':last.guess.toLocaleString()}</strong></div><div><small>ANSWER</small><strong>${q.answer.toLocaleString()}</strong></div></div><details><summary data-sound="details">Details</summary><p>${escapeHtml(q.fact)}</p><a href="${escapeHtml(q.url)}" target="_blank" rel="noopener">${escapeHtml(q.source)}</a></details></div><div class="answer-dock single"><button class="primary" id="next" data-sound="${state.index===4?'results':'next'}">${state.index===4?'Results':'Next'}</button></div>`;$('#next').onclick=()=>{if(state.index===4){state.phase='finished';activeSession=false;save();render();checkDaily();}else{state.index++;start();}};}
else if(['animating','entering'].includes(state.phase)){panel.innerHTML='';}
else if(['loading','scoring'].includes(state.phase)){panel.innerHTML=`<div class="prompt-card welcome"><p class="welcome-copy">${state.phase==='loading'?'Getting the next at-bat…':'Saving your swing…'}</p></div>`;}
else if(state.phase==='submit-error'){panel.innerHTML=`<div class="prompt-card welcome"><p class="welcome-copy">${escapeHtml(state.submitError||'Your guess is saved. That swing couldn’t be scored. Try again.')}</p><button class="primary" id="retry-swing" data-sound="retry">Retry</button></div>`;$('#retry-swing').onclick=()=>submit(state.pendingTimed);}
else renderBoxScore();
syncMobileViewport();fadeInPanels();}

function renderBoxScore(){
 const rows=state.history.map((atBat,i)=>`<tr><th scope="row">${i+1} · ${escapeHtml(questions[i]?.sport||'At bat')}</th><td>${result(atBat.score)}</td><td>${atBat.score.toLocaleString()}</td></tr>`).join('');
 panel.innerHTML=`<div class="prompt-card final">
  <h2>Final box score</h2>
  <div class="box-total">${total().toLocaleString()}<small> / 5,000</small></div>
  <div class="finish-runs">${state.runs} RUN${state.runs===1?'':'S'}</div>
  <table class="box-score" aria-label="At-bat results">
   <thead><tr><th scope="col">At bat</th><th scope="col">Result</th><th scope="col">Points</th></tr></thead>
   <tbody>${rows}</tbody>
  </table>
  <div class="box-actions"><button class="primary" id="share" data-sound="share">Copy result</button>${todayDaily&&todayDaily.puzzleId!==daily?.puzzleId?'<button class="secondary" id="today" data-sound="today">Play today’s puzzle</button>':daily?.mode==='daily'?'':'<button class="secondary" id="again" data-sound="again">Play again</button>'}</div>
  <div id="share-status" role="status"></div>
  <textarea id="share-text" aria-label="Result to copy" readonly hidden></textarea>
 </div>`;
 $('#share').onclick=async()=>{
  const text=`BALLPARKLE ${daily?.mode==='daily'?date:'PRACTICE'}\n${total().toLocaleString()} / 5,000 · ${state.runs} run${state.runs===1?'':'s'}\n${state.history.map(h=>abbr(result(h.score))).join(' · ')}`;
  const status=$('#share-status'),fallback=$('#share-text');
  try{await navigator.clipboard.writeText(text);status.textContent='Copied';fallback.hidden=true;}
  catch{status.textContent='Select and copy your result.';fallback.value=text;fallback.hidden=false;fallback.select();}
 };
 const again=$('#again');
 if(again)again.onclick=()=>{state=initial();if(daily){state.token=daily.token;questions=Array(5).fill(null);}save();render();};
 const today=$('#today');
 if(today)today.onclick=()=>useDaily(todayDaily);
}

function parse(raw){const input=raw.trim();if(!/^(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(input))return null;const n=Number(input.replaceAll(',',''));return Number.isFinite(n)?n:null;}
async function submit(timed){
 if(!['question','submit-error'].includes(state.phase))return;
 const retry=state.phase==='submit-error';
 if(!retry&&!timed&&Date.now()>=state.deadline)return submit(true);
 const guess=retry?state.pendingGuess:parse(state.draft);
 if(!retry&&!timed&&guess===null){$('#error').textContent='Enter a positive number or zero.';return;}
 if(!timed)unlockSound();
 const previousBases=[...state.bases];let score;
 if(daily){
  state.pendingGuess=guess;state.pendingTimed=timed;state.phase='scoring';state.deadline=null;save();
  const form=$('#guess-form');
  if(form){
   form.querySelector('button').disabled=true;
   $('#guess').readOnly=true;
   $('#guess').blur();
   $('#error').textContent='Saving your swing…';
  }else render();
  try{const response=await apiCall('/api/score',{token:state.token,guess,timed});score=response.score;Object.assign(questions[state.index],{answer:response.answer,fact:response.fact,source:response.source,url:response.url});state.questions[state.index]=questions[state.index];state.token=response.token;}
  catch(error){state.phase='submit-error';state.submitError=error.status===429?'Your guess is saved. '+RATE_LIMIT_MESSAGE:'Your guess is saved. That swing couldn’t be scored. Try again.';save();render();return;}
 }else score=points(guess,questions[state.index].answer,questions[state.index].sport);
 const play=advance(state.bases,state.outs,score);
 state.history.push({guess,score,timed,runs:play.runs,cleared:play.cleared});state.bases=play.bases;state.outs=play.outs;state.runs+=play.runs;state.phase='animating';state.pendingGuess=null;state.submitError='';save();$('#guess')?.blur();render();animate(score,previousBases,play.cleared);
}
function tick(){if(state.phase!=='question')return;const left=Math.max(0,state.deadline-Date.now());if(left===0){submit(true);return;}const timer=$('.timer'),track=$('.track');if(timer){timer.textContent=Math.ceil(left/1000);timer.classList.toggle('urgent',left<=5000);track.classList.toggle('urgent',left<=5000);track.firstElementChild.style.width=left/200+'%';}}
setInterval(tick,100);setInterval(checkDaily,60000);document.addEventListener('visibilitychange',()=>{tick();if(!document.hidden)checkDaily();});window.addEventListener('focus',checkDaily);$('#help').onclick=openHelp;$('#close-help').onclick=closeHelp;$('#rules').oncancel=e=>{e.preventDefault();closeHelp();};
const canvas=$('#field'),c=canvas.getContext('2d');canvas.width=960;canvas.height=540;c.imageSmoothingEnabled=false;
const portraitView=matchMedia('(max-width: 650px) and (orientation: portrait)');
portraitView.addEventListener('change',()=>{
 if(!['animating','entering'].includes(state.phase))draw();
});
const skyCanvas=document.createElement('canvas');skyCanvas.width=960;skyCanvas.height=540;
const skyContext=skyCanvas.getContext('2d');skyContext.imageSmoothingEnabled=false;
const ambientEpoch=performance.now();
const art={};let artReady=false,animationPose=0;
const artEntries=Object.entries(ASSETS);
Promise.all([document.fonts.load('700 24px BallparkPixel'),...artEntries.map(([name,url])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{art[name]=im;resolve();};im.onerror=()=>resolve();im.src=url;}))]).then(()=>{if(art.skyMask)buildSkyTintMask();artReady=Object.keys(art).length===artEntries.length;draw();refreshStartButton();});
const basePoints=[[480,488],[772,383],[480,315],[185,383],[480,488]];
// Canvas selects frames from the approved sprite sheets.
const CLIPS={
 runnerFront:{ms:60,frames:8},runnerBack:{ms:60,frames:8},
 batterIdle:{ms:120,frames:1},batterSwingClip:{ms:50,frames:8,once:true},
 runnerIdle:{ms:120,frames:8},runnerCelebrate:{ms:90,frames:8,once:true},
 defenderIdle:{ms:120,frames:8},pitcherDelivery:{ms:50,frames:12,once:true},
 pitcherCheer:{ms:110,frames:8,once:true},pitcherCry:{ms:110,frames:8,once:true},
 pitcherSingle:{ms:110,frames:8,once:true},pitcherDouble:{ms:110,frames:8,once:true},pitcherTriple:{ms:110,frames:8,once:true},
 batterWalk:{ms:100,frames:8},playerWalk:{ms:100,frames:8}
};
function atlasPlayer(name,x,y,height,time=0,mirror=false,offset=0){
 const im=art[name];if(!im)return;
 const clip=CLIPS[name],freeze=reducedMotion();
 const step=freeze?0:Math.floor(Math.max(0,time)/clip.ms+offset);
 const frame=clip.once?Math.min(clip.frames-1,step):step%clip.frames,scale=height/362;
 c.save();c.translate(Math.round(x),Math.round(y));if(mirror)c.scale(-1,1);
 c.drawImage(im,(frame%4)*384,Math.floor(frame/4)*384,384,384,-192*scale,-374*scale,384*scale,384*scale);
 c.restore();
}
function runnerHeight(y){return 43+Math.max(0,Math.min(1,(y-310)/197))*82;}
function runningPlayer(r,time,drawPlayer=atlasPlayer){
 const height=runnerHeight(r.y);
 if(r.mode==='celebrate'){drawPlayer('runnerCelebrate',r.x,r.y,height,r.clipTime);return;}
 if(r.mode==='walk'){drawPlayer(r.clip||'playerWalk',r.x,r.y,r.clip==='batterWalk'?125:height,r.clipTime,r.dx<0);return;}
 if(!r.moving){drawPlayer('runnerIdle',r.x,r.y,height,time,false,(r.id||0)*3);return;}
 const toward=(r.dy||0)>0,side=r.dx||1;
 drawPlayer(toward?'runnerFront':'runnerBack',r.x,r.y,height,time,(toward&&side>0)||(!toward&&side<0),(r.id||0)*4);
}
function reducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
// Original Higgsfield clouds are separate layers; new birds and crowd use generated frames.
const SCENERY={birdDelay:6000,birdInterval:42000,birdDuration:12000};
// Chicago solar position follows NOAA's fractional-year approximation. UTC input
// makes sunrise, sunset, and daylight-saving changes independent of device zone.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
function solarPosition(timestamp){
 const date=new Date(timestamp),year=date.getUTCFullYear();
 const day=Math.floor((Date.UTC(year,date.getUTCMonth(),date.getUTCDate())-Date.UTC(year,0,0))/86400000);
 const days=(year%4===0&&(year%100!==0||year%400===0))?366:365;
 const minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
 const gamma=2*Math.PI/days*(day-1+(minutes/60-12)/24);
 const equation=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
 const declination=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
 const solarMinutes=((minutes+equation-4*87.6298)%1440+1440)%1440;
 const hourAngle=(solarMinutes/4-180)*Math.PI/180,latitude=41.8781*Math.PI/180;
 const elevation=Math.asin(Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination)*Math.cos(hourAngle))*180/Math.PI;
 return {elevation,morning:hourAngle<0};
}
const DAY_LIGHT=[112,177,230,0,0];
const NIGHT_LIGHT=[8,19,47,.88,1];
const DAWN_LIGHT=[238,137,115,.54,0];
const DUSK_LIGHT=[232,106,103,.57,0];
function blendLight(a,b,t){return a.map((value,i)=>value+(b[i]-value)*t);}
function lightingAt(timestamp){
 const {elevation,morning}=solarPosition(timestamp),warm=morning?DAWN_LIGHT:DUSK_LIGHT;
 const twilight=morning?[55,56,92,.77,.25]:[57,47,91,.79,.25];
 const ramp=(low,high)=>Math.max(0,Math.min(1,(elevation-low)/(high-low)));
 const values=elevation<-12?NIGHT_LIGHT:elevation<-4?blendLight(NIGHT_LIGHT,twilight,ramp(-12,-4)):elevation<2?blendLight(twilight,warm,ramp(-4,2)):elevation<12?blendLight(warm,DAY_LIGHT,ramp(2,12)):DAY_LIGHT;
 return {sky:`rgb(${values.slice(0,3).map(Math.round).join(',')})`,skyAlpha:values[3],stars:values[4]};
}
let lightingMinute=-1,lighting=lightingAt(Date.now());
function currentLighting(){const minute=Math.floor(Date.now()/60000);if(minute!==lightingMinute){lightingMinute=minute;lighting=lightingAt(Date.now());}return lighting;}
const STARS=[[36,22],[83,49],[134,17],[180,68],[231,32],[286,54],[334,24],[390,72],[439,38],[557,31],[605,60],[718,26],[768,71],[813,35],[902,53],[947,22]];
let skyTintMask=null;
function buildSkyTintMask(){
 skyTintMask=document.createElement('canvas');skyTintMask.width=960;skyTintMask.height=540;
 const ctx=skyTintMask.getContext('2d');ctx.drawImage(art.skyMask,0,0,960,540);
 const width=960,height=540,size=width*height;
 const source=ctx.getImageData(0,0,width,height),filled=ctx.createImageData(width,height);
 const ground=new Uint8Array(size),queue=new Int32Array(size);let head=0,tail=0;
 const transparent=i=>source.data[i*4+3]<128;
 const visit=i=>{if(i>=0&&i<size&&!ground[i]&&transparent(i)){ground[i]=1;queue[tail++]=i;}};
 // The stadium is one transparent region connected to the bottom of the
 // original sky mask. Fill only separate cloud holes; never tint that region.
 for(let x=0;x<width;x++)visit((height-1)*width+x);
 while(head<tail){const i=queue[head++],x=i%width; if(x>0)visit(i-1);if(x<width-1)visit(i+1);visit(i-width);visit(i+width);}
 for(let i=0;i<size;i++)if(!ground[i]){const p=i*4;filled.data[p]=filled.data[p+1]=filled.data[p+2]=filled.data[p+3]=255;}
 ctx.putImageData(filled,0,0);
}
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
function drawPortraitLighting(){
 const light=currentLighting(),mask=art.portraitSkyMask;
 if(!mask||!light.skyAlpha)return;
 const ctx=skyContext;
 // Reuse the offscreen canvas and composite only the upper part of the portrait.
 ctx.clearRect(0,0,960,540);
 ctx.fillStyle=light.sky;
 ctx.globalAlpha=light.skyAlpha;
 ctx.fillRect(0,0,mask.width,mask.height);
 if(light.stars){
  ctx.fillStyle='#fff5d5';
  ctx.globalAlpha=light.stars*.9;
  for(const [x,y] of STARS)ctx.fillRect(Math.round(x*752/960),Math.round(y*3.6),2,2);
 }
 ctx.globalAlpha=1;
 ctx.globalCompositeOperation='destination-in';
 ctx.drawImage(mask,0,0);
 ctx.globalCompositeOperation='source-over';
 c.drawImage(skyCanvas,0,0,mask.width,mask.height,0,0,mask.width,mask.height);
}
function drawSky(now){
 if(!art.skyClouds||!art.skyMask)return;
 const scene=skyScene(now-ambientEpoch,reducedMotion()),ctx=skyContext,light=currentLighting();
 ctx.clearRect(0,0,960,540);
 for(const cloud of scene.clouds)ctx.drawImage(art.skyClouds,cloud.sx,cloud.sy,cloud.w,cloud.h,cloud.x,cloud.y,cloud.width,cloud.height);
 if(scene.bird&&art.skyBirds){
  const b=scene.bird;ctx.save();ctx.translate(b.x,b.y);if(b.reverse){ctx.translate(b.width,0);ctx.scale(-1,1);}
  ctx.drawImage(art.skyBirds,(b.frame%4)*384,Math.floor(b.frame/4)*128,384,128,0,0,b.width,b.height);ctx.restore();
 }
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(art.skyMask,0,0,960,540);ctx.globalCompositeOperation='source-over';
 c.drawImage(skyCanvas,0,0);
 if(light.skyAlpha||light.stars){
  ctx.clearRect(0,0,960,540);
  if(light.skyAlpha){ctx.fillStyle=light.sky;ctx.globalAlpha=light.skyAlpha;ctx.fillRect(0,0,960,220);ctx.globalAlpha=1;}
  if(light.stars){ctx.fillStyle='#fff5d5';ctx.globalAlpha=light.stars*.9;for(const [x,y] of STARS)ctx.fillRect(x,y,2,2);ctx.globalAlpha=1;}
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(skyTintMask,0,0);ctx.globalCompositeOperation='source-over';
  c.drawImage(skyCanvas,0,0);
 }
}
const CROWD_PROFILES=[null,
 {duration:1800,fraction:.22,ms:125},
 {duration:2800,fraction:.44,ms:100},
 {duration:4000,fraction:.7,ms:80},
 {duration:6800,fraction:1,ms:60}
];
let crowdReaction=null;
function crowdLevel(score){return score===1000?4:score>=800?3:score>=600?2:score>=400?1:0;}
function beginCrowdReaction(score,now,speed=1){
 const level=crowdLevel(score);
 if(level&&!reducedMotion())crowdReaction={level,start:now+MOTION.contact/speed};
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
const PORTRAIT_CROWD_AREAS=[
 [[0,501],[80,521],[126,543],[148,568],[0,555]],
 [[0,584],[136,582],[169,627],[0,637]],
 [[154,580],[210,586],[244,625],[183,626]],
 [[502,627],[534,594],[574,590],[554,625]],
 [[565,629],[597,591],[624,589],[600,631]],
 [[610,630],[643,589],[752,558],[752,639]],
 [[583,566],[722,559],[721,573],[586,588]]
];
function drawCrowd(now,portrait=false){
 const reaction=crowdScene(now,reducedMotion());if(!reaction.alpha||!art.crowdCheer)return;
 const areas=portrait?PORTRAIT_CROWD_AREAS:CROWD_AREAS;
 c.save();c.globalAlpha=reaction.alpha;
 for(let area=0;area<areas.length;area++){
  const polygon=areas[area],left=Math.min(...polygon.map(p=>p[0])),top=Math.min(...polygon.map(p=>p[1])),right=Math.max(...polygon.map(p=>p[0]));
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
// Match the portrait artwork's base anchors while keeping the shared play timeline.
// Project the anchor only so players retain their original proportions.
const portraitX=x=>376+(x-480)*.79;
const portraitY=y=>790+(y-307)*1.37;
// The delivery sheet's idle cleats sit slightly right of its frame center.
const PORTRAIT_PITCHER={x:371,y:904,height:100,releaseX:350,releaseY:834};
function portraitPlayer(name,x,y,height,...frame){
 atlasPlayer(name,portraitX(x),portraitY(y),height*1.15,...frame);
}
function drawScoreboard(portrait){
 c.save();
 if(portrait){
  c.translate(376,495);
  c.scale(1.12,1.12);
  c.translate(-480,-109);
 }
 c.textAlign='center';c.fillStyle='#e5d9a2';c.font='700 10px BallparkPixel';c.fillText('POINTS',480,119);
 c.fillStyle='#ffcf64';c.font='700 30px ui-monospace, monospace';c.fillText(String(total()).padStart(4,'0'),480,146);
 c.fillStyle='#a8b68d';c.fillRect(401,153,158,1);
 c.fillStyle='#fff2c9';c.font='700 12px ui-monospace, monospace';c.fillText('RUNS '+state.runs,434,169);c.fillText('OUTS '+state.outs,525,169);
 c.font='400 10px BallparkPixel';c.fillStyle='#c6c69e';c.fillText(state.phase==='finished'?'FINAL':'AT BAT '+(state.phase==='welcome'?0:state.index+1)+' / 5',480,184);
 c.restore();
}
function draw(ball=previousPlayBall(),pose=0,movers=null,options={}){
 const portrait=portraitView.matches,width=portrait?752:960,height=portrait?1344:540;
 if(canvas.width!==width||canvas.height!==height){
  canvas.width=width;canvas.height=height;c.imageSmoothingEnabled=false;
 }
 c.clearRect(0,0,width,height);
 const stadium=portrait?art.stadiumPortrait:art.stadium;
 if(!stadium){c.fillStyle='#244a35';c.fillRect(0,0,width,height);return;}
 c.drawImage(stadium,0,0,width,height);
 const now=performance.now();
 if(portrait)drawPortraitLighting();else drawSky(now);
 drawCrowd(now,portrait);
 drawScoreboard(portrait);
 const drawPlayer=portrait?portraitPlayer:atlasPlayer,spriteTime=options.time??now;
 drawPlayer('defenderIdle',portrait?205:252,portrait?280:320,portrait?49:38,spriteTime);
 drawPlayer('defenderIdle',portrait?755:707,portrait?280:321,portrait?49:38,spriteTime,false,3);
 drawPlayer('defenderIdle',480,portrait?247:280,portrait?41:32,spriteTime,false,5);
 const pitching=state.phase==='animating'&&!reducedMotion();
 const pitchTime=pitching?options.time??0:0;
 const reaction=pitching?pitcherReaction(state.history.at(-1)?.score,pitchTime):null;
 const pitcher=portrait?PORTRAIT_PITCHER:{x:480,y:381,height:69};
 atlasPlayer(reaction?.clip??'pitcherDelivery',pitcher.x,pitcher.y,pitcher.height,reaction?.time??pitchTime);
 const runners=movers||state.bases.flatMap((on,i)=>on?[{x:basePoints[i+1][0],y:basePoints[i+1][1]-8}]:[]);
 for(const runner of [...runners,...(options.actors||[])].sort((a,b)=>a.y-b.y)){
  const x=portrait?portraitX(runner.x):runner.x,y=portrait?portraitY(runner.y):runner.y;
  c.fillStyle='#14352455';c.beginPath();c.ellipse(x,y+1,9,3,0,0,Math.PI*2);c.fill();
  runningPlayer(runner,spriteTime,drawPlayer);
 }
 if(!options.hideBatter&&['question','scoring','submit-error','animating'].includes(state.phase)){
  const [x,y]=batterPosition(portrait);
  if(pose<1)drawPlayer('batterIdle',x,y,125);
  else drawPlayer('batterSwingClip',x,y,125,(options.time??0)-MOTION.swingStart);
 }
 if(ball&&portrait){
  let x=portraitX(ball.x),y=portraitY(ball.y);
  const groundY=ball.groundY;
  if(groundY===undefined){
   // Match the larger pitcher's release and converge on the existing contact point.
   const remaining=(MOTION.contact-pitchTime)/(MOTION.contact-MOTION.release);
   x+=(PORTRAIT_PITCHER.releaseX-portraitX(PITCH_RELEASE.x))*remaining;
   y+=(PORTRAIT_PITCHER.releaseY-portraitY(PITCH_RELEASE.y))*remaining;
  }
  drawBaseball({...ball,x,y,groundY:groundY===undefined?undefined:portraitY(groundY),size:ball.size*1.15});
 }else if(ball){
  drawBaseball(ball);
 }
}
function drawBaseball({x,y,size,spin,groundY}){
 if(groundY!==undefined){
  c.fillStyle='rgba(18,33,22,.32)';c.beginPath();
  c.ellipse(x,groundY+size,size*1.2,size*.45,0,0,Math.PI*2);c.fill();
 }
 c.save();c.translate(Math.round(x),Math.round(y));
 c.fillStyle='#575044';c.beginPath();c.arc(0,0,size+.7,0,Math.PI*2);c.fill();
 c.fillStyle='#fff7de';c.beginPath();c.arc(0,0,size,0,Math.PI*2);c.fill();
 c.rotate(spin);c.strokeStyle='#b84438';c.lineWidth=.85;c.beginPath();
 c.moveTo(-size*.48,-size*.66);c.quadraticCurveTo(size*.32,0,-size*.48,size*.66);
 c.moveTo(size*.4,-size*.66);c.quadraticCurveTo(-size*.19,0,size*.4,size*.66);
 c.stroke();c.restore();
}
// Sample rounded corners once, then traverse by actual distance at a shared speed.
const routeCache=new Map();
const BATTER_POSITION=[422,507],PORTRAIT_BATTER_POSITION=[398,487];
function batterPosition(portrait){return portrait?PORTRAIT_BATTER_POSITION:BATTER_POSITION;}
function runnerRoute(start,steps,batter=false,portrait=false){
 const key=[start,steps,batter,batter&&portrait].join(':');if(routeCache.has(key))return routeCache.get(key);
 const [x,y]=batterPosition(portrait);
 const points=[batter?[x,y+8]:basePoints[start],...Array.from({length:steps},(_,i)=>basePoints[Math.min(4,start+i+1)])];
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
function routePoint(start,steps,t,batter=false,portrait=false){
 const route=runnerRoute(start,steps,batter,portrait),distance=Math.max(0,Math.min(1,t))*route.length;
 const seg=route.segments.find(s=>distance<=s.offset+s.size)||route.segments.at(-1);
 const u=Math.min(1,(distance-seg.offset)/seg.size),{a,b}=seg;
 return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u-8,dx:b[0]-a[0],dy:b[1]-a[1]};
}
const MOTION={release:400,swingStart:520,contact:720,runStart:900,speed:.29,celebrate:720,exit:1200,entry:1350,outStart:1100};
const hitSteps=s=>s===1000?4:s>=800?3:s>=600?2:s>=400?1:0;
function baseRunners(bases){return bases.flatMap((on,i)=>on?[{x:basePoints[i+1][0],y:basePoints[i+1][1]-8,id:i+1}]:[]);}
function walkActor(id,from,to,t,clip='playerWalk'){
 const u=Math.max(0,Math.min(1,t));
 return {id,x:from[0]+(to[0]-from[0])*u,y:from[1]+(to[1]-from[1])*u,dx:to[0]-from[0],dy:to[1]-from[1],mode:'walk',clip,clipTime:u*(clip==='batterWalk'?MOTION.entry:MOTION.exit)};
}
function scoringActor(id,elapsed){
 if(elapsed<MOTION.celebrate)return {id,x:480,y:480,mode:'celebrate',clipTime:elapsed};
 const exitTime=elapsed-MOTION.celebrate;
 return exitTime<MOTION.exit-1e-7?walkActor(id,[480,480],[1050,555],exitTime/MOTION.exit):null;
}
function playDuration(score,previousBases,portrait=false){
 const steps=hitSteps(score);if(!steps)return MOTION.outStart+MOTION.exit;
 let end=MOTION.runStart+runnerRoute(0,steps,true,portrait).length/MOTION.speed+(steps===4?MOTION.celebrate+MOTION.exit:180);
 for(let i=0;i<3;i++)if(previousBases[i]&&i+1+steps>=4){
  const arrival=MOTION.runStart+runnerRoute(i+1,3-i).length/MOTION.speed;
  end=Math.max(end,arrival+MOTION.celebrate+MOTION.exit);
 }
 return end;
}
const CONTACT_POINT={x:474,y:445};
const PORTRAIT_CONTACT_OFFSET={x:PORTRAIT_BATTER_POSITION[0]-BATTER_POSITION[0],y:PORTRAIT_BATTER_POSITION[1]-BATTER_POSITION[1]};
const PITCH_RELEASE={x:462,y:335};
const HIT_LANES=[-1,.5,0,1,-.5];
// Fair-hit depths leave room for the full 24% roll before either stadium's wall.
// The widest lanes also fit inside the portrait crop.
const BALL_PATHS=[
 {spread:105,depth:72,arc:10,flight:250,roll:700},
 {spread:180,depth:106,arc:26,flight:430,roll:1050},
 {spread:228,depth:124,arc:52,flight:620,roll:1050},
 {spread:255,depth:135,arc:70,flight:740,roll:1150},
 {spread:370,depth:315,arc:132,flight:970,roll:0}
];
function ballAfterSwing(score,atBat,elapsed,portrait=false){
 const steps=hitSteps(score),path=BALL_PATHS[steps];
 const lane=HIT_LANES[atBat%HIT_LANES.length];
 const age=Math.max(0,elapsed);
 if(steps===4&&age>=path.flight)return null;
 if(score===0){
  const u=Math.min(1,age/670),distance=1-(1-u)**2;
  const x=CONTACT_POINT.x+14*distance+(portrait?PORTRAIT_CONTACT_OFFSET.x*(1-distance):0);
  const y=CONTACT_POINT.y+83*distance+(portrait?PORTRAIT_CONTACT_OFFSET.y*(1-distance):0);
  return {x,y,size:3.8,spin:distance*12,groundY:y};
 }
 const flight=Math.min(1,age/path.flight);
 const roll=path.roll?Math.min(1,Math.max(0,(age-path.flight)/path.roll)):0;
 const rollDistance=1-(1-roll)**2;
 const distance=flight+(steps===4?0:.24*rollDistance);
 const x=CONTACT_POINT.x+lane*path.spread*distance+(portrait?PORTRAIT_CONTACT_OFFSET.x*(1-flight):0);
 const groundY=CONTACT_POINT.y-path.depth*distance+(portrait?PORTRAIT_CONTACT_OFFSET.y*(1-flight):0);
 const bounce=roll<.2?Math.sin(roll/.2*Math.PI)*(steps?5:2):0;
 const y=groundY-path.arc*4*flight*(1-flight)-bounce;
 return {x,y,size:Math.max(2,4-distance*1.35),spin:distance*25,groundY};
}
const PITCHER_REACTIONS=['pitcherCheer','pitcherSingle','pitcherDouble','pitcherTriple','pitcherCry'];
function pitcherReaction(score,elapsed){
 if(score===undefined)return null;
 const steps=hitSteps(score);
 const start=MOTION.contact+(steps?BALL_PATHS[steps].flight:240);
 return elapsed<start?null:{clip:PITCHER_REACTIONS[steps],time:elapsed-start};
}
function previousPlayBall(){
 if(!['reveal','finished','loading'].includes(state.phase))return null;
 const atBat=state.history.length-1,last=state.history[atBat];
 return last?ballAfterSwing(last.score,atBat,Infinity):null;
}
function playScene(score,previousBases,elapsed,cleared=false,atBat=0,portrait=false){
 const steps=hitSteps(score),scene={ball:null,pose:0,runners:baseRunners(previousBases),hideBatter:false};
 if(elapsed<MOTION.contact){
  scene.pose=elapsed<MOTION.swingStart?0:1;
  if(elapsed>=MOTION.release){
   const u=(elapsed-MOTION.release)/(MOTION.contact-MOTION.release);
   const contactX=CONTACT_POINT.x+(portrait?PORTRAIT_CONTACT_OFFSET.x:0);
   const contactY=CONTACT_POINT.y+(portrait?PORTRAIT_CONTACT_OFFSET.y:0);
   scene.ball={x:PITCH_RELEASE.x+(contactX-PITCH_RELEASE.x)*u,y:PITCH_RELEASE.y+(contactY-PITCH_RELEASE.y)*u-9*Math.sin(u*Math.PI),size:2+2*u,spin:u*17};
  }
  return scene;
 }
 scene.pose=elapsed<MOTION.contact+130?2:3;
 scene.ball=ballAfterSwing(score,atBat,elapsed-MOTION.contact,portrait);
 if(!steps){
  if(elapsed>=MOTION.outStart){
   scene.hideBatter=true;
   const progress=(elapsed-MOTION.outStart)/MOTION.exit;
   scene.runners=cleared?scene.runners.filter(r=>progress<1).map(r=>walkActor(r.id,[r.x,r.y],[1050,555],progress)):scene.runners;
   if(progress<1)scene.runners.push(walkActor(0,batterPosition(portrait),[-100,555],progress));
  }
  return scene;
 }
 if(elapsed<MOTION.runStart)return scene;
 scene.hideBatter=true;scene.runners=[];
 const runTime=elapsed-MOTION.runStart;
 function runner(start,travel,id,batter=false){
  const duration=runnerRoute(start,travel,batter,portrait).length/MOTION.speed;
  if(start+travel===4&&runTime>=duration){const actor=scoringActor(id,runTime-duration);if(actor)scene.runners.push(actor);return;}
  const progress=Math.min(1,runTime/duration);
  scene.runners.push({...routePoint(start,travel,progress,batter,portrait),id,moving:progress<1});
 }
 for(let i=0;i<3;i++)if(previousBases[i])runner(i+1,Math.min(steps,3-i),i+1);
 runner(0,steps,0,true);
 return scene;
}
function walkUp(done){
 if(reducedMotion()){done();return;}
 const start=performance.now();
 function frame(now){
  const progress=Math.min(1,(now-start)*1.35/MOTION.entry);
  draw(null,0,null,{hideBatter:true,time:now,actors:[walkActor(0,[-100,555],batterPosition(portraitView.matches),progress,'batterWalk')]});
  if(progress<1)requestAnimationFrame(frame);else done();
 }
 requestAnimationFrame(frame);
}
function animate(score,previousBases,cleared=false){
 const reduced=reducedMotion(),speed=reduced?1:1.5,startTime=performance.now();
 let playedSound=false;
 beginCrowdReaction(score,startTime,speed);
 function frame(now){
  const portrait=portraitView.matches,duration=reduced?90:playDuration(score,previousBases,portrait);
  const elapsed=Math.min(duration,(now-startTime)*speed);
  if(!playedSound&&(reduced||elapsed>=MOTION.contact)){
   playedSound=true;
   playAtBatSound(score);
  }
  const scene=reduced?{ball:null,pose:0,runners:baseRunners(state.bases),hideBatter:true}:playScene(score,previousBases,elapsed,cleared,state.index,portrait);
  const call=$('#play-call');
  if(!call.textContent&&(elapsed>MOTION.contact+200||reduced))call.textContent=result(score).toUpperCase()+'!';
  draw(scene.ball,scene.pose,scene.runners,{hideBatter:scene.hideBatter,time:elapsed});
  if(elapsed<duration)requestAnimationFrame(frame);else{state.phase='reveal';save();render();}
 }
 requestAnimationFrame(frame);
}
// Keep ambient idle clips alive without repainting over play/entrance animations.
let lastAmbientFrame=-Infinity,lastDrawnLight=null;
function ambientFrame(now){
 if(artReady&&!document.hidden&&!['animating','entering'].includes(state.phase)&&now-lastAmbientFrame>=1000/30){
  const light=currentLighting();
  if(!reducedMotion()||light!==lastDrawnLight)draw(previousPlayBall(),0,null,{time:now});
  lastDrawnLight=light;
  lastAmbientFrame=now;
 }
 requestAnimationFrame(ambientFrame);
}
render();requestAnimationFrame(ambientFrame);bootstrap();
