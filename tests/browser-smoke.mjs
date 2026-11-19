import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';

const url=process.env.TEST_URL||'http://127.0.0.1:5173';
const errors=[];
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({
  channel:'chrome',headless:true,
  args:[
    '--no-sandbox','--disable-dev-shm-usage',
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]
});
try{
  const page=await browser.newPage({
    viewport:{width:1280,height:720},
    deviceScaleFactor:1
  });
  page.on('pageerror',error=>{errors.push(error.stack||error.message);console.log('BROWSER PAGE ERROR:',error.stack||error.message);});
  page.on('console',message=>{if(message.type()==='error')console.log('BROWSER CONSOLE ERROR:',message.text());});
  await page.goto(url,{waitUntil:'load',timeout:20000});
  const banner=page.locator('#error');
  await page.waitForFunction(()=>document.querySelector('#intruder-status')?.textContent.includes('loaded')&&
    document.querySelector('#asset-status')?.textContent.includes('loaded'),
    null,{timeout:24000});
  assert.equal(await banner.isVisible(),false,'WebGL startup failed');
  await page.waitForFunction(()=>
    document.querySelector('#app')?.dataset.heroArtStatus==='ready',
    null,{timeout:13000});
  const loadedHeroArt=await page.locator('#app').getAttribute('data-hero-glbs');
  assert.ok(loadedHeroArt?.includes('room_sofa_2seat'), 'sofa GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('room_coffee_table'), 'table GLB did not replace fallback');
  await page.screenshot({path:'artifacts/apartment-orbit.png'});
  // Inspect the bone-driven art directly as well as the full apartment.
  await page.keyboard.press('r');
  await page.waitForTimeout(1250);
  await page.screenshot({path:'artifacts/intruder-closeup.png'});
  await page.keyboard.press('r');
  await page.waitForTimeout(850);
  await page.keyboard.press('v');
  await page.waitForFunction(()=>document.querySelector('#app')?.classList.contains('fps-mode'));
  assert.equal(await page.locator('#night-end').isVisible(),false,'win/loss modal showed at game start');
  const start=await page.locator('#night-clock').innerText();
  assert.match(start,/^0[01]:[0-5][0-9]$/,'timer incorrectly formatted');
  await page.waitForFunction(first=>
    document.querySelector('#night-clock')?.textContent!==first,
    start,{timeout:9500});
  const next=await page.locator('#night-clock').innerText();
  if(next===start){
    const diagnostic=await page.evaluate(()=>({
      appClasses:document.querySelector('#app').className,
      mode:document.querySelector('#mode-status')?.textContent,
      hud:document.querySelector('#night-hud')?.textContent,
      error:document.querySelector('#error')?.textContent
    }));
    throw new Error('Survival timer never started. Diagnostics: '+JSON.stringify(diagnostic)+' Browser errors: '+JSON.stringify(errors));
  }
  await page.keyboard.press('p');
  assert.match(await page.locator('#quality-play').innerText(),/CINEMATIC/);
  await page.screenshot({path:'artifacts/survival-fps.png'});
  await page.keyboard.press('v');
  assert.equal(await page.locator('#fps-hud').isVisible(),false,'orbit mode not restored');
  assert.equal(await page.locator('#night-end').isVisible(),false,'end overlay blocked orbit mode');
  assert.deepEqual(errors,[],'uncaught errors in the browser');
  console.log('Chrome/WebGL smoke test passed: both GLBs, timer, view modes and quality profile');
}finally{
  await browser.close();
}
