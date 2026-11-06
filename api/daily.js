import {loadBank,createSession} from '../lib/daily.mjs';
import {respond} from '../lib/http.mjs';
export default function handler(req,res){
 if(req.method!=='GET')return respond(res,405,{error:'Method not allowed'});
 try{return respond(res,200,createSession(loadBank()));}catch{return respond(res,503,{error:'Today’s game is temporarily unavailable. Please try again.'});}
}
