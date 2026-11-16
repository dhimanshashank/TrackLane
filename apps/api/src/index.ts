import { DB_PACKAGE } from "@tracklane/db";
import { ITERATION_TYPES, type IterationType } from "@tracklane/shared";

const current: IterationType = "bug_fix";

console.log(DB_PACKAGE);
console.log(`Iteration types: ${ITERATION_TYPES.join(", ")}`);
console.log(`Current iteration type: ${current}`);