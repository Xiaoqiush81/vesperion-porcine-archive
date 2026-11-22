import { PiglizaEngine } from './pigliza-engine.js?v=20261122-pigliza-1';
import { PIGLIZA_DATA } from './pigliza-rules.js?v=20261122-pigliza-1';

export const PIGLIZA_STORAGE_KEY = 'pigdex-pigliza-v1';
const MAX_MESSAGES = 40;

function readSession(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(PIGLIZA_STORAGE_KEY) || 'null');
    if (!value || value.version !== 1 || !Array.isArray(value.messages)) return null;
    const messages = value.messages
      .filter(item => item && ['user','bot'].includes(item.role) && typeof item.content === 'string')
      .map(item => ({ role:item.role, content:item.content.slice(0, 1200) }))
      .slice(-MAX_MESSAGES);
    return { messages, engine:value.engine };
  } catch { return null; }
}

function saveSession(messages, engine, storage = globalThis.localStorage) {
  try {
    storage.setItem(PIGLIZA_STORAGE_KEY, JSON.stringify({
      version:1,
      messages:messages.slice(-MAX_MESSAGES),
      engine:engine.getState(),
    }));
  } catch { /* Conversation remains usable when private browsing blocks storage. */ }
}

function messageNode(message) {
  const article = document.createElement('article');
  const label = document.createElement('small');
  const content = document.createElement('p');
  article.className = `pigliza-message is-${message.role}`;
  label.textContent = message.role === 'user' ? '小猪' : '猪莉莎';
  content.textContent = message.content;
  article.append(label, content);
  return article;
}

export function initPigliza() {
  const log = document.querySelector('#piglizaLog');
  const form = document.querySelector('#piglizaForm');
  const input = document.querySelector('#piglizaInput');
  const send = document.querySelector('#piglizaSend');
  const reset = document.querySelector('#piglizaReset');
  const status = document.querySelector('#piglizaStatus');
  if (!log || !form || !input || !send || !reset || !status || form.dataset.ready) return;
  form.dataset.ready = 'true';

  const engine = new PiglizaEngine(PIGLIZA_DATA);
  const saved = readSession();
  const messages = saved?.messages?.length ? [...saved.messages] : [{ role:'bot', content:engine.getGreeting() }];
  if (saved?.engine) engine.setState(saved.engine);

  const render = () => {
    log.replaceChildren(...messages.map(messageNode));
    log.scrollTop = log.scrollHeight;
    input.disabled = engine.quit;
    send.disabled = engine.quit;
    status.textContent = engine.quit
      ? '本次谈话已经结束；点“重新开始”可唤醒猪莉莎。'
      : '本地规则机正在倾听 · 不连接 AI 或远端服务';
  };

  const append = (role, content) => {
    messages.push({ role, content });
    if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || engine.quit) return;
    append('user', value);
    append('bot', engine.respond(value));
    input.value = '';
    saveSession(messages, engine);
    render();
    if (!engine.quit) input.focus();
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  reset.addEventListener('click', () => {
    engine.reset();
    messages.splice(0, messages.length, { role:'bot', content:engine.getGreeting() });
    saveSession(messages, engine);
    render();
    input.focus();
  });

  render();
}
