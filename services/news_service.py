import os
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class NewsService:
    def __init__(self):
        self.api_key = os.getenv('NEWSDATA_API_KEY')
        if not self.api_key:
            raise ValueError("NEWSDATA_API_KEY environment variable is not set")
        
        self.base_url = "https://newsdata.io/api/1/news"
        self.cache = {}
        self.cache_duration = timedelta(minutes=15)
        self.last_update = {}
        self._client = None
        
        # Category mapping for newsdata.io
        self.category_mapping = {
            'business': 'business',
            'entertainment': 'entertainment',
            'general': 'top',
            'health': 'health',
            'science': 'science',
            'sports': 'sports',
            'technology': 'technology'
        }

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=5.0,  # Reduced timeout
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        return self._client

    async def get_news(self, category: Optional[str] = None, country: Optional[str] = None) -> List[Dict]:
        try:
            # Create cache key
            cache_key = f"{category}_{country}" if country else category
            
            # Check cache
            if (cache_key in self.cache and cache_key in self.last_update and
                datetime.now() - self.last_update[cache_key] < self.cache_duration):
                return self.cache[cache_key]

            # Prepare API parameters
            params = {
                'apikey': self.api_key,
                'language': 'en'
            }
            
            # Handle category
            if category and category != 'region':
                mapped_category = self.category_mapping.get(category.lower(), 'top')
                params['category'] = mapped_category
            
            # Handle country
            if country or category == 'region':
                params['country'] = country or 'in'  # Use 'in' for India when category is region
            
            # Make API request
            client = await self.get_client()
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] != 'success':
                raise Exception(f"News API error: {data.get('results', 'Unknown error')}")
            
            # Process articles
            articles = []
            for article in data.get('results', []):
                if not article.get('title') or not article.get('link'):
                    continue
                    
                processed_article = {
                    'title': article['title'].strip(),
                    'description': article.get('description', '').strip() if article.get('description') else '',
                    'url': article['link'],
                    'source': article.get('source_id', ''),
                    'published_at': article.get('pubDate', ''),
                    'image_url': article.get('image_url', '')
                }
                articles.append(processed_article)
            
            # Update cache
            self.cache[cache_key] = articles[:10]  # Limit to 10 articles
            self.last_update[cache_key] = datetime.now()
            
            return articles[:10]

        except httpx.TimeoutException:
            print("Request timed out")
            return self.cache.get(cache_key, [])  # Return cached data if available
        except httpx.HTTPError as e:
            print(f"HTTP error occurred: {str(e)}")
            return self.cache.get(cache_key, [])  # Return cached data if available
        except Exception as e:
            print(f"Error fetching news: {str(e)}")
            return self.cache.get(cache_key, [])  # Return cached data if available

    async def clear_cache(self):
        self.cache.clear()
        self.last_update.clear()
        
    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
