export function init(rootId = "slidingWindowDemo") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const container = document.createElement("div");
  container.className = "sw-demo-container";

  const controls = document.createElement("div");
  controls.className = "sw-demo-controls";

  const windowSizeGroup = document.createElement("div");
  windowSizeGroup.className = "sw-control-group";
  windowSizeGroup.style.gap = "10px";

  const windowSizeLabel = document.createElement("label");
  windowSizeLabel.textContent = "sliding window";
  windowSizeLabel.htmlFor = "swWindowSize";
  windowSizeLabel.style.textAlign = "center";

  const windowSizeSlider = document.createElement("input");
  windowSizeSlider.type = "range";
  windowSizeSlider.id = "swWindowSize";
  windowSizeSlider.min = "3";
  windowSizeSlider.max = "9";
  windowSizeSlider.value = "6";
  windowSizeSlider.className = "sw-window-slider";

  const windowSizeDisplay = document.createElement("span");
  windowSizeDisplay.className = "sw-size-display";
  windowSizeDisplay.textContent = "6 bytes";

  const stepGroup = document.createElement("div");
  stepGroup.className = "sw-control-group";

  const leftButton = document.createElement("button");
  leftButton.textContent = "←";
  leftButton.className = "sw-step-button";
  leftButton.disabled = true;

  const rightButton = document.createElement("button");
  rightButton.textContent = "→";
  rightButton.className = "sw-step-button";

  const positionDisplay = document.createElement("span");
  positionDisplay.className = "sw-position-display";
  positionDisplay.textContent = "Step 0";

  stepGroup.append(leftButton, positionDisplay, rightButton);

  windowSizeGroup.append(windowSizeLabel, windowSizeSlider, windowSizeDisplay);
  controls.append(windowSizeGroup, stepGroup);

  const vizContainer = document.createElement("div");
  vizContainer.className = "sw-viz-container";

  const inputLabel = document.createElement("h4");
  inputLabel.textContent = "Input";
  inputLabel.className = "sw-label";

  const textContainer = document.createElement("div");
  textContainer.className = "sw-text-container";

  const textDisplay = document.createElement("div");
  textDisplay.className = "sw-text-display";

  textContainer.append(textDisplay);

  const compressedLabel = document.createElement("h4");
  compressedLabel.textContent = "Compressed";
  compressedLabel.className = "sw-label";

  const outputDisplay = document.createElement("div");
  outputDisplay.className = "sw-output-display";

  vizContainer.append(inputLabel, textContainer, compressedLabel, outputDisplay);

  container.append(controls, vizContainer);
  root.append(container);

  let currentPosition = 0;
  let windowSize = 6;
  const text = "abc123123abc123";
  let compressionSteps = [];

  function computeAllSteps() {
    compressionSteps = [];
    let pos = 0;

    while (pos < text.length) {
      const match = findMatchAtPosition(pos);
      if (match) {
        compressionSteps.push({ type: "match", length: match.length, distance: match.distance, startPos: pos });
        pos += match.length;
      } else {
        compressionSteps.push({ type: "literal", char: text[pos], startPos: pos });
        pos++;
      }
    }
  }

  function getCurrentStepIndex() {
    for (let i = 0; i < compressionSteps.length; i++) {
      const step = compressionSteps[i];
      if (step.startPos === currentPosition) {
        return i;
      }
    }
    return -1;
  }

  function renderTextWithHighlights() {
    while (textDisplay.firstChild) {
      textDisplay.removeChild(textDisplay.firstChild);
    }

    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      span.textContent = text[i];
      span.className = "sw-char";

      if (i >= Math.max(0, currentPosition - windowSize) && i < currentPosition) {
        span.classList.add("sw-window-char");
        if (i === Math.max(0, currentPosition - windowSize)) {
          span.classList.add("sw-window-first");
        }
        if (i === currentPosition - 1) {
          span.classList.add("sw-window-last");
        }
      }

      const match = getCurrentStep();
      if (match && i >= currentPosition && i < currentPosition + match.length) {
        if (match.length > 1) {
          span.classList.add("sw-next-char-multi");
        } else {
          span.classList.add("sw-next-char");
        }
      } else if (!match && i === currentPosition) {
        span.classList.add("sw-next-char");
      }

      if (match && i >= currentPosition - match.distance && i < currentPosition - match.distance + match.length) {
        span.classList.add("sw-reference-char");
      }

      textDisplay.append(span);
    }
  }

  function findMatchAtPosition(pos) {
    if (pos >= text.length) return null;

    let bestLength = 0;
    let bestDistance = 0;

    for (let distance = 1; distance <= Math.min(windowSize, pos); distance++) {
      const startPos = pos - distance;
      if (startPos < 0) break;

      let length = 0;
      while (pos + length < text.length && text[pos + length] === text[startPos + length]) {
        length++;
      }

      if (length > bestLength) {
        bestLength = length;
        bestDistance = distance;
      }
    }

    return bestLength > 2 ? { length: bestLength, distance: bestDistance } : null;
  }

  function getCurrentStep() {
    if (currentPosition >= text.length) return null;
    return findMatchAtPosition(currentPosition);
  }

  function updateOutput() {
    const completeOutput = [];
    let pos = 0;

    while (pos < text.length) {
      const match = findMatchAtPosition(pos);
      if (match) {
        completeOutput.push(`(l=${match.length},d=${match.distance})`);
        pos += match.length;
      } else {
        completeOutput.push(text[pos]);
        pos++;
      }
    }

    while (outputDisplay.firstChild) {
      outputDisplay.removeChild(outputDisplay.firstChild);
    }

    pos = 0;
    let outputIndex = 0;
    let highlighted = false;

    while (pos < text.length) {
      const match = findMatchAtPosition(pos);
      const span = document.createElement("span");
      span.className = "sw-output-item";

      if (match) {
        span.textContent = `(l=${match.length},d=${match.distance})`;
        pos += match.length;
      } else {
        span.textContent = text[pos];
        pos++;
      }

      if (pos > currentPosition && !highlighted) {
        const currentMatch = findMatchAtPosition(currentPosition);
        if (currentMatch && currentMatch.length > 1) {
          span.classList.add("sw-current-output-multi");
        } else {
          span.classList.add("sw-current-output");
        }
        highlighted = true;
      }

      outputDisplay.append(span);
      outputIndex++;
    }
  }

  function updateControls() {
    const currentStepIndex = getCurrentStepIndex();
    leftButton.disabled = currentStepIndex <= 0;
    rightButton.disabled = currentStepIndex >= compressionSteps.length - 1;
    positionDisplay.textContent = `Step ${currentStepIndex >= 0 ? currentStepIndex : 0}`;
  }

  function stepRight() {
    const currentStepIndex = getCurrentStepIndex();
    if (currentStepIndex >= 0 && currentStepIndex < compressionSteps.length - 1) {
      const nextStep = compressionSteps[currentStepIndex + 1];
      currentPosition = nextStep.startPos;
      renderTextWithHighlights();
      updateOutput();
      updateControls();
    }
  }

  function stepLeft() {
    const currentStepIndex = getCurrentStepIndex();
    if (currentStepIndex > 0) {
      const prevStep = compressionSteps[currentStepIndex - 1];
      currentPosition = prevStep.startPos;
      renderTextWithHighlights();
      updateOutput();
      updateControls();
    }
  }

  windowSizeSlider.addEventListener("input", function () {
    windowSize = parseInt(this.value);
    windowSizeDisplay.textContent = windowSize + " bytes";
    currentPosition = 0;
    computeAllSteps();
    renderTextWithHighlights();
    updateOutput();
    updateControls();
  });

  leftButton.addEventListener("click", stepLeft);
  rightButton.addEventListener("click", stepRight);

  computeAllSteps();
  renderTextWithHighlights();
  updateOutput();
  updateControls();
}
