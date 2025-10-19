function analyze() {
  const windDir = document.getElementById("windDir").value;
  const windSpeed = parseFloat(document.getElementById("windSpeed").value);
  const exData = document.getElementById("exData").value;

  const ranks = [], fStatus = [];
  for (let i = 1; i <= 6; i++) {
    ranks.push(document.getElementById("rank" + i).value);
    fStatus.push(document.getElementById("f" + i).value);
  }

  // --- 展示データ解析 ---
  const lines = exData.split("\n").map(l => l.trim());
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

  // --- 総合スコア算出 ---
  const score = [];
  for (let i=0;i<6;i++){
    let s = lapRank[i]*2 + displayRank[i] + turnRank[i] + strRank[i]*0.5;
    if (fStatus[i]==="F1") s+=1.5;
    if (fStatus[i]==="F2") s+=4;
    if (fStatus[i]==="F3") s+=10;
    if (ranks[i]==="A1") s-=0.8;
    if (ranks[i]==="A2") s-=0.4;
    if (ranks[i]==="B1") s+=0.6;
    if (ranks[i]==="B2") s+=1.5;
    score.push({i:i+1,s});
  }

  score.sort((a,b)=>a.s-b.s);
  const evals = score.map(x => ({
    boat: x.i,
    rank: x.s <=4.5?"S":x.s<=6?"A":x.s<=8?"B":x.s<=10?"C":"D"
  }));

  // --- 1号艇信頼度 ---
  let trust = 3;
  let trustReason = "平均的な信頼度";
  if (fStatus[0] !== "なし") {
    trust -= 1;
    trustReason = "フライング持ちでやや不安";
  }
  if (lapRank[0] === 1 || turnRank[0] === 1) {
    trust += 1;
    trustReason = "足しっかりで押し切り濃厚";
  }
  if (lapRank[0] >= 4) {
    trust -= 1;
    trustReason = "周回遅れて不安あり";
  }
  trust = Math.max(1, Math.min(5, trust));

  // --- 展開メモ ---
  let tenkai = "";
  if (windDir === "追い風") tenkai += "イン有利でスロー勢優勢、";
  if (windDir === "向かい風") tenkai += "外勢のまくり差し警戒、";
  if (windDir === "横風") tenkai += "展開は混戦気味、";
  const topBoat = evals[0].boat;
  tenkai += `${topBoat}号艇が機力上位で主導権握りそう💨`;

// --- 買い目生成 ---
const top3 = evals.slice(0, 3).map(e => e.boat);
let main = [];
let sub = [];

// 重複を避けながらセット作成
const unique = arr => [...new Set(arr)].slice(0, 3);

if (trust >= 4) {
  main = unique([1, top3[0], top3[1]]);
  sub  = unique([1, top3[2], 4]);
} else {
  main = unique([top3[0], top3[1], 1]);
  sub  = unique([top3[0], top3[1], top3[2]]);
}

// もし3艇未満なら補完
while (main.length < 3) main.push(top3.find(b => !main.includes(b)) || 6);
while (sub.length < 3) sub.push(top3.find(b => !sub.includes(b)) || 5);

// --- 自信ランク ---
let diff = Math.abs(score[0].s - score[1].s);
let conf = "B";
if (diff >= 2 && trust >= 4) conf = "S";
else if (diff >= 1.2) conf = "A";
else if (diff < 1.2) conf = "B";
if (windDir === "横風") conf = "B";

// --- 出力 ---
const resultArea = document.getElementById("resultArea");
resultArea.innerHTML = `
  <h3>🎯展示解析＆AI予想結果</h3>
  <p>風向：${windDir}　風速：${windSpeed}m</p>
  <hr>
  <p>展示1位：${displayRank.indexOf(1)+1}号艇</p>
  <p>周回1位：${lapRank.indexOf(1)+1}号艇</p>
  <p>周り足1位：${turnRank.indexOf(1)+1}号艇</p>
  <p>直線1位：${strRank.indexOf(1)+1}号艇</p>
  <hr>
  <p>🏁 総合ランク：${evals.map(e=>`${e.boat}号艇${e.rank}`).join("、 ")}</p>
  <p>💡1号艇信頼度：${"★".repeat(trust)}（${trustReason}）</p>
  <p>🧠展開メモ：${tenkai}</p>
  <hr>
  <p>🎯本命：${main.sort((a,b)=>a-b).join("-")}</p>
  <p>💥押さえ：${sub.sort((a,b)=>a-b).join("-")}</p>
  <p>🎖予想自信ランク：${conf}</p>
  <hr>
  <p style="color:#ff66a3;">👑テイちゃんコメント：<br>
  ${
    conf === "S" ? "これガチで狙い目🔥足も展開も完璧ッ💋" :
    conf === "A" ? "データ的に信頼度高め✨買う価値アリ！" :
    "ちょい荒れ警戒⚡オッズ次第で調整してねっ💅"
  }</p>
`;

resultArea.scrollIntoView({ behavior: "smooth" });


