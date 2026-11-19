import { Game } from './game/Game.js';
const root=document.querySelector('#app');
try{
  const game=new Game({canvas:document.querySelector('#scene'),root});
  game.start();
}catch(error){
  console.error('Unable to launch the visual lab:',error);
  const banner=document.querySelector('#error');
  banner.hidden=false;
  banner.textContent='3:17 AM could not start. WebGL 2 and a compatible graphics driver are required. Details: '+error.message;
}
