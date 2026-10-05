<!--meta {"title": "Aigen – apps for businesses | Preview 3", "description": "Aigen builds apps for legal obligations, reporting and recurring work, and custom AI automation for businesses in Finland and across Europe."} -->
    <section class="home-hero wrap" aria-labelledby="hero-title">
      <div class="home-hero-grid">
        <div>
          <p class="kicker">AI Generation Oy · a Finnish software company</p>
          <h1 id="hero-title">Apps for work that has to be done&nbsp;right.</h1>
          <p class="home-lead">We build apps for legal obligations, reporting and the recurring work of everyday business. If the right app doesn’t exist yet, we build it for you.</p>

          <form class="finder" action="{{url:apps}}" method="get" role="search">
            <label class="finder-label" for="etusivu-haku">What do you need to get done?</label>
            <div class="search-row">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
              <input id="etusivu-haku" type="search" name="q" placeholder="E.g. whistleblowing channel or emissions reporting" autocomplete="off" enterkeyhint="search">
              <button class="button button-primary" type="submit">Find<span class="long">&nbsp;an app</span></button>
            </div>
          </form>

          <nav class="browse" aria-labelledby="browse-title">
            <h2 id="browse-title">Or browse by task</h2>
            <ul>
              <li><a href="{{url:apps}}?task=obligations">Legal obligations <span class="n" data-count-category="velvoitteet">4</span></a></li>
              <li><a href="{{url:apps}}?task=reporting">Reporting and finance <span class="n" data-count-category="raportointi">2</span></a></li>
              <li><a href="{{url:apps}}?task=people">People and workplace <span class="n" data-count-category="henkilosto">2</span></a></li>
              <li><a href="{{url:apps}}?task=work">Organising work <span class="n" data-count-category="tyo">1</span></a></li>
              <li><a href="{{url:apps}}?task=communication">Communication and marketing <span class="n" data-count-category="viestinta">1</span></a></li>
            </ul>
          </nav>
        </div>

        <aside class="featured" aria-labelledby="featured-title">
          <div class="featured-head">
            <h2 id="featured-title">Featured</h2>
            <p>Available now</p>
          </div>
          <ul class="featured-list">
            <li class="feat">
              <img src="/testi-sivu3/assets/kuvakkeet/ilmoo.svg" alt="" width="52" height="52">
              <p class="use">Internal whistleblowing channel</p>
              <h3><a href="{{url:app-ilmoo}}">Ilmoo</a></h3>
              <p class="sum">Staff report misconduct in writing and anonymously. Handlers see the statutory deadlines.</p>
              <p class="price"><b>€19.90</b> /month + VAT · first month free</p>
            </li>
            <li class="feat">
              <img src="/testi-sivu3/assets/kuvakkeet/aigen-cbam.png" alt="" width="52" height="52">
              <p class="use">CBAM reporting preparation</p>
              <h3><a href="{{url:app-aigen-cbam}}">Aigen CBAM</a></h3>
              <p class="sum">For importers: import, supplier and emissions data in one place, and the annual declaration data prepared.</p>
              <p class="price"><b>€39</b> /month + VAT · 30-day trial</p>
            </li>
          </ul>
          <a class="all-apps" href="{{url:apps}}">All apps <span class="mono"><span data-count-audience="">7</span> →</span></a>
        </aside>
      </div>
    </section>

    <section class="paths" aria-labelledby="paths-title">
      <div class="wrap">
        <h2 id="paths-title" class="visually-hidden">What Aigen does</h2>
        <ul class="path-grid">
          <li>
            <p class="mini-kicker">Ready-made apps</p>
            <h3><a href="{{url:apps}}">Apps</a></h3>
            <p>Set them up yourself, with the price shown up front. Search and categories help even if you don’t know the app’s name.</p>
          </li>
          <li>
            <p class="mini-kicker">Built for you</p>
            <h3><a href="{{url:custom}}">Custom development</a></h3>
            <p>AI agents, automation and software built around your own data and systems. We start with one workflow.</p>
          </li>
          <li>
            <p class="mini-kicker">Learning materials</p>
            <h3><a href="{{url:guides}}">Guides and blog</a></h3>
            <p>Guides to EU rules, AI agents and automation, and articles on using agents in everyday work.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="custom-teaser" aria-labelledby="custom-title">
      <div class="wrap custom-grid">
        <div class="custom-intro">
          <p class="kicker">Custom development</p>
          <h2 id="custom-title">Can’t find the right app? We’ll build it for you.</h2>
          <p>When an off-the-shelf app isn’t enough, we build software or AI automation around your own data and systems. We start with one workflow that repeats every week.</p>
          <div class="actions">
            <a class="button button-primary" href="{{url:custom}}">About custom development</a>
            <a class="arrow-link" href="mailto:contact@aigen.fi?subject=Custom%20development">Tell us about the workflow</a>
          </div>
        </div>
        <ol class="pipeline" aria-label="Example of one bounded workflow">
          <li><span>Data</span>Documents, spreadsheets, systems</li>
          <li><span>Agent</span>Finds, combines and drafts</li>
          <li class="human"><span>Human</span>Reviews exceptions and approves</li>
          <li><span>Done</span>Result and a log of what was done</li>
        </ol>
      </div>
    </section>

    <section class="learn" aria-labelledby="learn-title">
      <div class="wrap">
        <div class="related-head"><h2 id="learn-title">Guides for businesses</h2><a class="arrow-link" href="{{url:guides}}">All guides</a></div>
        <!--@guide-cards-->
        <div class="related-head blog-head"><h2>Latest from the blog</h2><a class="arrow-link" href="{{url:blog}}">All articles</a></div>
        <!--@latest-posts-->
      </div>
    </section>

    <section class="why" id="why" aria-labelledby="why-title">
      <div class="wrap why-grid">
        <p class="kicker">Why we do this</p>
        <h2 id="why-title">Obligations apply to companies without an IT department, too.</h2>
        <div class="why-text">
          <p>That’s why we build apps you can set up without an IT project, with the price visible up front. We also tell you what they don’t do, so you know what stays on your side.</p>
          <p>We use AI agents in our own daily work, and we use the same skills when we build automation for clients.</p>
          <p><a class="arrow-link" href="{{url:company}}">More about us</a></p>
        </div>
      </div>
    </section>

    <section class="contact" id="contact" aria-labelledby="contact-title">
      <div class="wrap contact-grid">
        <div>
          <h2 id="contact-title">Tell us what you need to get done.</h2>
          <p>A few sentences by email is enough to start. If you already know which app you need, you can start straight from its page.</p>
        </div>
        <div class="contact-links">
          <a class="contact-mail" href="mailto:contact@aigen.fi">contact@aigen.fi</a>
          <ul>
            <li><a href="{{url:apps}}">Apps <span class="mono">all in one place</span><span aria-hidden="true">→</span></a></li>
            <li><a href="https://www.linkedin.com/company/ai-generation-oy/" rel="noopener">LinkedIn <span class="mono">AI Generation Oy</span><span aria-hidden="true">↗</span></a></li>
          </ul>
        </div>
      </div>
    </section>
