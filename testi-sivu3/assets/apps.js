/*
  Aigen app catalog: the single source of truth for catalog cards, homepage counts and related apps.

  Adding an app = adding one object to `apps`. Rules:
  - Only real, verified facts. No invented prices or features. Leave `price` null if it isn't public.
  - `status`: "saatavilla" (can be started now), "beta" or "tulossa" (not available, no start CTA).
  - `audience`: "yritykset" (business software) or "muut" (games, consumer apps and experiments).
    Business and other projects are shown in separate catalog views.
  - `categories`: one or more ids from `categories` for the same audience.
  - `href`: preview detail page, existing product page or the app's own site. `link` tells which:
    "detail" | "page" | "external".
  - `icon`: real app icon if one exists; otherwise a neutral monogram is drawn from the name.
  - `featured`: homepage shows at most three featured apps (curated by hand in index.html).
*/
window.AIGEN_CATALOG = {
  audiences: [
    { id: "yritykset", label: "Yrityksille", hint: "Sovellukset yritysten ja organisaatioiden työhön" },
    { id: "muut", label: "Pelit ja kokeilut", hint: "Kuluttajille tarkoitetut sovellukset ja kokeiluprojektit" }
  ],

  categories: [
    { id: "velvoitteet", audience: "yritykset", label: "Lakisääteiset velvoitteet" },
    { id: "raportointi", audience: "yritykset", label: "Raportointi ja talous" },
    { id: "henkilosto", audience: "yritykset", label: "Henkilöstö ja työyhteisö" },
    { id: "tyo", audience: "yritykset", label: "Työn organisointi" },
    { id: "viestinta", audience: "yritykset", label: "Viestintä ja markkinointi" },
    { id: "pelit", audience: "muut", label: "Pelit" },
    { id: "kokeilut", audience: "muut", label: "Tekoälykokeilut" }
  ],

  statuses: [
    { id: "saatavilla", label: "Saatavilla" },
    { id: "beta", label: "Beta" },
    { id: "tulossa", label: "Tulossa" }
  ],

  apps: [
    {
      id: "ilmoo",
      name: "Ilmoo",
      useCase: "Sisäinen ilmoituskanava",
      summary: "Henkilöstö voi ilmoittaa väärinkäytöksistä kirjallisesti ja nimettömästi, ja käsittelijät näkevät lain määräajat.",
      audience: "yritykset",
      categories: ["velvoitteet", "henkilosto"],
      status: "saatavilla",
      price: { amount: "19,90 €", unit: "/kk + alv", note: "1. kuukausi ilmaiseksi" },
      href: "/testi-sivu3/sovellukset/ilmoo/",
      link: "detail",
      icon: "/testi-sivu3/assets/kuvakkeet/ilmoo.svg",
      keywords: "whistleblowing ilmoittajansuojelulaki 1171/2022 direktiivi 2019/1937 väärinkäytös ilmianto ilmoittaja nimetön anonyymi hr palaute",
      featured: 1
    },
    {
      id: "aigen-cbam",
      name: "Aigen CBAM",
      useCase: "CBAM-raportoinnin valmistelu",
      summary: "Kokoaa tuonti-, toimittaja- ja päästötiedot yhteen ja valmistelee vuosi-ilmoituksen aineiston.",
      audience: "yritykset",
      categories: ["raportointi", "velvoitteet"],
      status: "saatavilla",
      price: { amount: "39 €", unit: "/kk + alv", note: "30 päivän kokeilu" },
      href: "/testi-sivu3/sovellukset/aigen-cbam/",
      link: "detail",
      icon: "/testi-sivu3/assets/kuvakkeet/aigen-cbam.png",
      keywords: "cbam hiilirajamekanismi päästöt päästöraportointi maahantuonti tuonti maahantuoja tulli cn-koodi vuosi-ilmoitus 2023/956 ympäristö vastuullisuus toimittajat",
      featured: 2
    },
    {
      id: "draftpad",
      name: "Draftpad",
      useCase: "Tekstien luonnostelu ja yhteistyö",
      summary: "Tiimi ja omat AI-agentit luonnostelevat, kommentoivat ja versioivat tekstejä samassa työtilassa.",
      audience: "yritykset",
      categories: ["tyo", "viestinta"],
      status: "saatavilla",
      price: null,
      language: "Englanninkielinen",
      href: "https://draftpad.aigen.fi/",
      link: "external",
      icon: null,
      keywords: "kirjoittaminen teksti luonnos sisältö julkaisu some postaus kommentointi versiohistoria agentit api tiimi"
    },
    {
      id: "tasapay",
      name: "TasaPay",
      useCase: "Palkka-avoimuuden raportointi",
      summary: "Kokoaa palkkadatan vertailukelpoiseen muotoon ja nostaa esiin tarkistettavat palkkaerot.",
      audience: "yritykset",
      categories: ["raportointi", "henkilosto", "velvoitteet"],
      status: "tulossa",
      price: null,
      href: "/tuotteet/tasapay/",
      link: "page",
      icon: null,
      keywords: "palkka-avoimuus palkka-avoimuusdirektiivi 2023/970 palkkaerot palkkatasa-arvo palkka palkat hr henkilöstöhallinto"
    },
    {
      id: "gpsrdocs",
      name: "GPSRdocs",
      useCase: "Tuoteturvallisuuden dokumentaatio",
      summary: "Kokoaa tuotekohtaiset riskiarviot, liitteet ja vastuuhenkilöt yhteen tarkistettavaan näkymään.",
      audience: "yritykset",
      categories: ["velvoitteet"],
      status: "tulossa",
      price: null,
      href: "/tuotteet/gpsrdocs/",
      link: "page",
      icon: null,
      keywords: "gpsr tuoteturvallisuus tuoteturvallisuusasetus 2023/988 riskiarvio kuluttajatuotteet dokumentaatio maahantuoja valmistaja verkkokauppa"
    },
    {
      id: "spawnpad",
      name: "Spawnpad",
      useCase: "Selainpelit",
      summary: "Ilmaisia Three.js-selainpelejä pelattavaksi ja paikka julkaista oma peli.",
      audience: "muut",
      categories: ["pelit"],
      status: "saatavilla",
      price: { amount: "Ilmainen", unit: "pelata", note: null },
      language: "Englanninkielinen",
      href: "https://spawnpad.gg/",
      link: "external",
      icon: "/testi-sivu3/assets/kuvakkeet/spawnpad.svg",
      keywords: "peli pelit pelata selainpeli three.js arcade julkaise"
    },
    {
      id: "clawspam",
      name: "ClawSpam",
      useCase: "Sosiaalinen verkosto AI-agenteille",
      summary: "AI-agenteilla on omat profiilit, syöte ja keskustelut yhdessä paikassa.",
      audience: "muut",
      categories: ["kokeilut"],
      status: "beta",
      price: null,
      language: "Englanninkielinen",
      href: "https://clawspam.com/",
      link: "external",
      icon: "/testi-sivu3/assets/kuvakkeet/clawspam.png",
      keywords: "agentit ai-agentit sosiaalinen media verkosto syöte kokeilu"
    }
  ]
};
