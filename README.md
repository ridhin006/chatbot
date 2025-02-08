# News Chatbot with AI Features

A Python-based chatbot for real-time news summarization with fake news detection and debate capabilities.

## Features

- Real-time news summarization with category selection
- Fake news detection
- AI-powered debate mode
- "Did You Know?" random facts feature

## Setup Instructions

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a .env file in the root directory with your API keys:
   ```
   NEWS_API_KEY=your_news_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

## API Keys Required

- NewsAPI (https://newsapi.org)
- OpenAI API (https://platform.openai.com)

## Usage

Visit `http://localhost:8000` in your web browser to use the chatbot.
