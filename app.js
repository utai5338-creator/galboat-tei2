// --- ギャルボート Ver.3.9 Final（race削除＋風速整数対応）---

function analyze() {
  const windDir = document.getElementById("windDir").value;
  const windSpeed = parseInt(document.getElementById("windSpeed").value); // ←整数化
  const exData = document.getElementById("exData").value;

  const ranks = [], fStatus = [];
  for (let i = 1; i <= 6; i++) {
    ranks.push(document.getElementById("rank" + i).value);
    fStatus.push(document.getElementById("f" + i).value);
  }

  // race, place削除 → 保存データも修正
  const data = { windDir, windSpeed, exData, ranks, fStatus };
  localStorage.setItem("teiData", JSON.stringify(data));
  location.href = "result.html";
}

window.onload = function () {
  if (location.pathname.endsWith("result.html")) {
    const data = JSON.parse(localStorage.getItem("teiData"));
    if (!data) return;
    const resultArea = document.getElementById("resultArea");

    // --- 展示データ解析 ---
    const lines = data.exData.split("\n").map(l => l.trim());
    const metrics = {};
    ["展示", "周回", "周り足", "直線", "ST"].forEach(key => {
      const line = lines.find(l => l.includes(key));
      if (line) {
        const nums = line.match(/[0-9]+\.[0-9]+/g);
        if (nums && nums.length >= 6) {
          metrics[key] = nums.slice(0, 6).map(n => parseFloat(n));
        }
      }
    });
    if (!metrics["直線"]) metrics["直線"] = [7, 7, 7, 7, 7, 7];

    const getRanks = (values) => {
      const arr = values.map((v, i) => ({ v, i }));
      arr.sort((a, b) => a.v - b.v);
      const ranks = Array(6);
      arr.forEach((x, i) => (ranks[x.i] = i + 1));
      return ranks;
    };

    const displayRank = getRanks(metrics["展示"]);
    const lapRank = getRanks(metrics["周回"]);
    const turnRank = getRanks(metrics["周り足"]);
    const strRank = getRanks(metrics["直線"]);

    // --- 総合スコア計算 ---
    const score = [];
    for (let i = 0; i < 6; i++) {
      let s = lapRank[i] * 2 + displayRank[i] + turnRank[i] + strRank[i] * 0.5;

      // 🟠 フライング補正
      if (data.fStatus[i] === "F1") s += 1.5;
      if (data.fStatus[i] === "F2") s += 4;
      if (data.fStatus[i] === "F3") s += 8;
      if (data.fStatus[i] === "なし") s += 0;

      // 🟢 階級補正
      if (data.ranks[i] === "A1") s -= 0.8;
      if (data.ranks[i] === "A2") s -= 0.4;
      if (data.ranks[i] === "B1") s += 0.6;
      if (data.ranks[i] === "B2") s += 1.5;

      score.push({ i: i + 1, s });
    }

    score.sort((a, b) => a.s - b.s);

    // --- 展開判定 ---
    const manyF = data.fStatus.filter(f => ["F2", "F3"].includes(f)).length;
    const outerA = data.ranks.slice(3).some(r => ["A1", "A2"].includes(r));
    const innerWeak =
      ["B1", "B2"].includes(data.ranks[0]) ||
      ["B1", "B2"].includes(data.ranks[1]);

    let scenario = "イン逃げ型";
    if (manyF >= 2 || innerWeak || ["F2", "F3"].includes(data.fStatus[0])) {
      scenario = "波乱型";
    } else if (data.windDir.includes("向かい") && data.windSpeed >= 3 && outerA) {
      scenario = "外まくり型";
    } else if (lapRank[1] === 1 && data.ranks[1].includes("A")) {
      scenario = "差し戦型";
    }

    // --- 買い目生成 ---
    let main = [], sub = [], comment = "", confidence = "B";

    const validBoats = score
      .filter(s => !["F3"].includes(data.fStatus[s.i - 1]))
      .map(s => s.i);

    const normalize = (arr) => {
      let uniq = Array.from(new Set(arr)).sort((a, b) => a - b);
      while (uniq.length < 3) {
        const next = score.find(s => !uniq.includes(s.i));
        if (next) uniq.push(next.i);
        else break;
      }
      return uniq.slice(0, 3);
    };

    const isSafe = (i) => !["F2", "F3"].includes(data.fStatus[i - 1]);

    if (scenario === "イン逃げ型") {
      main = normalize([1, ...validBoats.filter(isSafe).slice(0, 2)]);
      sub = normalize([1, validBoats[1], validBoats[2]]);
      comment = "逃げ信頼💋A級イン戦は鉄板ムード！";
      confidence = "A";
    } else if (scenario === "差し戦型") {
      main = normalize(validBoats.filter(isSafe).slice(0, 3));
      sub = normalize([1, validBoats[0], validBoats[1]]);
      comment = "差し一撃も💥スタート決まれば波乱！";
      confidence = "B＋";
    } else if (scenario === "外まくり型") {
      main = normalize(validBoats.filter(isSafe).slice(0, 3));
      sub = normalize([1, validBoats[0], validBoats[1]]);
      comment = "向かい風＋外A級🔥まくり差し展開！";
      confidence = "B＋";
    } else {
      const chaos = score
        .filter(s => {
          const f = data.fStatus[s.i - 1];
          const r = data.ranks[s.i - 1];
          return !["F3"].includes(f) && r !== "B2";
        })
        .slice(0, 3)
        .map(s => s.i);
      main = normalize(chaos);
      sub = normalize([1, ...chaos.slice(1)]);
      comment = "F艇多め💥波乱注意⚡";
      confidence = "B−";
    }

    const toKey = arr => arr.slice().sort((a, b) => a - b).join("-");
    if (toKey(main) === toKey(sub)) {
      const next = score.find(s => !main.includes(s.i));
      if (next) sub = normalize([...main.slice(0, 2), next.i]);
    }

    function getRankLabel(s) {
      if (s <= 4.5) return "S";
      if (s <= 6) return "A";
      if (s <= 8) return "B";
      if (s <= 10) return "C";
      return "D";
    }

    const evals = score.map(x => ({
      boat: x.i,
      rank: getRankLabel(x.s),
    }));

    resultArea.innerHTML = `
      <h3>🎯買い目：3連複2点（${scenario}）</h3>
      <p><b>本命：</b>${main.join("–")}</p>
      <p><b>押さえ：</b>${sub.join("–")}</p>
      <hr>
      <h4>🔍展示分析</h4>
      <p>展示1位：${displayRank.indexOf(1) + 1}号艇（★）</p>
      <p>周回1位：${lapRank.indexOf(1) + 1}号艇（★）</p>
      <p>周り足1位：${turnRank.indexOf(1) + 1}号艇（★）</p>
      <p>直線1位：${strRank.indexOf(1) + 1}号艇（★）</p>
      <p>→ 総合ランク：${evals.map(e => `${e.boat}号艇${e.rank}`).join("、")}</p>
      <hr>
      <h4>💡展開メモ</h4>
      <p>${comment}</p>
      <h4>🎖予想自信ランク：${confidence}</h4>
      <p>風向：${data.windDir}　風速：${data.windSpeed}m</p>
    `;
  }
};



