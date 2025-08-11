const colors = ["#0891b2", "#ea580c", "#d6ad09", "#c756c3"];

export function init(rootId = "whiteboardDemo") {
  const root = document.getElementById(rootId);
  if (!root) {
    console.error(`No element found with ID ${rootId}`);
    return;
  }

  root.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const colorPicker = document.createElement("div");
  colorPicker.className = "color-picker";

  let currentColor = colors[0];

  colors.forEach((color) => {
    const circle = document.createElement("div");
    circle.className = "color-circle";
    circle.dataset.color = color;
    circle.title = color;
    circle.style.backgroundColor = color;
    circle.addEventListener("click", () => {
      currentColor = color;
      colorPicker.querySelectorAll(".color-circle").forEach((c) => {
        c.classList.toggle("selected", c === circle);
      });
      updateHoverColor();
    });
    colorPicker.append(circle);
  });
  colorPicker.querySelector(".color-circle").classList.add("selected");

  toolbar.append(colorPicker);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.className = "reset-button";
  toolbar.append(resetBtn);

  root.append(toolbar);

  const gridContainer = document.createElement("div");
  gridContainer.className = "grid-container";

  const gridLeft = document.createElement("div");
  const gridRight = document.createElement("div");
  gridLeft.className = "whiteboard-grid";
  gridRight.className = "whiteboard-grid";

  const gridSize = 3;
  const cellsLeft = [];
  const cellsRight = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellLeft = document.createElement("div");
      const cellRight = document.createElement("div");

      cellLeft.className = "grid-cell";
      cellRight.className = "grid-cell";

      cellLeft.dataset.row = row;
      cellLeft.dataset.col = col;
      cellRight.dataset.row = row;
      cellRight.dataset.col = col;

      cellsLeft.push(cellLeft);
      cellsRight.push(cellRight);

      gridLeft.append(cellLeft);
      gridRight.append(cellRight);
    }
  }

  gridContainer.append(gridLeft);
  gridContainer.append(gridRight);
  root.append(gridContainer);
  addHoverEffects();

  const logContainer = document.createElement("div");
  logContainer.className = "log-container";

  const logLeft = document.createElement("pre");
  logLeft.className = "log-box";
  logLeft.textContent = "Messages appear here";
  logLeft.style.color = "#888888";
  logLeft.style.textAlign = "center";
  logLeft.style.overflowWrap = "break-word";

  const logRight = document.createElement("pre");
  logRight.className = "log-box";
  logRight.textContent = "Messages appear here";
  logRight.style.color = "#888888";
  logRight.style.textAlign = "center";
  logRight.style.overflowWrap = "break-word";

  logContainer.append(logLeft);
  logContainer.append(logRight);
  root.append(logContainer);

  const note = document.createElement("p");
  note.style.fontSize = "11px";
  note.style.color = "#77777790";
  note.style.marginTop = "0";
  const noteText = document.createTextNode("Note: This isn't ");
  const emphasis = document.createElement("em");
  emphasis.textContent = "actually";
  const noteText2 = document.createTextNode(
    " using WebSockets to communicate between the two grids, it's just a simulation. I wanted to keep everything self-contained in your browser, but you can't create a WebSocket server in the browser."
  );
  note.append(noteText, emphasis, noteText2);
  root.append(note);

  const drawnSquares = [];

  function getCellByPosition(row, col, side) {
    const cells = side === "left" ? cellsLeft : cellsRight;
    return cells.find((cell) => parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col);
  }

  function fillCell(row, col, color, side) {
    const cell = getCellByPosition(row, col, side);
    if (cell) {
      cell.style.backgroundColor = color;
      cell.dataset.filled = "true";
      cell.dataset.color = color;
    }
  }

  function addHoverEffects() {
    const allCells = [...cellsLeft, ...cellsRight];

    allCells.forEach((cell) => {
      cell.addEventListener("mouseenter", () => {
        if (cell.dataset.filled !== "true") {
          cell.style.backgroundColor = currentColor + "90";
        }
      });

      cell.addEventListener("mouseleave", () => {
        if (cell.dataset.filled !== "true") {
          cell.style.backgroundColor = "";
        }
      });
    });
  }

  function updateHoverColor() {
    const allCells = [...cellsLeft, ...cellsRight];

    allCells.forEach((cell) => {
      if (cell.dataset.filled !== "true" && cell.style.backgroundColor && cell.style.backgroundColor !== "") {
        cell.style.backgroundColor = currentColor + "40";
      }
    });
  }

  function logMessage(logLeft, logRight, side, type, msg) {
    const dir = type === "sent" ? "⬆" : "⬇";
    const color = type === "sent" ? "#059669" : "#dc2626";

    const arrow = document.createElement("span");
    arrow.style.color = color;
    arrow.style.marginRight = "2px";
    arrow.textContent = dir;

    const message = document.createElement("span");

    const jsonStart = JSON.stringify(msg).split(`"${msg.color}"`)[0];
    const jsonEnd = JSON.stringify(msg).split(`"${msg.color}"`)[1];

    const colorSpan = document.createElement("span");
    colorSpan.style.color = msg.color;
    colorSpan.style.fontWeight = "bold";
    colorSpan.textContent = msg.color;

    message.textContent = jsonStart;
    message.append(colorSpan);
    message.append(document.createTextNode(jsonEnd));

    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.alignItems = "center";
    line.style.gap = "3px";
    line.append(arrow, message);
    if (side === "left") {
      if (logLeft.textContent === "Messages appear here") {
        logLeft.textContent = "";
        logLeft.style.color = "#e2e8f0";
      }
      logLeft.append(line);
      logLeft.scrollTop = logLeft.scrollHeight;
    } else {
      if (logRight.textContent === "Messages appear here") {
        logRight.textContent = "";
        logRight.style.color = "#e2e8f0";
      }
      logRight.append(line);
      logRight.scrollTop = logRight.scrollHeight;
    }
  }

  function sendMessage(originSide, message, logLeft, logRight) {
    logMessage(logLeft, logRight, originSide, "sent", message);

    drawnSquares.push(message);

    fillCell(message.row, message.col, message.color, "left");
    fillCell(message.row, message.col, message.color, "right");

    const recvSide = originSide === "left" ? "right" : "left";
    logMessage(logLeft, logRight, recvSide, "recv", message);
  }

  function onGridClick(originSide, e) {
    const cell = e.target.closest(".grid-cell");
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const message = { row, col, color: currentColor };

    sendMessage(originSide, message, logLeft, logRight);
  }

  gridLeft.addEventListener("click", (e) => onGridClick("left", e));
  gridRight.addEventListener("click", (e) => onGridClick("right", e));

  resetBtn.addEventListener("click", () => {
    drawnSquares.length = 0;

    cellsLeft.forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.dataset.filled = "false";
      cell.dataset.color = "";
    });
    cellsRight.forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.dataset.filled = "false";
      cell.dataset.color = "";
    });

    logLeft.textContent = "Messages appear here";
    logLeft.style.color = "#888888";
    logLeft.style.userSelect = "none";
    logRight.textContent = "Messages appear here";
    logRight.style.color = "#888888";
    logRight.style.userSelect = "none";
  });
}
