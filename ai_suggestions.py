from transformers import pipeline

class AISuggestions:
    def __init__(self):
        self.generator = pipeline('text-generation', model='gpt2')
        self.classifier = pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english')

    def generate_alternative(self, text, biased_term):
        prompt = f"Rewrite the following text to remove gender bias, specifically focusing on the term '{biased_term}': {text}"
        response = self.generator(prompt, max_length=len(prompt) + 50, num_return_sequences=1, truncation=True)
        return response[0]['generated_text'].replace(prompt, '').strip()

    def provide_explanation(self, biased_term):
        prompt = f"Explain why the term '{biased_term}' is considered gender-biased:"
        response = self.generator(prompt, max_length=len(prompt) + 100, num_return_sequences=1, truncation=True)
        return response[0]['generated_text'].replace(prompt, '').strip()

    def analyze_context(self, text):
        sentiment = self.classifier(text)[0]
        bias_prompt = f"Analyze the following text for gender bias: {text}"
        bias_analysis = self.generator(bias_prompt, max_length=len(bias_prompt) + 100, num_return_sequences=1)
        
        analysis = f"Sentiment: {sentiment['label']} (confidence: {sentiment['score']:.2f})\n"
        analysis += f"Bias Analysis: {bias_analysis[0]['generated_text'].replace(bias_prompt, '').strip()}"
        return analysis

# Example usage
if __name__ == "__main__":
    ai_suggestions = AISuggestions()
    
    text = "The chairman called all businessmen to the meeting."
    biased_term = "chairman"
    
    alternative = ai_suggestions.generate_alternative(text, biased_term)
    explanation = ai_suggestions.provide_explanation(biased_term)
    context_analysis = ai_suggestions.analyze_context(text)
    
    print(f"Alternative: {alternative}")
    print(f"\nExplanation: {explanation}")
    print(f"\nContext Analysis: {context_analysis}")
