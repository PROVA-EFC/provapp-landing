/* provapp — shared nav/footer + 5-language renderer for secondary pages.
   Each page defines window.PAGE = { slug, tr: {...}, en: {...}, de: {...}, fr: {...}, es: {...} }
   where each language object is { title, kicker, lead, updated?, sections: [ { kicker?, h, blocks: [...] } ] }.
   Block types: p, quote, h3, ul, ol, cards (cols, items[{h,p,metric,ref}]), refs (items), table (head, rows), note.
   Authored content only (no user input) is injected as HTML. */
(function () {
  'use strict';

  var LANGS = ['tr', 'en', 'de', 'fr', 'es'];
  var STORAGE_KEY = 'provapp-lang';

  var NAV = {
    tr: { home: 'Ana sayfa', about: 'Hakkımızda', methodology: 'Metodoloji', privacy: 'Gizlilik', tips: 'İpuçları', terms: 'Kullanım Şartları', app: 'Beta Uygulaması',
          sub: 'multimodal varlık, ses ve beden dili kalibrasyonu', rights: 'Tüm hakları saklıdır.', navLabel: 'Ana gezinme' },
    en: { home: 'Home', about: 'About', methodology: 'Methodology', privacy: 'Privacy', tips: 'Tips', terms: 'Terms', app: 'Beta App',
          sub: 'multimodal presence, voice & body-language calibration', rights: 'All rights reserved.', navLabel: 'Main navigation' },
    de: { home: 'Start', about: 'Über uns', methodology: 'Methodik', privacy: 'Datenschutz', tips: 'Tipps', terms: 'Nutzungsbedingungen', app: 'Beta-App',
          sub: 'multimodale Kalibrierung von Präsenz, Stimme & Körpersprache', rights: 'Alle Rechte vorbehalten.', navLabel: 'Hauptnavigation' },
    fr: { home: 'Accueil', about: 'À propos', methodology: 'Méthodologie', privacy: 'Confidentialité', tips: 'Conseils', terms: 'Conditions', app: 'Appli bêta',
          sub: 'calibration multimodale de la présence, de la voix et du langage corporel', rights: 'Tous droits réservés.', navLabel: 'Navigation principale' },
    es: { home: 'Inicio', about: 'Acerca de', methodology: 'Metodología', privacy: 'Privacidad', tips: 'Consejos', terms: 'Términos', app: 'App beta',
          sub: 'calibración multimodal de presencia, voz y lenguaje corporal', rights: 'Todos los derechos reservados.', navLabel: 'Navegación principal' }
  };

  var PAGES = [
    { key: 'about', href: 'about.html' },
    { key: 'methodology', href: 'methodology.html' },
    { key: 'privacy', href: 'privacy.html' },
    { key: 'tips', href: 'tips.html' },
    { key: 'terms', href: 'terms.html' }
  ];

  function detectLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && LANGS.indexOf(stored) >= 0) return stored;
    var nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
    return LANGS.indexOf(nav) >= 0 ? nav : 'en';
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function renderNav(lang) {
    var t = NAV[lang];
    var slug = (window.PAGE && window.PAGE.slug) || '';
    var header = document.getElementById('site-header');
    if (!header) return;
    header.innerHTML = '';
    var nav = el('nav', { 'class': 'nav', 'aria-label': t.navLabel });
    var brand = el('a', { 'class': 'brand', href: 'index.html', 'aria-label': 'provapp' },
      '<span class="brand-badge" aria-hidden="true"><img src="assets/provapp_mark.svg" alt=""></span>' +
      '<span><div class="brand-name">provapp</div><div class="brand-sub">' + t.sub + '</div></span>');
    nav.appendChild(brand);

    var links = el('div', { 'class': 'nav-links' });
    PAGES.forEach(function (p) {
      var a = el('a', { href: p.href, 'class': 'hide-sm' }, t[p.key]);
      if (p.key === slug) a.setAttribute('aria-current', 'page');
      links.appendChild(a);
    });
    links.appendChild(el('a', { href: 'https://app.provapp.app', rel: 'noopener' }, t.app));

    var sw = el('div', { 'class': 'lang', role: 'group', 'aria-label': 'Language' });
    LANGS.forEach(function (l) {
      var b = el('button', { type: 'button', 'data-set-lang': l, 'aria-pressed': String(l === lang) }, l.toUpperCase());
      b.addEventListener('click', function () { setLang(l); });
      sw.appendChild(b);
    });
    links.appendChild(sw);
    nav.appendChild(links);
    header.appendChild(nav);
  }

  function renderFooter(lang) {
    var t = NAV[lang];
    var f = document.getElementById('site-footer');
    if (!f) return;
    var links = PAGES.map(function (p) { return '<a href="' + p.href + '">' + t[p.key] + '</a>'; }).join('');
    f.innerHTML =
      '<div class="row">' +
        '<div>© ' + new Date().getFullYear() + ' provapp · PROVA-EFC · ' + t.rights + '</div>' +
        '<div class="links">' + links + '<a href="mailto:hello@provapp.app">hello@provapp.app</a></div>' +
      '</div>';
  }

  function renderBlock(b) {
    switch (b.type) {
      case 'p': return el('p', null, b.text);
      case 'quote': return el('div', { 'class': 'quote' }, b.text);
      case 'h3': return el('h3', null, b.text);
      case 'note': return el('p', { 'class': 'note' }, b.text);
      case 'ul':
      case 'ol': {
        var list = el(b.type);
        b.items.forEach(function (it) { list.appendChild(el('li', null, it)); });
        return list;
      }
      case 'refs': {
        var r = el('ul', { 'class': 'refs' });
        b.items.forEach(function (it) { r.appendChild(el('li', null, it)); });
        return r;
      }
      case 'cards': {
        var g = el('div', { 'class': b.cols === 2 ? 'grid-2' : 'grid-3' });
        b.items.forEach(function (c) {
          var card = el('article', { 'class': 'card' });
          card.appendChild(el('h3', null, c.h));
          if (c.p) card.appendChild(el('p', null, c.p));
          if (c.metric) card.appendChild(el('div', { 'class': 'metric' }, c.metric));
          if (c.ref) card.appendChild(el('div', { 'class': 'ref' }, c.ref));
          g.appendChild(card);
        });
        return g;
      }
      case 'table': {
        var wrap = el('div', { 'class': 'table-wrap' });
        var tbl = el('table', { 'class': 'metrics' });
        var thead = el('thead'); var trh = el('tr');
        b.head.forEach(function (h) { trh.appendChild(el('th', { scope: 'col' }, h)); });
        thead.appendChild(trh); tbl.appendChild(thead);
        var tbody = el('tbody');
        b.rows.forEach(function (row) {
          var tr = el('tr');
          row.forEach(function (c) { tr.appendChild(el('td', null, c)); });
          tbody.appendChild(tr);
        });
        tbl.appendChild(tbody); wrap.appendChild(tbl);
        return wrap;
      }
      default: return el('p', null, b.text || '');
    }
  }

  function renderPage(lang) {
    var P = window.PAGE;
    if (!P) return;
    var c = P[lang] || P.en;
    document.title = c.title + ' · provapp';
    var md = document.querySelector('meta[name="description"]');
    if (md && c.lead) md.setAttribute('content', c.lead.replace(/<[^>]+>/g, ''));

    var main = document.getElementById('site-main');
    if (!main) return;
    main.innerHTML = '';

    var head = el('header', { 'class': 'page-head' });
    if (c.kicker) head.appendChild(el('p', { 'class': 'kicker' }, c.kicker));
    head.appendChild(el('h1', null, c.title));
    if (c.lead) head.appendChild(el('p', { 'class': 'lead' }, c.lead));
    if (c.updated) head.appendChild(el('p', { 'class': 'updated' }, c.updated));
    main.appendChild(head);

    (c.sections || []).forEach(function (s, i) {
      var sec = el('section', { 'class': 'window', id: s.id || ('s' + (i + 1)) });
      if (s.kicker) sec.appendChild(el('p', { 'class': 'kicker' }, s.kicker));
      if (s.h) sec.appendChild(el('h2', null, s.h));
      (s.blocks || []).forEach(function (b) { sec.appendChild(renderBlock(b)); });
      main.appendChild(sec);
    });
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    document.documentElement.setAttribute('data-ui', lang);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    renderNav(lang);
    renderPage(lang);
    renderFooter(lang);
  }

  document.addEventListener('DOMContentLoaded', function () { setLang(detectLang()); });
})();
