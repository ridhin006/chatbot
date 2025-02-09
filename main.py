from fastapi import FastAPI, HTTPException, WebSocket, Request, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import json
from datetime import datetime, timedelta
import random
from models.fake_news_detector import FakeNewsDetector
from services.news_service import NewsService
from services.debate_service import DebateService
from services.facts_service import FactsService

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize services
news_service = None
debate_service = DebateService()
facts_service = FactsService()
fake_news_detector = FakeNewsDetector()

@app.on_event("startup")
async def startup_event():
    global news_service
    try:
        news_service = NewsService()
        print("NewsService initialized successfully")
    except Exception as e:
        print(f"Error initializing NewsService: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    if news_service:
        try:
            await news_service.close()
            print("NewsService closed successfully")
        except Exception as e:
            print(f"Error closing NewsService: {e}")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("New WebSocket connection request")
    await websocket.accept()
    print("WebSocket connection accepted")
    
    try:
        while True:
            try:
                data = await websocket.receive_json()
                print(f"Received message: {data}")
                
                message_type = data.get("type", "unknown")
                print(f"Processing message type: {message_type}")
                
                if message_type == "fact_request":
                    print("Handling fact request")
                    fact = facts_service.get_random_fact()
                    print(f"Got random fact: {fact}")
                    response = {
                        "type": "fact",
                        "data": fact
                    }
                    print(f"Sending response: {response}")
                    await websocket.send_json(response)
                    print("Fact response sent")
                
                elif message_type == "news":
                    if not news_service:
                        raise Exception("NewsService not initialized")
                    
                    category = data.get("category", "general")
                    print(f"Fetching news for category: {category}")
                    
                    news_articles = await news_service.get_news(category=category)
                    print(f"Found {len(news_articles)} articles")
                    
                    await websocket.send_json({
                        "type": "news",
                        "data": news_articles
                    })
                
                elif message_type == "fake_news_check":
                    text = data["text"]
                    print(f"Checking fake news for: {text}")
                    result = fake_news_detector.predict(text)
                    print(f"Fake news result: {result}")
                    await websocket.send_json({
                        "type": "fake_news_result",
                        "data": result
                    })
                
                else:
                    print(f"Unknown message type: {message_type}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unknown message type"
                    })
                    
            except json.JSONDecodeError as e:
                print(f"Invalid JSON received: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid message format"
                })
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": "Server error occurred"
            })
        except:
            print("Could not send error message to client")
    finally:
        try:
            await websocket.close()
        except:
            pass
        print("WebSocket connection closed")

@app.get("/api/news/{category}")
async def get_news(category: str):
    try:
        news = await news_service.get_news(category)
        if not news:
            raise HTTPException(status_code=404, detail="No news found for this category")
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    return {
        "categories": [
            "region",
            "business",
            "entertainment",
            "general",
            "health",
            "science",
            "sports",
            "technology"
        ]
    }

@app.get("/api/facts")
async def get_facts():
    try:
        facts = await facts_service.get_random_facts()
        if not facts:
            raise HTTPException(status_code=404, detail="No facts found")
        return facts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-fake-news")
async def detect_fake_news(text: str):
    try:
        result = fake_news_detector.predict(text)
        return {"is_fake": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8080)
