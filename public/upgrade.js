
// Real Cburnett pieces
const REAL = {
  wK:'https://lichess1.org/assets/piece/cburnett/wK.svg',
  wQ:'https://lichess1.org/assets/piece/cburnett/wQ.svg',
  wR:'https://lichess1.org/assets/piece/cburnett/wR.svg',
  wB:'https://lichess1.org/assets/piece/cburnett/wB.svg',
  wN:'https://lichess1.org/assets/piece/cburnett/wN.svg',
  wP:'https://lichess1.org/assets/piece/cburnett/wP.svg',
  bK:'https://lichess1.org/assets/piece/cburnett/bK.svg',
  bQ:'https://lichess1.org/assets/piece/cburnett/bQ.svg',
  bR:'https://lichess1.org/assets/piece/cburnett/bR.svg',
  bB:'https://lichess1.org/assets/piece/cburnett/bB.svg',
  bN:'https://lichess1.org/assets/piece/cburnett/bN.svg',
  bP:'https://lichess1.org/assets/piece/cburnett/bP.svg',
};
function inject(){
  if(document.getElementById('zg-css')) return;
  const s=document.createElement('style'); s.id='zg-css';
  s.innerHTML=`
    [class*="piece"]{background-size:95% 95% !important;background-position:center !important;background-repeat:no-repeat !important;}
    .wK,[data-piece="wK"]{background-image:url(${REAL.wK}) !important;}
    .wQ,[data-piece="wQ"]{background-image:url(${REAL.wQ}) !important;}
    .wR,[data-piece="wR"]{background-image:url(${REAL.wR}) !important;}
    .wB,[data-piece="wB"]{background-image:url(${REAL.wB}) !important;}
    .wN,[data-piece="wN"]{background-image:url(${REAL.wN}) !important;}
    .wP,[data-piece="wP"]{background-image:url(${REAL.wP}) !important;}
    .bK,[data-piece="bK"]{background-image:url(${REAL.bK}) !important;}
    .bQ,[data-piece="bQ"]{background-image:url(${REAL.bQ}) !important;}
    .bR,[data-piece="bR"]{background-image:url(${REAL.bR}) !important;}
    .bB,[data-piece="bB"]{background-image:url(${REAL.bB}) !important;}
    .bN,[data-piece="bN"]{background-image:url(${REAL.bN}) !important;}
    .bP,[data-piece="bP"]{background-image:url(${REAL.bP}) !important;}
  `;
  document.head.appendChild(s);
}
setInterval(inject,500);


