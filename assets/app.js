/* Interações do site (JS puro, sem dependências). */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var swap = function (el, off, on, ativo) {
    off.split(' ').forEach(function (c) { el.classList.toggle(c, !ativo); });
    on.split(' ').forEach(function (c) { el.classList.toggle(c, ativo); });
  };

  /* Header: sombra ao rolar */
  var header = $('header#topo');
  var onScroll = function () { header && header.classList.toggle('shadow-header', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menu mobile */
  var menu = $('#menu-mobile');
  var abrir = $('[aria-controls="menu-mobile"]');
  var setMenu = function (open) {
    if (!menu) return;
    swap(menu, 'invisible opacity-0', 'visible opacity-100', open);
    menu.setAttribute('aria-hidden', String(!open));
    abrir && abrir.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  abrir && abrir.addEventListener('click', function () { setMenu(true); });
  var fechar = $('[aria-label="Fechar menu"]', menu);
  fechar && fechar.addEventListener('click', function () { setMenu(false); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* Fade-in ao rolar */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Reserva → abre o Airbnb com datas e hóspedes */
  var form = $('#reserva form');
  if (!form) return;
  var airbnb = ($('a[href*="airbnb.com"]') || {}).href;
  var msg = $('#reserva [aria-live]');
  var ci = $('input[aria-label="Data de check-in"]', form);
  var co = $('input[aria-label="Data de check-out"]', form);
  var hoje = new Date().toISOString().slice(0, 10);
  var fmt = function (v) { var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  var mostrar = function (input) {
    var span = input.parentNode.querySelector('.flex-col > span:last-child');
    span.textContent = input.value ? fmt(input.value) : 'Escolher data';
    swap(span, 'font-normal text-placeholder', 'font-medium text-texto', !!input.value);
  };
  ci.min = hoje; co.min = hoje;
  [ci, co].forEach(function (inp) {
    inp.addEventListener('click', function () { try { inp.showPicker(); } catch (e) { /* sem suporte */ } });
    inp.addEventListener('change', function () {
      if (inp === ci) {
        co.min = ci.value || hoje;
        if (co.value && ci.value && co.value <= ci.value) { co.value = ''; mostrar(co); }
      }
      mostrar(inp);
    });
  });

  var dd = $('[aria-haspopup="listbox"]', form);
  var lista = $('[role="listbox"]', dd);
  var chev = $$('svg', dd).pop();
  var valor = $('.flex-col > span:last-child', dd);
  var hospedes = parseInt(valor.textContent, 10) || 2;
  var setDD = function (open) {
    swap(lista, 'invisible -translate-y-1.5 opacity-0', 'visible translate-y-0 opacity-100', open);
    chev.classList.toggle('rotate-180', open);
    dd.setAttribute('aria-expanded', String(open));
  };
  dd.addEventListener('click', function (e) {
    var li = e.target.closest('li');
    if (li) {
      e.stopPropagation();
      hospedes = parseInt(li.textContent, 10);
      valor.textContent = li.textContent;
      $$('li', lista).forEach(function (x) { x.setAttribute('aria-selected', String(x === li)); });
      setDD(false);
      return;
    }
    setDD(dd.getAttribute('aria-expanded') !== 'true');
  });
  dd.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDD(dd.getAttribute('aria-expanded') !== 'true'); }
  });
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setDD(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setDD(false); setMenu(false); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!ci.value || !co.value) {
      msg.textContent = 'Escolha as datas de check-in e check-out para ver a disponibilidade.';
      return;
    }
    var noites = Math.round((new Date(co.value) - new Date(ci.value)) / 864e5);
    msg.textContent = noites + (noites === 1 ? ' noite' : ' noites') + ' · ' + hospedes +
      (hospedes === 1 ? ' hóspede' : ' hóspedes') + ' — abrindo o Airbnb para confirmar.';
    if (airbnb) {
      var url = new URL(airbnb);
      url.searchParams.set('check_in', ci.value);
      url.searchParams.set('check_out', co.value);
      url.searchParams.set('adults', String(hospedes));
      window.open(url.toString(), '_blank', 'noopener');
    }
  });
})();
