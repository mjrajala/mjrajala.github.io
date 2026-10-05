// Mobile menu: toggle, close on link click, Escape or outside click.
(function () {
  var button = document.querySelector('.menu-button');
  var nav = document.getElementById('paavalikko');
  if (!button || !nav) return;

  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
})();
