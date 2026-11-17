import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChatMessages } from "../src/utils/chatMessages.js";

test("Chỉ gửi 5 cặp hỏi đáp gần nhất và câu hỏi mới", () => {
  const history = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `Tin ${i}`, extra: "không gửi" }));
  const messages = buildChatMessages(history, "  Hỏi tiếp  ");
  assert.equal(messages.length, 11);
  assert.deepEqual(messages[0], { role: "user", content: "Tin 10" });
  assert.deepEqual(messages.at(-1), { role: "user", content: "Hỏi tiếp" });
  assert.equal(history.length, 20);
});

test("Hội thoại dài được rút gọn theo từng cặp để không mất câu hỏi mới", () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "a".repeat(i % 2 ? 10000 : 2000) }));
  const messages = buildChatMessages(history, "Câu hỏi mới");
  assert.ok(messages.reduce((sum, item) => sum + item.content.length, 0) <= 24000);
  assert.equal(messages.at(-1).content, "Câu hỏi mới");
  assert.equal(messages[0].role, "user");
  assert.ok(messages.every((item, i) => item.role === (i % 2 ? "assistant" : "user")));
});
