import { createSignal, onMount } from 'solid-js';
import './index.css';

function App() {
  const [display, setDisplay] = createSignal('0');
  const [operator, setOperator] = createSignal<string | null>(null);
  const [firstValue, setFirstValue] = createSignal<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = createSignal(false);
  const [expression, setExpression] = createSignal('');
  const [theme, setTheme] = createSignal('light');

  onMount(() => {
    loadConfig();
  });

  const loadConfig = async () => {
    try {
      const res = await fetch('/config');
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
      await fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Failed to save config:', err);
    }
  };

  const sendLogEntry = async (expression: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `Executed calculation at ${timestamp}: '${expression}'`;
    try {
      await fetch('/log', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: logEntry,
      });
    } catch (err) {
      console.warn('Failed to send log entry:', err);
    }
  };

  const toggleTheme = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    saveConfig({ theme: next });
  };

  function formatResult(value: number): string {
    return Number(value)
      .toPrecision(12)
      .replace(/\.?0+$/, '');
  }

  const inputDigit = (digit: string) => {
    setDisplay(waitingForOperand() ? digit : display() === '0' ? digit : display() + digit);
    setWaitingForOperand(false);
  };

  const inputDot = () => {
    if (!display().includes('.')) setDisplay(display() + '.');
  };

  const clear = () => {
    setDisplay('0');
    setOperator(null);
    setFirstValue(null);
    setWaitingForOperand(false);
    setExpression('');
  };

  const toggleSign = () => {
    setDisplay(display().startsWith('-') ? display().slice(1) : '-' + display());
  };

  const inputPercent = () => {
    const value = parseFloat(display());
    if (!isNaN(value)) setDisplay(String(value / 100));
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display());
    if (firstValue() == null) {
      setFirstValue(display());
      setExpression(`${display()}`);
    } else if (operator()) {
      setExpression(expression() + ` ${operator()} ${display()}`);
      const result = calculate(parseFloat(firstValue()!), inputValue, operator()!);
      setDisplay(formatResult(result));
      setFirstValue(String(result));
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        return second !== 0 ? first / second : NaN;
      default:
        return second;
    }
  };

  const handleEquals = () => {
    if (operator() && firstValue() != null) {
      const first = parseFloat(firstValue()!);
      const second = parseFloat(display());
      setExpression(expression() + ` ${operator()} ${display()}`);
      const result = calculate(first, second, operator()!);
      const formatted = formatResult(result);
      setExpression(expression() + ` = ${formatted}`);
      setDisplay(formatted);
      setFirstValue(null);
      setOperator(null);
      setWaitingForOperand(false);

      sendLogEntry(expression());
      setExpression('');
    }
  };

  const Button = (props: { label: string; onClick: () => void; class?: string }) => (
    <button
      class={`btn w-full ${props.class?.includes('col-span-2') ? '' : 'aspect-square'} ${props.class || 'btn-digit'}`}
      onClick={() => props.onClick()}
    >
      {props.label}
    </button>
  );

  return (
    <div class="max-w-xs mx-auto mt-10 p-6 bg-base-200 rounded-box shadow text-center">
      <div class="flex justify-end mb-4">
        <button class="btn btn-sm btn-outline" onClick={toggleTheme}>
          {theme() === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      <h1 class="text-2xl font-bold mb-4">Solid Calculator</h1>
      <div class="mb-4 text-right text-3xl bg-base-100 p-2 rounded-box border font-mono">{display()}</div>

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
    </div>
  );
}

export default App;
