const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const repoOwner = 'sivaprakhash12';
const repoName = 'tms-mobile';
const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist! Run predeploy first.');
  process.exit(1);
}

// Add empty .nojekyll so GitHub Pages does not ignore files starting with _ or special assets
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-deploy-'));
console.log('Copying dist to temporary directory:', tempDir);
fs.cpSync(distDir, tempDir, { recursive: true });

let remoteUrl = `https://github.com/${repoOwner}/${repoName}.git`;
try {
  const detected = execSync('git remote get-url origin', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  }).trim();
  if (detected) remoteUrl = detected;
} catch (e) {
  // Use default remoteUrl
}

function run(cmd, cwd) {
  return execSync(cmd, { cwd: cwd || tempDir, stdio: 'inherit' });
}

try {
  run('git init');
  run('git config user.name "sivaprakhash12"');
  run('git config user.email "sivaprakhash7@gmail.com"');
  run('git checkout -B gh-pages');
  run('git add -A');
  run('git commit -m "Deploy to GitHub Pages"');

  console.log(`Pushing to ${remoteUrl} (gh-pages)...`);
  try {
    run(`git push --force "${remoteUrl}" gh-pages`);
  } catch (pushErr) {
    console.log('Retrying with username in URL...');
    const authUrl = `https://${repoOwner}@github.com/${repoOwner}/${repoName}.git`;
    run(`git push --force "${authUrl}" gh-pages`);
  }

  console.log('\n--- Deployment Complete! ---');
  console.log(`Live URL: https://${repoOwner}.github.io/${repoName}/`);
} finally {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup error
  }
}
