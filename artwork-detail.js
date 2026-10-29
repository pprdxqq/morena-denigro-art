(function(){
  const root=document.querySelector('[data-artwork-detail]');
  if(!root)return;
  const stories={
    'daikoku-1':'Ein flüchtiger Blick auf Daikoku PA: Nacht, Architektur und Reflexion verschmelzen in der glänzenden Oberfläche.',
    'daikoku-2':'Aus derselben Serie, aber ein anderer Augenblick: Die Linien des Autos halten die Bewegung fest, während das Bild selbst ganz still bleibt.',
    'daikoku-3':'Die dunkle Karosserie wird zur Bühne für einzelne Lichtspuren; jeder Reflex wirkt wie eine kleine Erinnerung an die Fahrt.',
    'ginza-1':'Im dichten Rhythmus Tokios wird die Oberfläche des Autos zum Spiegel der Stadt.',
    'ginza-2':'Warme Farbtöne und klare Konturen übersetzen eine urbane Begegnung in einen stillen Bildmoment.',
    'ginza-3':'Ein Ausschnitt aus Ginza, gesehen durch Licht, Farbe und die vielen Schichten einer Spiegelung.',
    'singen-1':'Die Serie Singen richtet den Blick auf Alltagsmomente, in denen sich Umgebung und Lack begegnen.',
    'singen-2':'Ein Bild über Geduld: Schicht für Schicht entsteht die Reflexion auf der Leinwand.',
    'singen-3':'Zwischen Bewegung und Ruhe zeigt sich, wie eine Oberfläche Stimmung tragen kann.',
    'dessau-1':'Dessau-Roßlau bildet den Ausgangspunkt; im Zentrum steht das Licht auf der Karosserie.'
  };
  const render=()=>{
    const work=works.find(item=>item.id===new URLSearchParams(location.search).get('id'));
    if(!work){root.innerHTML='<section class="artwork-not-found wrap"><p class="eyebrow">WERKARCHIV</p><h1>Dieses Werk ist gerade nicht zu finden.</h1><p>Entdecke alle Arbeiten in der Galerie oder suche nach einem Motiv im Shop.</p><div class="artwork-detail-actions"><a class="button button-dark" href="galerie.html">Zur Galerie ↗</a><a class="text-link" href="shop.html">Prints entdecken →</a></div></section>';document.title='Werk nicht gefunden — Morena Denigro';return}
    const place={daikoku:'DAIKOKU PA · JAPAN',ginza:'GINZA · TOKYO',singen:'SINGEN · DEUTSCHLAND',dessau:'DESSAU-ROSSLAU · DEUTSCHLAND'}[work.series]||work.series.toUpperCase();
    const price=work.price==null?'Preis auf Anfrage':euro(work.price);
    const story=work.story||stories[work.id]||'Ein Werk aus Morenas Atelier, das Licht, Oberfläche und einen Moment in einer eigenen Bildsprache festhält.';
    const available=work.status==='Original verfügbar'&&work.available!==false;
    root.innerHTML=`<section class="artwork-detail-hero wrap">
      <div class="artwork-detail-breadcrumb"><a href="galerie.html">Galerie</a><span aria-hidden="true">/</span><span data-breadcrumb></span></div>
      <div class="artwork-detail-layout">
        <div class="artwork-detail-visual"><button class="artwork-detail-image-button" type="button" aria-label="Werk vergrößert ansehen"><img class="artwork-detail-image" alt="" fetchpriority="high"><span class="artwork-image-note">BILD ANSEHEN <span aria-hidden="true">↗</span></span></button><p class="artwork-zoom-hint">Tippe oder klicke auf das Werk, um es im Detail zu betrachten.</p></div>
        <div class="artwork-detail-copy"><p class="eyebrow" data-place></p><h1 data-title></h1>
          <p class="artwork-detail-lede">Jedes Bild beginnt mit einem genauen Blick — auf Reflexionen, Linien und das Licht, das eine Oberfläche für einen Augenblick verändert.</p>
          <div class="artwork-detail-rule"></div>
          <dl class="artwork-specs"><div><dt>Technik & Format</dt><dd data-medium></dd></div><div><dt>Serie / Ort</dt><dd data-series></dd></div><div><dt>Jahr</dt><dd data-year></dd></div><div><dt>Verfügbarkeit</dt><dd><span class="artwork-availability"></span></dd></div></dl>
          <div class="artwork-detail-price"><span>Original</span><strong data-price></strong></div>
          <p class="artwork-detail-disclaimer">Preis und Verfügbarkeit werden vor einer Bestellung persönlich bestätigt. Ein Original ist ein Einzelstück; Prints sind separat erhältlich.</p>
          <div class="artwork-detail-actions"><a class="button button-dark" data-enquiry>Werk anfragen <span aria-hidden="true">↗</span></a><a class="text-link" href="shop.html#prints">Prints entdecken <span aria-hidden="true">→</span></a></div>
          <p class="artwork-detail-back"><a href="galerie.html">← Zurück zur Galerie</a></p>
        </div>
      </div>
    </section>
    <section class="artwork-story-section wrap"><div class="artwork-story-label"><p class="eyebrow">HINTER DEM BILD</p><h2>Ein Moment in <em>Licht.</em></h2></div><div class="artwork-story-copy"><p data-story></p><p class="artwork-story-note">Werkdetails basieren auf dem aktuellen Atelier-Katalog. Weitere Informationen zu Rahmung, Pflege oder individueller Präsentation können vor einer Anfrage persönlich geklärt werden.</p></div></section>
    <section class="artwork-purchase-notes wrap"><article><span>01 / ORIGINAL</span><h3>Einzelstück</h3><p>Der angezeigte Status und Preis werden vor einer verbindlichen Bestellung persönlich bestätigt.</p></article><article><span>02 / PRINTS</span><h3>Dein Lieblingsmotiv</h3><p>Fine-Art-Prints in A6 und A5 findest du im Shop, sofern das Motiv angeboten wird.</p><a href="shop.html#prints">Prints ansehen ↗</a></article><article><span>03 / VERSAND</span><h3>Sorgfältig planen</h3><p>Versandkosten, Lieferdetails und Widerrufshinweise findest du auf der Informationsseite.</p><a href="legal.html">Versand & Rechtliches ↗</a></article></section>
    <section class="artwork-related section wrap"><div class="section-head"><div><p class="eyebrow">WEITER ENTDECKEN</p><h2>Weitere <em>Arbeiten.</em></h2></div><a class="text-link" href="galerie.html">Alle Werke <span aria-hidden="true">↗</span></a></div><div class="art-grid artwork-related-grid"></div></section>
    <dialog class="artwork-lightbox" aria-label="Vergrößerte Werkansicht"><button type="button" class="artwork-lightbox-close" aria-label="Vergrößerung schließen">×</button><img alt=""><p></p></dialog>`;
    root.querySelector('[data-breadcrumb]').textContent=work.title;
    const image=root.querySelector('.artwork-detail-image');image.src=work.img;image.alt=work.title+', '+work.medium;
    root.querySelector('[data-place]').textContent=place+' · '+work.year;
    root.querySelector('[data-title]').textContent=work.title;
    root.querySelector('[data-medium]').textContent=work.medium;
    root.querySelector('[data-series]').textContent=place;
    root.querySelector('[data-year]').textContent=work.year;
    root.querySelector('[data-story]').textContent=story;
    const status=root.querySelector('.artwork-availability');status.textContent=work.status||'Verfügbarkeit auf Anfrage';if(available)status.classList.add('is-available');else status.classList.add('is-unavailable');
    root.querySelector('[data-price]').textContent=price;
    const enquiry=root.querySelector('[data-enquiry]');
    enquiry.href='mailto:morenadenigro@gmail.com?subject='+encodeURIComponent('Anfrage zum Werk: '+work.title)+'&body='+encodeURIComponent('Hallo Morena,\n\nich interessiere mich für das Werk „'+work.title+'“. Kannst du mir mehr über Verfügbarkeit, Details und Versand erzählen?\n\nViele Grüße');
    enquiry.textContent=available?'Original anfragen ↗':work.status==='Verkauft'?'Frage zum verkauften Werk ↗':'Verfügbarkeit anfragen ↗';
    document.title=work.title+' — Morena Denigro';
    const description=document.querySelector('meta[name="description"]');if(description)description.content=work.title+' von Morena Denigro. '+work.medium+'. Werkgeschichte, Details und Verfügbarkeit.';
    const related=works.filter(item=>item.id!==work.id).sort((a,b)=>(a.series===work.series?0:1)-(b.series===work.series?0:1)).slice(0,3);
    root.querySelector('.artwork-related-grid').innerHTML=related.map(item=>'<article class="art-card"><a class="art-image" href="artwork.html?id='+encodeURIComponent(item.id)+'"><img src="'+item.img+'" alt="'+item.title+', '+item.medium+'" loading="lazy"><span class="art-label glass">'+item.year+'</span></a><div class="art-info"><div><h3><a class="artwork-title-link" href="artwork.html?id='+encodeURIComponent(item.id)+'">'+item.title+'</a></h3><p>'+item.medium+'</p></div><span class="price">'+(item.price==null?'Auf Anfrage':euro(item.price))+'</span></div></article>').join('');
    const lightbox=root.querySelector('.artwork-lightbox'), zoom=lightbox.querySelector('img');
    const open=()=>{zoom.src=work.img;zoom.alt=work.title+', '+work.medium;lightbox.querySelector('p').textContent=work.title+' · '+work.medium;if(typeof lightbox.showModal==='function')lightbox.showModal();else lightbox.setAttribute('open','')};
    root.querySelector('.artwork-detail-image-button').addEventListener('click',open);
    lightbox.querySelector('.artwork-lightbox-close').addEventListener('click',()=>lightbox.close());
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});
  };
  const id=new URLSearchParams(location.search).get('id');
  fetch('/api/catalogue').then(r=>r.ok?r.json():null).then(result=>{if(result&&Array.isArray(result.works)&&result.works.length)works=result.works.map(w=>({...w,price:w.price==null?null:Number(w.price)}));render()}).catch(render);
  document.addEventListener('morena:catalogue-updated',render);
})();
