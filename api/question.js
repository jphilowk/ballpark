import {loadBank,getQuestion} from '../lib/daily.mjs';
import {respond,bodyOf} from '../lib/http.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 try{const body=await bodyOf(req);return respond(res,200,getQuestion(loadBank(),body.token));}catch{return respond(res,400,{error:'This at-bat could not be loaded. Refresh the page to start a new game.'});}
}
