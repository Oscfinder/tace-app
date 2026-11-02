import { test } from "node:test";
import assert from "node:assert/strict";
import { describeError, scrubEvent, scrubText } from "./scrub.ts";

test("scrubText removes emails, phone numbers, ids, tokens and quoted values", () => {
  const out = scrubText(
    'duplicate key (email)=(ada.obi@gmail.com) for "Ada Obi" call 0803 123 4567 id 11111111-2222-4333-8444-555555555555 Bearer abc123 https://x.io/p?token=zzz',
  );
  for (const leak of ["ada.obi", "Ada Obi", "0803", "4567", "11111111", "abc123", "token=zzz"]) {
    assert.ok(!out.includes(leak), `leaked ${leak}: ${out}`);
  }
});

test("scrubText caps the length", () => {
  assert.ok(scrubText("x".repeat(5000)).length <= 300);
});

test("scrubEvent strips user, request, extra, breadcrumbs and source lines", () => {
  const event = {
    user: { id: "u1", email: "ada@x.com", ip_address: "1.2.3.4" },
    request: { url: "https://site/dashboard/admin/beneficiaries/abc?x=1", cookies: { sb: "secret" }, data: { name: "Ada" } },
    extra: { body: "hello Ada" },
    server_name: "host-1",
    breadcrumbs: [{ message: "fetch /api?email=ada@x.com" }],
    contexts: { runtime: { name: "node" }, device: { model: "Tecno" }, os: { name: "Android" } },
    transaction: "/dashboard/admin/finance?from=2026-01-01",
    tags: { digest: "123", route: "/x", note: "email ada@x.com" },
    exception: {
      values: [
        {
          type: "Error",
          value: 'Message from "Ada" to ada@x.com failed',
          stacktrace: {
            frames: [
              { filename: "app/a.ts", lineno: 10, context_line: "const name = 'Ada'", pre_context: ["x"], post_context: ["y"], vars: { name: "Ada" } },
            ],
          },
        },
      ],
    },
  };
  const out = JSON.stringify(scrubEvent(event));
  for (const leak of ["ada@x.com", "Ada", "1.2.3.4", "secret", "Tecno", "Android", "host-1", "x=1", "from=2026"]) {
    assert.ok(!out.includes(leak), `report still contains ${leak}: ${out}`);
  }
  assert.ok(out.includes("app/a.ts") && out.includes('"lineno":10'), "keeps the code location");
  assert.ok(out.includes('"digest":"123"'), "keeps the digest");
  assert.ok(out.includes("/dashboard/admin/finance"), "keeps the route");
});

test("describeError returns a safe name and message", () => {
  const d = describeError(new TypeError('bad value "Ada" ada@x.com'));
  assert.equal(d.name, "TypeError");
  assert.ok(!d.message.includes("Ada") && !d.message.includes("@"));
  assert.equal(describeError("plain string ada@x.com").name, "NonError");
});
