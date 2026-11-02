import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "./safe-redirect.ts";

const BACKSLASH = String.fromCharCode(92);

test("keeps ordinary same-site paths", () => {
  assert.equal(safeNextPath("/reset-password"), "/reset-password");
  assert.equal(safeNextPath("/a?b=1"), "/a?b=1");
  assert.equal(safeNextPath("/dashboard/admin"), "/dashboard/admin");
});

test("refuses anything that could leave the site", () => {
  const bad = [
    null,
    undefined,
    "",
    "//evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/" + BACKSLASH + "evil.com",
    "/\t/evil.com",
    "/..//evil.com",
    "/.//evil.com",
    "evil.com",
  ];
  for (const input of bad) assert.equal(safeNextPath(input as string), null, String(input));
});
