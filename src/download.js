const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Persistent profile (safe, NOT Chrome profile)
const USER_DATA_DIR = path.join(__dirname, 'pw-profile');


// Extensions
const EXTENSION_1 = path.join(__dirname, '..', 'extension-1');
const EXTENSION_2 = path.join(__dirname, '..', 'extension-2');

// ---------- Main ----------
async function automateNotebookLM() {
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        acceptDownloads: true,
        permissions: ['clipboard-read'],
        viewport: null,
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',

            // 👇 Load multiple extensions
            `--disable-extensions-except=${EXTENSION_1},${EXTENSION_2}`,
            `--load-extension=${EXTENSION_1},${EXTENSION_2}`,
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



    // Wait for table to load
    await page.waitForSelector('tbody.mdc-data-table__content');

    // Select first row
    const firstRow = page.locator('tbody.mdc-data-table__content tr').first();

    // Click on title inside first row
    await firstRow.locator('.project-table-title').click();
    console.log('✅ Clicked first project');


    const contentLoadWait = async () => {
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
    }

    // ---------- Waiting for Content generation ----------
    await contentLoadWait();


    // Open Slides dropdown
    {
        console.log('Opening Slides dropdown...');
        const artifactItemSlides = page.locator(
            'div.artifact-item-button:has(button[aria-description="Slides"])'
        ).first();
        const moreBtnSlides = artifactItemSlides.locator('button[aria-label="More"]');
        await artifactItemSlides.waitFor({ state: 'visible' });
        await moreBtnSlides.waitFor({ state: 'visible' });
        await moreBtnSlides.click({ force: true });
        console.log('✅ Opened More menu for Slides');
        const pdfBtn = page.locator(
            'button.mat-mdc-menu-item:has-text("Download PDF document")'
        );
        await pdfBtn.waitFor({ state: 'visible' });
        const [slidesDownload] = await Promise.all([
            page.waitForEvent('download'),
            pdfBtn.click()
        ]);
        await slidesDownload.saveAs(path.join(DOWNLOAD_DIR, slidesDownload.suggestedFilename()));
        console.log('✅ Saved Slides PDF');
    }

    await page.waitForTimeout(5000);

    // Open Audio Overview dropdown
    {
        console.log('Opening Audio Overview dropdown...');
        const artifactItem = page
            .locator('div.artifact-item-button')
            .filter({
                has: page.locator('button[aria-description="Audio Overview"]')
            })
            .first();
        const moreBtn = artifactItem.getByRole('button', { name: 'More' });
        await moreBtn.waitFor({ state: 'visible' });
        await moreBtn.click({ force: true });
        console.log('✅ Menu opened');
        const activeMenu = page.locator('.cdk-overlay-pane').last();
        const downloadBtn = activeMenu.getByRole('menuitem', { name: 'Download' });
        await downloadBtn.waitFor({ state: 'visible' });
        const [audioDownload] = await Promise.all([
            page.waitForEvent('download'),
            downloadBtn.click()
        ]);
        await audioDownload.saveAs(path.join(DOWNLOAD_DIR, audioDownload.suggestedFilename()));
        console.log('✅ Saved Audio Overview');
    }

    await page.waitForTimeout(5000);

    // Open Video Overview dropdown
    {
        console.log('Opening Video Overview dropdown...');
        const artifactItem = page
            .locator('div.artifact-item-button')
            .filter({
                has: page.locator('button[aria-description="Video Overview"]')
            })
            .first();
        const moreBtn = artifactItem.getByRole('button', { name: 'More' });
        await artifactItem.waitFor({ state: 'visible' });
        await artifactItem.hover(); // important for Angular UI
        await moreBtn.scrollIntoViewIfNeeded();
        await moreBtn.click();
        console.log('✅ Dropdown opened');
        const activeMenu = page.locator('.cdk-overlay-pane').last();
        const downloadBtn = activeMenu.getByRole('menuitem', { name: 'Download' });
        await downloadBtn.waitFor({ state: 'visible' });
        const [videoDownload] = await Promise.all([
            page.waitForEvent('download'),
            downloadBtn.click()
        ]);
        await videoDownload.saveAs(path.join(DOWNLOAD_DIR, videoDownload.suggestedFilename()));
        console.log('✅ Saved Video Overview');
    }


    await page.waitForTimeout(5000);

    // Open Mind Map
    {
        console.log('Opening Mind Map...');
        await page.waitForSelector('.artifact-library-container');
        await page.locator(
            '.artifact-item-button:has(mat-icon:has-text("flowchart"))'
        ).first().click();
        console.log('✅ Opened Mind Map');
        await page.waitForTimeout(5000);
        console.log('Clicking Export Mind Map...');
        await page.locator('button[aria-label="导出思维导图"]').click();
        await page.waitForSelector('button:has-text("JSON")');
        console.log('Selecting JSON export...');
        const [mindmapDownload] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('button:has-text("JSON")').click()
        ]);
        await mindmapDownload.saveAs(path.join(DOWNLOAD_DIR, mindmapDownload.suggestedFilename()));
        console.log('✅ Saved Mind Map JSON:', mindmapDownload.suggestedFilename());
        await page.reload();
    }

    await page.waitForTimeout(5000);

    // Open Flashcards
    {
        console.log('Opening Flashcards...');
        await page.waitForSelector('.artifact-library-container');
        await page.locator(
            '.artifact-item-button:has(mat-icon:has-text("cards_star"))'
        ).first().click();
        console.log('✅ Opened Flashcards');
        await page.waitForTimeout(5000);
        await page.locator('button[aria-label="Copy JSON"]')
            .filter({ hasText: 'Copy' })
            .click();
        const clipboardJson = await page.evaluate(() => navigator.clipboard.readText());
        fs.writeFileSync(path.join(DOWNLOAD_DIR, 'clouds_Flashcards.json'), clipboardJson, 'utf-8');
        console.log('Flashcards JSON saved!');
        await page.reload();
    }

    await page.waitForTimeout(5000);


    // Open Quiz
    {
        console.log('Opening Quiz...');
        await page.waitForSelector('.artifact-library-container');
        await page.locator(
            '.artifact-item-button:has(mat-icon:has-text("quiz"))'
        ).first().click();
        console.log('✅ Opened Quiz');
        await page.waitForTimeout(5000);
        await page.locator('button[aria-label="Copy JSON"]')
            .filter({ hasText: 'Copy' })
            .click();
        const clipboardJson = await page.evaluate(() => navigator.clipboard.readText());
        fs.writeFileSync(path.join(DOWNLOAD_DIR, 'clouds_Quiz.json'), clipboardJson, 'utf-8');
        console.log('✅ Quiz Saved');
        await page.reload();
    }

    await page.waitForTimeout(5000);


}



automateNotebookLM().catch(console.error);