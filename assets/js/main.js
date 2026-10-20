import { initTheme } from './theme.js?v=20261011-safari-1';

const QUOTES = ['“可猫可猪；若必须二选一，仍然是猪。”', '“爸爸爸爸——”', '“咪————”', '“今天已经是明晚了。”', '“蜗牛胜出，芝士沉默。”', '“本猪合格，可以继续抱。”', '“一只宇宙无敌第一可爱萌猪诞生惹。”', '“这不是烧钱，这是文化传播经费。”'];

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2200);
}

let archiveReady = false;
let tarotReady = false;
let identityReady = false;
let archiveLoading = null;
let tarotLoading = null;
let identityLoading = null;

async function initArchive() {
  if (archiveReady) return;
  if (!archiveLoading) archiveLoading = import('./archive.js?v=20261015-specimens-51')
    .then(async ({ createArchive, loadSpecimens }) => {
      createArchive(await loadSpecimens());
      archiveReady = true;
    })
    .catch(error => {
      console.error(error);
      document.querySelector('#specimenGrid').innerHTML = '<p>档案数据加载失败，请稍后重试。</p>';
    })
    .finally(() => { archiveLoading = null; });
  return archiveLoading;
}

async function initTarot() {
  if (tarotReady) return;
  if (!tarotLoading) tarotLoading = import('./tarot.js?v=20261019-modular-1')
    .then(({ createTarotCabinet }) => {
      createTarotCabinet();
      tarotReady = true;
    })
    .catch(error => {
      console.error(error);
      document.querySelector('#practiceStatus').textContent = '塔罗馆加载失败，请刷新后再试。';
    })
    .finally(() => { tarotLoading = null; });
  return tarotLoading;
}

async function initIdentity() {
  if (identityReady) return;
  if (!identityLoading) identityLoading = Promise.all([
    import('./identity.js?v=20261020-bank-1'),
    import('./archive.js?v=20261020-specimens-52').then(module => module.loadSpecimens())
  ])
    .then(([{ createIdentityOffice }, specimens]) => {
      createIdentityOffice(specimens, toast);
      identityReady = true;
    })
    .catch(error => {
      console.error(error);
      document.querySelector('#identityIntro').innerHTML = '<p>鉴定所档案加载失败，请稍后重试。</p>';
    })
    .finally(() => { identityLoading = null; });
  return identityLoading;
}

function roomFromHash() {
  const name = location.hash.slice(1);
  return ['tarot', 'specimens', 'identify'].includes(name) ? name : 'home';
}

async function enterRoom(room, push = true) {
  const target = ['tarot', 'specimens', 'identify'].includes(room) ? room : 'home';
  document.body.dataset.room = target;
  document.querySelectorAll('[data-room-target]').forEach(item => item.classList.toggle('is-current', item.dataset.roomTarget === target));
  if (push && location.hash !== `#${target}`) history.pushState({ room: target }, '', `#${target}`);
  if (target === 'specimens') await initArchive();
  if (target === 'tarot') await initTarot();
  if (target === 'identify') await initIdentity();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

async function main() {
  initTheme(document.querySelector('#themeToggle'));
  document.querySelector('#pigQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelector('#callPig').addEventListener('click', () => toast('捕获回应：咪———— ୯(*´ω｀*)୬'));
  document.querySelector('#updatedAt').textContent = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' }).format(new Date());

  document.addEventListener('click', event => {
    const entrance = event.target.closest('[data-room-target]');
    if (!entrance) return;
    event.preventDefault();
    enterRoom(entrance.dataset.roomTarget);
  });
  window.addEventListener('popstate', () => enterRoom(roomFromHash(), false));
  await enterRoom(roomFromHash(), false);
}

main();

