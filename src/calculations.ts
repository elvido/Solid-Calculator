type Operator = '+' | '-' | '*' | '/';

/**
 * Evaluates alternating numeric and operator tokens with normal precedence.
 * The UI uses NaN as the internal error value for invalid expressions.
 */
export function evaluateExpression(tokens: string[]): number {
  if (tokens.length < 3 || tokens.length % 2 === 0) return Number.NaN;

  const firstValue = Number(tokens[0]);
  if (!Number.isFinite(firstValue)) return Number.NaN;

  const values: number[] = [firstValue];
  const reducedOperators: Operator[] = [];

  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index] as Operator;
    const nextValue = Number(tokens[index + 1]);

    if (!Number.isFinite(nextValue)) return Number.NaN;

    if (operator === '*' || operator === '/') {
      const previous = values.pop()!;
      values.push(operator === '*' ? previous * nextValue : nextValue === 0 ? Number.NaN : previous / nextValue);
    } else {
      values.push(nextValue);
      reducedOperators.push(operator);
    }
  }

  return values.slice(1).reduce((result, value, index) => {
    const operator = reducedOperators[index];
    return operator === '+' ? result + value : result - value;
  }, values[0]);
}

/** Formats a finite result for the calculator display or returns its error state. */
export function formatResult(value: number, digitLimit = 14): string {
  if (!Number.isFinite(value)) return 'Error';

  return Number(value)
    .toPrecision(digitLimit)
    .replace(/\.?0+$/, '');
}

/** Limits the number of numeric digits while preserving a sign and decimal point. */
export function applyDigitLimit(input: string, digitLimit = 14): string {
  const unsigned = input.startsWith('-') || input.startsWith('+') ? input.slice(1) : input;
  const digitsOnly = unsigned.replace('.', '');
  const excess = digitsOnly.length - digitLimit;

  return excess <= 0 ? input : input.slice(0, input.length - excess);
}
