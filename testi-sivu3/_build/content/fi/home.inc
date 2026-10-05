<!--meta {"title": "Aigen – sovelluksia yrityksille | Esikatselu 3", "description": "Aigen tekee yrityksille sovelluksia lakisääteisiin velvoitteisiin, raportointiin ja toistuvaan työhön, ja rakentaa räätälöityä automaatiota."} -->
    <section class="home-hero wrap" aria-labelledby="hero-title">
      <div class="home-hero-grid">
        <div>
          <p class="kicker">AI Generation Oy · suomalainen ohjelmistoyritys</p>
          <h1 id="hero-title">Sovelluksia työhön, joka pitää hoitaa&nbsp;oikein.</h1>
          <p class="home-lead">Teemme yrityksille sovelluksia lakisääteisiin velvoitteisiin, raportointiin ja arjen toistuvaan työhön. Jos sopivaa sovellusta ei vielä ole, rakennamme sen teille.</p>

          <form class="finder" action="{{url:apps}}" method="get" role="search">
            <label class="finder-label" for="etusivu-haku">Mitä haluat hoitaa?</label>
            <div class="search-row">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
              <input id="etusivu-haku" type="search" name="q" placeholder="Esim. ilmoituskanava tai päästöraportointi" autocomplete="off" enterkeyhint="search">
              <button class="button button-primary" type="submit">Etsi<span class="long">&nbsp;sovellus</span></button>
            </div>
          </form>

          <nav class="browse" aria-labelledby="browse-title">
            <h2 id="browse-title">Tai selaa tehtävän mukaan</h2>
            <ul>
              <li><a href="{{url:apps}}?tehtava=velvoitteet">Lakisääteiset velvoitteet <span class="n" data-count-category="velvoitteet">4</span></a></li>
              <li><a href="{{url:apps}}?tehtava=raportointi">Raportointi ja talous <span class="n" data-count-category="raportointi">2</span></a></li>
              <li><a href="{{url:apps}}?tehtava=henkilosto">Henkilöstö ja työyhteisö <span class="n" data-count-category="henkilosto">2</span></a></li>
              <li><a href="{{url:apps}}?tehtava=tyo">Työn organisointi <span class="n" data-count-category="tyo">1</span></a></li>
              <li><a href="{{url:apps}}?tehtava=viestinta">Viestintä ja markkinointi <span class="n" data-count-category="viestinta">1</span></a></li>
            </ul>
          </nav>
        </div>

        <aside class="featured" aria-labelledby="featured-title">
          <div class="featured-head">
            <h2 id="featured-title">Esillä nyt</h2>
            <p>Saatavilla heti</p>
          </div>
          <ul class="featured-list">
            <li class="feat">
              <img src="/testi-sivu3/assets/kuvakkeet/ilmoo.svg" alt="" width="52" height="52">
              <p class="use">Sisäinen ilmoituskanava</p>
              <h3><a href="{{url:app-ilmoo}}">Ilmoo</a></h3>
              <p class="sum">Henkilöstö ilmoittaa väärinkäytöksistä kirjallisesti ja nimettömästi. Käsittelijät näkevät lain määräajat.</p>
              <p class="price"><b>19,90 €</b> /kk + alv · 1. kuukausi ilmaiseksi</p>
            </li>
            <li class="feat">
              <img src="/testi-sivu3/assets/kuvakkeet/aigen-cbam.png" alt="" width="52" height="52">
              <p class="use">CBAM-raportoinnin valmistelu</p>
              <h3><a href="{{url:app-aigen-cbam}}">Aigen CBAM</a></h3>
              <p class="sum">Maahantuojalle: tuonti-, toimittaja- ja päästötiedot yhteen ja vuosi-ilmoituksen aineisto valmiiksi.</p>
              <p class="price"><b>39 €</b> /kk + alv · 30 päivän kokeilu</p>
            </li>
          </ul>
          <a class="all-apps" href="{{url:apps}}">Kaikki sovellukset <span class="mono"><span data-count-audience="">7</span> kpl →</span></a>
        </aside>
      </div>
    </section>

    <section class="paths" aria-labelledby="paths-title">
      <div class="wrap">
        <h2 id="paths-title" class="visually-hidden">Mitä Aigen tekee</h2>
        <ul class="path-grid">
          <li>
            <p class="mini-kicker">Valmiit sovellukset</p>
            <h3><a href="{{url:apps}}">Sovellukset</a></h3>
            <p>Otatte käyttöön itse, hinta näkyy etukäteen. Haku ja luokat auttavat, vaikka sovelluksen nimeä ei tietäisi.</p>
          </li>
          <li>
            <p class="mini-kicker">Omaan tarpeeseen</p>
            <h3><a href="{{url:custom}}">Räätälöity kehitys</a></h3>
            <p>Tekoälyagentit, automaatio ja ohjelmistot yrityksenne omaan dataan ja järjestelmiin. Aloitamme yhdestä työnkulusta.</p>
          </li>
          <li>
            <p class="mini-kicker">Oppimateriaalit</p>
            <h3><a href="{{url:guides}}">Oppaat ja blogi</a></h3>
            <p>Oppaat EU-sääntelyyn, tekoälyagentteihin ja automaatioon sekä kirjoituksia agenttien käytöstä arjessa.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="custom-teaser" aria-labelledby="custom-title">
      <div class="wrap custom-grid">
        <div class="custom-intro">
          <p class="kicker">Räätälöity kehitys</p>
          <h2 id="custom-title">Etkö löydä sopivaa sovellusta? Rakennetaan se teille.</h2>
          <p>Kun valmis sovellus ei riitä, rakennamme ohjelmiston tai tekoälyautomaation yrityksenne omaan dataan ja järjestelmiin. Aloitamme yhdestä työnkulusta, joka toistuu joka viikko.</p>
          <div class="actions">
            <a class="button button-primary" href="{{url:custom}}">Lue räätälöidystä kehityksestä</a>
            <a class="arrow-link" href="mailto:contact@aigen.fi?subject=R%C3%A4%C3%A4t%C3%A4l%C3%B6ity%20kehitys">Kerro työnkulusta</a>
          </div>
        </div>
        <ol class="pipeline" aria-label="Esimerkki yhdestä rajatusta työnkulusta">
          <li><span>Data</span>Dokumentit, taulukot, järjestelmät</li>
          <li><span>Agentti</span>Hakee, yhdistää ja luonnostelee</li>
          <li class="human"><span>Ihminen</span>Tarkistaa poikkeamat ja hyväksyy</li>
          <li><span>Valmis</span>Lopputulos ja loki siitä, mitä tehtiin</li>
        </ol>
      </div>
    </section>

    <section class="learn" aria-labelledby="learn-title">
      <div class="wrap">
        <div class="related-head"><h2 id="learn-title">Oppaat yrityksille</h2><a class="arrow-link" href="{{url:guides}}">Kaikki oppaat</a></div>
        <!--@guide-cards-->
        <div class="related-head blog-head"><h2>Uusimmat blogikirjoitukset</h2><a class="arrow-link" href="{{url:blog}}">Kaikki kirjoitukset</a></div>
        <!--@latest-posts-->
      </div>
    </section>

    <section class="why" id="miksi" aria-labelledby="why-title">
      <div class="wrap why-grid">
        <p class="kicker">Miksi teemme tätä</p>
        <h2 id="why-title">Velvoitteet koskevat myös yrityksiä, joilla ei ole omaa <span class="nowrap">IT-osastoa</span>.</h2>
        <div class="why-text">
          <p>Siksi teemme sovelluksia, jotka voi ottaa käyttöön ilman <span class="nowrap">IT-projektia</span> ja joiden hinnan näkee etukäteen. Kerromme myös, mitä ne eivät tee. Silloin tiedätte, mikä jää teidän hoidettavaksenne.</p>
          <p>Käytämme tekoälyagentteja omassa päivittäisessä työssämme. Samaa osaamista käytämme, kun rakennamme automaatiota asiakkaille.</p>
          <p><a class="arrow-link" href="{{url:company}}">Lue lisää meistä</a></p>
        </div>
      </div>
    </section>

    <section class="contact" id="yhteys" aria-labelledby="contact-title">
      <div class="wrap contact-grid">
        <div>
          <h2 id="contact-title">Kerro, mitä teidän pitää saada hoidettua.</h2>
          <p>Muutama lause sähköpostissa riittää alkuun. Jos tiedätte jo, mitä sovellusta tarvitsette, voitte aloittaa suoraan sen sivulta.</p>
        </div>
        <div class="contact-links">
          <a class="contact-mail" href="mailto:contact@aigen.fi">contact@aigen.fi</a>
          <ul>
            <li><a href="{{url:apps}}">Sovellukset <span class="mono">kaikki yhdessä paikassa</span><span aria-hidden="true">→</span></a></li>
            <li><a href="https://www.linkedin.com/company/ai-generation-oy/" rel="noopener">LinkedIn <span class="mono">AI Generation Oy</span><span aria-hidden="true">↗</span></a></li>
          </ul>
        </div>
      </div>
    </section>
