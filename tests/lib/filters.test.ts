import {
  DEFAULT_PROPOSITION_FILTERS,
  PROPOSITION_TYPE_OPTIONS,
  getPropositionTypeLabel,
  parsePropositionFilters,
} from "@/lib/filters";

describe("proposition filters helpers", () => {
  test("parsePropositionFilters falls back to defaults", () => {
    const params = new URLSearchParams();
    const parsed = parsePropositionFilters(params);
    expect(parsed).toEqual(DEFAULT_PROPOSITION_FILTERS);
  });

  test("parsePropositionFilters reads provided params", () => {
    const params = new URLSearchParams({
      search: "transporte",
      type: "PL",
    });
    const parsed = parsePropositionFilters(params);
    expect(parsed).toEqual({ search: "transporte", type: "PL" });
  });

  test("getPropositionTypeLabel falls back to value", () => {
    expect(getPropositionTypeLabel("MP")).toBe(
      PROPOSITION_TYPE_OPTIONS.find((opt) => opt.value === "MP")?.label,
    );
    expect(getPropositionTypeLabel("XYZ")).toBe("XYZ");
  });
});

