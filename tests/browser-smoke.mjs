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
  const variant=await page.locator('#app').getAttribute('data-intruder-variant');
  if(process.env.EXPECT_INTRUDER_V2==='1'){
    assert.equal(variant,'v2','candidate GLB must be loaded, not silently replaced by fallback');
  }
  await page.waitForFunction(()=>
    document.querySelector('#app')?.dataset.heroArtStatus==='ready',
    null,{timeout:13000});
  const loadedHeroArt=await page.locator('#app').getAttribute('data-hero-glbs');
  assert.ok(loadedHeroArt?.includes('room_sofa_2seat'), 'sofa GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('room_coffee_table'), 'table GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('room_bed_dressed'), 'bed GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('room_dresser_phone'), 'dresser GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('room_media_console'), 'media cabinet GLB did not replace fallback');
  assert.ok(loadedHeroArt?.includes('prop_television'), 'television GLB did not replace fallback');
  await page.screenshot({path:'artifacts/apartment-orbit.png'});
  // Capture honest unobstructed art reviews in addition to the HUD snapshots.
  await page.keyboard.press('h');
  await page.waitForTimeout(160);
  await page.screenshot({path:'artifacts/artreview-livingroom-clean.png'});
  await page.keyboard.press('r');
  await page.waitForTimeout(1850);
  await page.screenshot({path:'artifacts/artreview-intruder-clean.png'});
  await page.keyboard.press('h');
  await page.screenshot({path:'artifacts/intruder-closeup.png'});
  await page.keyboard.press('r');
  await page.waitForTimeout(850);
  await page.keyboard.press('v');
  await page.waitForFunction(()=>document.querySelector('#app')?.classList.contains('fps-mode'));
  assert.equal(await page.locator('#night-end').isVisible(),false,'win/loss modal showed at game start');
  // Scroll alone sets the persistent preferred pace; holding C alters only
  // stance. Neither input should affect the orbit camera controls later.
  await page.mouse.move(640,360);
  const initialPace=Number(await page.locator('#app').getAttribute('data-analog-pace'));
  assert.ok(Math.abs(initialPace-1.75)<.01,'default walking pace wrong');
  await page.mouse.wheel(0,-120);
  await page.waitForFunction(()=>Number(document.querySelector('#app')?.dataset.analogPace)>1.75,
    null,{timeout:3000});
  const quicker=Number(await page.locator('#app').getAttribute('data-analog-pace'));
  await page.keyboard.down('c');
  await page.mouse.wheel(0,200);
  await page.waitForFunction(()=>Number(document.querySelector('#app')?.dataset.analogStance)<.9,
    null,{timeout:3000});
  await page.keyboard.up('c');
  assert.equal(Number(await page.locator('#app').getAttribute('data-analog-pace')),
    quicker,'C + wheel must not change preferred speed');
  assert.match(await page.locator('#stance-readout').innerText(),/CROUCHED|LOWERED/);
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
  const orbitPace=await page.locator('#app').getAttribute('data-analog-pace');
  const orbitStance=await page.locator('#app').getAttribute('data-analog-stance');
  await page.mouse.wheel(0,120);
  assert.equal(await page.locator('#app').getAttribute('data-analog-pace'),orbitPace,
    'orbit wheel should not alter saved FPS pace');
  assert.equal(await page.locator('#app').getAttribute('data-analog-stance'),orbitStance,
    'orbit wheel should not alter saved FPS stance');
  assert.equal(await page.locator('#night-end').isVisible(),false,'end overlay blocked orbit mode');
  // Verify the original rig remains available for honest A/B review and
  // protects the survival build if the candidate later regresses.
  const legacyUrl=new URL(url);
  legacyUrl.searchParams.set('intruder','legacy');
  await page.goto(legacyUrl.toString(),{waitUntil:'load',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.intruderVariant==='legacy',
    null,{timeout:24000});
  await page.keyboard.press('r');
  await page.waitForTimeout(1850);
  await page.screenshot({path:'artifacts/artreview-intruder-legacy.png'});
  assert.deepEqual(errors,[],'uncaught errors in the browser');
  console.log('Chrome/WebGL smoke test passed: both GLBs, timer, view modes and quality profile');
}finally{
  await browser.close();
}
