document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 0;
    let tutorialSteps = [];

    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const prevButton = document.getElementById('tutorial-prev-btn');
    const nextButton = document.getElementById('tutorial-next-btn');
    const skipButton = document.getElementById('tutorial-skip-btn');
    const stepTitle = document.getElementById('tutorial-step-title');
    const stepDescription = document.getElementById('tutorial-step-description');
    const finishButton = document.getElementById('tutorial-finish-btn');

    function initTutorial() {
        fetchTutorialData();
    }

    function fetchTutorialData() {
        fetch('/tutorial/tutorial_steps.json')
            .then(response => response.json())
            .then(data => {
                tutorialSteps = data.steps;
                console.log("Tutorial steps loaded:", tutorialSteps);
                updateTutorialContent();
            })
            .catch(error => console.error("Error loading tutorial steps:", error));
    }

    function updateTutorialContent() {
        console.log("Updating content for step:", currentStep);
        if (tutorialSteps[currentStep]) {
            stepTitle.textContent = tutorialSteps[currentStep].title;
            stepDescription.textContent = tutorialSteps[currentStep].content;
        } else {
            console.error("No content for step:", currentStep);
        }
        updateButtonStates();
        updateButtonVisibility();
    }

    function updateButtonStates() {
        if (prevButton) prevButton.disabled = currentStep === 0;
        if (nextButton) {
            nextButton.disabled = currentStep === tutorialSteps.length - 1;
            nextButton.textContent = currentStep === tutorialSteps.length - 1 ? "Finish" : "Next";
        }
    }

    function updateButtonVisibility() {
        if (currentStep === tutorialSteps.length - 1) {
            nextButton.style.display = 'none';
            finishButton.style.display = 'inline-block';
        } else {
            nextButton.style.display = 'inline-block';
            finishButton.style.display = 'none';
        }
    }

    function endTutorial() {
        console.log("Ending tutorial");
        if (tutorialOverlay) {
            tutorialOverlay.classList.add('tutorial-hidden');
            currentStep = 0;
        } else {
            console.error("Tutorial overlay not found");
        }
    }

    function handlePreviousClick() {
        console.log("Handle Previous Click, current step:", currentStep);
        if (currentStep > 0) {
            currentStep--;
            updateTutorialContent();
        } else {
            console.log("Already at the first step");
        }
    }

    // Event Listeners
    if (prevButton) {
        prevButton.addEventListener('click', handlePreviousClick);
    } else {
        console.error("Previous button not found in the DOM");
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log("Next button clicked");
            if (currentStep < tutorialSteps.length - 1) {
                currentStep++;
                updateTutorialContent();
            }
        });
    } else {
        console.error("Next button not found");
    }

    if (skipButton) {
        skipButton.addEventListener('click', endTutorial);
    }

    if (finishButton) {
        finishButton.addEventListener('click', () => {
            console.log("Finish button clicked");
            endTutorial();
        });
    } else {
        console.error("Finish button not found");
    }

    // Initialize tutorial on page load
    initTutorial();
});
