import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
test('out of range weights cannot silently select ETT sizes',()=>{
 for(const field of ['cuffed','uncuffed','depth']) assert.ok(page.includes('outsideColorRange ? "超出尺範圍" : zone.'+field));
 assert.ok(page.includes('workingWeight < 3 || workingWeight > 36'));
});
test('inhalation and suppository product checks are explicit',()=>{
 assert.ok(!page.includes('MDI／DPI 2 噴'));
 assert.ok(page.includes('未核對規格'));
 assert.ok(page.includes('是否可分割'));
});
