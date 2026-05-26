"use strict";

const $ = (id) => document.getElementById(id);

const els = {
  names: $("names"),
  benchCount: $("benchCount"),
  inc: $("inc"),
  dec: $("dec"),
  rollBtn: $("rollBtn"),
  die: $("die"),
  dieNum: $("dieNum"),
  rosterCount: $("roster-count"),
  error: $("error"),
  results: $("results"),
  benchNames: $("bench-names"),
  rollList: $("roll-list"),
  copyBtn: $("copyBtn"),
  rerollBtn: $("rerollBtn"),
};

// Holds the most recent roll so "Copy for Discord" and "Re-cast" work.
let lastRoll = null;
let scrambleTimer = null;

/* ---------- Roster parsing ---------- */
function parseNames() {
  return els.names.value
    .split(/[\n,]+/)
    .map((n) => n.trim())
    .filter(Boolean);
}

function updateRosterCount() {
  const n = parseNames().length;
  els.rosterCount.textContent = n ? `${n} raider${n === 1 ? "" : "s"} on the roster` : "";
}

/* ---------- Rolling ---------- */
function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

// Each raider rolls a d20; the lowest `benchCount` roll(s) sit out.
// If the cut is ambiguous (a tie straddles the boundary), re-roll everyone —
// just like calling a re-roll on tied /roll results in game.
function rollBench(names, benchCount) {
  let rolls;
  let attempts = 0;
  do {
    rolls = names.map((name) => ({ name, roll: d20() }));
    rolls.sort((a, b) => a.roll - b.roll);
    attempts++;
  } while (isAmbiguous(rolls, benchCount) && attempts < 50);

  const benched = new Set(rolls.slice(0, benchCount).map((r) => r.name));
  return { rolls, benched: rolls.slice(0, benchCount).map((r) => r.name), benchedSet: benched };
}

// Ambiguous when the highest benched roll equals the lowest safe roll.
function isAmbiguous(sortedRolls, benchCount) {
  if (benchCount >= sortedRolls.length) return false;
  return sortedRolls[benchCount - 1].roll === sortedRolls[benchCount].roll;
}

/* ---------- The die ---------- */
function startDieScramble() {
  els.die.classList.remove("settle");
  els.die.classList.add("casting");
  scrambleTimer = setInterval(() => {
    els.dieNum.textContent = d20();
  }, 60);
}
function settleDie(value) {
  clearInterval(scrambleTimer);
  els.die.classList.remove("casting");
  els.dieNum.textContent = value;
  // restart the settle pop
  els.die.classList.remove("settle");
  void els.die.offsetWidth; // reflow so the animation replays
  els.die.classList.add("settle");
}

/* ---------- Rendering ---------- */
function renderResults(result) {
  els.benchNames.textContent = result.benched.join(", ");

  els.rollList.innerHTML = "";
  result.rolls.forEach((r, i) => {
    const benched = result.benchedSet.has(r.name);
    const li = document.createElement("li");
    li.className = "roll-row" + (benched ? " benched" : "");
    li.style.animationDelay = `${i * 55}ms`;
    li.innerHTML = `
      <span class="roll-badge">${r.roll}</span>
      <span class="roll-name"></span>
      <span class="roll-tag ${benched ? "benchtag" : "safe"}">${benched ? "BENCH" : "RAID"}</span>
    `;
    li.querySelector(".roll-name").textContent = r.name;
    els.rollList.appendChild(li);
  });

  els.results.hidden = false;
  els.results.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- Discord formatting ---------- */
// Produces a fenced code block so columns stay aligned when pasted into Discord.
function toDiscord(result) {
  const date = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const benchedCount = result.benched.length;
  const lines = [];
  lines.push("```");
  lines.push(`BENCH ROLL  —  ${date}`);
  lines.push(`Benched (${benchedCount}): ${result.benched.join(", ")}`);
  lines.push("-".repeat(28));
  result.rolls.forEach((r) => {
    const roll = String(r.roll).padStart(2, " ");
    const flag = result.benchedSet.has(r.name) ? "  <-- BENCH" : "";
    lines.push(`${roll}  ${r.name}${flag}`);
  });
  lines.push("```");
  return lines.join("\n");
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/* ---------- Actions ---------- */
function doRoll() {
  els.error.textContent = "";
  const names = parseNames();
  const benchCount = parseInt(els.benchCount.value, 10) || 0;

  if (names.length < 2) {
    els.error.textContent = "Summon at least 2 raiders before casting.";
    return;
  }
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
    els.error.textContent = "Two raiders share the same name — make them unique.";
    return;
  }
  if (benchCount < 1) {
    els.error.textContent = "Bench at least 1 raider.";
    return;
  }
  if (benchCount >= names.length) {
    els.error.textContent = `Can't bench ${benchCount} of ${names.length} — someone has to raid.`;
    return;
  }

  els.rollBtn.classList.add("casting");
  startDieScramble();

  setTimeout(() => {
    lastRoll = rollBench(names, benchCount);
    els.rollBtn.classList.remove("casting");
    // The die settles on fate's lowest roll — the one that decides the bench.
    settleDie(lastRoll.rolls[0].roll);
    renderResults(lastRoll);
  }, 650);
}

async function doCopy() {
  if (!lastRoll) return;
  try {
    await copyToClipboard(toDiscord(lastRoll));
    els.copyBtn.classList.add("copied");
    els.copyBtn.querySelector(".copy-label").textContent = "Copied!";
    els.copyBtn.querySelector(".copy-icon").textContent = "✓";
    setTimeout(() => {
      els.copyBtn.classList.remove("copied");
      els.copyBtn.querySelector(".copy-label").textContent = "Copy for Discord";
      els.copyBtn.querySelector(".copy-icon").textContent = "⧉";
    }, 1800);
  } catch (e) {
    els.error.textContent = "Couldn't copy to clipboard.";
  }
}

/* ---------- Wiring ---------- */
els.names.addEventListener("input", updateRosterCount);
els.rollBtn.addEventListener("click", doRoll);
els.rerollBtn.addEventListener("click", doRoll);
els.copyBtn.addEventListener("click", doCopy);
els.inc.addEventListener("click", () => {
  els.benchCount.value = (parseInt(els.benchCount.value, 10) || 0) + 1;
});
els.dec.addEventListener("click", () => {
  els.benchCount.value = Math.max(1, (parseInt(els.benchCount.value, 10) || 1) - 1);
});

updateRosterCount();
