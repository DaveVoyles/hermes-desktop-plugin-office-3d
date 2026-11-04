#!/usr/bin/env node
// Deterministically build dashboard/dist/index.js from dashboard/manifest.json + plugin_api.py
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const manifestPath = path.join(repoRoot, 'dashboard', 'manifest.json');
const apiPath = path.join(repoRoot, 'dashboard', 'plugin_api.py');
const distDir = path.join(repoRoot, 'dashboard', 'dist');
const distIndexPath = path.join(distDir, 'index.js');

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing manifest: ${manifestPath}`);
}
if (!fs.existsSync(apiPath)) {
  throw new Error(`Missing backend API: ${apiPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pluginName = manifest.name || 'office-3d';
const pluginVersion = manifest.version || '1.0.0';
const pluginDesc = manifest.description || 'Office 3D live overview';

// Verify backend route endpoint is present in plugin_api.py
const apiSource = fs.readFileSync(apiPath, 'utf8');
if (!apiSource.includes('/state')) {
  throw new Error('plugin_api.py missing /state endpoint');
}

const code = `// ${pluginName} v${pluginVersion} - ${pluginDesc}
// Built deterministically from dashboard/manifest.json + dashboard/plugin_api.py
(function () {
  "use strict";
  var SDK = window.__HERMES_PLUGIN_SDK__;
  var React = SDK.React;
  var hooks = SDK.hooks || {};
  var useEffect = hooks.useEffect || React.useEffect;
  var useRef = hooks.useRef || React.useRef;

  function Office3DTab() {
    var frameRef = useRef(null);

    useEffect(function () {
      var active = true;
      function poll() {
        if (typeof SDK.fetchJSON === 'function') {
          SDK.fetchJSON('/api/plugins/${pluginName}/state')
            .then(function (data) {
              if (!active) return;
              if (frameRef.current && frameRef.current.contentWindow) {
                frameRef.current.contentWindow.postMessage({ type: 'office-state', data: data }, '*');
              }
            })
            .catch(function () {});
        }
      }
      poll();
      var timer = setInterval(poll, 4000);
      return function () {
        active = false;
        clearInterval(timer);
      };
    }, []);

    var host = (typeof location !== 'undefined' && location.hostname) || 'mini-pro.tail86a7c7.ts.net';
    var iframeSrc = 'http://' + host + ':8790/wraps/${pluginName}/index.html';

    return React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: 'calc(100vh - 4.5rem)',
          position: 'relative',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          background: '#16191e'
        }
      },
      React.createElement('iframe', {
        ref: frameRef,
        src: iframeSrc,
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }
      })
    );
  }

  if (window.__HERMES_PLUGINS__ && typeof window.__HERMES_PLUGINS__.register === 'function') {
    window.__HERMES_PLUGINS__.register('${pluginName}', Office3DTab);
  }
})();
`;

fs.mkdirSync(distDir, { recursive: true });

// If dist/index.js exists and is a symlink, remove it so we write a real file
if (fs.existsSync(distIndexPath)) {
  const stat = fs.lstatSync(distIndexPath);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(distIndexPath);
  }
}

fs.writeFileSync(distIndexPath, code, 'utf8');

const finalStat = fs.lstatSync(distIndexPath);
if (finalStat.isSymbolicLink()) {
  throw new Error('dist/index.js must be a real file, not a symlink');
}

console.log(`Successfully built ${distIndexPath} (${finalStat.size} bytes)`);
