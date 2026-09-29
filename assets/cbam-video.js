/* No YouTube resources are requested until the visitor loads the player. */
document.querySelectorAll('.cbam-video-frame').forEach(frame => {
  const button = frame.querySelector('.cbam-video-load');
  button.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.title = frame.dataset.videoTitle;
    player.src = 'https://www.youtube-nocookie.com/embed/jxG4TfzwtwQ?autoplay=0';
    player.allow = 'encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(player);
    player.focus({ preventScroll: true });
  }, { once: true });
  button.hidden = false;
});
