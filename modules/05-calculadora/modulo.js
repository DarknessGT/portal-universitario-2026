// MÓDULO 05: Calculadora
// Actividad: Realizar suma, resta, multiplicación y división.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// Evite modificar módulos asignados a otros compañeros.

document.addEventListener("DOMContentLoaded", () => {
  const calculator = document.getElementById("app-05");
  const display = document.getElementById("pantalla-05");
  const status = document.getElementById("resultado-05");

  if (!calculator || !display || !status) return;

  const MAX_DIGITS = 12;
  let displayValue = "0";
  let currentValue = 0;
  let accumulator = null;
  let operator = null;
  let waitingForOperand = false;
  let justCalculated = false;
  let hasError = false;

  const formatNumber = value => {
    if (Object.is(value, -0)) return "0";
    return Number(value.toPrecision(12)).toString();
  };

  const render = () => {
    display.textContent = displayValue;
  };

  const clear = () => {
    displayValue = "0";
    currentValue = 0;
    accumulator = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    hasError = false;
    status.textContent = "";
    render();
  };

  const startFreshEntry = () => {
    displayValue = "0";
    currentValue = 0;
    accumulator = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    hasError = false;
  };

  const showError = message => {
    displayValue = "Error";
    accumulator = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    hasError = true;
    status.textContent = message;
    render();
  };

  const calculate = (left, right, selectedOperator) => {
    switch (selectedOperator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) return null;
        return left / right;
      default:
        return null;
    }
  };

  const selectOperator = nextOperator => {
    if (hasError) return;

    if (operator !== null && !waitingForOperand) {
      const result = calculate(accumulator, currentValue, operator);
      if (result === null || !Number.isFinite(result)) {
        showError(result === null ? "No se puede dividir entre cero." : "El resultado está fuera del rango permitido.");
        return;
      }

      accumulator = result;
      currentValue = result;
      displayValue = formatNumber(result);
    } else if (operator === null) {
      accumulator = currentValue;
    }

    operator = nextOperator;
    waitingForOperand = true;
    justCalculated = false;
    status.textContent = `Operación pendiente: ${formatNumber(accumulator)} ${operator === "*" ? "×" : operator === "/" ? "÷" : operator === "-" ? "−" : operator}`;
    render();
  };

  const enterDigit = digit => {
    if (hasError || justCalculated) startFreshEntry();

    if (waitingForOperand) {
      displayValue = digit;
      waitingForOperand = false;
    } else if (displayValue.replace(/\D/g, "").length < MAX_DIGITS) {
      displayValue = displayValue === "0" ? digit : `${displayValue}${digit}`;
    } else {
      status.textContent = `Se permiten hasta ${MAX_DIGITS} dígitos por número.`;
      return;
    }

    currentValue = Number(displayValue);
    hasError = false;
    justCalculated = false;
    status.textContent = "";
    render();
  };

  const enterDecimal = () => {
    if (hasError || justCalculated) startFreshEntry();

    if (waitingForOperand) {
      displayValue = "0.";
      waitingForOperand = false;
    } else if (displayValue.includes(".")) {
      status.textContent = "Usa un solo separador decimal por número.";
      return;
    } else if (displayValue.replace(/\D/g, "").length >= MAX_DIGITS) {
      status.textContent = `Se permiten hasta ${MAX_DIGITS} dígitos por número.`;
      return;
    } else {
      displayValue = `${displayValue}.`;
    }

    currentValue = Number(displayValue);
    hasError = false;
    justCalculated = false;
    status.textContent = "";
    render();
  };

  const calculateResult = () => {
    if (hasError || operator === null) return;
    if (waitingForOperand) {
      status.textContent = "Ingresa el segundo número antes de calcular.";
      return;
    }

    const left = accumulator;
    const right = currentValue;
    const selectedOperator = operator;
    const result = calculate(left, right, selectedOperator);

    if (result === null || !Number.isFinite(result)) {
      showError(result === null ? "No se puede dividir entre cero." : "El resultado está fuera del rango permitido.");
      return;
    }

    currentValue = result;
    displayValue = formatNumber(result);
    accumulator = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = true;
    status.textContent = `${formatNumber(left)} ${selectedOperator === "*" ? "×" : selectedOperator === "/" ? "÷" : selectedOperator === "-" ? "−" : selectedOperator} ${formatNumber(right)} = ${displayValue}`;
    render();
  };

  const perform = (action, value) => {
    if (action === "clear") clear();
    if (action === "digit") enterDigit(value);
    if (action === "decimal") enterDecimal();
    if (action === "operator") selectOperator(value);
    if (action === "calculate") calculateResult();
  };

  calculator.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || !calculator.contains(button)) return;
    perform(button.dataset.action, button.dataset.value);
  });

  calculator.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      clear();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && event.target instanceof HTMLButtonElement) return;

    if (/^[0-9]$/.test(event.key)) perform("digit", event.key);
    else if (event.key === "." || event.key === ",") perform("decimal");
    else if (["+", "-", "−", "*", "x", "X", "×", "/", "÷"].includes(event.key)) {
      const operators = { "−": "-", x: "*", X: "*", "×": "*", "/": "/", "÷": "/" };
      perform("operator", operators[event.key] ?? event.key);
    } else if (event.key === "=" || event.key === "Enter") {
      event.preventDefault();
      calculateResult();
    }
  });
});
