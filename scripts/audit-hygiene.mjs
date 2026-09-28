#!/usr/bin/env node

/**
 * scripts/audit-hygiene.mjs
 *
 * Script determinístico de auditoria de higiene do repositório, segurança estática e conformidade Git.
 * Executa estritamente operações de LEITURA. NENHUMA operação de escrita Git (add, commit, push) é realizada.
 *
 * Verificações realizadas:
 * 1. git diff --check (conflitos e problemas de whitespace na working tree e no stage)
 * 2. Detecção de arquivos proibidos (arquivos .env*, bancos SQLite, artefatos .next, logs, relatórios)
 * 3. Varredura de defesa em profundidade para segredos/chaves de API expostas em arquivos modificados
 * 4. Verificação de desvio de escopo (se o parâmetro --scope for fornecido)
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_FILE_PATTERNS = [
  {
    name: 'Arquivo de ambiente ou segredo (.env)',
    pattern: /(^|[/\\])\.env(\.(local|development|test|production)(\.local)?)?$/i,
    allowed: /(^|[/\\])\.env\.example$/i,
  },
  {
    name: 'Banco de dados SQLite operacional ou transitório (*.db, *.db-wal, etc.)',
    pattern: /\.(db|db-journal|db-wal|db-shm)$/i,
    allowed: null,
  },
  {
    name: 'Dados locais em .workspace/data/',
    pattern: /(^|[/\\])\.workspace[/\\]data[/\\]/i,
    allowed: null,
  },
  {
    name: 'Artefato de build ou compilação (.next, out, dist, build, *.tsbuildinfo)',
    pattern: /(^|[/\\])(\.next|out|dist|build)[/\\]|\.tsbuildinfo$/i,
    allowed: null,
  },
  {
    name: 'Relatório ou cache de testes (coverage, test-results, playwright-report)',
    pattern: /(^|[/\\])(coverage|test-results|playwright-report|blob-report)[/\\]/i,
    allowed: null,
  },
  {
    name: 'Arquivo de log (*.log)',
    pattern: /\.(log|log\.\d+)$/i,
    allowed: null,
  },
  {
    name: 'Arquivo temporário de SO ou IDE (.DS_Store, Thumbs.db, *.suo)',
    pattern: /(^|[/\\])(\.DS_Store|Thumbs\.db|\.idea[/\\]|\.vscode[/\\](?!settings\.json$|extensions\.json$)|.*\.suo$)/i,
    allowed: null,
  },
];

const SECRET_PATTERNS = [
  {
    name: 'Chave privada RSA/EC/DSA/OpenSSH',
    regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
  },
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z\-_]{35}/,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,}/,
  },
  {
    name: 'Slack Token',
    regex: /xox[baprs]-[0-9A-Za-z-]{10,}/,
  },
];

function runGitCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    if (err.stdout || err.stderr) {
      return (err.stdout || '') + (err.stderr || '');
    }
    throw err;
  }
}

function checkGitDiff() {
  const violations = [];

  // Checa diff unstaged
  try {
    execSync('git diff --check', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    if (output.trim()) {
      violations.push(`[git diff --check (unstaged)]:\n${output.trim()}`);
    }
  }

  // Checa diff staged (cached)
  try {
    execSync('git diff --cached --check', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    if (output.trim()) {
      violations.push(`[git diff --cached --check (staged)]:\n${output.trim()}`);
    }
  }

  return violations;
}

function getChangedFilesFromStatus() {
  const output = runGitCommand('git status --porcelain');
  if (!output) return [];

  const lines = output.split(/\r?\n/);
  const files = [];

  for (const line of lines) {
    if (!line || line.trim().length === 0) continue;
    const status = line.substring(0, 2);
    let filePath = line.substring(2).trim();

    // Lida com caminhos renomeados (ex: R  old -> new)
    if (filePath.includes(' -> ')) {
      filePath = filePath.split(' -> ')[1].trim();
    }

    // Remove aspas se o git escapou o caminho
    if (filePath.startsWith('"') && filePath.endsWith('"')) {
      filePath = filePath.slice(1, -1);
    }

    files.push({ status, path: filePath });
  }

  return files;
}

function checkForbiddenFiles(changedFiles) {
  const violations = [];

  for (const { status, path: filePath } of changedFiles) {
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const rule of FORBIDDEN_FILE_PATTERNS) {
      if (rule.pattern.test(normalizedPath)) {
        if (rule.allowed && rule.allowed.test(normalizedPath)) {
          continue;
        }
        violations.push(`[Arquivo Proibido Detectado (${rule.name})]: status "${status}" em "${filePath}"`);
      }
    }
  }

  return violations;
}

function checkSensitiveContent(changedFiles) {
  const violations = [];
  const textExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.json', '.yaml', '.yml', '.md', '.txt', '.sql',
    '.css', '.html', '.csv', '.env.example'
  ]);

  for (const { path: filePath } of changedFiles) {
    if (!fs.existsSync(filePath)) continue;

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) continue;
      if (stat.size > 1024 * 1024) continue; // Pula arquivos > 1MB

      const ext = path.extname(filePath).toLowerCase();
      if (!textExtensions.has(ext) && !path.basename(filePath).startsWith('.')) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const secretRule of SECRET_PATTERNS) {
          if (secretRule.regex.test(line)) {
            violations.push(
              `[Segredo/Credencial em Potencial (${secretRule.name})]: em ${filePath}:${i + 1} -> "${line.trim().slice(0, 80)}..."`
            );
          }
        }
      }
    } catch {
      // Ignora erro de leitura caso arquivo tenha sido deletado entre os passos
    }
  }

  return violations;
}

function checkScope(changedFiles) {
  const violations = [];
  const scopeArg = process.argv.find(arg => arg.startsWith('--scope='));
  if (!scopeArg) return violations;

  const allowedScope = scopeArg
    .replace('--scope=', '')
    .split(',')
    .map(p => p.trim().replace(/\\/g, '/'))
    .filter(Boolean);

  if (allowedScope.length === 0) return violations;

  for (const { path: filePath } of changedFiles) {
    const normalized = filePath.replace(/\\/g, '/');
    const isAllowed = allowedScope.some(allowed => {
      if (allowed.endsWith('/')) {
        return normalized.startsWith(allowed);
      }
      return normalized === allowed;
    });

    if (!isAllowed) {
      violations.push(`[Desvio de Escopo Detectado]: Arquivo "${filePath}" não está na lista de escopo aprovada.`);
    }
  }

  return violations;
}

function main() {
  console.log('='.repeat(70));
  console.log('🔍 INICIANDO AUDITORIA DETERMINÍSTICA DE HIGIENE E SEGURANÇA');
  console.log('   (Operação estritamente de LEITURA — zero modificação no Git)');
  console.log('='.repeat(70));

  const allViolations = [];

  // 1. git diff --check
  console.log('\n[1/4] Verificando git diff --check (whitespace e conflitos)...');
  const diffViolations = checkGitDiff();
  if (diffViolations.length > 0) {
    allViolations.push(...diffViolations);
    console.log('      ❌ Falha detectada em git diff --check');
  } else {
    console.log('      ✅ Limpo (sem problemas de whitespace ou conflitos)');
  }

  // Obter arquivos alterados/não rastreados
  const changedFiles = getChangedFilesFromStatus();

  // 2. Arquivos proibidos
  console.log('\n[2/4] Verificando arquivos proibidos (.env, *.db, .next, logs, etc.)...');
  const forbiddenViolations = checkForbiddenFiles(changedFiles);
  if (forbiddenViolations.length > 0) {
    allViolations.push(...forbiddenViolations);
    console.log(`      ❌ ${forbiddenViolations.length} arquivo(s) proibido(s) detectado(s)`);
  } else {
    console.log('      ✅ Nenhum arquivo proibido detectado na working tree/staging');
  }

  // 3. Varredura de defesa em profundidade para segredos
  console.log('\n[3/4] Varrendo segredos em arquivos modificados (defesa em profundidade)...');
  const secretViolations = checkSensitiveContent(changedFiles);
  if (secretViolations.length > 0) {
    allViolations.push(...secretViolations);
    console.log(`      ❌ ${secretViolations.length} padrão(ões) suspeito(s) de credencial detectado(s)`);
  } else {
    console.log('      ✅ Nenhum padrão de credencial conhecido detectado');
  }
  console.log('      ℹ️  Lembrete: Esta varredura é complementar; a inspeção humana do diff no Gate permanece obrigatória.');

  // 4. Verificação de escopo
  console.log('\n[4/4] Verificando conformidade com escopo autorizado...');
  const scopeViolations = checkScope(changedFiles);
  if (scopeViolations.length > 0) {
    allViolations.push(...scopeViolations);
    console.log(`      ❌ ${scopeViolations.length} arquivo(s) fora do escopo detectado(s)`);
  } else {
    console.log('      ✅ Escopo validado com sucesso');
  }

  console.log('\n' + '='.repeat(70));
  if (allViolations.length > 0) {
    console.error('❌ AUDITORIA DE HIGIENE FALHOU COM AS SEGUINTES VIOLAÇÕES:');
    allViolations.forEach((v, idx) => console.error(`  ${idx + 1}. ${v}`));
    console.error('='.repeat(70));
    process.exit(1);
  } else {
    console.log('✅ AUDITORIA DE HIGIENE E SEGURANÇA CONCLUÍDA COM SUCESSO (0 VIOLAÇÕES)');
    console.log('='.repeat(70));
    process.exit(0);
  }
}

main();
