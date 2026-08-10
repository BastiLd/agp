import assert from "node:assert/strict";
import { planPresets, SEEDED_SERVER_ID } from "../packages/common/src/index.mjs";
import { buildStartupCommand, runtimeTemplates } from "../packages/runtime/src/index.mjs";

const free = planPresets.find((plan) => plan.slug === "free");
assert.equal(free.ramMb, 308);
assert.equal(free.diskMb, 716);
assert.equal(free.cpuPercent, 25);
assert.equal(free.databases, 0);
assert.equal(free.backups, 0);
assert.equal(SEEDED_SERVER_ID, "171faeea");
assert.ok(runtimeTemplates.some((template) => template.id === "python-3.14"));
const command = buildStartupCommand({ startup_command: "python /home/container/app.py" });
assert.match(command, /requirements\.txt/);
assert.match(command, /package\.json/);
assert.match(command, /python \/home\/container\/app\.py/);
console.log("smoke tests passed");