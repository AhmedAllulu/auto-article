import { runGenerationBatch } from '../src/services/generation.js';

runGenerationBatch().then((r) => {
  console.log(JSON.stringify(r));
  process.exit(0);
});


