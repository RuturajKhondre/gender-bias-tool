import re
import json
import os
from collections import defaultdict

class BiasDetector:
    def __init__(self):
        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Construct the full path to the JSON files
        bias_patterns_path = os.path.join(current_dir, 'data', 'bias_patterns.json')
        explanations_path = os.path.join(current_dir, 'data', 'explanations.json')
        
        # Open the files using the full paths
        with open(bias_patterns_path, 'r') as f:
            self.bias_patterns = json.load(f)
        with open(explanations_path, 'r') as f:
            self.explanations = json.load(f)
        
        self.biased_terms = {}
        for category in self.bias_patterns:
            if isinstance(self.bias_patterns[category], dict):
                self.biased_terms.update(self.bias_patterns[category])

        self.profession_bias = {
            "headmaster": "Consider using 'principal' or 'head teacher' for gender neutrality.",
            "chairman": "Consider using 'chairperson' or 'chair' for gender neutrality.",
            "policeman": "Consider using 'police officer' for gender neutrality.",
            "fireman": "Consider using 'firefighter' for gender neutrality.",
            "mailman": "Consider using 'mail carrier' or 'postal worker' for gender neutrality.",
        }
        self.biased_phrases = [
            (r"\b(he|she) is a (good|bad)\b", "Consider using 'they are a good/bad' for gender neutrality."),
            (r"\b(men|women) are better at\b", "Avoid generalizing abilities based on gender."),
            (r"\bprefers to hire (male|female)\b", "Hiring preferences based on gender may indicate bias."),
            (r"\b(male|female) teachers for the higher grades\b", "Associating grade levels with teacher gender may indicate bias."),
        ]

    def analyze_text(self, text):
        """
        Analyze the given text for gender-biased terms.
        Returns a list of dictionaries containing the biased term, its position, and a suggestion.
        """
        results = []
        words = text.lower().split()
        for i, word in enumerate(words):
            if word in self.biased_terms:
                results.append({
                    'biased_term': word,
                    'position': i,
                    'suggestion': self.biased_terms[word]
                })
        return results

    def generate_alternative(self, text):
        """
        Generate an alternative version of the text with gender-biased terms replaced.
        """
        words = text.split()
        for i, word in enumerate(words):
            lower_word = word.lower()
            if lower_word in self.biased_terms:
                words[i] = self.biased_terms[lower_word]
        return ' '.join(words)

    def get_explanation(self, biased_term):
        if biased_term in self.explanations:
            return self.explanations[biased_term]
        return {"why_biased": "This term may reinforce gender stereotypes or exclude certain genders."}

    def detect_bias(self, text):
        words = text.lower().split()
        gender_counts = defaultdict(int)
        biased_terms = []
        suggestions = []

        for word in words:
            for gender, terms in self.biased_terms.items():
                if word in terms:
                    gender_counts[gender] += 1
                    biased_terms.append(word)

        for term, suggestion in self.profession_bias.items():
            if term.lower() in text.lower():
                suggestions.append(suggestion)

        for pattern, suggestion in self.biased_phrases:
            if re.search(pattern, text, re.IGNORECASE):
                suggestions.append(suggestion)

        bias_detected = len(biased_terms) > 0 or len(suggestions) > 0
        bias_ratio = abs(gender_counts['male'] - gender_counts['female']) / (sum(gender_counts.values()) or 1)

        return {
            'bias_detected': bias_detected,
            'biased_terms': biased_terms,
            'suggestions': suggestions,
            'bias_ratio': bias_ratio
        }

# Example usage:
if __name__ == "__main__":
    detector = BiasDetector()
    
    sample_text = "The chairman called a meeting with all businessmen and policemen."
    
    results = detector.analyze_text(sample_text)
    print("Biased terms found:")
    for result in results:
        print(f"Term: {result['biased_term']}")
        print(f"Suggestion: {result['suggestion']}")
        print(f"Explanation: {detector.get_explanation(result['biased_term'])}")
        print()
    
    alternative_text = detector.generate_alternative(sample_text)
    print("Alternative text:")
    print(alternative_text)
