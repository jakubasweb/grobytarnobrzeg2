(function () {
  'use strict';

  /* ---------- Konfiguracja ---------- */
  // Wpisz identyfikator GA4 (np. 'G-XXXXXXXXXX'), aby po zgodzie użytkownika ładować statystykę.
  // Pozostaw pusty ciąg, jeśli strona nie korzysta z żadnych narzędzi analitycznych.
  // Po włączeniu dostosuj też Content-Security-Policy w .htaccess oraz Politykę prywatności i cookies.
  var GA_ID = '';
  var CONSENT_KEY = 'pip_cookie_consent';
  var CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  /* ---------- Menu mobilne ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Formularz kontaktowy ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var phoneRe = /^[0-9 +()\-]{7,20}$/;

    var clearErrors = function () {
      form.querySelectorAll('.field-error').forEach(function (n) { n.remove(); });
      form.querySelectorAll('[aria-invalid]').forEach(function (n) {
        n.removeAttribute('aria-invalid');
        n.removeAttribute('aria-describedby');
      });
    };
    var showError = function (input, text) {
      var id = input.id + '-err';
      var p = document.createElement('p');
      p.className = 'field-error';
      p.id = id;
      p.textContent = text;
      var holder = input.closest('.field') || input.parentNode;
      holder.appendChild(p);
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
    };
    var setStatus = function (type, text) {
      status.className = 'form-status ' + type;
      status.textContent = text;
    };

    var validate = function () {
      clearErrors();
      var errors = [];
      var f = form.elements;
      if (f.name.value.trim().length < 2) errors.push([f.name, 'Podaj imię i nazwisko.']);
      if (!phoneRe.test(f.phone.value.trim())) errors.push([f.phone, 'Podaj poprawny numer telefonu.']);
      if (f.email.value.trim() && !f.email.checkValidity()) errors.push([f.email, 'Podaj poprawny adres e-mail.']);
      if (!f.service.value) errors.push([f.service, 'Wybierz rodzaj usługi.']);
      if (f.message.value.trim().length < 10) errors.push([f.message, 'Wiadomość powinna mieć co najmniej 10 znaków.']);
      if (!f.consent.checked) errors.push([f.consent, 'Potwierdź zapoznanie się z dokumentami.']);
      errors.forEach(function (pair) { showError(pair[0], pair[1]); });
      if (errors.length) errors[0][0].focus();
      return errors.length === 0;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');
      if (!validate()) return;
      if (!window.fetch) { form.submit(); return; }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus('', 'Wysyłanie…');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, msg: d.message }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            setStatus('ok', res.msg || 'Dziękuję! Wiadomość została wysłana. Odezwę się wkrótce.');
          } else {
            setStatus('err', res.msg || 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń.');
          }
        })
        .catch(function () {
          setStatus('err', 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń: +48 607 455 340.');
        })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Zgoda na cookies ---------- */
  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (c && c.v === 1 && Date.now() - c.ts < CONSENT_MAX_AGE_MS) return c;
    } catch (e) { /* brak dostępu do pamięci przeglądarki */ }
    return null;
  }
  function saveConsent(analytics) {
    var c = { v: 1, analytics: !!analytics, ts: Date.now() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) { /* ignoruj */ }
    return c;
  }

  var analyticsLoaded = false;
  function applyConsent(c) {
    if (c && c.analytics && GA_ID && !analyticsLoaded) {
      analyticsLoaded = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, { anonymize_ip: true });
    }
  }

  var banner, dialog;

  function build() {
    banner = document.createElement('section');
    banner.className = 'cc';
    banner.setAttribute('aria-labelledby', 'cc-title');
    banner.hidden = true;
    banner.innerHTML =
      '<h2 id="cc-title">Szanujemy Twoją prywatność</h2>' +
      '<p>Ta strona używa tylko niezbędnych technologii do działania. Za Twoją zgodą możemy też korzystać z anonimowej statystyki odwiedzin. ' +
      'Szczegóły znajdziesz w <a href="polityka-cookies.html">Polityce cookies</a>.</p>' +
      '<div class="cc-actions">' +
      '<button type="button" class="btn btn-primary" data-cc="all">Akceptuję wszystkie</button>' +
      '<button type="button" class="btn btn-primary" data-cc="necessary">Tylko niezbędne</button>' +
      '<button type="button" class="btn" data-cc="settings">Dostosuj</button>' +
      '</div>';

    dialog = document.createElement('dialog');
    dialog.className = 'cc-dialog';
    dialog.setAttribute('aria-labelledby', 'cc-dlg-title');
    dialog.innerHTML =
      '<form method="dialog">' +
      '<h2 id="cc-dlg-title">Ustawienia cookies</h2>' +
      '<p>Wybierz, na co się zgadzasz. Zgodę możesz zmienić w każdej chwili przez link „Ustawienia cookies” w stopce.</p>' +
      '<div class="cc-option"><input type="checkbox" id="cc-necessary" checked disabled>' +
      '<div><label for="cc-necessary">Niezbędne</label><span>Zapamiętanie Twojego wyboru dotyczącego cookies. Zawsze aktywne.</span></div></div>' +
      '<div class="cc-option"><input type="checkbox" id="cc-analytics">' +
      '<div><label for="cc-analytics">Statystyczne</label><span>Anonimowe statystyki odwiedzin, które pomagają ulepszać stronę.</span></div></div>' +
      '<div class="cc-actions">' +
      '<button type="button" class="btn btn-primary" data-cc="save">Zapisz wybór</button>' +
      '<button type="button" class="btn btn-primary" data-cc="all">Akceptuję wszystkie</button>' +
      '<button type="button" class="btn" data-cc="close">Anuluj</button>' +
      '</div></form>';

    document.body.insertBefore(banner, document.body.firstChild);
    document.body.appendChild(dialog);

    var onClick = function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'settings') { openDialog(); return; }
      if (a === 'close') { dialog.close(); return; }
      var analytics = a === 'all' || (a === 'save' && document.getElementById('cc-analytics').checked);
      var c = saveConsent(analytics);
      banner.hidden = true;
      if (dialog.open) dialog.close();
      applyConsent(c);
    };
    banner.addEventListener('click', onClick);
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
      else onClick(e);
    });
  }

  function openDialog() {
    var c = readConsent();
    document.getElementById('cc-analytics').checked = !!(c && c.analytics);
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function init() {
    build();
    var c = readConsent();
    if (c) applyConsent(c); else banner.hidden = false;

    document.querySelectorAll('[data-cookie-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDialog(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
