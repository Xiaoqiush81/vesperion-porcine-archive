import { createArchive, loadSpecimens } from './archive.js?v=20261015-specimens-51';
import { initTheme } from './theme.js?v=20261011-safari-1';
import { createTarotCabinet } from './tarot.js?v=20261019-restored-originals';

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

async function initArchive() {
  if (archiveReady) return;
  archiveReady = true;
  try { createArchive(await loadSpecimens()); }
  catch (error) {
    archiveReady = false;
    console.error(error);
    document.querySelector('#specimenGrid').innerHTML = '<p>档案数据加载失败，请稍后重试。</p>';
  }
}

function initTarot() {
  if (tarotReady) return;
  tarotReady = true;
  createTarotCabinet();
}

function roomFromHash() {
  const name = location.hash.slice(1);
  return name === 'tarot' || name === 'specimens' ? name : 'home';
}

async function enterRoom(room, push = true) {
  const target = room === 'tarot' || room === 'specimens' ? room : 'home';
  document.body.dataset.room = target;
  document.querySelectorAll('[data-room-target]').forEach(item => item.classList.toggle('is-current', item.dataset.roomTarget === target));
  if (push && location.hash !== `#${target}`) history.pushState({ room: target }, '', `#${target}`);
  if (target === 'specimens') await initArchive();
  if (target === 'tarot') initTarot();
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

