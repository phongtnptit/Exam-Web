export function buildChatMessages(history, question) {
  const messages = [...history.slice(-10).map(({ role, content }) => ({ role, content })),
    { role: "user", content: question.trim() }];
  while (messages.length > 1 && messages.reduce((sum, item) => sum + item.content.length, 0) > 24000) {
    messages.splice(0, 2);
  }
  return messages;
}
