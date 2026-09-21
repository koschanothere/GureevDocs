const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const pkg = require(path.join(projectRoot, "package.json"));

const releaseDir = path.join(projectRoot, "release");
const latestDir = path.join(projectRoot, "release-latest");
const installerName = `${pkg.build.productName} Setup ${pkg.version}.exe`;
const src = path.join(releaseDir, installerName);

if (!fs.existsSync(src)) {
  console.error(`Installer not found: ${src}`);
  process.exit(1);
}

fs.rmSync(latestDir, { recursive: true, force: true });
fs.mkdirSync(latestDir, { recursive: true });
fs.copyFileSync(src, path.join(latestDir, installerName));

console.log(`release-latest/${installerName}`);
