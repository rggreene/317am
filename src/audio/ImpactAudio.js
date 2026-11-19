// Procedural, non-graphic melee sound design. No network audio assets.
export class ImpactAudio{
  constructor(){this.ctx=null;this.noise=null;}
  context(){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    if(!this.ctx)this.ctx=new Ctx();
    if(this.ctx.state==='suspended')void this.ctx.resume();
    if(!this.noise){
      const n=Math.floor(this.ctx.sampleRate*.45),buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
      const arr=buf.getChannelData(0);
      for(let i=0;i<n;i++)arr[i]=Math.random()*2-1;
      this.noise=buf;
    }
    return this.ctx;
  }
  tone(from,to,time,loudness,type='triangle'){
    const ctx=this.context();if(!ctx)return;
    const t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(from,t);
    osc.frequency.exponentialRampToValueAtTime(to,t+time);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(loudness,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+time);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(t);osc.stop(t+time+.015);
  }
  noiseBurst(frequency,duration,volume,filterType='bandpass'){
    const ctx=this.context();if(!ctx)return;
    const t=ctx.currentTime,source=ctx.createBufferSource(),
      filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=this.noise;
    filter.type=filterType;filter.frequency.value=frequency;filter.Q.value=.55;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
    source.start(t);source.stop(t+duration+.015);
  }
  swing(){
    this.noiseBurst(1250,.15,.018,'highpass');
    this.tone(190,85,.13,.008);
  }
  impact(){
    this.noiseBurst(320,.09,.060);
    this.tone(155,57,.17,.052);
    this.tone(720,510,.22,.008,'sine');
  }
}
