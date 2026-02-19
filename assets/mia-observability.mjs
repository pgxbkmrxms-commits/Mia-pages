export const createTelemetry = (config, { setStatus, logDebug = () => {} } = {}) => {
  const toTelemetryText = (value) => {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const getErrorTelemetry = () => {
    try {
      const raw = localStorage.getItem(config.TELEMETRY_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveErrorTelemetry = (entries) => {
    try {
      localStorage.setItem(config.TELEMETRY_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      logDebug('Telemetry save failed', error);
    }
  };

  const clearErrorTelemetry = () => {
    try {
      localStorage.removeItem(config.TELEMETRY_STORAGE_KEY);
    } catch (error) {
      logDebug('Telemetry clear failed', error);
    }
  };

  const recordErrorTelemetry = (type, data = {}) => {
    if (!config.ENABLE_ERROR_TELEMETRY) {
      return;
    }
    const entries = getErrorTelemetry();
    entries.push({
      type,
      time: new Date().toISOString(),
      path: window.location.pathname,
      ...data
    });
    saveErrorTelemetry(entries.slice(-config.TELEMETRY_MAX_ITEMS));
  };

  const installGlobalHandlers = ({ onFatalError }) => {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      recordErrorTelemetry('error', {
        message: toTelemetryText(event.message || event.error),
        source: toTelemetryText(event.filename),
        line: event.lineno || null,
        column: event.colno || null,
        stack: toTelemetryText(event.error && event.error.stack)
      });
      if (typeof onFatalError === 'function') {
        onFatalError('Ein Fehler ist aufgetreten. Bitte Seite neu laden.');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      recordErrorTelemetry('unhandledrejection', {
        reason: toTelemetryText(event.reason)
      });
    });
  };

  const createDebugTelemetryPanel = () => {
    if (!config.DEBUG) {
      return;
    }

    const panel = document.createElement('div');
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Debugwerkzeuge');
    panel.className = 'debug-panel';

    const makeButton = (label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = 'debug-panel-button';
      return button;
    };

    const exportButton = makeButton('Telemetry kopieren');
    exportButton.addEventListener('click', async () => {
      const entries = getErrorTelemetry();
      const payload = JSON.stringify(entries, null, 2);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload);
        } else {
          throw new Error('Clipboard API unavailable');
        }
        setStatus(`Telemetry kopiert (${entries.length} Einträge).`);
      } catch (error) {
        setStatus('Kopieren fehlgeschlagen – siehe Konsole.', { isError: true });
        console.warn('Telemetry copy failed:', error, payload);
      }
    });

    const clearButton = makeButton('Telemetry leeren');
    clearButton.addEventListener('click', () => {
      clearErrorTelemetry();
      setStatus('Telemetry geleert.');
    });

    panel.appendChild(exportButton);
    panel.appendChild(clearButton);
    document.body.appendChild(panel);
  };

  return {
    getErrorTelemetry,
    clearErrorTelemetry,
    recordErrorTelemetry,
    installGlobalHandlers,
    createDebugTelemetryPanel
  };
};
