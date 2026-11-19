// Tulis naskah voiceover (bentuk ucapan) dari SENT di video.html -> audio/naskah-vo.txt
const fs = require('fs');
const src = fs.readFileSync('video.html', 'utf8');
const sent = [...src.matchAll(/\{ id: '(\w+)', sc: (\d+), t: '([^']+)'(?:, say: '([^']+)')?/g)];
const NUM = { '1178': 'seribu seratus tujuh puluh delapan', '1272': 'seribu dua ratus tujuh puluh dua', '1989': 'seribu sembilan ratus delapan puluh sembilan', '5,5': 'lima koma lima', '45': 'empat puluh lima' };
const TAG = { h1: '[slow, mysterious] ', h2: '[whispers] ', p1: '[tense] ', d2: '', z: '[whispers] ' };
let out = [], prev = 0;
for (const [, id, sc, t, say] of sent) {
  let s = (say || t).replace(/[*!~]/g, '');
  for (const k in NUM) s = s.replace(new RegExp('(^|\\s)' + k.replace(',', '\\,') + '(?=[\\s,.…])', 'g'), '$1' + NUM[k]);
  out.push((+sc !== prev && prev ? '\n' : '') + (TAG[id] || '') + s); prev = +sc;
}
fs.writeFileSync('audio/naskah-vo.txt', out.join('\n') + '\n'); console.log(out.join('\n'));
