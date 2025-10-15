// --- BoatRace Prediction Ver.3.9 ---
// フライング補正・重複防止強化版

function runPrediction() {
  const input = document.getElementById("inputData").value.trim();
  if (!input) return alert("データを入力してね⚡");

  const rows = input.split("\n").map(r => r.split(","));
  const data = rows.map(r => ({
    boat: Number(r[0]),
    display: Number(r[1]),
    lap: Number(r[2]),
    maw: Number(r[3]),
    straight: Number(r[4]),
    st: parseFloat(r[5].replace("F.","0.")) || 0,
    flying: r[6] ? r[6].trim() : "-"
  }));

  const result = getPrediction(data);
  displayResult(result);
}

function getPrediction(data) {
  const scoreList = data.map(d => {
    let score =
      (40 / d.lap) +
      (30 / d.maw) +
      (20 / d.straight) +
      (10 / d.display);

    // --- フライング補正 ---
    let fPenalty = 1.0;
    if (d.flying === "F1") fPenalty = 0.85;
    else if (d.flying === "F2") fPenalty = 0.65;
    else if (d.flying === "F3") fPenalty = 0.0;

    score *= fPenalty;
    return { ...d, score };
  });

  const validBoats = scoreList.filter(b => b.score > 0);
  validBoats.sort((a, b) => b.score - a.score);

  // --- 軸艇 ---
  let axisBoat = validBoats[0];
  if (axisBoat.flying === "F2" || axisBoat.flying === "F3") {
    const next = validBoats.find(b => b.flying === "-" || b.flying === "F1");
    if (next) axisBoat = next;
  }

  const axis = axisBoat.boat;
  const candidates = validBoats.filter(b => b.boat !== axis).slice(0, 5);

  let rawMain = [], rawSub = [];

  // --- 本命（軸＋上位2艇） ---
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      rawMain.push([axis, candidates[i].boat, candidates[j].boat]);
      if (rawMain.length >= 2) break;
    }
    if (rawMain.length >= 2) break;
  }

  // --- 押さえ（上位3艇＋軸） ---
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      rawSub.push([candidates[i].boat, candidates[j].boat, axis]);
      if (rawSub.length >= 2) break;
    }
    if (rawSub.length >= 2) break;
  }

  // --- 重複防止＆昇順整列 ---
  const formatSets = arr =>
    Array.from(new Set(arr.map(a => a.sort((x,y)=>x-y).join('-'))));

  const main = formatSets(rawMain);
  const sub = formatSets(rawSub);

  // --- 信頼度ランク ---
  let confidence = "B";
  if (axisBoat.flying === "-") confidence = "A";
  if (axisBoat.flying === "F1") confidence = "A−";
  if (axisBoat.flying === "F2") confidence = "B−";
  if (axisBoat.flying === "F3") confidence = "C";
  if (validBoats[0].score - validBoats[1].score > 0.5) confidence = "S";

  const flyingList = data
    .filter(d => d.flying !== "-" && d.flying !== "")
    .map(d => `${d.boat}号艇(${d.flying})`);

  return {
    axis: axisBoat.boat,
    main,
    sub,
    confidence,
    flyingList,
    ranking: validBoats.map(b => ({
      boat: b.boat,
      score: b.score.toFixed(2),
      flying: b.flying
    }))
  };
}

function displayResult(res) {
  let html = `🎯<b>本命：</b>${res.main.join(' ／ ')}\n`;
  html += `💫<b>押さえ：</b>${res.sub.join(' ／ ')}\n\n`;
  html += `🎯<b>軸艇：</b>${res.axis}号艇\n`;
  html += `🏁<b>自信ランク：</b>${res.confidence}\n\n`;

  html += `⚠️<b>フライング持ち：</b>\n`;
  html += res.flyingList.length
    ? res.flyingList.map(f => {
        if (f.includes("F3")) return `<span class="f3">${f}</span>`;
        if (f.includes("F2")) return `<span class="f2">${f}</span>`;
        if (f.includes("F1")) return `<span class="f1">${f}</span>`;
        return f;
      }).join(" ／ ")
    : "なし";

  html += `\n\n📊<b>スコア順位：</b>\n`;
  res.ranking.forEach((r, i) => {
    html += `${i+1}位：${r.boat}号艇（${r.score}）${r.flying !== "-" ? " ["+r.flying+"]" : ""}\n`;
  });

  document.getElementById("output").innerHTML = html;
}


