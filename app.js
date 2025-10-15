function analyze() {
  const place = document.getElementById("place").value;
  const race = document.getElementById("race").value;
  const windDir = document.getElementById("windDir").value;
  const windSpeed = parseFloat(document.getElementById("windSpeed").value);
  const exData = document.getElementById("exData").value;

  const ranks = [], fStatus = [];
  for (let i = 1; i <= 6; i++) {
    ranks.push(document.getElementById("rank" + i).value);
    fStatus.push(document.getElementById("f" + i).value);
  }

  const data = { place, race, windDir, windSpeed, exData, ranks, fStatus };
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

    // 直線タイムがない場対策（徳山・住之江など）
    if (!metrics["直線"]) {
      metrics["直線"] = [6.99, 7.00, 7.01, 7.02, 7.03, 7.04];
    }

    function getRanks(values) {
      const arr = values.map((v, i) => ({ v, i }));
      arr.sort((a, b) => a.v - b.v);
      const ranks = Array(6);
      arr.forEach((x, i) => (ranks[x.i] = i + 1));
      return ranks;
    }

    const displayRank = getRanks(metrics["展示"]);
    const lapRank = getRanks(metrics["周回"]);
    const turnRank = getRanks(metrics["周り足"]);
    const strRank = getRanks(metrics["直線"]);

    // --- 実力＆F補正を加えたスコア算出 ---
    const score = [];
    for (let i = 0; i < 6; i++) {
      let s = lapRank[i] * 2 + displayRank[i] + turnRank[i] + strRank[i] * 0.5;

      // フライング補正
      if (data.fStatus[i] === "F1") s += 1;
      if (data.fStatus[i] === "F2") s += 2;
      if (data.fStatus[i] === "F3") s += 3;
      if (data.fStatus[i] === "F切") s += 3.5;

      // 階級補正
      if (data.ranks[i] === "A1") s -= 0.7;
      if (data.ranks[i] === "A2") s -= 0.3;
      if (data.ranks[i] === "B1") s += 0.5;
      if (data.ranks[i] === "B2") s += 1.0;

      score.push({ i: i + 1, s });
    }

    score.sort((a, b) => a.s - b.s);
    const topBoats = score.map(s => s.i);

    // --- 展開判定 ---
    let scenario = "イン逃げ型"; // default
    const outerHasA1 = data.ranks.some((r, i) => (i >= 3 && (r === "A1" || r === "A2")));
    const manyF = data.fStatus.filter(f => f === "F2" || f === "F3" || f === "F切").length;
    const innerWeak = ["B1","B2"].includes(data.ranks[0]) || ["B1","B2"].includes(data.ranks[1]);

    if (data.windDir.includes("向かい") && data.windSpeed >= 3 && outerHasA1) {
      scenario = "外まくり型";
    } else if (manyF >= 2 || innerWeak) {
      scenario = "波乱型";
    } else if (data.windDir.includes("追い") && data.windSpeed <= 2 && data.ranks[0] === "A1") {
      scenario = "イン逃げ型";
    } else if (lapRank[1] === 1 && data.ranks[1].includes("A")) {
      scenario = "差し戦型";
    }

    // --- 買い目パターン ---
    let main = [], sub = [], comment = "", confidence = "B";

    if (scenario === "イン逃げ型") {
      main = [1, 2, 3];
      sub = [1, 3, 4];
      comment = "イン信頼💋逃げ一本勝負で！";
      confidence = "A";
    } else if (scenario === "差し戦型") {
      main = [1, 3, 4];
      sub = [1, 4, 5];
      comment = "差し展開きちゃうかも💥";
      confidence = "B＋";
    } else if (scenario === "外まくり型") {
      main = [3, 4, 5];
      sub = [4, 5, 6];
      comment = "外勢アツすぎ🔥風に乗ってまくり差し！";
      confidence = "B＋";
    } else if (scenario === "波乱型") {
      main = [2, 3, 5];
      sub = [1, 4, 6];
      comment = "荒れる気配💥穴党チャンスかも！？";
      confidence = "B−";
    }

    // --- 展示結果まとめ ---
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

    // --- 出力 ---
    resultArea.innerHTML = `
      <h3>🎯${data.place}${data.race}R／買い目：3連複2点（${scenario}）</h3>
      <p><b>本命：</b>${main.join("–")}</p>
      <p><b>押さえ：</b>${sub.join("–")}</p>
      <hr>
      <h4>🔍展示分析</h4>
      <p>展示1位：${displayRank.indexOf(1) + 1}号艇（★）</p>
      <p>周回1位：${lapRank.indexOf(1) + 1}号艇（★）</p>
      <p>周り足1位：${turnRank.indexOf(1) + 1}号艇（★）</p>
      <p>直線1位：${strRank.indexOf(1) + 1}号艇（★）</p>
      <p>→ 総合ランク：${evals.map(e => e.boat + "号艇" + e.rank).join("、")}</p>
      <hr>
      <h4>💡展開読み</h4>
      <p>${comment}</p>
      <h4>🎖予想自信ランク：${confidence}</h4>
      <p>風向：${data.windDir}　風速：${data.windSpeed}m</p>
    `;
  }
};




