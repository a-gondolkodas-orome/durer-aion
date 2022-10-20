function sendData(fileName: string, data: string){
  const fd = new FormData();
  fd.append('key', fileName);
  fd.append('file', data);
  fetch('https://durer-d4ee5dcab098f3d6755c03070e1a71bf.s3.eu-central-1.amazonaws.com/', { method: 'POST', body: fd, mode: 'cors'}).then(res => console.log(res.status));
}

export function sendDataStart(code: string){
  let now = new Date().toISOString();
  sendData(code+"_start_"+now, "code");
}


export function sendDataRelayStart(code: string){
  let now = new Date().toISOString();
  sendData(code+"_relaystart_"+now, "");
}

export function sendDataRelayStep(code: string, G: any, ctx: any){
  let now = new Date().toISOString();
  let problemNumber = G.currentProblem;
  let answer = G.answer;
  sendData(code+"_relay_"+problemNumber+"_"+answer+"_"+now, JSON.stringify(G)+JSON.stringify(ctx));
}

export function sendDataRelayEnd(code: string, G: any, ctx: any){
  let now = new Date().toISOString();
  let points = G.points;
  sendData(code+"_relayend_"+points+"_"+now, JSON.stringify(G)+JSON.stringify(ctx));
}

export function sendDataStrategyStart(code: string){
  let now = new Date().toISOString();
  sendData(code+"_stratstart_"+now, "");
}

export function sendDataStrategyStep(code: string, G: any, ctx: any){
  let now = new Date().toISOString();
  sendData(code+"_strat_"+now, JSON.stringify(G)+JSON.stringify(ctx));
}

export function sendDataStrategyEnd(code: string, G: any, ctx: any){
  let now = new Date().toISOString();
  let points = G.points;
  sendData(code+"_stratend_"+points+"_"+now, JSON.stringify(G)+JSON.stringify(ctx));
}