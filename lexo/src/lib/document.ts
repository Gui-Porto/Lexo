function digits(value: string) {
  return value.replace(/\D/g, "");
}

function allSame(d: string) {
  return d.split("").every((c) => c === d[0]);
}

export function validateCPF(value: string): boolean {
  const d = digits(value);
  if (d.length !== 11 || allSame(d)) return false;

  const calc = (slice: string, weights: number[]) => {
    const sum = slice.split("").reduce((acc, c, i) => acc + Number(c) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const first = calc(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== Number(d[9])) return false;

  const second = calc(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return second === Number(d[10]);
}

export function validateCNPJ(value: string): boolean {
  const d = digits(value);
  if (d.length !== 14 || allSame(d)) return false;

  const calc = (slice: string, weights: number[]) => {
    const sum = slice.split("").reduce((acc, c, i) => acc + Number(c) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const first = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== Number(d[12])) return false;

  const second = calc(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return second === Number(d[13]);
}

export function validateDocument(value: string): boolean {
  const d = digits(value);
  if (d.length === 11) return validateCPF(d);
  if (d.length === 14) return validateCNPJ(d);
  return false;
}
