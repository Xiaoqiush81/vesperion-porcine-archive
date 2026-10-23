import { initTheme } from './theme.js?v=20261011-safari-1';
import { createSoundscape } from './audio.js?v=20261023-card-1';

const TAROT_MODULE_URL = './tarot.js?v=20261023-safari-paint-1';
const ARCHIVE_MODULE_URL = './archive.js?v=20261023-details-1';

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
let recordsReady = false;
let archiveLoading = null;
let tarotLoading = null;
let identityLoading = null;
let recordsLoading = null;
let archiveController = null;
let roomRequest = 0;

async function initArchive() {
  if (archiveReady) return archiveController;
  if (!archiveLoading) archiveLoading = import(ARCHIVE_MODULE_URL)
    .then(async ({ createArchive, loadSpecimens }) => {
      archiveController = createArchive(await loadSpecimens());
      archiveReady = true;
      return archiveController;
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
  if (!tarotLoading) tarotLoading = import(TAROT_MODULE_URL)
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
    import('./identity.js?v=20261020-bank-copy-restore'),
    import('./archive.js?v=20261021-favorites').then(module => module.loadSpecimens())
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

async function initRecords() {
  if (recordsReady) return;
  if (!recordsLoading) recordsLoading = Promise.all([
    import('./records.js?v=20261021-tarot-fast'),
    import('./archive.js?v=20261021-favorites').then(module => module.loadSpecimens())
  ]).then(([{ createRecordRoom }, specimens]) => {
    createRecordRoom(specimens);
    recordsReady = true;
  }).catch(error => {
    console.error(error);
    document.querySelector('#activityLedger').innerHTML = '<p class="record-empty">档案室暂时无法打开，请稍后重试。</p>';
  }).finally(() => { recordsLoading = null; });
  return recordsLoading;
}

function roomFromHash() {
  const name = location.hash.slice(1);
  return ['tarot', 'specimens', 'identify', 'records'].includes(name) ? name : 'home';
}

async function enterRoom(room, push = true) {
  const request = ++roomRequest;
  const target = ['tarot', 'specimens', 'identify', 'records'].includes(room) ? room : 'home';
  const roomNames = { specimens: '猪猪图鉴', identify: '猪种鉴定所', tarot: '宅邸塔罗馆', records: '宅邸档案室' };
  if (target === 'specimens') await initArchive();
  if (target === 'tarot') await initTarot();
  if (target === 'identify') await initIdentity();
  if (target === 'records') await initRecords();
  if (request !== roomRequest) return;
  document.body.dataset.room = target;
  document.querySelector('#roomToolbarTitle').textContent = roomNames[target] || '';
  document.querySelectorAll('[data-room-target]').forEach(item => item.classList.toggle('is-current', item.dataset.roomTarget === target));
  if (push && location.hash !== `#${target}`) history.pushState({ room: target }, '', `#${target}`);
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

async function main() {
  initTheme(document.querySelector('#themeToggle'));
  createSoundscape();
  const warmRooms = () => {
    import(TAROT_MODULE_URL).catch(() => {});
    initArchive().catch(() => {});
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warmRooms, { timeout:1200 });
  else window.setTimeout(warmRooms, 650);
  document.querySelector('#pigQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelector('#callPig').addEventListener('click', () => toast('捕获回应：咪———— ୯(*´ω｀*)୬'));
  document.querySelector('#randomPig').addEventListener('click', async event => {
    const button = event.currentTarget;
    const label = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = '捕捉中…';
    try {
      const archive = await initArchive();
      archive?.openRandom();
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = label;
    }
  });
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

