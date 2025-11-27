const INVALID_CPFS = new Set([
  "00000000000",
  "11111111111",
  "22222222222",
  "33333333333",
  "44444444444",
  "55555555555",
  "66666666666",
  "77777777777",
  "88888888888",
  "99999999999",
]);

export const normalizeCpf = (value: string) => value.replace(/\D/g, "");

export const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11);
  const parts = [];

  if (digits.length > 0) {
    parts.push(digits.slice(0, 3));
  }
  if (digits.length > 3) {
    parts.push(digits.slice(3, 6));
  }
  if (digits.length > 6) {
    parts.push(digits.slice(6, 9));
  }

  let formatted = parts.join(".");

  if (digits.length > 9) {
    formatted += `-${digits.slice(9, 11)}`;
  }

  return formatted;
};

export const isValidCpf = (value: string) => {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11 || INVALID_CPFS.has(cpf)) {
    return false;
  }

  const calcDigit = (factor: number) => {
    let total = 0;
    for (let i = 0; i < factor - 1; i++) {
      total += Number(cpf[i]) * (factor - i);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const digit1 = calcDigit(10);
  const digit2 = calcDigit(11);

  return digit1 === Number(cpf[9]) && digit2 === Number(cpf[10]);
};

export const validateCpf = (value: string) =>
  isValidCpf(value) ? null : "CPF inválido";
