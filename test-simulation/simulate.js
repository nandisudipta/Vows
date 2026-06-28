const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Starting Vow end-to-end simulation using REAL DOM clicks...');

  const viewport = { width: 1280, height: 1024 };

  // Launch browser with standard desktop viewport
  const browserA = await puppeteer.launch({ headless: true, defaultViewport: viewport });
  const browserB = await puppeteer.launch({ headless: true, defaultViewport: viewport });

  const pageA = await browserA.newPage();
  const pageB = await browserB.newPage();

  // Log browser console events
  pageA.on('console', msg => console.log(`[A Console]:`, msg.text()));
  pageB.on('console', msg => console.log(`[B Console]:`, msg.text()));

  const fileUrl = 'file://' + path.resolve(__dirname, '../index.html');

  // --- PARTNER A: CREATE SESSION ---
  console.log('👤 Partner A: Navigating to landing page...');
  await pageA.goto(fileUrl);

  console.log('👤 Partner A: Clicking "Begin Together" (Real click)');
  await pageA.waitForSelector('button.btn-primary');
  await pageA.click('button.btn-primary');

  // WAIT for screen transitions to complete
  console.log('👤 Partner A: Waiting for Connect screen to be active...');
  await pageA.waitForSelector('#sr-connect.active');

  console.log('👤 Partner A: Selecting "Create Session" role (Real click)...');
  await pageA.click('#rc-create');

  console.log('👤 Partner A: Filling out form...');
  await pageA.waitForSelector('#cn-me');
  await pageA.type('#cn-me', 'Arjun');
  await pageA.type('#cn-partner', 'Priya');
  await pageA.type('#cn-pin', '2026');

  console.log('👤 Partner A: Generating session code (Real click)...');
  await pageA.waitForSelector('#fl-create button.btn-primary');
  await pageA.click('#fl-create button.btn-primary');

  // Wait for code to be generated and displayed
  await pageA.waitForFunction(() => {
    const code = document.getElementById('cr-code').textContent;
    return code && code !== '——';
  });

  const sessionCode = await pageA.$eval('#cr-code', el => el.textContent);
  console.log(`🔑 Generated Session Code: ${sessionCode}`);

  // --- PARTNER B: JOIN SESSION ---
  console.log('👥 Partner B: Navigating to landing page...');
  await pageB.goto(fileUrl);

  console.log('👥 Partner B: Clicking "Begin Together" (Real click)');
  await pageB.waitForSelector('button.btn-primary');
  await pageB.click('button.btn-primary');

  // WAIT for screen transitions to complete
  console.log('👥 Partner B: Waiting for Connect screen to be active...');
  await pageB.waitForSelector('#sr-connect.active');

  console.log('👥 Partner B: Selecting "Join Session" role (Real click)...');
  await pageB.click('#rc-join');

  console.log('👥 Partner B: Filling out join form...');
  await pageB.waitForSelector('#jn-me');
  await pageB.type('#jn-me', 'Priya');
  await pageB.type('#jn-code', sessionCode);
  await pageB.type('#jn-pin', '2026'); // PIN is checked at join time now!

  console.log('👥 Partner B: Joining session (Real click)...');
  await pageB.waitForSelector('#fl-join button.btn-primary');
  await pageB.click('#fl-join button.btn-primary');

  // Partner B goes directly to the assessment
  console.log('⏳ Waiting for Partner B to enter assessment...');
  await pageB.waitForSelector('#sr-assess.active');
  console.log('👥 Partner B is on assessment screen.');

  // Partner A needs to click "Begin" on the status page
  console.log('👤 Partner A: Clicking "Begin" on creation status page (Real click)...');
  await pageA.waitForFunction(() => {
    const btn = document.getElementById('btn-start-now');
    return btn && btn.textContent.includes('Begin');
  });
  await pageA.click('#btn-start-now');
  await pageA.waitForSelector('#sr-assess.active');
  console.log('👤 Partner A is on assessment screen.');

  // --- ASSESSMENT SIMULATION (55 Questions) ---
  console.log('📝 Simulating answers for both partners (Real clicks)...');

  const answerAllQuestions = async (page, name) => {
    const totalQuestions = await page.evaluate(() => TOTAL);
    for (let q = 1; q <= totalQuestions; q++) {
      await page.waitForSelector('#q-body');
      
      // Auto-click the first available answer option inside the viewport
      const optionSelector = await page.evaluate(() => {
        if (document.querySelector('#q-body .chip')) return '#q-body .chip';
        if (document.querySelector('#q-body .chip-big')) return '#q-body .chip-big';
        if (document.querySelector('#q-body .scale-btn')) return '#q-body .scale-btn';
        return null;
      });

      if (optionSelector) {
        await page.click(optionSelector);
      }

      // Real coordinate click on Next button
      await page.click('#btn-next');
      
      if (q % 10 === 0 || q === totalQuestions) {
        console.log(`  [${name}] Answered ${q}/${totalQuestions} questions...`);
      }
      
      // Brief pause to mimic user speed
      await new Promise(r => setTimeout(r, 50));
    }
  };

  // Run both assessments simultaneously
  await Promise.all([
    answerAllQuestions(pageA, 'Partner A'),
    answerAllQuestions(pageB, 'Partner B')
  ]);

  console.log('✅ Both partners completed all 55 questions!');

  // --- REVEAL FLOW ---
  console.log('⏳ Waiting for "Reveal Compatibility" gate screen...');
  await pageA.waitForSelector('#sr-gate.active', { timeout: 15000 });
  await pageB.waitForSelector('#sr-gate.active', { timeout: 15000 });
  console.log('🎉 Gate screen reached on both devices.');

  console.log('👤 Partner A: Proceeding to PIN input (Real click)...');
  await pageA.click('#sr-gate button.btn-primary');
  await pageA.waitForSelector('#sr-pin.active');

  console.log('👤 Partner A: Entering PIN "2026"...');
  await pageA.type('#pin-1', '2');
  await pageA.type('#pin-2', '0');
  await pageA.type('#pin-3', '2');
  await pageA.type('#pin-4', '6'); // Will auto-submit

  // Wait for results screen to load
  console.log('📊 Waiting for Results Dashboard...');
  await pageA.waitForSelector('#sr-results.active', { timeout: 15000 });
  console.log('🏆 Results Dashboard Loaded successfully!');

  // Extract score
  const score = await pageA.$eval('#res-score-num', el => el.textContent);
  console.log(`\n========================================`);
  console.log(`📈 RESULTS: Compatibility Score = ${score}`);
  console.log(`========================================\n`);

  await pageA.screenshot({ path: 'step6_final_results_A.png', fullPage: true });
  console.log('📷 Final results screenshot saved to step6_final_results_A.png');

  // Close browser contexts
  await browserA.close();
  await browserB.close();
  console.log('👋 Simulation finished successfully!');
})();
