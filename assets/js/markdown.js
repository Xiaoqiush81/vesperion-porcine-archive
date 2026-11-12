const ESCAPE_RE = /[&<>"']/g;
const ESCAPES = Object.freeze({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' });

export function escapeHtml(value = '') {
  return String(value).replace(ESCAPE_RE, character => ESCAPES[character]);
}

function safeHref(raw = '') {
  const href = String(raw).trim();
  if (/^(?:https?:|mailto:|#|\/)/i.test(href)) return escapeHtml(href);
  return '#';
}

export function markdownInline(value = '') {
  let text = escapeHtml(value);
  const code = [];
  text = text.replace(/\x60([^\x60]+)\x60/g, (_, content) => {
    code.push('<code>' + content + '</code>');
    return '\u0000' + (code.length - 1) + '\u0000';
  });
  text = text
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, (_, href) =>
      '<a href="' + safeHref(href) + '" target="_blank" rel="noopener noreferrer">' + href + '</a>')
    .replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, href, title) =>
      '<img src="' + safeHref(href) + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : '') + ' loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) =>
      '<a href="' + safeHref(href) + '"' + (title ? ' title="' + title + '"' : '') + ' target="_blank" rel="noopener noreferrer">' + label + '</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)] || '');
}

function isFence(line) { return /^\s*\x60\x60\x60/.test(line); }

export function markdownToHtml(value = '') {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    if (isFence(line)) {
      const language = line.trim().slice(3).trim();
      const body = [];
      i += 1;
      while (i < lines.length && !isFence(lines[i])) body.push(lines[i++]);
      if (i < lines.length) i += 1;
      output.push('<pre><code' + (language ? ' class="language-' + escapeHtml(language) + '"' : '') + '>' + escapeHtml(body.join('\n')) + '</code></pre>');
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push('<h' + level + '>' + markdownInline(heading[2]) + '</h' + level + '>');
      i += 1;
      continue;
    }

    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      output.push('<hr>');
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
      output.push('<blockquote>' + markdownToHtml(quote.join('\n')) + '</blockquote>');
      continue;
    }

    const tableDivider = lines[i + 1]?.match(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/);
    if (line.includes('|') && tableDivider) {
      const splitRow = row => row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
      const headers = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map(cell => {
        const left = cell.startsWith(':');
        const right = cell.endsWith(':');
        return left && right ? 'center' : right ? 'right' : left ? 'left' : '';
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      const head = '<thead><tr>' + headers.map((cell, index) =>
        '<th' + (aligns[index] ? ' style="text-align:' + aligns[index] + '"' : '') + '>' + markdownInline(cell) + '</th>').join('') + '</tr></thead>';
      const body = '<tbody>' + rows.map(row => '<tr>' + headers.map((_, index) =>
        '<td' + (aligns[index] ? ' style="text-align:' + aligns[index] + '"' : '') + '>' + markdownInline(row[index] || '') + '</td>').join('') + '</tr>').join('') + '</tbody>';
      output.push('<div class="markdown-table-wrap"><table>' + head + body + '</table></div>');
      continue;
    }

    const listMatch = line.match(/^\s*([-+*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const tag = ordered ? 'ol' : 'ul';
      const items = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*([-+*]|\d+\.)\s+(.+)$/);
        if (!match || (/\d+\./.test(match[1]) !== ordered)) break;
        const task = match[2].match(/^\[([ xX])\]\s+(.+)$/);
        items.push(task
          ? '<li class="markdown-task"><input type="checkbox" disabled' + (task[1].toLowerCase() === 'x' ? ' checked' : '') + '> <span>' + markdownInline(task[2]) + '</span></li>'
          : '<li>' + markdownInline(match[2]) + '</li>');
        i += 1;
      }
      output.push('<' + tag + '>' + items.join('') + '</' + tag + '>');
      continue;
    }

    const paragraph = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isFence(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*([-+*]|\d+\.)\s+/.test(lines[i]) && !/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    output.push('<p>' + paragraph.map(markdownInline).join('<br>') + '</p>');
  }

  return output.join('');
}

export function markdownElement(tag, className = '', value = '', inline = false) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.innerHTML = inline ? markdownInline(value) : markdownToHtml(value);
  return node;
}

export function renderMarkdown(node, value = '', inline = false) {
  if (!node) return node;
  node.innerHTML = inline ? markdownInline(value) : markdownToHtml(value);
  return node;
}
