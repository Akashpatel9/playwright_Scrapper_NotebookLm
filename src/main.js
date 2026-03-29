const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PDF_URL = 'https://ncert.nic.in/textbook/pdf/jeff101.pdf';
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Persistent profile (safe, NOT Chrome profile)
const USER_DATA_DIR = path.join(__dirname, 'pw-profile');



// ---------- Main ----------
async function automateNotebookLM() {
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        acceptDownloads: true,
        viewport: null,
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
        ],
    });



    // Clean any old tabs (fix blank page issue)
    for (const p of context.pages()) {
        await p.close();
    }
    const page = await context.newPage();
    console.log('Opening NotebookLM...');
    await page.goto('https://notebooklm.google.com/', {
        waitUntil: 'domcontentloaded',
    });



    // 🔐 LOGIN HANDLING
    try {
        await page.waitForSelector('text=Create new', { timeout: 10000 });
        console.log('✅ Already logged in');
    } catch {
        console.log('⚠️ First time login required...');
        await page.waitForSelector('text=Create new', { timeout: 180000 });
        console.log('✅ Login saved');
    }



    // STEP 1: Create project
    console.log('Creating project...');
    await page.locator('button:has-text("Create new")').click()
    await page.waitForTimeout(10000);



    // STEP 2: Add PDF
    console.log('Adding PDF...');
    await page.locator('button:has-text("close")').click()
    await page.waitForTimeout(2000);
    const urlInput = page.locator('.mat-mdc-input-element');
    await page.waitForTimeout(2000);
    await urlInput.fill(PDF_URL);
    await page.waitForTimeout(2000);
    await urlInput.press('Enter');
    await page.waitForTimeout(30000);



    // STEP 3: Prompt
    // console.log('Sending prompt...');
    // const chatBox = page.locator('div[contenteditable="true"]').last();

    // await chatBox.fill(
    //     `Give a detailed structured summary with headings, references, and key insights.`
    // );

    // await waitAndClick(page.locator('button[aria-label="Send message"]'));
    // await waitForGeneration(page);

    
    
    
    // STEP 4: Studio
    // ---------- GENERATIONS ----------
    // SLIDES
    console.log('Generating Slides...');
    await page.locator('[aria-label="Slide deck"]').click();
    await page.waitForTimeout(2000);
    const chatBoxSlideDeck = page
        .locator('label:has-text("Describe the slide deck that you want to create")')
        .locator('..')
        .locator('textarea');
    await chatBoxSlideDeck.fill('Create a structured slide deck with headings and explanations.');
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Generate")').click();
    await page.waitForTimeout(2000);


    // AUDIO
    console.log('Generating Audio...');
    await page.locator('[aria-label="Audio Overview"]').click();
    await page.waitForTimeout(2000);
    await page.locator('mat-radio-button:has-text("Brief")').click();
    await page.waitForTimeout(2000);
    const chatBoxAudio = page
        .locator('label:has-text("What should the AI hosts focus on in this episode?")')
        .locator('..')
        .locator('textarea');
    await chatBoxAudio.fill('Create a podcast-style explanation covering all concepts clearly.');
    await page.waitForTimeout(2000);
    await waitAndClick(page.locator('button:has-text("Generate")'));
    await page.waitForTimeout(2000);


    // VIDEO
    console.log('Generating Video...');
    await page.locator('[aria-label="Video Overview"]').click();
    await page.waitForTimeout(2000);
    await page.locator('mat-radio-button:has-text("Explainer")').click();
    await page.waitForTimeout(2000);
    await page.locator('mat-radio-button:has-text("Whiteboard")').click();
    await page.waitForTimeout(2000);
    const chatBoxVideo = page
        .locator('label:has-text("What should the AI hosts focus on?")')
        .locator('..')
        .locator('textarea');
    await chatBoxVideo.fill('Create an explainer video script with step-by-step clarity.');
    await page.waitForTimeout(2000);
    await waitAndClick(page.locator('button:has-text("Generate")'));
    await page.waitForTimeout(2000);


    // MIND MAP
    console.log('Generating Mind Map...');
    await page.locator('[aria-label="Mind Map"]').click();
    await page.waitForTimeout(2000);


    // FLASHCARDS
    console.log('Generating Flashcards...');
    await page.locator('[aria-label="Flashcards"]').click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Hard")').click();
    await page.waitForTimeout(2000);
    const chatBoxFlashCards = page
        .locator('h2:has-text("What should the topic be?")')
        .locator('..')
        .locator('textarea');
    await chatBoxFlashCards.fill('Create flashcards covering all key concepts.');
    await page.waitForTimeout(2000);
    await waitAndClick(page.locator('button:has-text("Generate")'));
    await page.waitForTimeout(2000);


    // QUIZ
    console.log('Generating Quiz...');
    await page.locator('[aria-label="Quiz"]').click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Hard")').click();
    await page.waitForTimeout(2000);
    const chatBoxQuiz = page
        .locator('h2:has-text("What should the topic be?")')
        .locator('..')
        .locator('textarea');
    await chatBoxQuiz.fill('Create a challenging quiz covering all topics.');
    await page.waitForTimeout(2000);
    await waitAndClick(page.locator('button:has-text("Generate")'));
    await page.waitForTimeout(2000);
    console.log('All content generated!');


    
    // ---------- Waiting for Content generation ----------
    await page.waitForTimeout(10000);
    const artifactItems = await page.$$('artifact-library-item, artifact-library-note');
    for (const item of artifactItems) {
        const button = await item?.$('button.artifact-stretched-button');
        if (!button) {
            console.log('No button found for artifact');
            continue;
        }
        console.log('Waiting for artifact to be ready...');

        await new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const isDisabled = await button.evaluate(btn => btn.disabled);
                    if (!isDisabled) {
                        clearInterval(interval);
                        resolve();
                    }
                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 1000);
        });

        console.log('Artifact ready');
    }
    console.log('All Artifact Generated');
    await page.waitForTimeout(5000);







    return;

    // ----------------------------------------------------- TODO  -------------------------------------------------
    // ---------- Downloading ----------
    console.log('Downloading...');

    // SLIDES

    console.log('Downloading... Slide Deck');

    // Click Slides button
    await page.waitForSelector(
        'button.artifact-stretched-button[aria-description="Slides"]:not([disabled])',
        { visible: true, timeout: 15000 }
    );

    // Give UI time to render slideshow controls
    await page.waitForTimeout(30000);

    // Click "More options"
    const moreButtons = page.locator('button[aria-label="More options"]');
    await moreButtons.last().click();

    // ✅ Target ONLY visible overlay
    const activeMenu = page.locator('.cdk-overlay-pane:visible').last();

    // Wait for menu to render
    await activeMenu.waitFor({ state: 'visible', timeout: 15000 });

    // Wait for items inside it
    const menuItems = activeMenu.locator('button.mat-menu-item');
    await menuItems.first().waitFor({ state: 'visible' });

    // Debug
    const count = await menuItems.count();
    console.log('Menu items found:', count);

    for (let i = 0; i < count; i++) {
        console.log(await menuItems.nth(i).innerText());
    }

    // ✅ Icon-based selector (scoped to active menu)
    const pdfButton = activeMenu.locator(
        'button.mat-menu-item:has(mat-icon:text("picture_as_pdf"))'
    );

    // ✅ Fallback
    const fallbackPdf = activeMenu.locator('button.mat-menu-item', {
        hasText: 'PDF'
    });

    let target;

    if (await pdfButton.count()) {
        target = pdfButton.first();
    } else {
        target = fallbackPdf.first();
    }

    // Wait for correct button
    await target.waitFor({ state: 'visible', timeout: 10000 });

    // 📥 Download
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        target.click()
    ]);
    console.log("----->>", download)
}

automateNotebookLM().catch(console.error);