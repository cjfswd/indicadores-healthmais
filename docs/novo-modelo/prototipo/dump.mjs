import { Window } from 'happy-dom';
import fs from 'fs';
const html = fs.readFileSync('lesoes.html','utf8');
const i=html.indexOf('<script>'), j=html.lastIndexOf('</script>');
const win=new Window({url:'https://local.test/'}); const d=win.document;
d.body.innerHTML=html.slice(0,i);
win.eval(html.slice(i+8,j));
await new Promise(r=>setTimeout(r,150));

const txt = n => (n.textContent||'').replace(/\s+/g,' ').trim();
const out = { competencia: '08/2026', gerado: '2026-08-28', cards: [] };

for (const b of [...d.querySelectorAll('#nav .navitem')]) {
  b.click();
  await new Promise(r=>setTimeout(r,10));
  const code = txt(b.querySelector('.code'));
  const card = {
    code,
    nome: txt(d.querySelector('#hTitle')),
    nota: txt(d.querySelector('#hNote')),
    espelho: d.querySelector('#hMirror .mirror') ? txt(d.querySelector('#hMirror .mirror')) : null,
    meta: d.querySelector('#hMeta .meta-chip') ? {
      txt: txt(d.querySelector('#hMeta .meta-chip')).replace(/^(Meta atingida|Fora da meta)/,'').trim(),
      ok: d.querySelector('#hMeta .meta-chip').classList.contains('ok'),
    } : null,
    stats: [...d.querySelectorAll('#stats .cell')].map(c => ({
      k: txt(c.querySelector('.k')), v: txt(c.querySelector('.v')), d: txt(c.querySelector('.d')),
      warn: c.classList.contains('warn'),
    })),
    colunas: [...d.querySelectorAll('#thead th')].map(txt),
    linhas: [...d.querySelectorAll('#rows tr')].map(tr => [...tr.querySelectorAll('td')].map(td => {
      const pat = td.querySelector('.op');
      if (pat) return txt(td).replace(txt(pat), '').trim() + ' (' + txt(pat) + ')';
      return txt(td);
    })),
    pivot: {
      cols: [...d.querySelectorAll('#pthead th')].map(txt),
      rows: [...d.querySelectorAll('#prows tr')].map(tr => ({
        pai: tr.classList.contains('parent'),
        cells: [...tr.querySelectorAll('td')].map(txt),
      })),
    },
    alertas: [],
  };
  // alertas: abre cada linha e captura o alertbox
  const rows = [...d.querySelectorAll('#rows tr')];
  for (let k=0;k<rows.length;k++){
    rows[k].click();
    await new Promise(r=>setTimeout(r,5));
    const a = d.querySelector('#peekBody .alertbox');
    if (a) card.alertas.push({ registro: txt(d.querySelector('#peekId')), quem: txt(d.querySelector('#peekBody h2')), texto: txt(a) });
    const faltando = [...d.querySelectorAll('#peekBody .req .line.miss span')].map(txt);
    if (faltando.length) card.alertas.push({ registro: txt(d.querySelector('#peekId')), quem: txt(d.querySelector('#peekBody h2')), texto: 'Campo obrigatório em falta: ' + faltando.join('; ') });
  }
  out.cards.push(card);
}

out.paginas = [...d.querySelectorAll('#navOps .navitem')].map(b => {
  b.click();
  return {
    nome: txt(d.querySelector('#legacyBody h2')),
    lead: txt(d.querySelector('#legacyBody .lead')),
    itens: [...d.querySelectorAll('#legacyBody .lrow')].map(r => [txt(r.querySelector('.lk')), txt(r.querySelector('.lv'))]),
  };
});

fs.writeFileSync('painel.json', JSON.stringify(out,null,1));
console.log('cards', out.cards.length, '· alertas', out.cards.reduce((s,c)=>s+c.alertas.length,0), '· paginas', out.paginas.length);
