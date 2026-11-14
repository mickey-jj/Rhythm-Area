import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moveItem, stagePlanFromRules, updateStage, templateDraft, isIntegerInput, localDateInput, instantFromLocal } from '../frontend/src/pages/EventEditorPage/functions/editorRules.ts';
import { issueStep } from '../frontend/src/pages/EventEditorPage/functions/issueStep.ts';
const template = JSON.parse(readFileSync(new URL('../examples/midterm-review/template.json', import.meta.url), 'utf8'));
test('reordering stages and songs preserves the input and every item', () => {
  const input = Object.freeze(['a', 'b', 'c', 'd']);
  assert.deepEqual(moveItem(input, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moveItem(input, 3, 1), ['a', 'd', 'b', 'c']);
  assert.deepEqual(moveItem(input, -1, 2), input);
  assert.deepEqual(input, ['a', 'b', 'c', 'd']);
});
test('stage rules retain all supported overrides including per-stage disclosure and tie-break settings', () => {
  const rules = { ...template.rules, winsRequired: 3, matchMode: 'first-to', draftMode: 'sealed', tieBreak: ['worst-chart'] };
  const plan = stagePlanFromRules(rules);
  assert.equal(plan.matchMode, 'first-to'); assert.equal(plan.winsRequired, 3);
  assert.deepEqual(Object.keys(plan).sort(), ['metric', 'matchMode', 'winsRequired', 'draft', 'playOrder', 'resolution','draftMode','tieBreak','timing'].sort());
  assert.equal(plan.draftMode,'sealed'); assert.deepEqual(plan.tieBreak,['worst-chart']);
});
test('editing one stage preserves sibling rules and keeps downstream quotas valid', () => {
  const before = structuredClone(template.rules);
  const next = updateStage(before, 0, { advance: 2 });
  assert.deepEqual(next.map(stage => stage.advance), [2, 2, 1]);
  assert.deepEqual(before, template.rules);
  assert.deepEqual(next[2].plan, before.stages[2].plan);
});
test('template loading copies the complete template and does not share editable nested objects', () => {
  const result = templateDraft(template, undefined);
  assert.equal(result.name, template.name);
  assert.equal(result.charts.length, 117);
  assert.notEqual(result.rules, template.rules); assert.notEqual(result.charts, template.charts);
  assert.notEqual(result.appearance, template.appearance);
});
test('empty, fractional and out-of-range numeric text cannot turn into a saved zero', () => {
  ['', ' ', '0', '1', '-2', '2.5', 'NaN', 'Infinity', '257'].forEach(value => assert.equal(isIntegerInput(value, 2, 256), false));
  ['2', '16', '32', '256'].forEach(value => assert.equal(isIntegerInput(value, 2, 256), true));
});
test('invalid dates are harmless and local calendar values round-trip to the same instant', () => {
  assert.equal(localDateInput('not-a-date'), ''); assert.equal(instantFromLocal('invalid'), null);
  assert.equal(localDateInput(null), ''); assert.equal(instantFromLocal(''), null);
  const instant = '2026-11-06T05:10:00.000Z';
  assert.equal(instantFromLocal(localDateInput(instant)), instant);
});
test('validation issues navigate to the relevant definition step', () => {
  assert.equal(issueStep('pools.qualifier'), 4);
  assert.equal(issueStep('rules.metric.maximum'), 3);
  assert.equal(issueStep('stages.stage2.metric'), 3);
  assert.equal(issueStep('windows.registrationClose'), 1);
  assert.equal(issueStep('team.min'), 5);
});
