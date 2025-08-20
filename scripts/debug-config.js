#!/usr/bin/env node

import { config } from '../src/config.js';

console.log('🔍 Configuration Debug:');
console.log('ENV TRANSLATION_DEFAULT_CHUNK_COUNT:', process.env.TRANSLATION_DEFAULT_CHUNK_COUNT);
console.log('Config translation.defaultChunkCount:', config.translation.defaultChunkCount);
console.log('Type:', typeof config.translation.defaultChunkCount);
