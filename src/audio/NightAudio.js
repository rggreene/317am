// One compact WebAudio ambience engine. Begins only after a user gesture.
// No licensed samples, no autoplay audio, no repeated network fetches.
export class NightAudio{
  constructor(){
    this.ctx=null;this.ambient=null;this.ambientGain=null;this.hum=null;
    this.enabled=true;this.lastStep=-100;this.lastHeartbeat=-100;
  }
  init(){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    if(!this.ctx)this.ctx=new Ctx();
    if(this.ctx.state==='suspended')void this.ctx.resume();
    if(!this.ambient){
      const ctx=this.ctx,buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),values=buf.getChannelData(0);
      let last=0;for(let i=0;i<values.length;i++){last=.99*last+.01*(Math.random()*2-1);values[i]=last;}
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      src.buffer=buf;src.loop=true;filter.type='lowpass';filter.frequency.value=450;
      gain.gain.value=.055;src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);src.start();
      this.ambient=src;this.ambientGain=gain;
      const osc=ctx.createOscillator(),humGain=ctx.createGain();
      osc.type='sine';osc.frequency.value=59;humGain.gain.value=.006;
      osc.connect(humGain);humGain.connect(ctx.destination);osc.start();
      this.hum=humGain;
    }
    return this.ctx;
  }
  tone(freq,duration,volume=.035,ending=freq/2){
    const ctx=this.init();if(!ctx||!this.enabled)return;
    const t=ctx.currentTime,osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type='triangle';osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1,ending),t+duration);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(g);g.connect(ctx.destination);
    osc.start(t);osc.stop(t+duration+.015);
  }
  setPower(enabled){
    if(!this.ctx)return;
    this.hum?.gain.setTargetAtTime(enabled?.006:.0001,this.ctx.currentTime,.25);
  }
  enter(){this.init();if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(.055,this.ctx.currentTime,.35);}
  pause(){if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(.0001,this.ctx.currentTime,.15);}
  step(now,enemy=false,distance=1){
    const delay=enemy?.8:.38;
    if(now-(enemy?this.lastEnemyStep:this.lastStep||-100)<delay)return;
    if(enemy)this.lastEnemyStep=now;else this.lastStep=now;
    const gain=enemy?Math.max(.008,.028*(1-Math.min(distance,6)/8)):.013;
    this.tone(enemy?72:98,.055,gain,enemy?44:61);
  }
  door(){this.tone(108,.45,.11,38);}
  call(){this.tone(440,.16,.03,660);}
  click(){this.tone(160,.11,.027,118);}
  hurt(){this.tone(75,.24,.065,45);}
  heartbeat(now,health){
    if(health>=35||now-this.lastHeartbeat<1.2)return;
    this.lastHeartbeat=now;
    this.tone(83,.18,.035,55);
  }
}
