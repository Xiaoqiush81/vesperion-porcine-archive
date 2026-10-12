import { createArchive, loadSpecimens } from './archive.js?v=20261013-ui';
import { initTheme } from './theme.js?v=20261011-safari-1';

const QUOTES = ['“可猫可猪；若必须二选一，仍然是猪。”', '“爸爸爸爸——”', '“咪————”', '“今天已经是明晚了。”', '“蜗牛胜出，芝士沉默。”', '“本猪合格，可以继续抱。”', '“一只宇宙无敌第一可爱萌猪诞生惹。”', '“这不是烧钱，这是文化传播经费。”'];

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2200);
}

async function main() {
  initTheme(document.querySelector('#themeToggle'));
  document.querySelector('#pigQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelector('#callPig').addEventListener('click', () => toast('捕获回应：咪———— ୯(*´ω｀*)୬'));
  document.querySelector('#updatedAt').textContent = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' }).format(new Date());

  try { createArchive(await loadSpecimens()); }
  catch (error) {
    console.error(error);
    document.querySelector('#specimenGrid').innerHTML = '<p>档案数据加载失败，请稍后重试。</p>';
  }
}

main();
