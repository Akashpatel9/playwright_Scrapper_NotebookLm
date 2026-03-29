# NotebookLM Automation

This project automates a NotebookLM workflow with Playwright:

- Open NotebookLM
- Create a new notebook
- Add a PDF by URL
- Wait for processing
- Ask NotebookLM for a highly detailed structured summary
- Open Studio
- Generate an Audio Overview
- Generate a Quiz with MCQ options
- Generate Flashcards
- Open Notes if the section is available

## Setup

1. Install dependencies:

```bash
npm install
npx playwright install chromium
```

2. Optionally set environment variables by copying values from `.env.example`.

## Run

```bash
PDF_URL="https://example.com/file.pdf" npm run run:headed
```

The first run may require you to sign in to Google manually in the opened browser window. The browser profile is saved in `playwright-profile/` so later runs can usually reuse that session.

Screenshots are written to `output/screenshots/`.

## Notes

- NotebookLM's UI changes over time, so the script uses multiple fallback selectors.
- Audio Overview, Quiz, and Flashcards are generated from the Studio area.
- Notes are opened if the Notes section is present, but NotebookLM notes are not consistently exposed as a generated artifact flow in the same way as quizzes or audio. The script therefore treats Notes as an optional navigation step instead of forcing generation.
