function analyze(){
  const place = document.getElementById('place').value;
  const race = document.getElementById('race').value;
  const windDir = document.getElementById('windDir').value;
  const windSpeed = document.getElementById('windSpeed').value;
  const exData = document.getElementById('exData').value;
  const ranks = [];
  for(let i=1;i<=6;i++){ ranks.push(document.getElementById('rank'+i).value); }
  const data = { place, race, windDir, windSpeed, exData, ranks };
  localStorage.setItem('teiData', JSON.stringify(data));
  location.href='result.html';
}
window.onload = function(){
  if(location.pathname.endsWith('result.html')){
    const data = JSON.parse(localStorage.getItem('teiData'));
    if(!data) return;
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = `
      <p><b>場名：</b>${data.place}</p>
      <p><b>レース：</b>${data.race}R</p>
      <p><b>風：</b>${data.windDir} ${data.windSpeed}m/s</p>
      <p><b>階級：</b>${data.ranks.join(' / ')}</p>
      <p><b>展示データ：</b><br>${data.exData.replace(/\n/g,'<br>')}</p>
      <hr>
      <p>💋テイちゃんコメント：「展示タイム見たけど、アツいのはここだね〜！風と足のバランス要チェック💨」</p>
    `;
  }
};