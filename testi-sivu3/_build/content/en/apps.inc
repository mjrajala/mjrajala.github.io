<!--meta {"title": "Apps – Aigen | Preview 3", "description": "Aigen apps for businesses: search by task and compare use case, status and price.", "scripts": ["catalog.js"]} -->
    <div class="wrap" id="katalogi">
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="{{url:home}}">Home</a></li>
            <li><span aria-current="page">Apps</span></li>
          </ol>
        </nav>
        <h1>Apps</h1>
        <p class="lead">Search by what you need to get done. You don’t need to know the app’s name.</p>

        <div class="catalog-controls">
          <div class="audience" role="group" aria-label="Show apps">
            <button type="button" data-audience="yritykset" aria-pressed="true">For business <span class="n" data-audience-count></span></button>
            <button type="button" data-audience="muut" aria-pressed="false">Games and experiments <span class="n" data-audience-count></span></button>
          </div>

          <form id="haku" class="catalog-search" role="search">
            <label class="visually-hidden" for="haku-kentta">Search apps</label>
            <div class="search-row">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
              <input id="haku-kentta" type="search" name="q" placeholder="Search by task or name" autocomplete="off" enterkeyhint="search" aria-describedby="tulos-maara">
              <button class="clear" id="haku-tyhjenna" type="button" aria-label="Clear search" hidden>×</button>
            </div>
          </form>
        </div>
      </div>

      <noscript>
        <div class="noscript-list">
          <p>Search and filters need JavaScript. Here are all apps:</p>
          <ul>
            <li><a href="{{url:app-ilmoo}}">Ilmoo</a> – internal whistleblowing channel (available)</li>
            <li><a href="{{url:app-aigen-cbam}}">Aigen CBAM</a> – CBAM reporting preparation (available)</li>
            <li><a href="{{url:app-draftpad}}">Draftpad</a> – drafting and collaboration (available)</li>
            <li><a href="{{url:app-tasapay}}">TasaPay</a> – pay transparency reporting (coming)</li>
            <li><a href="{{url:app-gpsrdocs}}">GPSRdocs</a> – product safety documentation (coming)</li>
            <li><a href="{{url:app-spawnpad}}">Spawnpad</a> – browser games (games and experiments)</li>
            <li><a href="{{url:app-clawspam}}">ClawSpam</a> – social network for AI agents (beta, games and experiments)</li>
          </ul>
        </div>
      </noscript>

      <div class="catalog-body">
        <aside class="filters" id="suodattimet" aria-labelledby="suodattimet-otsikko">
          <div class="filters-head">
            <h2 id="suodattimet-otsikko">Filter apps</h2>
            <button class="icon-button" id="sulje-suodattimet" type="button" aria-label="Close filters">×</button>
          </div>
          <fieldset>
            <legend>Task</legend>
            <div id="tehtava-valinnat"></div>
          </fieldset>
          <fieldset>
            <legend>Status</legend>
            <div id="tila-valinnat"></div>
          </fieldset>
          <div class="filters-foot">
            <button class="text-button" type="button" data-reset>Clear all</button>
            <button class="button button-primary" id="nayta-tulokset" type="button">Show apps</button>
          </div>
        </aside>

        <section aria-labelledby="tulokset-otsikko">
          <div class="results-bar">
            <h2 id="tulokset-otsikko"><span id="tulos-maara" aria-live="polite">7 apps</span></h2>
            <div class="results-tools">
              <button class="button filters-open" id="avaa-suodattimet" type="button" aria-controls="suodattimet" aria-expanded="false">Filter <span class="badge" id="suodatin-maara" hidden></span></button>
              <label class="sort"><span>Sort</span>
                <select id="jarjestys">
                  <option value="suositellut">Recommended</option>
                  <option value="nimi">Name A–Z</option>
                </select>
              </label>
            </div>
          </div>

          <div class="active-wrap" hidden>
            <ul id="aktiiviset" aria-label="Active filters"></ul>
            <button class="text-button" type="button" data-reset>Clear all</button>
          </div>
          <p class="other-hits" id="muut-osumat" hidden><button type="button"></button></p>

          <ul class="app-grid" id="sovellukset"></ul>

          <div class="empty" id="tyhja" hidden>
            <h3>No matches</h3>
            <p id="tyhja-teksti"></p>
            <p>Try another word or clear the filters. If no app fits, we can build one for you.</p>
            <div class="actions">
              <button class="button button-primary" type="button" data-reset>Clear search and filters</button>
              <a class="button" href="{{url:custom}}">Custom development</a>
            </div>
          </div>

          <div class="more"><button class="button" id="nayta-lisaa" type="button" hidden>Show more</button></div>

          <aside class="catalog-custom" aria-labelledby="custom-title">
            <div>
              <h2 id="custom-title">Didn’t find what you need?</h2>
              <p>We build software or AI automation around your own workflow.</p>
            </div>
            <a class="button button-primary" href="{{url:custom}}">Custom development</a>
          </aside>
        </section>
      </div>
    </div>
