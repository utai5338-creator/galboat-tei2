function analyze() {
  const place = document.getElementById("place").value;
  const windDir = document.getElementById("windDir").value;
  const windSpeed = parseFloat(document.getElementById("windSpeed").value);
  const exData = document.getElementById("exData").value;

  const ranks = [], fStatus = [];
  for (let i = 1; i <= 6; i++) {
    ranks.push(document.getElementById("rank" + i).value);
    fStatus.push(document.getElementById("f" + i).value);
  }

  const data = { place, windDir, windSpeed, exData, ranks, fStatus };
  localStorage.setItem("teiData", JSON.stringify(data));
  location.href = "result.html";
}

window.onload = function () {
  if (location.pathname.endsWith("result.html")) {
    const data = JSON.parse(localStorage.getItem("teiData"));
    if (!data) return;
    const resultArea = document.getElementById("resultArea");

    // 展示データ解析
    const lines = data.exData.split("\n").map(l => l.trim());
    const metrics = {};
    ["展示", "周回", "周り足", "直線", "ST"].forEach(key => {
      const line = lines.find(l => l.includes(key));
      if (line) {
        const nums = line.match(/[0-9]+\.[0-9]+/g);
        if (nums && nums.length >= 6) metrics[key] = nums.slice(0, 6).map(Number);
      }
    });
    if (!metrics["直線"]) metrics["直線"] = [7,7,7,7,7,7];

    const getRanks = values => {
      const arr = values.map((v, i) => ({ v, i }));
      arr.sort((a,b) => a.v - b.v);
      const ranks = Array(6);
      arr.forEach((x,i) => ranks[x.i] = i + 1);
      return ranks;
    };

    const displayRank = getRanks(metrics["展示"]);
    const lapRank = getRanks(metrics["周回"]);
    const turnRank = getRanks(metrics["周り足"]);
    const strRank = getRanks(metrics["直線"]);

    // 総合スコア
    const score = [];
    for (let i=0;i<6;i++){
      let s = lapRank[i]*2 + displayRank[i] + turnRank[i] + strRank[i]*0.5;
      if (data.fStatus[i]==="F1") s+=1.5;
      if (data.fStatus[i]==="F2") s+=4;
      if (data.fStatus[i]==="F3") s+=10;
      if (data.ranks[i]==="A1") s-=0.8;
      if (data.ranks[i]==="A2") s-=0.4;
      if (data.ranks[i]==="B1") s+=0.6;
      if (data.ranks[i]==="B2") s+=1.5;
      score.push({i:i+1,s});
    }

    score.sort((a,b)=>a.s-b.s);

    const evals = score.map(x => ({
      boat: x.i,
      rank: x.s <=4.5?"S":x.s<=6?"A":x.s<=8?"B":x.s<=10?"C":"D"
    }));

    resultArea.innerHTML = `
      <h3>🎯${data.place} 展示解析結果</h3>
      <p>風向：${data.windDir}　風速：${data.windSpeed}m</p>
      <hr>
      <p>展示1位：${displayRank.indexOf(1)+1}号艇</p>
      <p>周回1位：${lapRank.indexOf(1)+1}号艇</p>
      <p>周り足1位：${turnRank.indexOf(1)+1}号艇</p>
      <p>直線1位：${strRank.indexOf(1)+1}号艇</p>
      <hr>
      <p>🏁 総合ランク：${evals.map(e=>`${e.boat}号艇${e.rank}`).join("、 ")}</p>
    `;
  }
};
