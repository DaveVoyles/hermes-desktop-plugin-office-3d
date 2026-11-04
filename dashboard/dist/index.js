// office-3d v1.3.0 - Live isometric office view of the Hermes profile gateways
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
          SDK.fetchJSON('/api/plugins/office-3d/state')
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
    var iframeSrc = 'http://' + host + ':8790/wraps/office-3d/index.html';

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
    window.__HERMES_PLUGINS__.register('office-3d', Office3DTab);
  }
})();
