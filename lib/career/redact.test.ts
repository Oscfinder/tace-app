import { test } from "node:test";
import assert from "node:assert/strict";
import { redactReflection as redact } from "./redact.ts";

test("removes phone numbers, emails, links, handles and app names", () => {
  assert.doesNotMatch(redact("call me on 0803 123 4567 I love football"), /0803|4567/);
  assert.match(redact("call me on 0803 123 4567 I love football"), /football/);
  assert.doesNotMatch(redact("my number is +234 803 123 4567"), /234|4567/);
  assert.doesNotMatch(redact("mail ada.obi@gmail.com thanks"), /@|gmail/);
  assert.doesNotMatch(redact("see www.mypage.com or https://x.io/me"), /mypage|x\.io/);
  assert.doesNotMatch(redact("I am @ada_obi on there"), /ada_obi/);
  assert.doesNotMatch(redact("add me on Instagram"), /instagram/i);
});

test("removes the child's own names and school, in any letter case", () => {
  const out = redact("My name is ADA Obi and I go to st mary's school", ["Ada", "Obi", "St Mary's School"]);
  assert.doesNotMatch(out, /\bada\b|\bobi\b|mary/i);
  assert.doesNotMatch(redact("I study at Kings College Lagos", ["Kings College Lagos"]), /Kings/);
});

test("keeps the meaning of what the child wrote", () => {
  assert.match(redact("I am proud that I fixed my uncle's radio", ["Ada"]), /fixed my uncle's radio/);
  assert.equal(redact("I like drawing and helping my sister", ["Ada"]), "I like drawing and helping my sister");
});

test("special characters in a name cannot break it", () => {
  assert.doesNotMatch(redact("call me a.b (the great)", ["a.b (the great)"]), /great/);
});
