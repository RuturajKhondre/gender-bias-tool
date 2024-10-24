from flask import Flask, render_template, request, jsonify, send_file, session, send_from_directory
from bias_detector import BiasDetector
from ai_analyzer import AIAnalyzer
from ai_suggestions import AISuggestions
from analytics import Analytics
import traceback
import logging
from io import BytesIO
import pdfkit
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace with a real secret key
logging.basicConfig(level=logging.DEBUG)

detector = BiasDetector()
ai_analyzer = AIAnalyzer()
ai_suggestions = AISuggestions()
analytics = Analytics()

@app.route('/')
def index():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    # Clear analytics data when loading the main page
    analytics.clear_data()
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data['text']
    
    try:
        app.logger.debug("Starting analysis")
        app.logger.debug(f"Received text: {text}")

        app.logger.debug("Calling detector.analyze_text")
        bias_results = detector.analyze_text(text)
        app.logger.debug(f"Bias results: {bias_results}")

        biased_terms = {result['biased_term']: result['suggestion'] for result in bias_results}
        app.logger.debug(f"Biased terms: {biased_terms}")

        app.logger.debug("Calling ai_analyzer.analyze_and_suggest")
        ai_results = ai_analyzer.analyze_and_suggest(text, biased_terms)
        app.logger.debug(f"AI results: {ai_results}")

        response = []
        for result in bias_results:
            biased_term = result['biased_term']
            gpt_alternative = ai_suggestions.generate_alternative(text, biased_term)
            gpt_explanation = ai_suggestions.provide_explanation(biased_term)
            
            response.append({
                'biased_term': biased_term,
                'suggestion': result['suggestion'],
                'gpt_alternative': gpt_alternative,
                'explanation': detector.get_explanation(biased_term),
                'gpt_explanation': gpt_explanation,
                'position': result['position'],
                'confidence': result.get('confidence', 0.5)  # Add this line
            })
        
        context_analysis = ai_suggestions.analyze_context(text)
        
        # Track this analysis
        analytics.track_analysis(text, response, ai_results['analysis'])
        
        # Calculate bias score
        bias_score = analytics.calculate_bias_score(response, ai_results['analysis'])
        
        # Save updated analytics
        analytics.save_analytics()
        
        # Store the analysis in the user's history
        if 'history' not in session:
            session['history'] = []
        session['history'].append({
            'text': text,
            'results': response,
            'timestamp': datetime.now().isoformat()
        })
        session.modified = True
        
        app.logger.debug("Analysis complete, returning results")
        response_data = {
            'results': response,
            'ai_analysis': ai_results['analysis'],
            'ai_suggestions': ai_results['suggestions'],
            'context_analysis': context_analysis,
            'bias_score': bias_score,
            'bias_distribution': {
                'gender': 0.4,
                'race': 0.2,
                'age': 0.05,
                'religion': 0.0,
                'disability': 0.0,
                'other': 0.0
            },
            'bias_types': ['gender', 'race', 'age', 'religion', 'disability', 'other']
        }
        print("Sending response:", response_data)
        return jsonify(response_data)
    except Exception as e:
        print("Error in analysis:", str(e))  # Log any errors
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/summary')
def summary():
    if analytics.total_texts == 0:
        return "No analysis has been performed yet. Please analyze some text first."
    return render_template('summary.html', report=analytics.generate_summary_report())

@app.route('/download_summary/<format>')
def download_summary(format):
    report = analytics.generate_summary_report()
    if format == 'txt':
        buffer = BytesIO()
        buffer.write(report.encode())
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, attachment_filename='summary_report.txt', mimetype='text/plain')
    elif format == 'pdf':
        pdf = pdfkit.from_string(report, False)
        buffer = BytesIO(pdf)
        return send_file(buffer, as_attachment=True, attachment_filename='summary_report.pdf', mimetype='application/pdf')
    else:
        return "Unsupported format", 400

@app.route('/history')
def history():
    return jsonify(session.get('history', []))

@app.route('/save-analysis', methods=['POST'])
def save_analysis():
    data = request.json
    # Here you would typically save the data to a database
    # For this example, we'll just pretend it's successful
    print(f"Saving analysis: {data['name']}")
    return jsonify({"success": True})

@app.route('/tutorial/<path:filename>')
def serve_tutorial(filename):
    return send_from_directory('tutorial', filename)

if __name__ == '__main__':
    app.run(debug=True)
