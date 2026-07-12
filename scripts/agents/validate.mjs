import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const expectedSkills = [
  'ai-recommendations',
  'business-pilot-product',
  'data-sync',
  'database-design',
  'ecommerce-analytics',
  'email-retention',
  'hosting-planning',
  'nestjs-backend',
  'nextjs-frontend',
  'repo-review',
  'security-review',
  'woocommerce-integration',
];

const expectedAgents = [
  'backend-engineer.toml',
  'database-architect.toml',
  'frontend-engineer.toml',
  'hosting-planner.toml',
  'product-architect.toml',
  'repo-reviewer.toml',
  'security-reviewer.toml',
  'woocommerce-engineer.toml',
];

const errors = [];

function fail(message) {
  errors.push(message);
}

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function validateSkills() {
  const skillsRoot = path.join(root, '.agents', 'skills');
  const entries = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skill of expectedSkills) {
    if (!entries.includes(skill)) {
      fail(`Missing skill directory: ${skill}`);
      continue;
    }

    const skillFile = path.join(skillsRoot, skill, 'SKILL.md');
    if (!(await fileExists(skillFile))) {
      fail(`Missing SKILL.md: ${skill}`);
      continue;
    }

    const content = await readFile(skillFile, 'utf8');
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

    if (!frontmatter) {
      fail(`Missing YAML frontmatter: ${skill}`);
      continue;
    }

    const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();

    if (name !== skill) {
      fail(`Skill name mismatch in ${skill}: expected '${skill}', got '${name ?? ''}'`);
    }

    if (!description || description.length < 20) {
      fail(`Skill description is missing or too short: ${skill}`);
    }
  }

  for (const entry of entries) {
    if (!expectedSkills.includes(entry)) {
      fail(`Unexpected skill directory: ${entry}`);
    }
  }
}

async function validateAgents() {
  const agentsRoot = path.join(root, '.codex', 'agents');
  const entries = (await readdir(agentsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.toml'))
    .map((entry) => entry.name)
    .sort();

  for (const agentFile of expectedAgents) {
    if (!entries.includes(agentFile)) {
      fail(`Missing custom agent: ${agentFile}`);
      continue;
    }

    const content = await readFile(path.join(agentsRoot, agentFile), 'utf8');

    for (const requiredKey of ['name', 'description', 'developer_instructions']) {
      const pattern = new RegExp(`^${requiredKey}\\s*=`, 'm');
      if (!pattern.test(content)) {
        fail(`Missing '${requiredKey}' in ${agentFile}`);
      }
    }
  }

  for (const entry of entries) {
    if (!expectedAgents.includes(entry)) {
      fail(`Unexpected custom agent file: ${entry}`);
    }
  }

  const configPath = path.join(root, '.codex', 'config.toml');
  if (!(await fileExists(configPath))) {
    fail('Missing .codex/config.toml');
    return;
  }

  const config = await readFile(configPath, 'utf8');
  if (!/^\[agents\]$/m.test(config)) fail("Missing '[agents]' section in .codex/config.toml");
  if (!/^max_threads\s*=\s*\d+$/m.test(config)) fail('Missing agents.max_threads');
  if (!/^max_depth\s*=\s*\d+$/m.test(config)) fail('Missing agents.max_depth');
}

await validateSkills();
await validateAgents();

if (errors.length > 0) {
  console.error('Agent configuration validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Agent configuration is valid: ${expectedSkills.length} skills, ${expectedAgents.length} custom agents.`);
