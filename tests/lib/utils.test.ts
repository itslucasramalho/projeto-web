import {
  canManageLaws,
  isAdminRole,
  isVerifiedRole,
  type UserRole,
} from "@/lib/utils";

describe("role helpers", () => {
  const roles: UserRole[] = ["citizen", "admin", "verified"];

  test("isAdminRole identifies only admins", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("verified")).toBe(false);
    expect(isAdminRole("citizen")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  test("isVerifiedRole identifies only verified", () => {
    expect(isVerifiedRole("verified")).toBe(true);
    expect(isVerifiedRole("admin")).toBe(false);
    expect(isVerifiedRole("citizen")).toBe(false);
    expect(isVerifiedRole()).toBe(false);
  });

  test("canManageLaws matches admins and verified", () => {
    const result = roles.map((role) => canManageLaws(role));
    expect(result).toEqual([false, true, true]);
    expect(canManageLaws()).toBe(false);
  });
});
