import {test} from 'node:test';import assert from 'node:assert/strict';import {points,result,advance,chicagoDate,shuffle} from './game.js';
test('scoring curve and exact-only perfect',()=>{assert.equal(points(200,200),1000);assert.equal(points(250,200),625);assert.equal(points(150,200),625);assert.equal(points(220,200),850);assert.equal(points(280,200),400);assert.equal(points(null,200),0);assert.equal(points(200.001,200),999);assert.equal(points(400,200),1);});
test('all hit boundaries',()=>{for(const [s,r] of [[1000,'Home run'],[999,'Triple'],[800,'Triple'],[799,'Double'],[600,'Double'],[599,'Single'],[400,'Single'],[399,'Out'],[1,'Out'],[0,'Strikeout']])assert.equal(result(s),r);});
test('runner movement and grand slam',()=>{assert.deepEqual(advance([true,true,true],1,1000),{bases:[false,false,false],outs:1,runs:4,cleared:false});assert.deepEqual(advance([true,true,false],0,650),{bases:[false,true,true],outs:0,runs:1,cleared:false});});
test('third out clears bases',()=>{assert.deepEqual(advance([true,false,true],2,50),{bases:[false,false,false],outs:0,runs:0,cleared:true});assert.deepEqual(advance([true,false,true],0,0).bases,[true,false,true]);});
test('Central reset winter and summer',()=>{assert.equal(chicagoDate(new Date('2026-11-06T05:59:59Z')),'2026-11-05');assert.equal(chicagoDate(new Date('2026-11-06T06:00:00Z')),'2026-11-06');assert.equal(chicagoDate(new Date('2026-07-06T05:00:00Z')),'2026-07-06');});
test('shared shuffle preserves sports',()=>{const a=['NFL','NBA','MLB','CBB','CFB'];assert.deepEqual(shuffle(a,'2026-11-05'),shuffle(a,'2026-11-05'));assert.deepEqual(shuffle(a,'2026-11-05').sort(),a.sort());});

test('MLB guesses earn more points for the same percentage error',()=>{
 for(const [guess,mlb,other] of [[115,813,775],[70,625,550],[145,438,325]]){
  assert.equal(points(guess,100,'MLB'),mlb);
  assert.equal(points(guess,100,'NFL'),other);
 }
 assert.equal(points(100,100,'MLB'),1000);
 assert.equal(points(null,100,'MLB'),0);
});
