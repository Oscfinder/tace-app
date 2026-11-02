import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminMfaRequired } from "./mfa.ts";

test("only the exact value true turns admin two-factor on", () => {
  const original = process.env.ADMIN_MFA_REQUIRED;
  try {
    for (const off of [undefined, "", "false", "TRUE", "True", "1", "yes", " true", "true "]) {
      if (off === undefined) delete process.env.ADMIN_MFA_REQUIRED;
      else process.env.ADMIN_MFA_REQUIRED = off;
      assert.equal(isAdminMfaRequired(), false, JSON.stringify(off));
    }
    process.env.ADMIN_MFA_REQUIRED = "true";
    assert.equal(isAdminMfaRequired(), true);
  } finally {
    if (original === undefined) delete process.env.ADMIN_MFA_REQUIRED;
    else process.env.ADMIN_MFA_REQUIRED = original;
  }
});
