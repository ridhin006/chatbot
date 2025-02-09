import os
from openai import OpenAI
import httpx

class DebateService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = OpenAI(
            api_key=api_key,
            http_client=httpx.Client(
                base_url="https://api.openai.com/v1",
                timeout=30.0
            )
        )
        
    async def get_response(self, topic, stance="opposing"):
        try:
            # Construct the prompt based on the stance
            if stance == "opposing":
                prompt = f"Present a well-reasoned opposing argument to the following topic: {topic}. Be concise but thorough in your response."
            else:
                prompt = f"Present a balanced analysis of both sides of the following topic: {topic}. Consider key arguments for and against."
            
            # Make API call to OpenAI
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a debate assistant that provides thoughtful and well-reasoned arguments."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
                
        except Exception as e:
            print(f"Error in debate service: {str(e)}")
            return "An error occurred while generating the debate response."
