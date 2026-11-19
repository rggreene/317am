// One compact WebAudio ambience engine. Begins only after a user gesture.
// No licensed samples, no autoplay audio, no repeated network fetches.
export class NightAudio{
  constructor(){
    this.ctx=null;this.ambient=null;this.ambientGain=null;this.hum=null;
    this.enabled=true;this.playing=false;this.powerOn=true;this.lastStep=-100;this.lastEnemyStep=-100;this.lastHeartbeat=-100;
    this.lastCreak=0;this.noiseBuffer=null;this.silenced=false;
  }
  init(){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    if(!this.ctx)this.ctx=new Ctx();
    if(this.ctx.state==='suspended')void this.ctx.resume();
    if(!this.ambient){
      const ctx=this.ctx,buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),values=buf.getChannelData(0);
      let last=0;for(let i=0;i<values.length;i++){last=.99*last+.01*(Math.random()*2-1);values[i]=last;}
      this.noiseBuffer=buf;
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      src.buffer=buf;src.loop=true;filter.type='lowpass';filter.frequency.value=450;
      gain.gain.value=this.enabled&&this.playing?.055:.0001;src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);src.start();
      this.ambient=src;this.ambientGain=gain;
      const osc=ctx.createOscillator(),humGain=ctx.createGain();
      osc.type='sine';osc.frequency.value=59;humGain.gain.value=this.enabled&&this.powerOn?.006:.0001;
      osc.connect(humGain);humGain.connect(ctx.destination);osc.start();
      this.hum=humGain;
    }
    return this.ctx;
  }
  tone(freq,duration,volume=.035,ending=freq/2,pan=0){
    const ctx=this.init();if(!ctx||!this.enabled)return;
    const t=ctx.currentTime,osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type='triangle';osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1,ending),t+duration);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(g);
    if(ctx.createStereoPanner){
      const stereo=ctx.createStereoPanner();
      stereo.pan.value=Math.max(-.85,Math.min(.85,pan));
      g.connect(stereo);stereo.connect(ctx.destination);
    }else g.connect(ctx.destination);
    osc.start(t);osc.stop(t+duration+.015);
  }
  setPower(enabled){
    this.powerOn=enabled;
    if(this.ctx&&this.hum)this.hum.gain.setTargetAtTime(
      this.enabled&&enabled&&!this.silenced?.006:.0001,this.ctx.currentTime,.25);
  }
  setMuted(muted){
    this.enabled=!muted;
    if(!this.ctx)return;
    if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(
      this.enabled&&this.playing?(this.silenced?.001:.055):.0001,this.ctx.currentTime,.12);
    if(this.hum)this.hum.gain.setTargetAtTime(
      this.enabled&&this.powerOn?(this.silenced?.0001:.006):.0001,this.ctx.currentTime,.12);
  }
  enter(){
    this.playing=true;
    this.init();
    if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(
      this.enabled?(this.silenced?.001:.055):.0001,this.ctx.currentTime,.35);
  }
  pause(){
    this.playing=false;
    if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(.0001,this.ctx.currentTime,.15);
  }
  noiseBurst(frequency,duration,volume,pan=0){
    const ctx=this.init();
    if(!ctx||!this.enabled||!this.playing||!this.noiseBuffer)return;
    const t=ctx.currentTime,source=ctx.createBufferSource(),
      filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=this.noiseBuffer;
    filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.6;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume,.0002),t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);
    if(ctx.createStereoPanner){
      const stereo=ctx.createStereoPanner();
      stereo.pan.value=Math.max(-.85,Math.min(.85,pan));
      gain.connect(stereo);stereo.connect(ctx.destination);
    }else gain.connect(ctx.destination);
    source.start(t);source.stop(t+duration+.01);
  }
  ambience(now){
    if(!this.playing||!this.enabled)return;
    const gap=12+3*Math.abs(Math.sin(now*.23));
    if(now-this.lastCreak<gap)return;
    this.lastCreak=now;
    // A gentle building-settling sound rather than a horror sting.
    const pan=Math.sin(now*1.7)*.45;
    this.noiseBurst(460,.22,.011,pan);
    this.tone(142,.19,.006,100,pan);
  }
  step(now,enemy=false,distance=1,pan=0,running=false,pace=1.75,stance=1){
    const movementPace=Math.max(0,Math.min(3,pace));
    const delay=enemy?.8:Math.max(.26,.86-movementPace*.19);
    if(now-(enemy?this.lastEnemyStep:this.lastStep||-100)<delay)return;
    if(enemy)this.lastEnemyStep=now;else this.lastStep=now;
    const gain=enemy?Math.max(.008,.028*(1-Math.min(distance,6)/8)):
      (.004+movementPace*.005)*(.72+.28*Math.max(0,Math.min(1,stance)));
    this.tone(enemy?72:98,.055,gain,enemy?44:61,pan);
    this.noiseBurst(enemy?360:540,.065,enemy?gain*.58:gain*.44,pan);
  }
  warning(){
    // Short low warning under the room tone, not a jump-scare sting.
    this.tone(122,.23,.028,69);
  }
  setSilence(active){
    if(this.silenced===active)return;
    this.silenced=active;
    if(!this.ctx)return;
    const t=this.ctx.currentTime;
    if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(
      this.enabled&&this.playing?(active?.001:.055):.0001,t,.18);
    if(this.hum)this.hum.gain.setTargetAtTime(
      this.enabled&&this.powerOn?(active?.0001:.006):.0001,t,.18);
  }
  environmentCue(kind,pan=0){
    if(kind==='settle')this.noiseBurst(310,.29,.012,pan);
    else if(kind==='tap'){
      this.tone(240,.055,.012,155,pan);
      this.noiseBurst(600,.08,.008,pan);
    }else if(kind==='flicker')this.tone(72,.13,.008,57,pan);
    // Silence is intentionally silent.
  }
  doorListen(){
    // Small latch tick, followed by room tone: the silence does the work.
    this.tone(215,.07,.009,165);
    this.noiseBurst(320,.12,.007);
  }
  doorRattle(){
    this.noiseBurst(260,.35,.022);
    this.tone(98,.29,.023,57);
  }
  miss(){this.tone(93,.19,.022,52);}
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
