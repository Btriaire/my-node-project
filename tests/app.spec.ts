import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

test('npm start prints the expected startup message', () => {
  const output = execSync('npm start', {
    cwd: '/Users/bruno/my-node-project',
    encoding: 'utf-8',
  });

  expect(output).toContain('Project setup verified: Node.js app is running.');
});
