const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PDF_URL = 'https://ncert.nic.in/textbook/pdf/bemr108.pdf';
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

async function automateNotebookLM() {
  // Launch browser (headless: false to see the browser)
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // STEP 1: Open NotebookLM
  console.log('Step 1: Opening NotebookLM...');
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // STEP 2: Create New Project
  console.log('Step 2: Creating new project...');
  await page.locator('button:has-text("Create new")').click();
  await page.waitForTimeout(2000);

  // STEP 3: Add PDF URL as Source
  console.log('Step 3: Adding PDF source URL...');
  await page.locator('button:has-text("Websites")').click();
  await page.waitForTimeout(1000);
  await page.locator('textarea[placeholder="Paste any links"]').fill(PDF_URL);
  await page.locator('button:has-text("Insert")').click();
  await page.waitForTimeout(8000);

  // STEP 4: Enter Summary Prompt in Chat
  console.log('Step 4: Sending summary prompt in chat...');
  const chatPrompt = `Give me a detailed and brief summary of this PDF. Do not miss any important topics, concepts, or sections. Include proper references (page numbers, section names, headings) wherever applicable. Cover all key points thoroughly.`;
  await page
    .locator('div[placeholder="Start typing..."], textarea[placeholder="Start typing..."]')
    .fill(chatPrompt);
  await page.locator('button[aria-label="Send message"]').click();
  await page.waitForTimeout(15000);

  // STEP 5: Go to Studio
  console.log('Step 5: Navigating to Studio...');
  await page.locator('text=Studio').click();
  await page.waitForTimeout(2000);

  // STEP 6: Generate Audio Overview (Brief)
  console.log('Step 6: Generating Audio Overview...');
  await page
    .locator('div:has-text("Audio Overview") >> button[aria-label*="arrow"], div:has-text("Audio Overview") >> .arrow-btn')
    .first()
    .click();
  await page.waitForTimeout(1000);
  await page.locator('text=Brief').click();
  await page
    .locator('textarea, div[contenteditable]')
    .last()
    .fill(
      `Create a concise but in-depth podcast episode covering all key topics from this NCERT chapter. Cover the central poem "A Show of Clouds" and its themes of imagination and nature. Explain each section with educational depth. Highlight vocabulary, phonics ('ck' sound), comprehension activities and drawing exercises.`
    );
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(3000);

  // STEP 7: Generate Slide Deck
  console.log('Step 7: Generating Slide Deck...');
  await page.locator('div:has-text("Slide deck") >> button').first().click();
  await page.waitForTimeout(1000);
  await page
    .locator('textarea, div[contenteditable]')
    .last()
    .fill(
      `Create a detailed and comprehensive slide deck for this NCERT chapter "A Show of Clouds". Include slides for: chapter overview, the poem with themes, each section, key vocabulary, phonics ('ck' sound), comprehension questions, and activities. Reference page numbers on each slide.`
    );
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(3000);

  // STEP 8: Generate Video Overview (Explainer + Whiteboard)
  console.log('Step 8: Generating Video Overview...');
  await page.locator('div:has-text("Video Overview") >> button').first().click();
  await page.waitForTimeout(1000);
  await page.locator('text=Explainer').click();
  await page.waitForTimeout(500);
  await page.locator('text=Whiteboard').click();
  await page.waitForTimeout(500);
  await page
    .locator('textarea, div[contenteditable]')
    .last()
    .fill(
      `Create a structured explainer video covering the entire NCERT chapter "A Show of Clouds". Walk through each section step by step with clear explanations suitable for primary school students and teachers.`
    );
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(3000);

  // STEP 9: Generate Mind Map (direct click)
  console.log('Step 9: Generating Mind Map...');
  await page.locator('div:has-text("Mind Map")').click();
  await page.waitForTimeout(3000);

  // STEP 10: Generate Flashcards (Hard)
  console.log('Step 10: Generating Flashcards...');
  await page.locator('div:has-text("Flashcards") >> button').first().click();
  await page.waitForTimeout(1000);
  await page.locator('text=Hard').click();
  await page
    .locator('textarea, div[contenteditable]')
    .last()
    .fill(
      `Create flashcards covering all key topics from this NCERT chapter including vocabulary, phonics 'ck' sound, comprehension questions, cloud colors, and key themes.`
    );
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(3000);

  // STEP 11: Generate Quiz (Hard)
  console.log('Step 11: Generating Quiz...');
  await page.locator('div:has-text("Quiz") >> button').first().click();
  await page.waitForTimeout(1000);
  await page.locator('text=Hard').click();
  await page
    .locator('textarea, div[contenteditable]')
    .last()
    .fill(
      `Create a challenging quiz covering all sections of this NCERT chapter including poem content, vocabulary, phonics 'ck' sound, comprehension, and activities.`
    );
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(3000);

  // STEP 12: Wait for all content to generate
  console.log('Step 12: Waiting for all content to generate...');
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Generating');
  }, { timeout: 300000 });
  console.log('All content generated!');

  // STEP 13: Download Video Overview
  console.log('Step 13: Downloading Video Overview...');
  await page.locator('text=Explainer').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button[aria-label*="more"], button:has-text("...")').first().click();
  const [videoDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('text=Download').click(),
  ]);
  await videoDownload.saveAs(path.join(DOWNLOAD_DIR, 'video_overview.mp4'));
  console.log('Video downloaded!');
  await page.goBack();

  // STEP 14: Download Audio Overview
  console.log('Step 14: Downloading Audio Overview...');
  await page.locator('text=Cloud Shapes and Phonics Lesson').click();
  await page.waitForTimeout(1000);
  await page.locator('button[aria-label*="more options"]').click();
  const [audioDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('text=Download').click(),
  ]);
  await audioDownload.saveAs(path.join(DOWNLOAD_DIR, 'audio_overview.mp3'));
  console.log('Audio downloaded!');
  await page.locator('button[aria-label*="close"]').click();

  // STEP 15: Download Slide Deck as PDF
  console.log('Step 15: Downloading Slide Deck as PDF...');
  await page.locator('text=A Show of Clouds').nth(1).click();
  await page.waitForTimeout(1000);
  await page.locator('button[aria-label*="more"], button:has-text("...")').click();
  const [pdfDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('text=Download PDF document (.pdf)').click(),
  ]);
  await pdfDownload.saveAs(path.join(DOWNLOAD_DIR, 'slide_deck.pdf'));
  console.log('Slide deck PDF downloaded!');

  // STEP 16: Export Mind Map as JSON
  console.log('Step 16: Exporting Mind Map as JSON...');
  await page.locator('text=A Show of Clouds: A Study of the Sky').click();
  await page.waitForTimeout(1000);
  await page.locator('button[aria-label*="export"], button:has-text("export")').click();
  await page.waitForTimeout(500);
  const [mindmapDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('text=JSON').click(),
  ]);
  await mindmapDownload.saveAs(path.join(DOWNLOAD_DIR, 'mindmap.json'));
  console.log('Mind map JSON exported!');

  // STEP 17: Copy Quiz JSON -> JSON Editor Online
  console.log('Step 17: Copying Quiz and saving to JSON Editor...');
  await page.locator('text=Clouds Quiz').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Copy")').click();
  await page.waitForTimeout(1000);

  const jsonPage = await context.newPage();
  await jsonPage.goto('https://jsoneditoronline.org/', { waitUntil: 'networkidle' });
  await jsonPage.waitForTimeout(2000);
  await jsonPage.locator('.editor-left .content-box').click();
  await jsonPage.keyboard.press('Control+A');
  await jsonPage.keyboard.press('Backspace');
  await jsonPage.keyboard.press('Control+V');
  await jsonPage.waitForTimeout(1000);

  await jsonPage.locator('button[title*="Save"], .save-button').click();
  await jsonPage.locator('text=Save to disk').click();
  await jsonPage.waitForTimeout(500);
  await jsonPage.locator('input[type="text"]').fill('clouds_quiz');
  const [jsonDownload] = await Promise.all([
    jsonPage.waitForEvent('download'),
    jsonPage.locator('button:has-text("Save")').click(),
  ]);
  await jsonDownload.saveAs(path.join(DOWNLOAD_DIR, 'clouds_quiz.json'));
  console.log('Quiz JSON saved!');

  console.log('\nAll steps completed successfully!');
  console.log(`All files saved to: ${DOWNLOAD_DIR}`);

  await browser.close();
}

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

automateNotebookLM().catch(console.error);
