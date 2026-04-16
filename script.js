/* ============================================================
   script.js  —  Precision Architect · Simple Interest Engine
   ============================================================
   SI formula :  SI = (P × R × T) / 100
   T unit     :  if "months", convert T → T / 12 before calc
   Tax rate   :  flat 30 % of SI (configurable via TAX_RATE)
   API        :  POST /calculate to http://localhost:3000
   ============================================================ */

"use strict";

/* ── Constants ── */
const TAX_RATE   = 0.30;    // 30 % flat estimate
const STORE_KEY  = "pa_history"; // localStorage key

/* ── DOM refs ── */
const inputPrincipal  = document.getElementById("input-principal");
const inputRate       = document.getElementById("input-rate");
const inputTime       = document.getElementById("input-time");
const selectUnit      = document.getElementById("select-unit");
const btnCalculate    = document.getElementById("btn-calculate");
const btnShare        = document.getElementById("btn-share");
const btnExport       = document.getElementById("btn-export");
const btnClearHistory = document.getElementById("btn-clear-history");
const historyList     = document.getElementById("history-list");
const toastEl         = document.getElementById("toast");

// Result elements
const elIntWhole  = document.getElementById("result-int-whole");
const elIntDec    = document.getElementById("result-int-dec");
const elMaturity  = document.getElementById("result-maturity");
const elTax       = document.getElementById("result-tax");
const elApy       = document.getElementById("result-apy");
const elInterestBlock = document.getElementById("result-interest-block");

// Sparkline
const sparklinePath = document.getElementById("sparkline-path");

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, duration = 2800) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className   = "toast show";

  toastTimer = setTimeout(() => {
    toastEl.className = "toast hide";
    setTimeout(() => { toastEl.className = "toast"; }, 320);
  }, duration);
}

/* ══════════════════════════════════════════════
   FORMATTING HELPERS
══════════════════════════════════════════════ */
function fmt(amount, decimals = 2) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

function fmtCurrency(amount) {
  return "₹" + fmt(amount);
}

/* ══════════════════════════════════════════════
   SPARKLINE GENERATOR
   Plots a simple SI growth curve from t=0 to t=T
══════════════════════════════════════════════ */
function updateSparkline(principal, rate, timeYears) {
  if (!principal || !rate || !timeYears) {
    sparklinePath.setAttribute("d",
      "M0,80 Q50,75 100,60 T200,40 T300,30 T400,10 L400,100 L0,100 Z"
    );
    return;
  }

  const steps  = 8;
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t  = (timeYears / steps) * i;
    const si = (principal * rate * t) / 100;
    // Normalize: map SI range [0 → maxSI] to y range [80 → 10]
    points.push({ t: i / steps, si });
  }

  const maxSI = points[points.length - 1].si;

  const pathPoints = points.map(({ t, si }) => {
    const x = t * 400;
    const y = maxSI > 0 ? 80 - (si / maxSI) * 70 : 80;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Build a smooth polyline path with a closing area
  let d = `M${pathPoints[0]}`;
  for (let i = 1; i < pathPoints.length; i++) {
    d += ` L${pathPoints[i]}`;
  }
  d += " L400,100 L0,100 Z";
  sparklinePath.setAttribute("d", d);
}

/* ══════════════════════════════════════════════
   VALIDATION
══════════════════════════════════════════════ */
function validate() {
  let valid = true;

  [inputPrincipal, inputRate, inputTime].forEach(el => {
    el.classList.remove("input-error");
  });

  const P = parseFloat(inputPrincipal.value);
  const R = parseFloat(inputRate.value);
  const T = parseFloat(inputTime.value);

  if (!inputPrincipal.value || isNaN(P) || P <= 0) {
    inputPrincipal.classList.add("input-error");
    valid = false;
  }
  if (!inputRate.value || isNaN(R) || R <= 0) {
    inputRate.classList.add("input-error");
    valid = false;
  }
  if (!inputTime.value || isNaN(T) || T <= 0) {
    inputTime.classList.add("input-error");
    valid = false;
  }

  return valid;
}

/* ══════════════════════════════════════════════
   CORE CALCULATION
══════════════════════════════════════════════ */
async function calculate() {
  if (!validate()) {
    showToast("Please fill in all fields with positive values.");
    return;
  }

  const P         = parseFloat(inputPrincipal.value);
  const R         = parseFloat(inputRate.value);
  const rawT      = parseFloat(inputTime.value);
  const unit      = selectUnit.value;

  // Convert months -> years if needed
  const T         = unit === "months" ? rawT / 12 : rawT;

  try {
    // Show loading state
    btnCalculate.disabled = true;
    btnCalculate.innerHTML = '<span class="material-symbols-outlined animate-spin">hourglass_empty</span> Calculating...';

    // Send data to server for calculation
    const response = await fetch('http://localhost:3000/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        P: P,
        R: R,
        T: T
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Server calculation failed');
    }

    const { simpleInterest: SI, totalAmount: maturity } = result.data;
    const tax = SI * TAX_RATE;

    // Effective APY for simple interest = R (constant regardless of time)
    // For a truly equivalent APY we use: APY = (maturity/P)^(1/T) - 1
    const apy = T > 0 ? (Math.pow(maturity / P, 1 / T) - 1) * 100 : R;

    // Update result card
    const [whole, dec] = SI.toFixed(2).split(".");
    elIntWhole.textContent = fmt(parseFloat(whole), 0);
    elIntDec.textContent   = dec;
    elMaturity.textContent = fmtCurrency(maturity);
    elTax.textContent      = fmtCurrency(tax);
    elApy.textContent      = fmt(apy, 2) + "%";

    // Re-trigger fade-in animation
    elInterestBlock.querySelector(".result-animate").classList.remove("result-animate");
    void elInterestBlock.querySelector(".tabular-nums").offsetWidth; // reflow
    elInterestBlock.querySelector(".tabular-nums")
      ? elInterestBlock.querySelector(".tabular-nums").classList.add("result-animate")
      : null;

    // Force animation replay on the result number wrapper
    const numEl = elInterestBlock.querySelector(".text-6xl, .text-7xl");
    if (numEl) {
      numEl.classList.remove("result-animate");
      void numEl.offsetWidth;
      numEl.classList.add("result-animate");
    }

    // Sparkline
    updateSparkline(P, R, T);

    // Persist to history
    saveHistory({ P, R, rawT, unit, SI, maturity, date: new Date().toISOString() });
    renderHistory();

    showToast("Calculation completed successfully!");

  } catch (error) {
    console.error('Calculation error:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    // Reset button state
    btnCalculate.disabled = false;
    btnCalculate.innerHTML = '<span class="material-symbols-outlined">calculate</span> Calculate Returns';
  }
}

/* ══════════════════════════════════════════════
   LOCAL-STORAGE HISTORY
══════════════════════════════════════════════ */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);          // newest first
  const trimmed = history.slice(0, 20); // cap at 20 entries
  localStorage.setItem(STORE_KEY, JSON.stringify(trimmed));
}

function clearHistory() {
  localStorage.removeItem(STORE_KEY);
  renderHistory();
  showToast("History cleared.");
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      `<p class="text-sm text-on-surface-variant text-center py-6 opacity-60">No calculations yet.</p>`;
    return;
  }

  history.forEach(entry => {
    const { P, R, rawT, unit, SI, date } = entry;
    const dateStr = new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    const timeLabel = `${rawT} ${rawT === 1
      ? unit.slice(0, -1)   // "Years" → "Year", "Months" → "Month"
      : unit.charAt(0).toUpperCase() + unit.slice(1)}`;

    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="history-icon">
          <span class="material-symbols-outlined text-[#aaffd8] text-sm">history</span>
        </div>
        <div>
          <p class="history-meta">${fmtCurrency(P)} @ ${fmt(R, 1)}%</p>
          <p class="history-sub">${timeLabel} &bull; ${dateStr}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="history-interest">+${fmtCurrency(SI)}</p>
        <p class="history-sub">Interest Earned</p>
      </div>
    `;
    historyList.appendChild(item);
  });
}

/* ══════════════════════════════════════════════
   SHARE  (Web Share API → clipboard fallback)
══════════════════════════════════════════════ */
async function shareResult() {
  const si       = elIntWhole.textContent + "." + elIntDec.textContent;
  const maturity = elMaturity.textContent;
  const text     = `📈 Precision Architect Calculation\nInterest Earned: ₹${si}\nMaturity Amount: ${maturity}\nCalculated with Precision Architect.`;

  if (navigator.share) {
    try {
      await navigator.share({ title: "My Interest Calculation", text });
    } catch (err) {
      // user cancelled — silently ignore
      if (err.name !== "AbortError") showToast("Share failed. Try again.");
    }
  } else {
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      showToast("✅  Result copied to clipboard!");
    } catch {
      showToast("❌  Could not copy. Please copy manually.");
    }
  }
}

/* ══════════════════════════════════════════════
   EXPORT  (html2canvas → PNG download)
══════════════════════════════════════════════ */
async function exportCard() {
  const card = document.getElementById("result-card");

  if (typeof html2canvas === "undefined") {
    showToast("❌  Export library not loaded. Check your connection.");
    return;
  }

  showToast("⏳  Generating image…");

  try {
    const canvas = await html2canvas(card, {
      backgroundColor: "#233a56",   // surface-bright — explicit background
      scale: 2,                      // 2× for retina sharpness
      useCORS: true,
      logging: false,
    });

    const link      = document.createElement("a");
    link.download   = `precision-architect-${Date.now()}.png`;
    link.href       = canvas.toDataURL("image/png");
    link.click();

    showToast("✅  Image downloaded!");
  } catch (err) {
    console.error("html2canvas error:", err);
    showToast("❌  Export failed. Please try again.");
  }
}

/* ══════════════════════════════════════════════
   MOBILE NAV SCROLL HELPERS
══════════════════════════════════════════════ */
function scrollToHistory() {
  document.getElementById("history-list")
    ?.closest(".bg-surface-container-low")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════════════════ */
btnCalculate.addEventListener("click", calculate);

// Allow Enter key on any input to trigger calculation
[inputPrincipal, inputRate, inputTime].forEach(el => {
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") calculate();
    // Clear error state as soon as user types
    el.addEventListener("input", () => el.classList.remove("input-error"), { once: true });
  });
  el.addEventListener("input", () => el.classList.remove("input-error"));
});

btnShare.addEventListener("click", shareResult);
btnExport.addEventListener("click", exportCard);
btnClearHistory.addEventListener("click", clearHistory);

// Desktop nav
document.getElementById("nav-history")?.addEventListener("click", scrollToHistory);

// Mobile nav
document.getElementById("mob-nav-history")?.addEventListener("click", scrollToHistory);
document.getElementById("mob-nav-calc")?.addEventListener("click", scrollToTop);

/* ══════════════════════════════════════════════
   INIT — render any existing history on load
══════════════════════════════════════════════ */
renderHistory();
