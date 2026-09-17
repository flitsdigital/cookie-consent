const { buildSync } = require('esbuild');
const fs = require('fs');
const banner = `/* @flitsdigital/cookie-consent v${require('./package.json').version} */`;

fs.mkdirSync('dist', { recursive: true });
buildSync({ entryPoints: ['src/head.js'], minify: true, target: 'es5', outfile: 'dist/head.min.js' });
buildSync({ entryPoints: ['src/consent.js'], minify: true, target: 'es2017', banner: { js: banner }, outfile: 'dist/consent.min.js' });
fs.copyFileSync('src/consent.js', 'dist/consent.js');
fs.writeFileSync('dist/head.snippet.html', '<script>' + fs.readFileSync('dist/head.min.js', 'utf8').trim() + '</script>\n');
