const EXAMPLE = {
  diskSize: 200,
  head: 53,
  requests: [98, 183, 37, 122, 14, 124, 65, 67]
};

let latestResults = null;
let activeTab = "fcfs";

const $ = (id) => document.getElementById(id);

function parseInputs() {
  const diskSize = Number($("diskSize").value);
  const head = Number($("headPosition").value);
  const raw = $("requests").value.trim();

  if (!Number.isInteger(diskSize) || diskSize < 2 || diskSize > 1000000) {
    throw new Error("Disk size must be a whole number between 2 and 1,000,000.");
  }
  if (!Number.isInteger(head) || head < 0 || head >= diskSize) {
    throw new Error(`Initial head position must be between 0 and ${diskSize - 1}.`);
  }
  if (!raw) throw new Error("Please enter at least one disk request.");

  const tokens = raw.split(/[,\s]+/).filter(Boolean);
  const requests = tokens.map((token) => {
    if (!/^\d+$/.test(token)) throw new Error(`Invalid request value: "${token}". Use whole track numbers.`);
    const value = Number(token);
    if (!Number.isSafeInteger(value) || value < 0 || value >= diskSize) {
      throw new Error(`Track ${token} is outside the valid range 0 to ${diskSize - 1}.`);
    }
    return value;
  });

  return { diskSize, head, requests };
}

function calculateResult(name, order, initialHead) {
  let current = initialHead;
  let total = 0;
  const steps = order.map((track, index) => {
    const distance = Math.abs(current - track);
    const step = { step: index + 1, from: current, to: track, distance };
    total += distance;
    current = track;
    return step;
  });

  return {
    name,
    order,
    steps,
    total,
    average: order.length ? total / order.length : 0
  };
}

function runFCFS(requests, head) {
  // FCFS services requests in their original arrival/input order.
  return calculateResult("FCFS", [...requests], head);
}

function runSSTF(requests, head) {
  // SSTF repeatedly chooses the closest request that has not been serviced.
  // Ties are resolved by choosing the request that appeared first in the input.
  const visited = new Array(requests.length).fill(false);
  const order = [];
  let current = head;

  for (let count = 0; count < requests.length; count++) {
    let bestIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < requests.length; i++) {
      if (visited[i]) continue;
      const distance = Math.abs(current - requests[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }

    visited[bestIndex] = true;
    order.push(requests[bestIndex]);
    current = requests[bestIndex];
  }

  return calculateResult("SSTF", order, head);
}

function renderSequence(elementId, result, initialHead) {
  const values = [initialHead, ...result.order];
  $(elementId).innerHTML = values.map((value, index) => {
    const node = `<span>${value}</span>`;
    return index === values.length - 1 ? node : node + "<b>→</b>";
  }).join("");
}

function renderResult(prefix, result, initialHead) {
  $(`${prefix}Total`).textContent = result.total;
  $(`${prefix}Average`).textContent = result.average.toFixed(2);
  $(`${prefix}Count`).textContent = result.order.length;
  renderSequence(`${prefix}Sequence`, result, initialHead);
}

function renderComparison(fcfs, sstf) {
  const maxValue = Math.max(fcfs.total, sstf.total, 1);
  $("fcfsBar").style.width = `${(fcfs.total / maxValue) * 100}%`;
  $("sstfBar").style.width = `${(sstf.total / maxValue) * 100}%`;
  $("fcfsBarValue").textContent = fcfs.total;
  $("sstfBarValue").textContent = sstf.total;

  const best = fcfs.total <= sstf.total ? "FCFS" : "SSTF";
  $("metricBest").textContent = best;
  $("metricBestFoot").textContent = fcfs.total === sstf.total ? "Equal head movement" : "Lower head movement";
  $("fcfsCard").classList.toggle("best", best === "FCFS");
  $("sstfCard").classList.toggle("best", best === "SSTF");

  const saved = Math.abs(fcfs.total - sstf.total);
  const baseline = Math.max(fcfs.total, sstf.total);
  const percentage = baseline ? (saved / baseline) * 100 : 0;

  if (saved === 0) {
    $("comparisonInsight").innerHTML = `<span class="insight-icon">＝</span><div><strong>Both algorithms have equal total movement</strong><p>Both travel ${fcfs.total} tracks for this request sequence.</p></div>`;
  } else {
    $("comparisonInsight").innerHTML = `<span class="insight-icon">✦</span><div><strong>${best} reduced head movement by ${percentage.toFixed(2)}%</strong><p>For this request sequence, ${best} travels ${saved} fewer tracks than ${best === "FCFS" ? "SSTF" : "FCFS"}.</p></div>`;
  }
}

function renderGraphs(fcfs, sstf, initialHead, diskSize) {
  // Draw an SVG line graph using the current simulation results.
  const svg = $("movementGraph");
  const width = 900, height = 360;
  const margin = { left: 62, right: 28, top: 24, bottom: 52 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const maxTrack = Math.max(diskSize - 1, 1);
  const maxSteps = Math.max(fcfs.order.length, sstf.order.length, 1);
  const x = (step) => margin.left + (step / maxSteps) * plotW;
  const y = (track) => margin.top + plotH - (track / maxTrack) * plotH;
  const tickCount = 5;
  let markup = "";
  for (let i = 0; i <= tickCount; i++) {
    const value = Math.round((maxTrack / tickCount) * i);
    const yy = y(value);
    markup += `<line class="graph-grid" x1="${margin.left}" y1="${yy}" x2="${width-margin.right}" y2="${yy}"/>`;
    markup += `<text class="graph-label" x="${margin.left-12}" y="${yy+4}" text-anchor="end">${value}</text>`;
  }
  for (let i = 0; i <= maxSteps; i++) {
    const xx = x(i);
    markup += `<line class="graph-grid" x1="${xx}" y1="${margin.top}" x2="${xx}" y2="${height-margin.bottom}"/>`;
    markup += `<text class="graph-label" x="${xx}" y="${height-25}" text-anchor="middle">${i}</text>`;
  }
  markup += `<line class="graph-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height-margin.bottom}"/>`;
  markup += `<line class="graph-axis" x1="${margin.left}" y1="${height-margin.bottom}" x2="${width-margin.right}" y2="${height-margin.bottom}"/>`;
  markup += `<text class="graph-label" x="${width/2}" y="${height-5}" text-anchor="middle">Service step (0 = initial head)</text>`;
  markup += `<text class="graph-label" transform="translate(17 ${height/2}) rotate(-90)" text-anchor="middle">Track position</text>`;
  const series = [
    { result: fcfs, line: "graph-line-fcfs", point: "graph-point-fcfs" },
    { result: sstf, line: "graph-line-sstf", point: "graph-point-sstf" }
  ];
  series.forEach(({result, line, point}) => {
    const values = [initialHead, ...result.order];
    const coords = values.map((track, index) => `${x(index)},${y(track)}`).join(" ");
    markup += `<polyline class="${line}" points="${coords}"/>`;
    values.forEach((track, index) => {
      markup += `<circle class="${point}" cx="${x(index)}" cy="${y(track)}" r="5"><title>${result.name}: step ${index}, track ${track}</title></circle>`;
    });
  });
  svg.innerHTML = markup;

  const maxMovement = Math.max(fcfs.total, sstf.total, 1);
  $("graphFcfsBar").style.width = `${fcfs.total / maxMovement * 100}%`;
  $("graphSstfBar").style.width = `${sstf.total / maxMovement * 100}%`;
  $("graphFcfsValue").textContent = fcfs.total;
  $("graphSstfValue").textContent = sstf.total;
}

function renderMovementTable(result) {
  const tbody = $("movementRows");
  tbody.innerHTML = result.steps.map((step) => `
    <tr>
      <td>${String(step.step).padStart(2, "0")}</td>
      <td>${step.from}</td>
      <td>${step.to}</td>
      <td>${step.distance} tracks</td>
    </tr>
  `).join("");
}

function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  if (latestResults) renderMovementTable(latestResults[tab]);
}

function runSimulation() {
  $("errorMessage").textContent = "";
  try {
    const { diskSize, head, requests } = parseInputs();
    const fcfs = runFCFS(requests, head);
    const sstf = runSSTF(requests, head);
    latestResults = { fcfs, sstf };

    $("metricTracks").textContent = diskSize;
    $("metricRequests").textContent = requests.length;
    renderResult("fcfs", fcfs, head);
    renderResult("sstf", sstf, head);
    renderComparison(fcfs, sstf);
    renderGraphs(fcfs, sstf, head, diskSize);
    renderMovementTable(latestResults[activeTab]);
  } catch (error) {
    $("errorMessage").textContent = error.message;
  }
}

function resetExample() {
  $("diskSize").value = EXAMPLE.diskSize;
  $("headPosition").value = EXAMPLE.head;
  $("requests").value = EXAMPLE.requests.join(", ");
  runSimulation();
}

$("runBtn").addEventListener("click", runSimulation);
$("resetBtn").addEventListener("click", resetExample);
document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

runSimulation();
