/* Progressive enhancement: navigation remains available when JavaScript is off. */
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-nav');
if (toggle && menu) {
  const closeMenu = (returnFocus = false) => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  matchMedia('(min-width: 951px)').addEventListener('change', () => closeMenu());
}
