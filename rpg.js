function startAnalysis() {
  const text = document.getElementById("rpgText");
  text.innerHTML = "";
  const message = "💋テイちゃん：「解析をスタートするよっ！データを冒険ログに保存中...」";
  let i = 0;
  const interval = setInterval(() => {
    text.innerHTML += message[i];
    i++;
    if (i >= message.length) clearInterval(interval);
  }, 40);
  
  setTimeout(() => {
    alert("📜 解析完了！（仮）これから冒険の続きが始まるよ✨");
  }, 2800);
}
