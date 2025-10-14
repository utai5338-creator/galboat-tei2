function analyze() {
  const exData = document.getElementById("exData").value;
  localStorage.setItem("exData", exData);
  window.location.href = "result.html";
}

window.onload = () => {
  if (location.pathname.includes("result.html")) {
    const data = localStorage.getItem("exData");
    if (!data) return;
    const lines = data.split("\n");
    let html = "";
    lines.forEach(line => {
      const parts = line.split(" ");
      const title = parts[0];
      const nums = parts.slice(1).map(v => parseFloat(v.replace("F.", ""))).filter(n => !isNaN(n));
      const sorted = [...nums].sort((a,b) => a-b);
      const best = nums.indexOf(sorted[0]) + 1;
      html += `<p>🏁${title}1位：${best}号艇（${sorted[0]}）</p>`;
    });
    document.getElementById("resultArea").innerHTML = `${html}
      <p>💄テイちゃんコメント：「展示1位の艇、マジで足仕上がってる感じ〜！これは買い目入れるっしょ💋」</p>`;
  }
};