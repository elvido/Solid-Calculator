import { createSignal, onCleanup, onMount } from 'solid-js';
import './index.css';
import { applyDigitLimit, evaluateExpression, formatResult } from './calculator-logic.mjs';

type Operator = '+' | '-' | '*' | '/';

export { applyDigitLimit, evaluateExpression, formatResult };

export default function Calculator() {
  const [display, setDisplay] = createSignal('0');
  const [operator, setOperator] = createSignal<Operator | null>(null);
  const [tokens, setTokens] = createSignal<string[]>([]);
  const [waitingForOperand, setWaitingForOperand] = createSignal(false);
  const [theme, setTheme] = createSignal('light');

  const digitLimit = 14;

  const loadConfig = async () => {
    try {
      const res = await fetch('/config');
      if (!res.ok) throw new Error('Configuration request failed');

      const data = await res.json();
      if (data.theme === 'light' || data.theme === 'dark') {
        setTheme(data.theme);
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    } catch (err) {
      console.warn('Failed to load config:', err);
    }
  };

  const saveConfig = async (updates: { theme?: string }) => {
    try {
      const res = await fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Configuration update failed');
    } catch (err) {
      console.warn('Failed to save config:', err);
    }
  };

  const sendLogEntry = async (expression: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = 'Executed calculation at ' + timestamp + ": '" + expression + "'";
    try {
      const res = await fetch('/log', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: logEntry,
      });
      if (!res.ok) throw new Error('Audit log request failed');
    } catch (err) {
      console.warn('Failed to send log entry:', err);
    }
  };

  const clear = () => {
    setDisplay('0');
    setOperator(null);
    setTokens([]);
    setWaitingForOperand(false);
  };

  const resetError = () => {
    if (display() === 'Error') clear();
  };

  const inputDigit = (digit: string) => {
    resetError();
    const current = display();
    const next = waitingForOperand()
      ? digit
      : current === '0'
        ? digit
        : current === '-'
          ? '-' + digit
          : current + digit;
    setDisplay(applyDigitLimit(next, digitLimit));
    setWaitingForOperand(false);
  };

  const inputDot = () => {
    resetError();
    const current = display();
    if (waitingForOperand()) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (current === '-') {
      setDisplay('-0.');
    } else if (!current.includes('.')) {
      setDisplay(applyDigitLimit(current + '.', digitLimit));
    }
  };

  const backspace = () => {
    if (waitingForOperand() || display() === 'Error') return;

    const current = display();
    const next = current.length > 1 ? current.slice(0, -1) : '0';
    setDisplay(next === '-' ? '0' : next);
  };

  const toggleSign = () => {
    resetError();
    if (waitingForOperand()) {
      setDisplay('-');
      setWaitingForOperand(false);
      return;
    }

    const current = display();
    setDisplay(current === '0' ? '-' : current.startsWith('-') ? current.slice(1) || '0' : '-' + current);
    setWaitingForOperand(false);
  };

  const inputPercent = () => {
    resetError();
    const value = Number(display());
    if (Number.isFinite(value)) {
      setDisplay(formatResult(value / 100, digitLimit));
      setWaitingForOperand(false);
    }
  };

  const performOperation = (nextOperator: Operator) => {
    if (display() === 'Error') {
      clear();
      return;
    }

    const current = display();
    const currentTokens = tokens();

    if (waitingForOperand()) {
      if (currentTokens.length > 0) {
        setTokens([...currentTokens.slice(0, -1), nextOperator]);
      } else {
        setTokens([current, nextOperator]);
      }
    } else if (currentTokens.length === 0) {
      setTokens([current, nextOperator]);
    } else {
      setTokens([...currentTokens, current, nextOperator]);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (tokens().length === 0 || operator() == null) return;

    const fullExpression = [...tokens(), display()];
    const result = evaluateExpression(fullExpression);
    const formatted = formatResult(result, digitLimit);
    const expressionText = fullExpression.join(' ') + ' = ' + formatted;

    setDisplay(formatted);
    setTokens([]);
    setOperator(null);
    setWaitingForOperand(true);
    sendLogEntry(expressionText);
  };

  const toggleTheme = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    saveConfig({ theme: next });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;

    if (/^[0-9]$/.test(key)) inputDigit(key);
    else if (key === '.' || key === ',') inputDot();
    else if (key === '+' || key === '-' || key === '*' || key === '/') performOperation(key as Operator);
    else if (key === '%') inputPercent();
    else if (key === 'Enter' || key === '=') handleEquals();
    else if (key === 'Escape' || key === 'Delete') clear();
    else if (key === 'Backspace') backspace();
    else return;

    event.preventDefault();
  };

  onMount(() => {
    loadConfig();
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  const Button = (props: { label: string; onClick: () => void; class?: string }) => (
    <button
      type="button"
      class={
        'btn w-full ' +
        (props.class?.includes('col-span-2') ? '' : 'aspect-square') +
        ' ' +
        (props.class || 'btn-digit')
      }
      onClick={() => props.onClick()}
    >
      {props.label}
    </button>
  );

  return (
    <div class="max-w-xs mx-auto mt-10 p-6 bg-base-200 rounded-box shadow text-center">
      <div class="flex justify-end mb-4">
        <button type="button" class="btn btn-sm btn-outline" onClick={toggleTheme}>
          {theme() === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      <h1 class="text-2xl font-bold mb-4">Solid Calculator</h1>
      <div class="mb-4 text-right text-3xl bg-base-100 p-2 rounded-box border font-mono" aria-live="polite">
        {display()}
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2 auto-rows-fr">
        <Button label="AC" onClick={clear} class="btn-function" />
        <Button label="+/-" onClick={toggleSign} class="btn-function" />
        <Button label="%" onClick={inputPercent} class="btn-function" />
        <Button label="÷" onClick={() => performOperation('/')} class="btn-operator" />
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2 auto-rows-fr">
        <Button label="7" onClick={() => inputDigit('7')} class="btn-digit" />
        <Button label="8" onClick={() => inputDigit('8')} class="btn-digit" />
        <Button label="9" onClick={() => inputDigit('9')} class="btn-digit" />
        <Button label="×" onClick={() => performOperation('*')} class="btn-operator" />
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2 auto-rows-fr">
        <Button label="4" onClick={() => inputDigit('4')} class="btn-digit" />
        <Button label="5" onClick={() => inputDigit('5')} class="btn-digit" />
        <Button label="6" onClick={() => inputDigit('6')} class="btn-digit" />
        <Button label="−" onClick={() => performOperation('-')} class="btn-operator" />
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2 auto-rows-fr">
        <Button label="1" onClick={() => inputDigit('1')} class="btn-digit" />
        <Button label="2" onClick={() => inputDigit('2')} class="btn-digit" />
        <Button label="3" onClick={() => inputDigit('3')} class="btn-digit" />
        <Button label="+" onClick={() => performOperation('+')} class="btn-operator" />
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2 auto-rows-fr">
        <Button label="0" onClick={() => inputDigit('0')} class="btn-digit col-span-2" />
        <Button label="." onClick={inputDot} class="btn-digit" />
        <Button label="=" onClick={handleEquals} class="btn-operator" />
      </div>
      <div class="text-[0.55rem] text-right mt-4 mb-1 pr-1 leading-none">
        <a href="/about" class="link link-hover text-base-content opacity-50 hover:opacity-90">
          About
        </a>
      </div>
    </div>
  );
}
