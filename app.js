function analyze() {
  const place = document.getElementById("place").value;
  const race = document.getElementById("race").value;
  const windDir = document.getElementById("windDir").value;
  const windSpeed = document.getElementById("windSpeed").value;
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

    // 順位付け関数
    function getRanks(values) {
      const arr = values.map((v, i) => ({ v, i }));
      arr.sort((a, b) => a.v - b.v);
      const ranks = Array(6);
      arr.forEach((x, i) => (ranks[x.i] = i + 1));
      return ranks;
    }

    const displayRank = getRanks(metrics["展示"] || [0, 0, 0, 0, 0, 0]);
    const lapRank = getRanks(metrics["周回"] || [0, 0, 0, 0, 0, 0]);
    const turnRank = getRanks(metrics["周り足"] || [0, 0, 0, 0, 0, 0]);
    const strRank = getRanks(metrics["直線"] || [0, 0, 0, 0, 0, 0]);

    // --- 総合スコア計算 ---
    const score = [];
    for (let i = 0; i < 6; i++) {
      let s = lapRank[i] * 2 + displayRank[i] + turnRank[i] + strRank[i] * 0.5;

      // フライング補正
      if (data.fStatus[i] === "F1") s += 0.8;
      if (data.fStatus[i] === "F2") s += 1.5;
      if (data.fStatus[i] === "F3") s += 3.0;
      if (data.fStatus[i] === "F切") s += 2.5;

      // 階級補正
      if (data.ranks[i] === "A1") s -= 0.7;
      if (data.ranks[i] === "A2") s -= 0.3;
      if (data.ranks[i] === "B1") s += 0.5;
      if (data.ranks[i] === "B2") s += 1.0;

      score.push({ i: i + 1, s });
    }

    score.sort((a, b) => a.s - b.s);

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

    // --- 買い目自動生成（重複・例外防止版）---
    const best = evals.slice(0, 4).map(e => e.boat);
    let main = [];
    let sub = [];

    if (best.includes(1)) {
      const others = best.filter(b => b !== 1);
      main = [1, others[0], others[1]];
      sub = [1, others[1], others[2] ?? others[0]];
    } else {
      main = [1, best[0], best[1]];
      sub = [1, best[1], best[2]];
    }

    function uniqueCombo(arr) {
      return [...new Set(arr)].slice(0, 3).sort((a,b)=>a-b);
    }
    main = uniqueCombo(main);
    sub = uniqueCombo(sub);
    if (JSON.stringify(main) === JSON.stringify(sub)) {
      sub = uniqueCombo([1, best[2], best[3] || 6]);
    }

    // --- 展開コメント生成 ---
    let comment = "";
    const hasHighRank = data.ranks.includes("A1") || data.ranks.includes("A2");
    const manyF = data.fStatus.filter(f => f === "F2" || f === "F3" || f === "F切").length;
    const outerStrong = best.some(b => b >= 4);

    if (data.ranks[0] === "A1" && lapRank[0] === 1) comment = "イン信頼！A1様の貫禄よ💋";
    else if (outerStrong && hasHighRank) comment = "外の伸びヤバ〜！まくり差し決まるかも🔥";
    else if (manyF >= 2) comment = "F多すぎて波乱の予感💥荒れる展開あり！";
    else if (data.windDir.includes("向かい")) comment = "向かい風注意⚡外差し浮上あるかも！";
    else comment = "安定の内寄り展開〜堅実勝負で💎";

    // --- 自信ランク ---
    let confidence = "B";
    if (data.ranks[0] === "A1" && lapRank[0] <= 2) confidence = "A";
    if (best[0] === 1 && hasHighRank && manyF === 0) confidence = "S";
    if (manyF >= 2) confidence = "B−";

    // --- 結果出力 ---
    resultArea.innerHTML = `
      <h3>🎯${data.place}${data.race}R／買い目：3連複2点</h3>
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
      <h4>💡1号艇信頼度：★★★★☆</h4>
      <p>・階級：${data.ranks[0]}　F状況：${data.fStatus[0]}　→ 軸信頼度高め</p>
      <h4>🧠展開メモ</h4>
      <p>${comment}</p>
      <h4>🎖予想自信ランク：${confidence}</h4>
    `;
  }
};


