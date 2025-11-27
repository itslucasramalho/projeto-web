export type SelectOption = {
  value: string;
  label: string;
};

export const BRAZIL_STATE_OPTIONS: SelectOption[] = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export const STATE_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos os estados" },
  ...BRAZIL_STATE_OPTIONS,
];

export const PROPOSITION_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos os tipos" },
  { value: "PL", label: "Projeto de Lei (PL)" },
  { value: "PEC", label: "Emenda Constitucional (PEC)" },
  { value: "MP", label: "Medida Provisória (MP)" },
  { value: "PLP", label: "Lei Complementar (PLP)" },
];

export type PropositionFilters = {
  search: string;
  type: string;
};

export const DEFAULT_PROPOSITION_FILTERS: PropositionFilters = {
  search: "",
  type: "all",
};

export const parsePropositionFilters = (
  params: URLSearchParams,
): PropositionFilters => ({
  search: params.get("search") ?? DEFAULT_PROPOSITION_FILTERS.search,
  type: params.get("type") ?? DEFAULT_PROPOSITION_FILTERS.type,
});

export const getStateLabel = (value?: string) =>
  BRAZIL_STATE_OPTIONS.find((state) => state.value === value)?.label ?? value;

export const getPropositionTypeLabel = (value?: string) =>
  PROPOSITION_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
  value;
