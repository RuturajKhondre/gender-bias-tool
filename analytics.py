from collections import Counter
import json
from datetime import datetime

class Analytics:
    def __init__(self):
        self.analyzed_texts = []
        self.biased_terms_count = Counter()
        self.total_bias_score = 0
        self.total_texts = 0

    def track_analysis(self, text, results, ai_analysis):
        self.analyzed_texts.append({
            'text': text,
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'ai_analysis': ai_analysis
        })
        self.total_texts += 1
        
        for result in results:
            self.biased_terms_count[result['biased_term']] += 1
        
        self.total_bias_score += ai_analysis['bias_probability']

    def generate_summary_report(self):
        if not self.analyzed_texts:
            return "No texts analyzed yet."

        report = "Summary Report:\n"
        report += f"Total texts analyzed: {self.total_texts}\n"
        report += f"Average bias score: {self.total_bias_score / self.total_texts:.2f}\n"
        report += f"Most common biased terms:\n"
        for term, count in self.biased_terms_count.most_common(5):
            report += f"  {term}: {count}\n"
        
        return report

    def calculate_bias_score(self, results, ai_analysis):
        rule_based_score = len(results) / 10  # Assuming 10 is the maximum number of biased terms we expect
        ai_score = ai_analysis['bias_probability']
        
        # Combine rule-based and AI scores (you can adjust the weights)
        combined_score = (0.6 * rule_based_score + 0.4 * ai_score)
        
        return min(combined_score, 1.0)  # Ensure the score is between 0 and 1

    def save_analytics(self, filename='analytics_data.json'):
        data = {
            'total_texts': self.total_texts,
            'total_bias_score': self.total_bias_score,
            'biased_terms_count': dict(self.biased_terms_count),
            'analyzed_texts': self.analyzed_texts
        }
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

    def load_analytics(self, filename='analytics_data.json'):
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
            self.total_texts = data['total_texts']
            self.total_bias_score = data['total_bias_score']
            self.biased_terms_count = Counter(data['biased_terms_count'])
            self.analyzed_texts = data['analyzed_texts']
        except FileNotFoundError:
            print(f"No analytics file found at {filename}. Starting with fresh analytics.")

    def clear_data(self):
        self.analyzed_texts = []
        self.biased_terms_count.clear()
        self.total_bias_score = 0
        self.total_texts = 0

# Example usage
if __name__ == "__main__":
    analytics = Analytics()
    
    # Simulate some analyses
    analytics.track_analysis("The chairman called a meeting.", 
                             [{'biased_term': 'chairman', 'suggestion': 'chairperson'}],
                             {'bias_probability': 0.7})
    analytics.track_analysis("She is a great businesswoman.", 
                             [{'biased_term': 'businesswoman', 'suggestion': 'business person'}],
                             {'bias_probability': 0.3})
    
    print(analytics.generate_summary_report())
    print(f"Bias score for last analysis: {analytics.calculate_bias_score([{'biased_term': 'businesswoman'}], {'bias_probability': 0.3})}")
    
    analytics.save_analytics()
