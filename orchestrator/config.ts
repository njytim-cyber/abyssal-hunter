import type { OrchestratorConfig } from './types';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config: OrchestratorConfig = {
  projectRoot: join(__dirname, '..'),
  testTimeout: 60000,
  securityLevel: 'moderate',
  enableAIAssist: true,
};
