console.log("Script file loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    const analyzeBtn = document.getElementById('analyze-btn');
    const inputText = document.getElementById('input-text');
    const result = document.getElementById('result');
    const exportContainer = document.getElementById('export-container');
    const exportBtn = document.getElementById('export-btn');
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const clearBtn = document.getElementById('clear-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const saveAnalysisBtn = document.getElementById('save-analysis-btn');
    const saveAnalysisContainer = document.getElementById('save-analysis-container');
    const analysisNameInput = document.getElementById('analysis-name');
    const saveAnalysisMessage = document.getElementById('save-analysis-message');

    console.log("Analyze button:", analyzeBtn);
    console.log("Clear button:", clearBtn);
    console.log("Refresh button:", refreshBtn);
    console.log("Save analysis button:", saveAnalysisBtn);
    console.log("Save analysis container:", saveAnalysisContainer);

    let analysisData = null;
    let analysisHistory = [];

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }    
    }

    toggleSwitch.addEventListener('change', switchTheme, false);

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    analyzeBtn.addEventListener('click', function() {
        const text = inputText.value.trim();
        if (text === '') {
            result.innerHTML = '<p>Please enter some text to analyze.</p>';
            return;
        }

        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;
        exportContainer.style.display = 'none';

        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text: text}),
        })
        .then(response => response.json())
        .then(data => {
            analysisData = data;
            let resultHtml = '<h2>What we found down the rabbit hole:</h2>';
            
            // Check if data.results exists and is an array
            if (Array.isArray(data.results) && data.results.length > 0) {
                resultHtml += '<ul>';
                data.results.forEach(item => {
                    resultHtml += `
                        <li>
                            <strong>Biased term:</strong> ${item.biased_term}<br>
                            <strong>Suggestion:</strong> ${formatSuggestion(item.suggestion)}<br>
                            <strong>AI Alternative:</strong> ${item.gpt_alternative || 'N/A'}<br>
                            <strong>Explanation:</strong> ${formatExplanation(item.explanation)}<br>
                            <strong>AI Explanation:</strong> ${item.gpt_explanation || 'N/A'}
                        </li>
                    `;
                });
                resultHtml += '</ul>';
            } else {
                resultHtml += '<p>No gender bias detected. Your language is as balanced as a tea party!</p>';
            }
            
            // Check if ai_analysis exists before accessing its properties
            if (data.ai_analysis) {
                resultHtml += '<h3>AI Analysis:</h3>';
                resultHtml += `<p>Bias Probability: ${formatConfidence(data.ai_analysis.bias_probability)}</p>`;
                resultHtml += `<p>Sentiment: ${data.ai_analysis.sentiment} (${formatConfidence(data.ai_analysis.sentiment_score)})</p>`;
            }
            
            if (typeof data.bias_score !== 'undefined') {
                resultHtml += `<p>Overall Bias Score: ${formatConfidence(data.bias_score)}</p>`;
                resultHtml += '<div class="bias-section">';
                resultHtml += '<h3>Bias Severity:</h3>';
                resultHtml += createProgressBar(data.bias_score);
                resultHtml += '</div>';
            }
            
            if (data.bias_distribution) {
                resultHtml += '<div class="bias-section">';
                resultHtml += '<canvas id="biasDistributionChart"></canvas>';
                resultHtml += '</div>';
            }
            
            if (data.context_analysis) {
                resultHtml += '<h3>Context Analysis:</h3>';
                resultHtml += `<p>${data.context_analysis}</p>`;
            }
            
            // Add Bias Types Color Legend
            resultHtml += '<div class="bias-section">';
            resultHtml += '<h3>Bias Types:</h3>';
            resultHtml += createBiasTypesLegend(data.bias_types);
            resultHtml += '</div>';

            result.innerHTML = resultHtml;

            // Create charts after adding to DOM
            requestAnimationFrame(() => {
                createBiasDistributionChart(data.bias_distribution);
            });

            exportContainer.style.display = 'block';

            // Add to analysis history
            analysisHistory.push({
                text: text,
                result: data,
                timestamp: new Date().toISOString()
            });
            displayAnalysisHistory();

            // Show save analysis container after successful analysis
            // Add this in your fetch .then() block where you show the results
            saveAnalysisContainer.style.display = 'flex';

            // Add event listener for save analysis button
            saveAnalysisBtn.addEventListener('click', function() {
                const analysisName = analysisNameInput.value.trim();

                // Assuming you have the analysis data stored in a variable called 'analysisData'
                const dataToSave = {
                    name: analysisName,
                    data: analysisData // Make sure you have this variable defined with your analysis results
                };

                // Send data to server to save
                fetch('/save-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSave),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Analysis saved successfully!');
                        analysisNameInput.value = ''; // Clear the input field
                    } else {
                        console.log('Failed to save analysis. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            });
        })
        .catch((error) => {
            console.error('Error:', error);
            result.innerHTML = `<p>Oh dear! We seem to have lost our way. Error details: ${error.message}</p>`;
            exportContainer.style.display = 'none';
        })
        .finally(() => {
            analyzeBtn.textContent = 'Down the Rabbit Hole';
            analyzeBtn.disabled = false;
        });
    });

    exportBtn.addEventListener('click', function() {
        if (analysisData) {
            exportResults(analysisData);
        } else {
            alert('Please perform an analysis first.');
        }
    });

    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        result.innerHTML = '';
        exportContainer.style.display = 'none';
    });

    refreshBtn.addEventListener('click', function() {
        location.reload();
    });

    function formatSuggestion(suggestion) {
        if (typeof suggestion === 'string') {
            return suggestion;
        }
        if (typeof suggestion === 'object' && suggestion !== null) {
            return Object.entries(suggestion)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        }
        return 'No suggestion available';
    }

    function formatExplanation(explanation) {
        if (typeof explanation === 'string') {
            return explanation;
        }
        let formattedExplanation = '';
        for (const [key, value] of Object.entries(explanation)) {
            formattedExplanation += `<strong>${key.replace('_', ' ')}:</strong> ${value}<br>`;
        }
        return formattedExplanation;
    }

    function formatConfidence(confidence) {
        if (typeof confidence === 'number') {
            return (confidence * 100).toFixed(2) + '%';
        }
        return 'N/A';
    }

    function createProgressBar(score) {
        const percentage = score * 100;
        const color = getBiasColor(score);
        return `
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};">
                    ${percentage.toFixed(2)}%
                </div>
            </div>
        `;
    }

    function createBiasDistributionChart(distribution) {
        const ctx = document.getElementById('biasDistributionChart').getContext('2d');
        const labels = Object.keys(distribution);
        const data = Object.values(distribution);
        const colors = data.map(getBiasColor);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bias Distribution',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,  // Changed to true
                aspectRatio: 2,  // Width:Height ratio of 2:1
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            font: {
                                size: 12  // Reduced from 14
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12  // Reduced from 14
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Bias Distribution',
                        font: {
                            size: 16  // Reduced from 18
                        }
                    }
                }
            }
        });
    }

    function createBiasTypesLegend(biasTypes) {
        let legendHtml = '<div class="bias-types-legend">';
        for (const type of biasTypes) {
            const color = getBiasTypeColor(type);
            legendHtml += `
                <div class="bias-type-item">
                    <span class="color-box" style="background-color: ${color};"></span>
                    <span>${type}</span>
                </div>
            `;
        }
        legendHtml += '</div>';
        return legendHtml;
    }

    function getBiasColor(score) {
        if (score < 0.3) return '#4CAF50';  // Green for low bias
        if (score < 0.7) return '#FFC107';  // Yellow for medium bias
        return '#F44336';  // Red for high bias
    }

    function getBiasTypeColor(type) {
        const colorMap = {
            'gender': '#FF6384',
            'race': '#36A2EB',
            'age': '#FFCE56',
            'religion': '#4BC0C0',
            'disability': '#9966FF',
            'other': '#FF9F40'
        };
        return colorMap[type.toLowerCase()] || '#C9CBCF';  // Default color if type not found
    }

    function exportResults(data) {
        const format = document.getElementById('export-format').value;
        let content, filename, mimeType;

        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = 'bias_analysis_results.json';
                mimeType = 'application/json';
                break;
            case 'csv':
                content = convertToCSV(data);
                filename = 'bias_analysis_results.csv';
                mimeType = 'text/csv';
                break;
            case 'txt':
                content = convertToPlainText(data);
                filename = 'bias_analysis_results.txt';
                mimeType = 'text/plain';
                break;
            case 'pdf':
                exportToPDF(data);
                return;
            case 'html':
                content = convertToHTML(data);
                filename = 'bias_analysis_results.html';
                mimeType = 'text/html';
                break;
            default:
                alert('Invalid export format');
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function convertToCSV(data) {
        let csv = 'Biased Term,Suggestion,AI Alternative,Explanation,AI Explanation\n';
        data.results.forEach(item => {
            csv += `"${item.biased_term}","${formatSuggestion(item.suggestion)}","${item.gpt_alternative}","${item.explanation}","${item.gpt_explanation}"\n`;
        });
        return csv;
    }

    function convertToPlainText(data) {
        let text = 'Bias Analysis Results\n\n';
        data.results.forEach(item => {
            text += `Biased Term: ${item.biased_term}\n`;
            text += `Suggestion: ${formatSuggestion(item.suggestion)}\n`;
            text += `AI Alternative: ${item.gpt_alternative}\n`;
            text += `Explanation: ${item.explanation}\n`;
            text += `AI Explanation: ${item.gpt_explanation}\n\n`;
        });
        return text;
    }

    function convertToHTML(data) {
        let html = '<html><head><title>Bias Analysis Results</title></head><body>';
        html += '<h1>Bias Analysis Results</h1>';
        data.results.forEach(item => {
            html += `<h2>Biased Term: ${item.biased_term}</h2>`;
            html += `<p><strong>Suggestion:</strong> ${formatSuggestion(item.suggestion)}</p>`;
            html += `<p><strong>AI Alternative:</strong> ${item.gpt_alternative}</p>`;
            html += `<p><strong>Explanation:</strong> ${item.explanation}</p>`;
            html += `<p><strong>AI Explanation:</strong> ${item.gpt_explanation}</p>`;
        });
        html += '</body></html>';
        return html;
    }

    function exportToPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yOffset = 10;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        const maxLineWidth = pageWidth - 2 * margin;

        doc.setFontSize(16);
        yOffset = addTextWithWrapping(doc, 'Bias Analysis Results', margin, yOffset, maxLineWidth);
        yOffset += 10;

        doc.setFontSize(12);
        data.results.forEach((item, index) => {
            if (yOffset > pageHeight - 20) {
                doc.addPage();
                yOffset = 10;
            }

            doc.setFont(undefined, 'bold');
            yOffset = addTextWithWrapping(doc, `Result ${index + 1}:`, margin, yOffset, maxLineWidth);
            yOffset += 5;

            doc.setFont(undefined, 'normal');
            yOffset = addTextWithWrapping(doc, `Biased Term: ${item.biased_term}`, margin, yOffset, maxLineWidth);
            yOffset += 5;

            yOffset = addTextWithWrapping(doc, `Suggestion: ${formatSuggestion(item.suggestion)}`, margin, yOffset, maxLineWidth);
            yOffset += 5;

            yOffset = addTextWithWrapping(doc, `AI Alternative: ${item.gpt_alternative || 'N/A'}`, margin, yOffset, maxLineWidth);
            yOffset += 5;

            yOffset = addTextWithWrapping(doc, `Explanation: ${formatExplanationForPDF(item.explanation)}`, margin, yOffset, maxLineWidth);
            yOffset += 5;

            yOffset = addTextWithWrapping(doc, `AI Explanation: ${item.gpt_explanation || 'N/A'}`, margin, yOffset, maxLineWidth);
            yOffset += 10;
        });

        doc.save('bias_analysis_results.pdf');
    }

    function addTextWithWrapping(doc, text, x, y, maxWidth) {
        const textLines = doc.splitTextToSize(text, maxWidth);
        const lineHeight = doc.getTextDimensions('T').h * 1.15;
        let currentY = y;

        textLines.forEach(line => {
            if (currentY > doc.internal.pageSize.height - 20) {
                doc.addPage();
                currentY = 10;
            }
            doc.text(line, x, currentY);
            currentY += lineHeight;
        });

        return currentY;
    }

    function formatExplanationForPDF(explanation) {
        if (typeof explanation === 'string') {
            return explanation;
        } else if (typeof explanation === 'object' && explanation !== null) {
            return Object.entries(explanation)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        } else {
            return 'No explanation available';
        }
    }

    function formatSuggestion(suggestion) {
        if (typeof suggestion === 'string') {
            return suggestion;
        } else if (typeof suggestion === 'object' && suggestion !== null) {
            return `${suggestion.alternative} (Severity: ${suggestion.severity})`;
        } else {
            return 'No suggestion available';
        }
    }

    function displayAnalysisHistory() {
        const historyList = document.getElementById('history-list');
        const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses')) || [];
        
        historyList.innerHTML = '';
        savedAnalyses.forEach((analysis, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h3>${analysis.name}</h3>
                <p>Timestamp: ${new Date(analysis.timestamp).toLocaleString()}</p>
                <div class="history-buttons">
                    <button class="reanalyze-btn" data-index="${index}">Reanalyze</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });

        // Add event listeners for reanalyze buttons
        document.querySelectorAll('.reanalyze-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const analysisToReanalyze = savedAnalyses[index];
                document.getElementById('input-text').value = analysisToReanalyze.data.text;
                document.getElementById('analyze-btn').click();
            });
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                savedAnalyses.splice(index, 1);
                localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
                displayAnalysisHistory();
            });
        });
    }

    function saveAnalysis(name, data) {
        let savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses')) || [];
        savedAnalyses.unshift({  // Changed from push to unshift
            name: name,
            data: data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
        displayAnalysisHistory();
    }

    document.getElementById('save-analysis-btn').addEventListener('click', function() {
        const analysisName = document.getElementById('analysis-name').value.trim() || 'Unnamed Analysis';
        if (analysisData) {
            saveAnalysis(analysisName, analysisData);
            document.getElementById('analysis-name').value = '';
            displayAnalysisHistory(); // Refresh the history display
        } else {
            alert('Please perform an analysis first.');
        }
    });
});
