import { createSignal } from "solid-js";
import './index.css';

function App() {
  const [display, setDisplay] = createSignal<string>("0");
  const [operator, setOperator] = createSignal<string | null>(null);
  const [firstValue, setFirstValue] = createSignal<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = createSignal<boolean>(false);
  const [theme, setTheme] = createSignal("light");

  const toggleTheme = () => {
    const next = theme() === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand()) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display() === "0" ? digit : display() + digit);
    }
  };

  const inputDot = () => {
    if (!display().includes(".")) {
      setDisplay(display() + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setOperator(null);
    setFirstValue(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display());
    if (firstValue() == null) {
      setFirstValue(display());
    } else if (operator()) {
      const result = calculate(parseFloat(firstValue()!), inputValue, operator()!);
      setDisplay(String(result));
      setFirstValue(String(result));
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+": return first + second;
      case "-": return first - second;
      case "*": return first * second;
      case "/": return second !== 0 ? first / second : NaN;
      default: return second;
    }
  };

  const handleEquals = () => {
    if (operator() && firstValue() != null) {
      const result = calculate(parseFloat(firstValue()!), parseFloat(display()), operator()!);
      setDisplay(String(result));
      setFirstValue(null);
      setOperator(null);
      setWaitingForOperand(false);
    }
  };

  return (
    <div class="max-w-xs mx-auto mt-10 p-6 bg-base-200 rounded-box shadow text-center">
      {/* Theme toggle */}
      <div class="flex justify-end mb-4">
        <button class="btn btn-sm btn-outline" onClick={toggleTheme}>
          {theme() === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
  
      <h1 class="text-2xl font-bold mb-4">Solid Calculator</h1>

      {/* Display */}
      <div class="mb-4 text-right text-3xl bg-base-100 p-2 rounded-box border font-mono">
        {display()}
      </div>

      {/* C button row */}
      <div class="grid grid-cols-4 gap-2 mb-2">
        <button class="btn btn-error col-span-4 hover:scale-105 active:scale-95 transition-transform" onClick={() => clear()}>C</button>
      </div>

      {/* Main pad */}
      <div class="grid grid-cols-4 gap-2 mb-2">
        {/* Digits and operations */}
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("7")}>7</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("8")}>8</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("9")}>9</button>
        <button class="btn btn-accent aspect-square" onClick={() => performOperation("/")}>÷</button>

        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("4")}>4</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("5")}>5</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("6")}>6</button>
        <button class="btn btn-accent aspect-square" onClick={() => performOperation("*")}>×</button>

        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("1")}>1</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("2")}>2</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("3")}>3</button>
        <button class="btn btn-accent aspect-square" onClick={() => performOperation("-")}>−</button>

        <button class="btn btn-neutral aspect-square" onClick={inputDot}>.</button>
        <button class="btn btn-neutral aspect-square" onClick={() => inputDigit("0")}>0</button>
        <button class="btn btn-success aspect-square" onClick={handleEquals}>=</button>
        <button class="btn btn-accent aspect-square" onClick={() => performOperation("+")}>+</button>
      </div>

    </div>
  );
}

export default App;