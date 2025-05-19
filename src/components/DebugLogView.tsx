import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'log' | 'warn' | 'error';
}

const DebugLogView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const interceptConsoleMethod = (methodName: 'log' | 'warn' | 'error') => {
      const originalMethod = console[methodName];
      console[methodName] = (...args: any[]) => {
        originalMethod.apply(console, args); // Chama o método original primeiro
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              // Tenta stringify, mas lida com objetos grandes ou circulares de forma simples
              return JSON.stringify(arg, (key, value) => {
                if (value && typeof value === 'object' && Object.keys(value).length > 20) { 
                  return '[Object Too Large]'; // Limita profundidade/tamanho
                }
                return value;
              }, 2);
            } catch (e) {
              return 'Unserializable Object';
            }
          }
          return String(arg);
        }).join(' ');

        setLogs(prevLogs => [
          { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type: methodName },
          ...prevLogs,
        ].slice(0, 100)); // Manter apenas os últimos 100 logs
      };
      return originalMethod;
    };

    const originalConsoleLog = interceptConsoleMethod('log');
    const originalConsoleWarn = interceptConsoleMethod('warn');
    const originalConsoleError = interceptConsoleMethod('error');

    return () => { // Cleanup: restaura os métodos originais do console
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '5px',
      left: '5px',
      right: '5px',
      maxHeight: '150px',
      overflowY: 'auto',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      fontSize: '10px',
      padding: '8px',
      zIndex: 99999,
      border: '1px solid #444',
      borderRadius: '4px',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
    }}>
      <strong style={{ display: 'block', marginBottom: '5px', color: '#88dd88' }}>CONSOLE LOGS:</strong>
      {logs.map((log, index) => (
        <div 
          key={index} 
          style={{ 
            color: log.type === 'error' ? '#ff7b7b' : log.type === 'warn' ? '#ffd700' : '#90ee90',
            borderBottom: logs.length -1 === index ? 'none' : '1px dashed #555',
            padding: '2px 0',
            marginBottom: '2px',
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-all',
          }}
        >
          <span style={{color: '#aaa'}}>[{log.timestamp}]</span> <span style={{color: '#ccc'}}>[{log.type.toUpperCase()}]:</span> {log.message}
        </div>
      ))}
    </div>
  );
};

export default DebugLogView;
