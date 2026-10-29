(function(){
  const root=document.querySelector('[data-artwork-detail]');
  if(!root)return;
  const work=works.find(item=>item.id===new URLSearchParams(location.search).get('id'));
  if(!work){
    root.innerHTML='<section class="artwork-not-found wrap"><p class="eyebrow">WERKARCHIV</p><h1>Dieses Werk ist gerade nicht zu finden.</h1><p>Entdecke alle Arbeiten in der Galerie.</p><a class="button button-dark" href="galerie.html">Zur Galerie ↗</a></section>';
    document.title='Werk nicht gefunden — Morena Denigro';
    return;
  }
  const place={daikoku:'DAIKOKU PA · JAPAN',ginza:'GINZA · TOKYO',singen:'SINGEN · DEUTSCHLAND',dessau:'DESSAU-ROSSLAU · DEUTSCHLAND'}[work.series]||work.series.toUpperCase();
  const price=work.price==null?'Preis auf Anfrage':euro(work.price);
  const subject=encodeURIComponent('Anfrage zum Werk: '+work.title);
  const body=encodeURIComponent('Hallo Morena,\n\nich interessiere mich für das Werk „'+work.title+'“. Kannst du mir mehr über Verfügbarkeit und Versand erzählen?\n\nViele Grüße');
  root.innerHTML=`<section class="artwork-detail-hero wrap">
    <div class="artwork-detail-breadcrumb"><a href="galerie.html">Galerie</a><span aria-hidden="true">/</span><span></span></div>
    <div class="artwork-detail-layout">
      <div class="artwork-detail-visual"><a class="artwork-detail-image-link" target="_blank" rel="noopener"><img class="artwork-detail-image" alt="" fetchpriority="high"><span class="artwork-image-note"></span></a></div>
      <div class="artwork-detail-copy"><p class="eyebrow"></p><h1></h1>
        <p class="artwork-detail-lede">Ein Werk aus Morenas Atelier — geschaffen mit einem Blick für Licht, Oberfläche und den Augenblick dazwischen.</p>
        <div class="artwork-detail-rule"></div>
        <dl class="artwork-specs"><div><dt>Technik & Format</dt><dd data-medium></dd></div><div><dt>Serie</dt><dd data-series></dd></div><div><dt>Jahr</dt><dd data-year></dd></div><div><dt>Verfügbarkeit</dt><dd><span class="artwork-availability"></span></dd></div></dl>
        <div class="artwork-detail-price"><span>Original</span><strong></strong></div>
        <p class="artwork-detail-disclaimer">Preis und Verfügbarkeit werden vor einer Bestellung persönlich bestätigt.</p>
        <div class="artwork-detail-actions"><a class="button button-dark" data-enquiry>Werk anfragen <span aria-hidden="true">↗</span></a><a class="text-link" href="shop.html#prints">Prints entdecken <span aria-hidden="true">→</span></a></div>
        <p class="artwork-detail-back"><a href="galerie.html">← Zurück zur Galerie</a></p>
      </div>
    </div>
  </section>
  <section class="artwork-related section wrap"><div class="section-head"><div><p class="eyebrow">WEITER ENTDECKEN</p><h2>Weitere <em>Arbeiten.</em></h2></div><a class="text-link" href="galerie.html">Alle Werke <span aria-hidden="true">↗</span></a></div><div class="art-grid artwork-related-grid"></div></section>`;
  root.querySelector('.artwork-detail-breadcrumb span:last-child').textContent=work.title;
  const image=root.querySelector('.artwork-detail-image');image.src=work.img;image.alt=work.title+', '+work.medium;
  root.querySelector('.artwork-detail-image-link').href=work.img;
  root.querySelector('.artwork-image-note').textContent='ORIGINALWERK · '+work.year;
  root.querySelector('.artwork-detail-copy>.eyebrow').textContent=place+' · '+work.year;
  root.querySelector('.artwork-detail-copy h1').textContent=work.title;
  root.querySelector('[data-medium]').textContent=work.medium;
  root.querySelector('[data-series]').textContent=place;
  root.querySelector('[data-year]').textContent=work.year;
  const status=root.querySelector('.artwork-availability');status.textContent=work.status||'Verfügbarkeit auf Anfrage';if(work.status==='Original verfügbar')status.classList.add('is-available');
  root.querySelector('.artwork-detail-price strong').textContent=price;
  root.querySelector('[data-enquiry]').href='mailto:morenadenigro@gmail.com?subject='+subject+'&body='+encodeURIComponent('Hallo Morena,\n\nich interessiere mich für das Werk „'+work.title+'“. Kannst du mir mehr über Verfügbarkeit und Versand erzählen?\n\nViele Grüße');
  document.title=work.title+' — Morena Denigro';
  const description=document.querySelector('meta[name="description"]');if(description)description.content=work.title+' von Morena Denigro. '+work.medium+'. Originalverfügbarkeit persönlich anfragen.';
  const related=works.filter(item=>item.id!==work.id).sort((a,b)=>(a.series===work.series?0:1)-(b.series===work.series?0:1)).slice(0,3);
  root.querySelector('.artwork-related-grid').innerHTML=related.map(item=>'<article class="art-card"><a class="art-image" href="artwork.html?id='+encodeURIComponent(item.id)+'"><img src="'+item.img+'" alt="'+item.title+', '+item.medium+'" loading="lazy"><span class="art-label glass">'+item.year+'</span></a><div class="art-info"><div><h3><a class="artwork-title-link" href="artwork.html?id='+encodeURIComponent(item.id)+'">'+item.title+'</a></h3><p>'+item.medium+'</p></div><span class="price">'+(item.price==null?'Auf Anfrage':euro(item.price))+'</span></div></article>').join('');
})();