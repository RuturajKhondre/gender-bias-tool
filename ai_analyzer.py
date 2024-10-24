from transformers import pipeline
import torch

class AIAnalyzer:
    def __init__(self):
        self.classifier = pipeline("text-classification", model="facebook/roberta-hate-speech-dynabench-r4-target")
        self.sentiment_analyzer = pipeline("sentiment-analysis")

    def analyze_text(self, text):
        # Classify text for potential bias
        classification = self.classifier(text)[0]
        
        # Analyze sentiment
        sentiment = self.sentiment_analyzer(text)[0]
        
        return {
            "bias_probability": classification["score"] if classification["label"] == "hate" else 1 - classification["score"],
            "sentiment": sentiment["label"],
            "sentiment_score": sentiment["score"]
        }

    def generate_suggestion(self, text, biased_terms):
        # This is a placeholder. In a full implementation, you'd use a more sophisticated
        # method to generate suggestions, possibly using a language model.
        suggestions = []
        for term, replacement in biased_terms.items():
            if term in text.lower():
                suggestions.append(f"Consider replacing '{term}' with '{replacement}'")
        return suggestions

    def analyze_and_suggest(self, text, biased_terms):
        analysis = self.analyze_text(text)
        suggestions = self.generate_suggestion(text, biased_terms)
        
        return {
            "analysis": analysis,
            "suggestions": suggestions
        }

# Example usage
if __name__ == "__main__":
    analyzer = AIAnalyzer()
    text = "The chairman called all businessmen to the meeting."
    biased_terms = {"chairman": "chairperson", "businessmen": "business people"}
    result = analyzer.analyze_and_suggest(text, biased_terms)
    print(result)