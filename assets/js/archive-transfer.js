import { ARCHIVE_FORMAT, ARCHIVE_VERSION, ARCHIVE_KEYS as KEYS, MAX_ARCHIVE_BYTES, normalizeArchive } from './archive-format.js?v=20261122-pigliza-2';

function readJson(storage, key, fallback) {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); }
  catch { throw new Error('当前设备有一项记录无法读取，已停止导出以免遗漏。'); }
}

export function createArchive(storage = globalThis.localStorage) {
  const read = (key, fallback) => readJson(storage, key, fallback);
  const archive = {
    format:ARCHIVE_FORMAT, version:ARCHIVE_VERSION, exportedAt:new Date().toISOString(),
    data:{
      favorites:read(KEYS.favorites, { specimens:[], tarot:[] }),
      identity:{ history:read(KEYS.identityHistory, []), lastQuestions:read(KEYS.identityQuestions, []), session:read(KEYS.identitySession, null) },
      tarot:{ history:read(KEYS.tarotHistory, []) },
      scholia:{ answers:read(KEYS.scholiaAnswers, {}), extracurricularAnswers:read(KEYS.extracurricularAnswers, {}) },
      faith:{ member:read(KEYS.faithMember, null), oracle:read(KEYS.faithOracle, { used:[], history:[], today:null }) },
      pigliza:read(KEYS.pigliza, null),
      preferences:{ theme:storage.getItem(KEYS.theme) || 'paper', baseTheme:storage.getItem(KEYS.baseTheme) || 'paper', audio:read(KEYS.audio, {}) }
    }
  };
  // Use the same schema in both directions; never create a file we cannot restore.
  const { entries } = normalizeArchive(archive);
  const clean = key => JSON.parse(entries.get(KEYS[key]) ?? 'null');
  archive.data = {
    favorites:clean('favorites'),
    identity:{ history:clean('identityHistory'), lastQuestions:clean('identityQuestions'), session:clean('identitySession') },
    tarot:{ history:clean('tarotHistory') }, scholia:{ answers:clean('scholiaAnswers'), extracurricularAnswers:clean('extracurricularAnswers') },
    faith:{ member:clean('faithMember'), oracle:clean('faithOracle') },
    pigliza:clean('pigliza'),
    preferences:{ theme:entries.get(KEYS.theme), baseTheme:entries.get(KEYS.baseTheme), audio:clean('audio') }
  };
  return archive;
}

export function replaceStorage(entries, storage = globalThis.localStorage) {
  const previous = new Map([...entries.keys()].map(key => [key, storage.getItem(key)]));
  const changed = [];
  try {
    for (const [key, value] of entries) {
      if (value === previous.get(key)) continue;
      value === null ? storage.removeItem(key) : storage.setItem(key, value);
      changed.push(key);
    }
  } catch {
    // Revert every successful write. Removing new values first also releases quota.
    for (const key of changed) { try { storage.removeItem(key); } catch {} }
    for (const key of changed) {
      const value = previous.get(key);
      try { value === null ? storage.removeItem(key) : storage.setItem(key, value); } catch {}
    }
    let restored = false;
    try { restored = changed.every(key => storage.getItem(key) === previous.get(key)); } catch {}
    throw new Error(restored
      ? '浏览器未能写入档案，已恢复导入前的记录。'
      : '浏览器拒绝写入，且部分原记录无法恢复。请保留原备份文件，不要继续导入。');
  }
}

function downloadArchive() {
  const archive = createArchive();
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type:'application/json' });
  if (blob.size > MAX_ARCHIVE_BYTES) throw new Error('当前档案超过 1MB，未生成无法恢复的文件。');
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `pigdex-081-archive-${archive.exportedAt.slice(0,10)}.json`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initArchiveTransfer(root = document) {
  const exportButton = root.querySelector('#exportArchive'), importButton = root.querySelector('#importArchive');
  const input = root.querySelector('#archiveFile'), status = root.querySelector('#archiveTransferStatus');
  if (!exportButton || exportButton.dataset.ready === 'true') return;
  exportButton.dataset.ready = 'true';
  let busy = false;
  const setBusy = value => { busy = value; exportButton.disabled = value; importButton.disabled = value; input.disabled = value; };
  exportButton.addEventListener('click', () => {
    if (busy) return;
    try { downloadArchive(); status.textContent = '完整宅邸档案已交付浏览器下载。'; }
    catch (error) { status.textContent = `导出失败：${error instanceof Error ? error.message : '浏览器拒绝了文件下载。'}`; }
  });
  importButton.addEventListener('click', () => { if (!busy) input.click(); });
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; input.value = '';
    if (!file || busy) return;
    setBusy(true);
    let committed = false;
    try {
      if (file.size > MAX_ARCHIVE_BYTES) throw new Error('档案超过 1MB，已拒绝读取。');
      const source = await file.text();
      let archive;
      try { archive = JSON.parse(source.replace(/^\uFEFF/, '')); }
      catch { throw new Error('文件不是有效的 JSON，未修改当前记录。'); }
      const { entries, summary, version } = normalizeArchive(archive);
      const compatibility = version === 1 ? '\n旧版未收录的项目会保留当前记录。' : '';
      if (!window.confirm(`即将恢复：${summary.join('、')}。\n这些项目会替换当前设备上的对应记录，请先保留需要的备份。${compatibility}\n确认导入吗？`)) {
        status.textContent = '已取消导入，当前记录未改动。';
        return;
      }
      replaceStorage(entries);
      committed = true;
      status.textContent = '档案已恢复，正在重新装订馆舍…';
      window.setTimeout(() => location.reload(), 450);
    } catch (error) { status.textContent = `导入失败：${error instanceof Error ? error.message : '文件内容无效。'}`; }
    finally { if (!committed) setBusy(false); }
  });
}
