/*
  Aigen app catalog: single source of truth for catalog cards, homepage counts and related apps (FI + EN).

  Adding an app = adding one object to `apps`. Rules:
  - Only real, verified facts. No invented prices or features. Leave `price` null if it isn't public.
  - `status`: "saatavilla" (can be started now), "beta" or "tulossa" (not available, no start CTA).
  - `audience`: "yritykset" (business software) or "muut" (games, consumer apps and experiments).
  - `categories`: one or more category ids of the same audience.
  - `path`: detail page per language. Every app has its own preview detail page.
  - Text fields live under `fi` and `en`. Search uses the current language only.
  - `icon`: real app icon if one exists; otherwise a neutral monogram is drawn from the name.
  - `featured`: homepage shows at most three featured apps (curated by hand in the page content).
  - Slugs: `slug.fi` / `slug.en` are the values used in catalog URLs (?tehtava= / ?task=).
*/
window.AIGEN_CATALOG = {
  audiences: [
    { id: "yritykset", slug: { fi: "yritykset", en: "business" }, fi: "Yrityksille", en: "For business" },
    { id: "muut", slug: { fi: "muut", en: "other" }, fi: "Pelit ja kokeilut", en: "Games and experiments" }
  ],

  categories: [
    { id: "velvoitteet", audience: "yritykset", slug: { fi: "velvoitteet", en: "obligations" }, fi: "Lakisääteiset velvoitteet", en: "Legal obligations" },
    { id: "raportointi", audience: "yritykset", slug: { fi: "raportointi", en: "reporting" }, fi: "Raportointi ja talous", en: "Reporting and finance" },
    { id: "henkilosto", audience: "yritykset", slug: { fi: "henkilosto", en: "people" }, fi: "Henkilöstö ja työyhteisö", en: "People and workplace" },
    { id: "tyo", audience: "yritykset", slug: { fi: "tyo", en: "work" }, fi: "Työn organisointi", en: "Organising work" },
    { id: "viestinta", audience: "yritykset", slug: { fi: "viestinta", en: "communication" }, fi: "Viestintä ja markkinointi", en: "Communication and marketing" },
    { id: "pelit", audience: "muut", slug: { fi: "pelit", en: "games" }, fi: "Pelit", en: "Games" },
    { id: "kokeilut", audience: "muut", slug: { fi: "kokeilut", en: "experiments" }, fi: "Tekoälykokeilut", en: "AI experiments" }
  ],

  statuses: [
    { id: "saatavilla", slug: { fi: "saatavilla", en: "available" }, fi: "Saatavilla", en: "Available" },
    { id: "beta", slug: { fi: "beta", en: "beta" }, fi: "Beta", en: "Beta" },
    { id: "tulossa", slug: { fi: "tulossa", en: "coming" }, fi: "Tulossa", en: "Coming" }
  ],

  apps: [
    {
      id: "ilmoo",
      name: "Ilmoo",
      audience: "yritykset",
      categories: ["velvoitteet", "henkilosto"],
      status: "saatavilla",
      icon: "/testi-sivu3/assets/kuvakkeet/ilmoo.svg",
      path: { fi: "/testi-sivu3/sovellukset/ilmoo/", en: "/testi-sivu3/en/apps/ilmoo/" },
      site: "https://ilmoo.fi/",
      featured: 1,
      fi: {
        useCase: "Sisäinen ilmoituskanava",
        summary: "Henkilöstö voi ilmoittaa väärinkäytöksistä kirjallisesti ja nimettömästi, ja käsittelijät näkevät lain määräajat.",
        price: { amount: "19,90 €", unit: "/kk + alv", note: "1. kuukausi ilmaiseksi" },
        keywords: "whistleblowing ilmoittajansuojelulaki 1171/2022 direktiivi 2019/1937 väärinkäytös ilmianto ilmoittaja nimetön anonyymi hr palaute"
      },
      en: {
        useCase: "Internal whistleblowing channel",
        summary: "Staff can report misconduct in writing and anonymously, and handlers see the statutory deadlines.",
        price: { amount: "€19.90", unit: "/month + VAT", note: "First month free" },
        keywords: "whistleblowing whistleblower protection act 1171/2022 directive 2019/1937 misconduct report reporter anonymous hr feedback"
      }
    },
    {
      id: "aigen-cbam",
      name: "Aigen CBAM",
      audience: "yritykset",
      categories: ["raportointi", "velvoitteet"],
      status: "saatavilla",
      icon: "/testi-sivu3/assets/kuvakkeet/aigen-cbam.png",
      path: { fi: "/testi-sivu3/sovellukset/aigen-cbam/", en: "/testi-sivu3/en/apps/aigen-cbam/" },
      site: "https://cbam.fi/",
      featured: 2,
      fi: {
        useCase: "CBAM-raportoinnin valmistelu",
        summary: "Kokoaa tuonti-, toimittaja- ja päästötiedot yhteen ja valmistelee vuosi-ilmoituksen aineiston.",
        price: { amount: "39 €", unit: "/kk + alv", note: "30 päivän kokeilu" },
        keywords: "cbam hiilirajamekanismi päästöt päästöraportointi maahantuonti tuonti maahantuoja tulli cn-koodi vuosi-ilmoitus 2023/956 ympäristö vastuullisuus toimittajat"
      },
      en: {
        useCase: "CBAM reporting preparation",
        summary: "Brings import, supplier and emissions data together and prepares the annual declaration data.",
        price: { amount: "€39", unit: "/month + VAT", note: "30-day trial" },
        keywords: "cbam carbon border adjustment mechanism emissions reporting imports importer customs cn code annual declaration 2023/956 environment sustainability suppliers"
      }
    },
    {
      id: "draftpad",
      name: "Draftpad",
      audience: "yritykset",
      categories: ["tyo", "viestinta"],
      status: "saatavilla",
      icon: null,
      path: { fi: "/testi-sivu3/sovellukset/draftpad/", en: "/testi-sivu3/en/apps/draftpad/" },
      site: "https://draftpad.aigen.fi/",
      fi: {
        useCase: "Tekstien luonnostelu ja yhteistyö",
        summary: "Tiimi ja omat AI-agentit luonnostelevat, kommentoivat ja versioivat tekstejä samassa työtilassa.",
        price: null,
        language: "Englanninkielinen",
        keywords: "kirjoittaminen teksti luonnos sisältö julkaisu some postaus kommentointi versiohistoria agentit api tiimi"
      },
      en: {
        useCase: "Drafting and collaboration",
        summary: "Your team and your own AI agents draft, comment on and version texts in one workspace.",
        price: null,
        language: "In English",
        keywords: "writing text draft content publishing social post comments version history agents api team"
      }
    },
    {
      id: "tasapay",
      name: "TasaPay",
      audience: "yritykset",
      categories: ["raportointi", "henkilosto", "velvoitteet"],
      status: "tulossa",
      icon: null,
      path: { fi: "/testi-sivu3/sovellukset/tasapay/", en: "/testi-sivu3/en/apps/tasapay/" },
      fi: {
        useCase: "Palkka-avoimuuden raportointi",
        summary: "Kokoaa palkkadatan vertailukelpoiseen muotoon ja nostaa esiin tarkistettavat palkkaerot.",
        price: null,
        keywords: "palkka-avoimuus palkka-avoimuusdirektiivi 2023/970 palkkaerot palkkatasa-arvo palkka palkat hr henkilöstöhallinto"
      },
      en: {
        useCase: "Pay transparency reporting",
        summary: "Brings pay data into comparable form and highlights pay gaps that need review.",
        price: null,
        keywords: "pay transparency directive 2023/970 pay gap equal pay salary wages hr human resources"
      }
    },
    {
      id: "gpsrdocs",
      name: "GPSRdocs",
      audience: "yritykset",
      categories: ["velvoitteet"],
      status: "tulossa",
      icon: null,
      path: { fi: "/testi-sivu3/sovellukset/gpsrdocs/", en: "/testi-sivu3/en/apps/gpsrdocs/" },
      fi: {
        useCase: "Tuoteturvallisuuden dokumentaatio",
        summary: "Kokoaa tuotekohtaiset riskiarviot, liitteet ja vastuuhenkilöt yhteen tarkistettavaan näkymään.",
        price: null,
        keywords: "gpsr tuoteturvallisuus tuoteturvallisuusasetus 2023/988 riskiarvio kuluttajatuotteet dokumentaatio maahantuoja valmistaja verkkokauppa"
      },
      en: {
        useCase: "Product safety documentation",
        summary: "Brings product-specific risk assessments, attachments and owners into one reviewable view.",
        price: null,
        keywords: "gpsr general product safety regulation 2023/988 risk assessment consumer products documentation importer manufacturer online store"
      }
    },
    {
      id: "spawnpad",
      name: "Spawnpad",
      audience: "muut",
      categories: ["pelit"],
      status: "saatavilla",
      icon: "/testi-sivu3/assets/kuvakkeet/spawnpad.svg",
      path: { fi: "/testi-sivu3/sovellukset/spawnpad/", en: "/testi-sivu3/en/apps/spawnpad/" },
      site: "https://spawnpad.gg/",
      fi: {
        useCase: "Selainpelit",
        summary: "Ilmaisia Three.js-selainpelejä pelattavaksi ja paikka julkaista oma peli.",
        price: { amount: "Ilmainen", unit: "pelata", note: null },
        language: "Englanninkielinen",
        keywords: "peli pelit pelata selainpeli three.js arcade julkaise"
      },
      en: {
        useCase: "Browser games",
        summary: "Free Three.js browser games to play and a place to publish your own.",
        price: { amount: "Free", unit: "to play", note: null },
        language: "In English",
        keywords: "game games play browser game three.js arcade publish"
      }
    },
    {
      id: "clawspam",
      name: "ClawSpam",
      audience: "muut",
      categories: ["kokeilut"],
      status: "beta",
      icon: "/testi-sivu3/assets/kuvakkeet/clawspam.png",
      path: { fi: "/testi-sivu3/sovellukset/clawspam/", en: "/testi-sivu3/en/apps/clawspam/" },
      site: "https://clawspam.com/",
      fi: {
        useCase: "Sosiaalinen verkosto AI-agenteille",
        summary: "AI-agenteilla on omat profiilit, syöte ja keskustelut yhdessä paikassa.",
        price: null,
        language: "Englanninkielinen",
        keywords: "agentit ai-agentit sosiaalinen media verkosto syöte kokeilu"
      },
      en: {
        useCase: "Social network for AI agents",
        summary: "AI agents get profiles, a feed and conversations in one place.",
        price: null,
        language: "In English",
        keywords: "agents ai agents social media network feed experiment"
      }
    }
  ]
};
