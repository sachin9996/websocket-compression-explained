import * as pako from "pako";

export function init(rootId = "compressionDemo") {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`Element with id '${rootId}' not found`);

  while (root.firstChild) root.removeChild(root.firstChild);

  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "20px";
  root.style.alignItems = "center";
  root.style.maxWidth = "850px";
  root.style.margin = "2em auto";
  root.style.padding = "25px";
  root.style.border = "1px solid #334155";
  root.style.borderRadius = "8px";
  root.style.background = "rgba(15, 23, 42, 0.6)";
  root.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
  root.style.userSelect = "none";

  const controls = document.createElement("div");
  controls.className = "compression-controls";
  controls.style.userSelect = "none";

  let patternType = "text";
  let messageSizeBits = 9;
  let swBits = 9;
  let currentRequestId = 0;

  const sw = document.createElement("div");
  sw.className = "control-group";
  sw.style.userSelect = "none";

  const swLabel = document.createElement("label");
  swLabel.textContent = "SW len";
  swLabel.htmlFor = "windowSize";
  swLabel.style.userSelect = "none";

  const swSlider = document.createElement("input");
  swSlider.type = "range";
  swSlider.id = "windowSize";
  swSlider.min = "9";
  swSlider.max = "15";
  swSlider.value = swBits.toString();
  swSlider.className = "slider";
  swSlider.style.userSelect = "none";

  const swValue = document.createElement("span");
  swValue.textContent = String(1 << parseInt(swSlider.value));
  swValue.className = "value-display";
  swValue.style.userSelect = "none";

  sw.append(swLabel);
  sw.append(swSlider);
  sw.append(swValue);

  const patternControl = document.createElement("div");
  patternControl.className = "control-group";
  patternControl.style.userSelect = "none";

  const patternLabel = document.createElement("label");
  patternLabel.textContent = "Pattern";
  patternLabel.htmlFor = "patternType";
  patternLabel.style.userSelect = "none";

  const patternSelect = document.createElement("select");
  patternSelect.id = "patternType";
  patternSelect.className = "pattern-select";
  patternSelect.style.userSelect = "none";

  const patterns = [
    {
      value: "random",
      label: "Random bytes (different)",
      description: "Generates completely random bytes for each message.",
    },
    {
      value: "random_repeating",
      label: "Random bytes (same)",
      description: "Uses the same random bytes for all messages.",
    },
    {
      value: "text",
      label: "Repeated text",
      description: 'Repeats "The quick brown fox jumps over the lazy dog." a bunch of times.',
    },
    {
      value: "increasing",
      label: "Increasing numbers",
      description: "Comma-separated increasing numbers.",
    },
    {
      value: "progressive_growth",
      label: "Progressive growth",
      description: "Repeating chunks of random data at different sizes (100, 200, 400, 800 and 1600 bytes)",
    },
    {
      value: "json",
      label: "JSON",
      description: "Simulates JSON data with nested objects and arrays.",
    },
  ];

  patterns.forEach((pattern) => {
    const option = document.createElement("option");
    option.value = pattern.value;
    option.textContent = pattern.label;
    if (pattern.value === patternType) {
      option.selected = true;
    }
    patternSelect.append(option);
  });

  patternControl.append(patternSelect);

  const msgLen = document.createElement("div");
  msgLen.className = "control-group";
  msgLen.style.userSelect = "none";

  const msgLenLabel = document.createElement("label");
  msgLenLabel.textContent = "msg len: ";
  msgLenLabel.htmlFor = "messageSize";
  msgLenLabel.style.userSelect = "none";

  const msgLenSlider = document.createElement("input");
  msgLenSlider.type = "range";
  msgLenSlider.id = "messageSize";
  msgLenSlider.min = "9";
  msgLenSlider.max = "15";
  msgLenSlider.value = messageSizeBits.toString();
  msgLenSlider.className = "slider";
  msgLenSlider.style.userSelect = "none";

  const msgLenValue = document.createElement("span");
  msgLenValue.textContent = String(1 << parseInt(msgLenSlider.value));
  msgLenValue.className = "value-display";
  msgLenValue.style.userSelect = "none";

  msgLen.append(msgLenLabel);
  msgLen.append(msgLenSlider);
  msgLen.append(msgLenValue);

  controls.append(patternControl);
  controls.append(msgLen);
  controls.append(sw);

  const patternDescription = document.createElement("div");
  patternDescription.id = "patternDescription";
  patternDescription.style.fontSize = "11px";
  patternDescription.style.color = "#777777";
  patternDescription.style.userSelect = "none";
  controls.append(patternDescription);

  const viz = document.createElement("div");
  viz.className = "visualization";
  viz.style.userSelect = "none";

  const dataContainer = document.createElement("div");
  dataContainer.className = "data-container";
  dataContainer.style.userSelect = "none";

  const dataLabel = document.createElement("h3");
  dataLabel.textContent = "Original";
  dataLabel.style.userSelect = "none";
  dataContainer.append(dataLabel);

  const dataStream = document.createElement("div");
  dataStream.className = "data-stream";
  dataContainer.append(dataStream);

  const compressedContainer = document.createElement("div");
  compressedContainer.className = "compressed-container";
  compressedContainer.style.userSelect = "none";

  const compressedLabel = document.createElement("h3");
  compressedLabel.textContent = "Compressed";
  compressedLabel.style.userSelect = "none";
  compressedLabel.style.marginTop = "20px";
  compressedContainer.append(compressedLabel);

  const compressedStream = document.createElement("div");
  compressedStream.className = "compressed-stream";
  compressedContainer.append(compressedStream);

  const statsWrapper = document.createElement("div");
  statsWrapper.className = "stats-wrapper";
  statsWrapper.style.userSelect = "none";

  const statsTitle = document.createElement("h3");
  statsTitle.textContent = "Overall";
  statsTitle.className = "stats-title";
  statsTitle.style.userSelect = "none";

  const statsContainer = document.createElement("div");
  statsContainer.className = "stats-container";
  statsContainer.style.fontFamily = "monospace";
  statsContainer.style.userSelect = "none";

  const ratioDiv = document.createElement("div");
  ratioDiv.className = "stat";
  ratioDiv.style.userSelect = "none";

  const ratioLabel = document.createElement("strong");
  ratioLabel.textContent = "Compression Ratio: ";
  ratioLabel.style.userSelect = "none";

  const ratioValue = document.createElement("span");
  ratioValue.id = "compressionRatio";
  ratioValue.textContent = "0%";
  ratioValue.style.userSelect = "none";

  ratioDiv.append(ratioLabel);
  ratioDiv.append(ratioValue);

  const origDiv = document.createElement("div");
  origDiv.className = "stat";
  origDiv.style.userSelect = "none";

  const origLabel = document.createElement("strong");
  origLabel.textContent = "Original Size: ";
  origLabel.style.userSelect = "none";

  const origValue = document.createElement("span");
  origValue.id = "originalSize";
  origValue.textContent = "0 bytes";
  origValue.style.userSelect = "none";

  origDiv.append(origLabel);
  origDiv.append(origValue);

  const compDiv = document.createElement("div");
  compDiv.className = "stat";
  compDiv.style.userSelect = "none";

  const compLabel = document.createElement("strong");
  compLabel.textContent = "Compressed Size: ";
  compLabel.style.userSelect = "none";

  const compValue = document.createElement("span");
  compValue.id = "compressedSize";
  compValue.textContent = "0 bytes";
  compValue.style.userSelect = "none";

  compDiv.append(compLabel);
  compDiv.append(compValue);

  const saveDiv = document.createElement("div");
  saveDiv.className = "stat";
  saveDiv.style.userSelect = "none";

  const saveLabel = document.createElement("strong");
  saveLabel.textContent = "Bytes Saved: ";
  saveLabel.style.userSelect = "none";

  const saveValue = document.createElement("span");
  saveValue.id = "savings";
  saveValue.textContent = "0 bytes";
  saveValue.style.userSelect = "none";

  saveDiv.append(saveLabel);
  saveDiv.append(saveValue);

  statsContainer.append(origDiv);
  statsContainer.append(compDiv);
  statsContainer.append(ratioDiv);

  statsWrapper.append(statsTitle);
  statsWrapper.append(statsContainer);

  const observationsWrapper = document.createElement("div");
  observationsWrapper.style.marginTop = "20px";
  observationsWrapper.style.userSelect = "none";

  const observationsContent = document.createElement("div");
  observationsContent.id = "observationsContent";
  observationsContent.style.fontSize = "11px";
  observationsContent.style.lineHeight = "1.4";
  observationsContent.style.color = "#777777";
  observationsContent.style.userSelect = "none";

  observationsWrapper.append(observationsContent);

  viz.append(dataContainer);
  viz.append(compressedContainer);
  viz.append(statsWrapper);
  viz.append(observationsWrapper);
  root.append(controls);
  root.append(viz);

  function updateVisualization() {
    const requestId = ++currentRequestId;

    const description = document.getElementById("patternDescription");
    const pattern = patterns.find((p) => p.value === patternType);
    description.textContent = pattern ? pattern.description : "";

    const observationsContent = document.getElementById("observationsContent");

    while (observationsContent.firstChild) {
      observationsContent.removeChild(observationsContent.firstChild);
    }

    switch (patternType) {
      case "text":
        const textStart = document.createTextNode(
          "As you might expect, text with repeated phrases compresses well. What you might not expect is that the compression doesn't get better with a bigger sliding window. See "
        );
        observationsContent.append(textStart);

        const link = document.createElement("a");
        link.href = "#footnote";
        link.textContent = "this note";
        link.className = "link-text";
        observationsContent.append(link);

        const textEnd = document.createTextNode(".");
        observationsContent.append(textEnd);
        break;

      case "random":
        const randomText = document.createTextNode(
          "Random data compresses poorly because there are no patterns for the sliding window to capture and reuse."
        );
        observationsContent.append(randomText);
        break;

      case "random_repeating":
        const randomRepeatingText = document.createTextNode(
          "Even random data compresses when it repeats (and the sliding window is big enough)."
        );
        observationsContent.append(randomRepeatingText);
        break;

      case "increasing":
        const increasingTextStart = document.createTextNode("Bigger sliding windows can lead to ");
        observationsContent.append(increasingTextStart);

        const italic = document.createElement("em");
        italic.textContent = "worse";
        observationsContent.append(italic);

        const increasingTextEnd = document.createTextNode(
          " compression? It turns out that DEFLATE doesn't always pick the best match in the sliding window, but uses a heuristic that can hurt compression sometimes."
        );
        observationsContent.append(increasingTextEnd);
        break;

      case "progressive_growth":
        const progressiveText = document.createTextNode(
          "Larger chunks of data can fit into larger sliding windows, leading to better compression."
        );
        observationsContent.append(progressiveText);
        break;

      case "json":
        const jsonText = document.createTextNode(
          "JSON compresses well due to similar patterns across objects. It also helps that these all have mostly identical schemas."
        );
        observationsContent.append(jsonText);
        break;

      default:
        throw new Error(`Unknown pattern ${patternType}`);
    }

    const messages = generateMessages(patternType, messageSizeBits, 5);
    const result = compressAndDecompress(messages, swBits);

    if (requestId !== currentRequestId) {
      return;
    }

    while (dataStream.firstChild) dataStream.removeChild(dataStream.firstChild);

    messages.forEach((message, index) => {
      const hexData = stringToHex(message);
      let displayHex = "";

      const screenWidth = window.innerWidth;
      let maxBytes, startBytes, endBytes;

      if (screenWidth <= 480) {
        maxBytes = 6;
        startBytes = 3;
        endBytes = 3;
      } else if (screenWidth <= 768) {
        maxBytes = 12;
        startBytes = 6;
        endBytes = 6;
      } else {
        maxBytes = 20;
        startBytes = 10;
        endBytes = 10;
      }

      if (hexData.length > maxBytes) {
        displayHex = `${hexData.slice(0, startBytes).join(" ")} ... ${hexData.slice(-endBytes).join(" ")}`;
      } else {
        displayHex = hexData.join(" ");
      }

      const hexContainer = document.createElement("div");
      hexContainer.style.fontFamily = "monospace";
      hexContainer.style.fontSize = "11px";
      hexContainer.style.wordBreak = "break-all";
      hexContainer.style.color = "#dddddd";
      hexContainer.style.padding = "8px";
      hexContainer.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      hexContainer.style.borderRadius = "4px";
      hexContainer.textContent = displayHex;
      hexContainer.style.cursor = "pointer";
      hexContainer.style.transition = "background-color 0.2s ease";
      hexContainer.style.whiteSpace = patternType === "text" ? "pre" : "";

      let tooltipText = "";
      if (message.length > 3 * maxBytes - 2) {
        const array = message.split("");
        const prefix = array
          .slice(0, (3 * maxBytes) / 2 - 1)
          .join("")
          .replace(/[\x00-\x1F\x80-\x9F]/g, "�")
          .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, "�");

        const suffix = array
          .slice(-((3 * maxBytes) / 2 - 1))
          .join("")
          .replace(/[\x00-\x1F\x80-\x9F]/g, "�")
          .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");

        tooltipText = `${prefix} ... ${suffix}`;
      } else {
        tooltipText = message;
      }

      hexContainer.addEventListener("mouseenter", function (event) {
        const element = event.currentTarget;
        element.style.backgroundColor = "rgb(2, 61, 83, 0.5)";
        const compressedMessage = document.getElementById(`compressedMessage${index}`);
        if (compressedMessage) {
          compressedMessage.style.backgroundColor = "rgb(2, 61, 83, 0.5)";
          compressedMessage.style.fontWeight = "bold";
        }

        element.textContent = tooltipText;
        element.style.fontWeight = "bold";
      });

      hexContainer.addEventListener("mouseleave", function (event) {
        const element = event.currentTarget;
        element.style.backgroundColor = "rgba(255, 255, 255, 0.05)";

        const compressedMessage = document.getElementById(`compressedMessage${index}`);
        if (compressedMessage) {
          compressedMessage.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          compressedMessage.style.fontWeight = "";
        }

        element.textContent = displayHex;
        element.style.fontWeight = "";
      });

      const messageContainer = document.createElement("div");
      messageContainer.style.display = "flex";
      messageContainer.style.alignItems = "center";
      messageContainer.style.gap = "10px";
      messageContainer.style.userSelect = "none";

      const lengthSpan = document.createElement("span");
      lengthSpan.textContent = `${message.length} bytes`;
      lengthSpan.style.fontSize = "11px";
      lengthSpan.style.color = "#94a3b8";
      lengthSpan.style.fontFamily = "monospace";
      lengthSpan.style.minWidth = "60px";
      lengthSpan.style.userSelect = "none";

      messageContainer.append(hexContainer, lengthSpan);
      dataStream.append(messageContainer);
    });

    while (compressedStream.firstChild) compressedStream.removeChild(compressedStream.firstChild);

    result.forEach((result, index) => {
      const statsDiv = document.createElement("div");
      statsDiv.style.fontSize = "12px";
      statsDiv.style.padding = "8px";
      statsDiv.style.background = "rgba(255, 255, 255, 0.05)";
      statsDiv.style.borderRadius = "4px";
      statsDiv.style.fontFamily = "monospace";
      statsDiv.style.textAlign = "center";
      statsDiv.style.userSelect = "none";
      statsDiv.className = `compressed-message-${index}`;
      statsDiv.id = `compressedMessage${index}`;

      const bytesSaved = result.originalSize - result.compressedSize;
      const overhead = result.time || 0;

      const comparisonSpan = document.createElement("span");
      comparisonSpan.textContent = `${result.originalSize.toString().padStart(4)} -> ${result.compressedSize
        .toString()
        .padStart(4)} bytes`;
      comparisonSpan.style.marginRight = "2px";
      comparisonSpan.style.color = "#dddddd";
      comparisonSpan.style.userSelect = "none";
      statsDiv.append(comparisonSpan);

      const reduction = (bytesSaved * 100) / result.originalSize;
      const reductionSpan = document.createElement("span");
      reductionSpan.textContent = `(${Math.abs(reduction.toFixed(2))}% ${bytesSaved > 0 ? "decrease" : "increase"})`;
      reductionSpan.style.color = bytesSaved > 0 ? "#059669" : "#dc2626";
      reductionSpan.style.marginRight = "10px";
      reductionSpan.style.userSelect = "none";
      statsDiv.append(reductionSpan);

      const timeSpan = document.createElement("span");
      timeSpan.textContent = `overhead: ${overhead.toFixed(2)}ms`;
      timeSpan.style.color = "#dddddd";
      timeSpan.style.userSelect = "none";
      statsDiv.append(timeSpan);

      compressedStream.append(statsDiv);
    });

    const totalOriginal = result.reduce((sum, result) => sum + result.originalSize, 0);
    const totalCompressed = result.reduce((sum, result) => sum + result.compressedSize, 0);
    const overallRatio = totalOriginal > 0 ? ((1 - totalCompressed / totalOriginal) * 100).toFixed(1) : "0.0";
    const isCompressionWorse = totalCompressed > totalOriginal;

    document.getElementById("originalSize").textContent = totalOriginal.toString().padStart(4) + " bytes";
    document.getElementById("compressedSize").textContent = totalCompressed.toString().padStart(4) + " bytes";
    document.getElementById("compressionRatio").textContent = overallRatio.padStart(5) + "%";

    const compressedSizeElement = document.getElementById("compressedSize");
    const compressionRatioElement = document.getElementById("compressionRatio");

    if (isCompressionWorse) {
      compressedSizeElement.style.color = "#dc2626";
      compressionRatioElement.style.color = "#dc2626";
    } else {
      compressedSizeElement.style.color = "#059669";
      compressionRatioElement.style.color = "#059669";
    }
  }

  swSlider.addEventListener("input", function () {
    swBits = parseInt(this.value);
    swValue.textContent = 1 << swBits;
    updateVisualization();
  });

  msgLenSlider.addEventListener("input", function () {
    messageSizeBits = parseInt(this.value);
    msgLenValue.textContent = 1 << messageSizeBits;
    updateVisualization();
  });

  patternSelect.addEventListener("change", function () {
    patternType = this.value;

    if (patternType === "json" || patternType === "progressive_growth") {
      msgLen.style.display = "none";
    } else {
      msgLen.style.display = "flex";
    }

    updateVisualization();
  });

  updateVisualization();

  let currentBreakpoint = getCurrentBreakpoint();

  function getCurrentBreakpoint() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) return "mobile";
    if (screenWidth <= 768) return "tablet";
    return "desktop";
  }

  window.addEventListener("resize", () => {
    const newBreakpoint = getCurrentBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      currentBreakpoint = newBreakpoint;
      updateVisualization();
    }
  });

  if (patternType === "json" || patternType === "progressive_growth") {
    msgLen.style.display = "none";
  }
}

function generateMessages(pattern, sizeBits, count) {
  const result = [];
  switch (pattern) {
    case "random":
      for (let i = 0; i < count; i++) {
        result.push(
          Array.from({ length: 1 << sizeBits }, () => String.fromCharCode(Math.floor(Math.random() * 256))).join("")
        );
      }
      return result;

    case "random_repeating":
      const s = Array.from({ length: 1 << sizeBits }, () => String.fromCharCode(Math.floor(Math.random() * 256))).join(
        ""
      );

      for (let i = 0; i < count; i++) {
        result.push(s);
      }
      return result;

    case "text":
      const pangram = "The quick brown fox jumps over the lazy dog. ";
      let currIndex = 0;

      for (let i = 0; i < count; i++) {
        let currString = "";
        while (currString.length < 1 << sizeBits) {
          const need = (1 << sizeBits) - currString.length;
          const have = pangram.length - currIndex;

          if (have > need) {
            currString += pangram.slice(currIndex, currIndex + need);
            currIndex += need;
          } else {
            currString += pangram.slice(currIndex);
            currIndex = 0;
          }
        }

        result.push(currString);
      }

      return result;

    case "increasing":
      let startNumber = 1;
      for (let i = 0; i < count; i++) {
        let currString = "";
        let currentNumber = startNumber;

        while (currString.length < 1 << sizeBits) {
          const numberStr = currentNumber.toString();
          const remainingSpace = (1 << sizeBits) - currString.length;

          const needsComma = currString.length > 0;
          const commaLength = needsComma ? 1 : 0;

          if (numberStr.length + commaLength <= remainingSpace) {
            if (needsComma) {
              currString += ",";
            }
            currString += numberStr;
            currentNumber++;
          } else {
            currString += "0".repeat(remainingSpace);
            break;
          }
        }

        result.push(currString);
        startNumber = currentNumber;
      }
      return result;

    case "progressive_growth":
      for (let i = 0; i < count; i++) {
        const length = 100 * (1 << i);
        const chunk = Array.from({ length }, () => String.fromCharCode(Math.floor(Math.random() * 256))).join("");
        const message = chunk.repeat(Math.ceil(100000 / length));
        result.push(message.substring(0, 100000));
      }

      return result;

    case "json":
      const browsers = ["chrome", "firefox", "safari", "edge"];
      const platforms = ["windows", "macos", "linux", "android"];
      const themes = ["dark", "light", "auto"];
      const languages = ["en", "es", "fr", "de", "ja"];
      const actions = ["click", "hover", "drag", "scroll", "keypress", "select", "update"];
      const eventTypes = ["mouse", "keyboard", "touch", "gesture"];
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
      ];

      for (let i = 0; i < count; i++) {
        const records = [];
        const targetSize = 100000;
        let currentSize = 0;
        let numRecords = 0;

        while (currentSize < targetSize && numRecords < 200) {
          const record = {
            id: `record_${i}_${numRecords}_${Math.floor(Math.random() * 1000000)}`,
            timestamp: Date.now() + Math.floor(Math.random() * 86400000),
            type: Math.random() > 0.5 ? "interaction" : "system",
            version: "1.2." + Math.floor(Math.random() * 20),
            data: {
              coordinates: {
                x: Math.floor(Math.random() * 1920),
                y: Math.floor(Math.random() * 1080),
                screen: Math.floor(Math.random() * 2) + 1,
                scrollX: Math.floor(Math.random() * 1000),
                scrollY: Math.floor(Math.random() * 1000),
              },
              element: {
                id: "element_" + Math.floor(Math.random() * 1000),
                className:
                  "btn btn-" +
                  (Math.random() > 0.5 ? "primary" : "secondary") +
                  " " +
                  (Math.random() > 0.5 ? "active" : "inactive"),
                tagName: Math.random() > 0.5 ? "button" : "div",
                innerText: "Button " + Math.floor(Math.random() * 100),
                attributes: {
                  "data-testid": "test-" + Math.floor(Math.random() * 1000),
                  "aria-label": "Button " + Math.floor(Math.random() * 100),
                  role: Math.random() > 0.5 ? "button" : "link",
                },
              },
              action: actions[Math.floor(Math.random() * actions.length)],
              eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
              payload: {
                keyCode: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : null,
                button: Math.random() > 0.5 ? Math.floor(Math.random() * 3) : null,
                modifiers: {
                  ctrl: Math.random() > 0.5,
                  shift: Math.random() > 0.5,
                  alt: Math.random() > 0.5,
                  meta: Math.random() > 0.5,
                },
                pressure: Math.random(),
                tiltX: Math.random() * 2 - 1,
                tiltY: Math.random() * 2 - 1,
              },
              performance: {
                loadTime: Math.random() * 1000,
                renderTime: Math.random() * 500,
                memoryUsage: Math.floor(Math.random() * 1000000),
                cpuUsage: Math.random() * 100,
              },
            },
            context: {
              sessionId: "session_" + Math.floor(Math.random() * 1000000),
              userId: "user_" + Math.floor(Math.random() * 100000),
              pageId: "page_" + Math.floor(Math.random() * 10000),
              requestId: "req_" + Math.floor(Math.random() * 1000000),
              clientInfo: {
                browser: browsers[Math.floor(Math.random() * browsers.length)],
                version: "1.2." + Math.floor(Math.random() * 100),
                platform: platforms[Math.floor(Math.random() * platforms.length)],
                userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
                screenResolution: `${1920 + Math.floor(Math.random() * 1000)}x${
                  1080 + Math.floor(Math.random() * 1000)
                }`,
                colorDepth: Math.random() > 0.5 ? 24 : 32,
                pixelRatio: Math.random() > 0.5 ? 1 : 2,
                timezone: "UTC" + (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 12),
                language: languages[Math.floor(Math.random() * languages.length)],
                cookiesEnabled: Math.random() > 0.5,
                localStorage: Math.random() > 0.5,
                sessionStorage: Math.random() > 0.5,
              },
              preferences: {
                theme: themes[Math.floor(Math.random() * themes.length)],
                language: languages[Math.floor(Math.random() * languages.length)],
                timezone: "UTC" + (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 12),
                notifications: Math.random() > 0.5,
                autoSave: Math.random() > 0.5,
                accessibility: {
                  highContrast: Math.random() > 0.5,
                  reducedMotion: Math.random() > 0.5,
                  screenReader: Math.random() > 0.5,
                },
              },
              network: {
                connectionType: Math.random() > 0.5 ? "wifi" : "cellular",
                effectiveType: ["slow-2g", "2g", "3g", "4g"][Math.floor(Math.random() * 4)],
                downlink: Math.random() * 100,
                rtt: Math.random() * 100,
              },
            },
            metadata: {
              source: Math.random() > 0.5 ? "client" : "server",
              priority: Math.random() > 0.5 ? "high" : "normal",
              category: Math.random() > 0.5 ? "user" : "system",
              tags: ["web", "interaction", "analytics", "performance", "accessibility"],
              version: "2.1." + Math.floor(Math.random() * 10),
              buildNumber: Math.floor(Math.random() * 1000),
              environment: Math.random() > 0.5 ? "production" : "development",
              deploymentId: "deploy_" + Math.floor(Math.random() * 1000000),
            },
            analytics: {
              pageViews: Math.floor(Math.random() * 1000),
              sessionDuration: Math.floor(Math.random() * 3600),
              bounceRate: Math.random(),
              conversionRate: Math.random(),
              userEngagement: {
                clicks: Math.floor(Math.random() * 100),
                scrolls: Math.floor(Math.random() * 500),
                timeOnPage: Math.floor(Math.random() * 300),
              },
            },
          };

          const recordSize = JSON.stringify(record).length;
          currentSize += recordSize;
          records.push(record);
          numRecords++;
        }

        const jsonData = {
          messageId: Math.floor(Math.random() * 1000000),
          timestamp: Date.now() + Math.floor(Math.random() * 1000),
          type: Math.random() > 0.5 ? "batch_interaction" : "system_update",
          version: "1.2." + Math.floor(Math.random() * 20),
          batchSize: records.length,
          records: records,
          summary: {
            totalRecords: records.length,
            averageLoadTime: records.reduce((sum, r) => sum + r.data.performance.loadTime, 0) / records.length,
            totalMemoryUsage: records.reduce((sum, r) => sum + r.data.performance.memoryUsage, 0),
            uniqueUsers: new Set(records.map((r) => r.context.userId)).size,
            uniqueSessions: new Set(records.map((r) => r.context.sessionId)).size,
          },
        };

        result.push(JSON.stringify(jsonData));
      }

      return result;

    default:
      throw new Error(`Unexpected pattern ${pattern}`);
  }
}

function stringToHex(str) {
  return Array.from(new TextEncoder().encode(str)).map((byte) => byte.toString(16).padStart(2, "0"));
}

function compressAndDecompress(messages, swBits) {
  const deflater = new pako.Deflate({
    windowBits: swBits,
    raw: true,
  });

  const inflater = new pako.Inflate({
    chunkSize: 512,
    windowBits: swBits,
    raw: true,
  });

  const result = [];

  for (const msg of messages) {
    const startTime = performance.now();

    deflater.push(msg, pako.constants.Z_SYNC_FLUSH);
    const compressed = concatUint8Arrays(deflater.chunks);

    inflater.push(compressed);
    const decompressed = concatUint8Arrays(inflater.chunks);

    const endTime = performance.now();
    const time = endTime - startTime;

    result.push({
      originalSize: msg.length,
      compressedSize: compressed.length,
      time,
    });

    deflater.chunks = [];
    inflater.chunks = [];
  }

  return result;
}

function concatUint8Arrays(uint8Arrays) {
  const totalLength = uint8Arrays.reduce((sum, c) => sum + c.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of uint8Arrays) {
    combined.set(arr, offset);
    offset += arr.length;
  }

  return combined;
}
