from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

class FakeNewsDetector:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.model = LogisticRegression()
        self.is_trained = False
        
        # Get the absolute path to the model file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(current_dir, 'fake_news_model.joblib')
        
        # Try to load pre-trained model if it exists
        if os.path.exists(self.model_path):
            try:
                self.load_model()
            except Exception as e:
                print(f"Error loading model: {str(e)}")
                self.is_trained = False
        
    def train(self, texts, labels):
        """Train the model with new data"""
        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)
        self.is_trained = True
        self.save_model()
    
    def predict(self, text):
        """Predict if a news article is fake or real"""
        if not self.is_trained:
            return {
                "prediction": "Unknown",
                "confidence": 0,
                "message": "Model not trained yet"
            }
        
        # Transform the text
        X = self.vectorizer.transform([text])
        
        # Get prediction and probability
        prediction = self.model.predict(X)[0]
        probability = max(self.model.predict_proba(X)[0])
        
        return {
            "prediction": "Fake" if prediction == 0 else "Real",
            "confidence": float(probability),
            "message": self._get_confidence_message(probability)
        }
    
    def _get_confidence_message(self, probability):
        if probability >= 0.9:
            return "High confidence in prediction"
        elif probability >= 0.7:
            return "Moderate confidence in prediction"
        else:
            return "Low confidence in prediction"
    
    def save_model(self):
        """Save the trained model"""
        if not os.path.exists(os.path.dirname(self.model_path)):
            os.makedirs(os.path.dirname(self.model_path))
        joblib.dump((self.vectorizer, self.model), self.model_path)
    
    def load_model(self):
        """Load a pre-trained model"""
        try:
            self.vectorizer, self.model = joblib.load(self.model_path)
            self.is_trained = True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.is_trained = False
