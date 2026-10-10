'use strict';

const trailerVideo = document.querySelector('.trailer-player video');
const trailerPlay = document.querySelector('.trailer-play');
trailerPlay.hidden = false;
trailerPlay.addEventListener('click', async () => {
  trailerPlay.hidden = true;
  try {
    await trailerVideo.play();
    trailerVideo.focus();
  } catch {
    trailerPlay.hidden = false;
  }
});
trailerVideo.addEventListener('play', () => { trailerPlay.hidden = true; });
trailerVideo.addEventListener('ended', () => { trailerPlay.hidden = false; });

// Small, local interactions. The website has no accounts, forms, or tracking.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const tabs = [...document.querySelectorAll('.mode-tab')];
function selectMode(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectMode(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectMode(tabs[next], true);
      tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  });
});

const thumbnails = [...document.querySelectorAll('.gallery-thumb')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const featuredImage = document.getElementById('featured-screenshot');
const featuredButton = document.querySelector('.featured-image');
const featuredTitle = document.getElementById('featured-title');
const featuredCaption = document.getElementById('featured-caption');
const featuredCategory = document.getElementById('featured-category');
const announcement = document.getElementById('gallery-announcement');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
let visibleScreenshots = thumbnails;
let currentScreenshot = thumbnails[0];
let previousFocus;

function syncLightbox() {
  lightboxImage.src = currentScreenshot.querySelector('img').src;
  lightboxImage.alt = `Current ${currentScreenshot.dataset.title} screen in Baqla`;
  document.getElementById('lightbox-title').textContent = currentScreenshot.dataset.title;
  document.getElementById('lightbox-caption').textContent = `${currentScreenshot.dataset.caption} · Current pre-release build`;
  document.getElementById('lightbox-count').textContent = `${visibleScreenshots.indexOf(currentScreenshot) + 1} / ${visibleScreenshots.length}`;
}

function selectScreenshot(thumbnail, announce = true) {
  currentScreenshot = thumbnail;
  thumbnails.forEach(item => item.setAttribute('aria-pressed', String(item === thumbnail)));
  featuredImage.src = thumbnail.querySelector('img').src;
  featuredImage.alt = `Current ${thumbnail.dataset.title} screen in Baqla`;
  featuredButton.setAttribute('aria-label', `Open ${thumbnail.dataset.title} screenshot full screen`);
  featuredTitle.textContent = thumbnail.dataset.title;
  featuredCaption.textContent = thumbnail.dataset.caption;
  featuredCategory.textContent = thumbnail.dataset.category === 'games' ? 'At the table' : 'Beyond the table';
  if (announce) announcement.textContent = `${thumbnail.dataset.title}. Screenshot ${visibleScreenshots.indexOf(thumbnail) + 1} of ${visibleScreenshots.length}.`;
  if (lightbox.open) syncLightbox();
}

function filterGallery(filter, announce = true) {
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  thumbnails.forEach(thumbnail => { thumbnail.hidden = filter !== 'all' && thumbnail.dataset.category !== filter; });
  visibleScreenshots = thumbnails.filter(thumbnail => !thumbnail.hidden);
  document.getElementById('gallery-count').textContent = `${visibleScreenshots.length} views`;
  if (!visibleScreenshots.includes(currentScreenshot)) selectScreenshot(visibleScreenshots[0], false);
  if (announce) announcement.textContent = `${visibleScreenshots.length} screenshots. Showing ${currentScreenshot.dataset.title}.`;
}

function moveScreenshot(direction) {
  const index = visibleScreenshots.indexOf(currentScreenshot);
  selectScreenshot(visibleScreenshots[(index + direction + visibleScreenshots.length) % visibleScreenshots.length]);
}

thumbnails.forEach(thumbnail => thumbnail.addEventListener('click', () => selectScreenshot(thumbnail)));
filterButtons.forEach(button => button.addEventListener('click', () => filterGallery(button.dataset.filter)));
document.getElementById('gallery-previous').addEventListener('click', () => moveScreenshot(-1));
document.getElementById('gallery-next').addEventListener('click', () => moveScreenshot(1));
document.querySelectorAll('[data-gallery-select]').forEach(link => {
  link.addEventListener('click', () => {
    filterGallery('games', false);
    const target = thumbnails.find(thumbnail => thumbnail.dataset.id === link.dataset.gallerySelect);
    if (target) selectScreenshot(target);
  });
});

featuredButton.addEventListener('click', () => {
  previousFocus = document.activeElement;
  syncLightbox();
  lightbox.showModal();
  document.body.classList.add('modal-open');
  document.querySelector('.lightbox-close').focus();
});
document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.lightbox-previous').addEventListener('click', () => moveScreenshot(-1));
document.querySelector('.lightbox-next').addEventListener('click', () => moveScreenshot(1));
lightbox.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (previousFocus) previousFocus.focus({ preventScroll: true });
});
lightbox.addEventListener('click', event => {
  if (event.target !== lightbox) return;
  const bounds = lightbox.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
});
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveScreenshot(event.key === 'ArrowRight' ? 1 : -1);
  }
});
document.getElementById('year').textContent = new Date().getFullYear();
