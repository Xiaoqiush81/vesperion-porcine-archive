#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const [, , inputPath, patchPath, outputPath = inputPath] = process.argv;
if (!inputPath || !patchPath) {
  console.error('Usage: node tools/apply-scholia-patch.mjs <plain.json> <patch.json> [output.json]');
  process.exit(1);
}

const data = JSON.parse(await readFile(inputPath, 'utf8'));
const patch = JSON.parse(await readFile(patchPath, 'utf8'));
if (!Array.isArray(data?.materials)) throw new Error('Invalid scholia payload');
if (patch?.format !== 'vesperion-scholia-maintenance-patch' || patch.version !== 1) {
  throw new Error('Invalid scholia maintenance patch');
}

const materials = new Map(data.materials.map(material => [material.id, material]));
const questions = new Map();
for (const material of data.materials) {
  if (!Array.isArray(material.questions)) material.questions = [];
  for (const question of material.questions) {
    if (questions.has(question.id)) throw new Error(`Duplicate question id: ${question.id}`);
    questions.set(question.id, { material, question });
  }
}

const usedVerses = new Set();
for (const [materialId, verse] of Object.entries(patch.replace_verses || {})) {
  const material = materials.get(materialId);
  if (!material) throw new Error(`Unknown material id in replace_verses: ${materialId}`);
  if (!Array.isArray(verse) || verse.some(line => typeof line !== 'string')) {
    throw new Error(`Invalid verse replacement for ${materialId}`);
  }
  material.verse = verse;
  usedVerses.add(materialId);
}

const deleted = new Set();
for (const questionId of patch.delete_questions || []) {
  const entry = questions.get(questionId);
  if (!entry) throw new Error(`Unknown question id in delete_questions: ${questionId}`);
  entry.material.questions = entry.material.questions.filter(question => question.id !== questionId);
  deleted.add(questionId);
}

const replaced = new Set();
for (const [questionId, replacement] of Object.entries(patch.replace_questions || {})) {
  if (deleted.has(questionId)) throw new Error(`Question both deleted and replaced: ${questionId}`);
  const entry = questions.get(questionId);
  if (!entry) throw new Error(`Unknown question id in replace_questions: ${questionId}`);
  const next = { ...entry.question };
  for (const field of ['title', 'prompt', 'answer', 'points']) {
    if (Object.hasOwn(replacement, field)) next[field] = replacement[field];
  }
  const index = entry.material.questions.findIndex(question => question.id === questionId);
  entry.material.questions[index] = next;
  replaced.add(questionId);
}

const kept = new Set(Object.keys(patch.reviewed_keep || {}));
for (const questionId of kept) {
  if (!questions.has(questionId)) throw new Error(`Unknown question id in reviewed_keep: ${questionId}`);
  if (deleted.has(questionId) || replaced.has(questionId)) {
    throw new Error(`Question cannot be both reviewed_keep and changed: ${questionId}`);
  }
}

const output = JSON.stringify(data, null, 2) + '\n';
await writeFile(outputPath, output);
console.log(JSON.stringify({
  output: outputPath,
  verseReplacements: usedVerses.size,
  questionReplacements: replaced.size,
  questionDeletions: deleted.size,
  reviewedKeep: kept.size
}, null, 2));
