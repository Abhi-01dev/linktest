const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('Root System Integrity & Production Configuration', async (t) => {
  await t.test('Root package.json exists and defines cross-platform scripts', () => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'Root package.json must exist');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.name, 'linktest-platform');
    assert.ok(pkg.scripts, 'scripts object must exist');
    assert.ok(pkg.scripts['build'], 'build script must exist');
    assert.ok(pkg.scripts['test'], 'test script must exist');
    assert.ok(pkg.scripts['dev'], 'dev script must exist');
  });

  await t.test('Backend and Frontend package.json configurations exist', () => {
    const backendPkgPath = path.join(ROOT_DIR, 'backend', 'package.json');
    const frontendPkgPath = path.join(ROOT_DIR, 'frontend', 'package.json');

    assert.ok(fs.existsSync(backendPkgPath), 'backend/package.json must exist');
    assert.ok(fs.existsSync(frontendPkgPath), 'frontend/package.json must exist');

    const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
    assert.strictEqual(backendPkg.name, 'linktest-backend');
    assert.strictEqual(backendPkg.type, 'module');
    assert.ok(backendPkg.scripts.test, 'backend must define test script');

    const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    assert.strictEqual(frontendPkg.name, 'linktest-frontend');
    assert.ok(frontendPkg.scripts.build, 'frontend must define build script');
  });

  await t.test('Backend source files and entrypoints exist', () => {
    const serverPath = path.join(ROOT_DIR, 'backend', 'src', 'server.js');
    const appPath = path.join(ROOT_DIR, 'backend', 'src', 'app.js');

    assert.ok(fs.existsSync(serverPath), 'backend/src/server.js must exist');
    assert.ok(fs.existsSync(appPath), 'backend/src/app.js must exist');
  });

  await t.test('GitHub Actions CI workflow exists and defines test and build jobs', () => {
    const ciPath = path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml');
    assert.ok(fs.existsSync(ciPath), '.github/workflows/ci.yml must exist');

    const ciContent = fs.readFileSync(ciPath, 'utf8');
    assert.match(ciContent, /npm test/, 'CI must execute npm test');
    assert.match(ciContent, /npm run build/, 'CI must execute npm run build');
    assert.match(ciContent, /actions\/checkout@v[0-9]/, 'CI must checkout repository');
    assert.match(ciContent, /actions\/setup-node@v[0-9]/, 'CI must set up Node');
  });

  await t.test('Environment documentation exists', () => {
    const backendEnvExample = path.join(ROOT_DIR, 'backend', '.env.example');
    assert.ok(fs.existsSync(backendEnvExample), 'backend/.env.example must exist');

    const envContent = fs.readFileSync(backendEnvExample, 'utf8');
    assert.match(envContent, /PORT=/, '.env.example must specify PORT');
    assert.match(envContent, /JWT_SECRET=/, '.env.example must specify JWT_SECRET');
  });

  await t.test('Database schema file exists and defines core tables', () => {
    const schemaPath = path.join(ROOT_DIR, 'backend', 'sql', 'schema.sql');
    assert.ok(fs.existsSync(schemaPath), 'backend/sql/schema.sql must exist');

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const requiredTables = [
      'users',
      'courses',
      'batches',
      'mock_tests',
      'mock_test_questions',
      'mock_test_attempts',
      'mock_test_responses',
      'mock_test_join_requests',
      'audit_logs',
      'security_logs',
      'question_bank',
      'coding_test_cases',
      'coding_submissions'
    ];

    for (const table of requiredTables) {
      const tableRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?${table}\\b`, 'i');
      assert.ok(tableRegex.test(schemaContent), `schema.sql must define table: ${table}`);
    }
  });

  await t.test('Security posture: Gitignore prevents credential and artifact leaks', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist at repository root');

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    assert.match(gitignoreContent, /\.env/, '.gitignore must ignore .env files');
    assert.match(gitignoreContent, /node_modules/, '.gitignore must ignore node_modules');
  });
});
