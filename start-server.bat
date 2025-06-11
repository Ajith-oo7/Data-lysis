@echo off
REM Set your OpenAI API key in a .env file instead
REM Create a .env file with: OPENAI_API_KEY=your_api_key_here
set NODE_ENV=production
set HOST=127.0.0.1
set PORT=5000
set NODE_OPTIONS=--no-warnings
node dist/index.js 