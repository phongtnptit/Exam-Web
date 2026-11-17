import { useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";
import { buildChatMessages } from "../utils/chatMessages";
import "../styles/chatbot.css";

const suggestions = [
  { topic: "Lập trình Web", question: "Giải thích useState và useEffect bằng ví dụ đơn giản." },
  { topic: "Cơ sở dữ liệu", question: "Phân biệt INNER JOIN và LEFT JOIN, kèm ví dụ." },
  { topic: "Mạng máy tính", question: "Giải thích sự khác nhau giữa TCP và UDP." },
  { topic: "Giải thuật", question: "Tạo 3 câu trắc nghiệm về tìm kiếm nhị phân và giải thích đáp án." },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    const container = conversationRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, sending, error]);

  async function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setSending(true);
    setError("");
    try {
      const result = await axiosClient.post("/chat", {
        messages: buildChatMessages(messages, question),
      }, { signal: controller.signal, timeout: 50000 });
      if (controller.signal.aborted) return;
      setMessages((previous) => [...previous,
        { role: "user", content: question },
        { role: "assistant", content: result.data.data.reply, incomplete: result.data.data.incomplete },
      ]);
      setInput("");
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.message || "Không gửi được câu hỏi. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setSending(false);
        inputRef.current?.focus();
      }
    }
  }

  function resetConversation() {
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="page-container chat-page">
      <div className="page-header-block">
        <div>
          <span className="section-badge">CÙNG BẠN ÔN TẬP</span>
          <h1>Trợ lý học tập AI</h1>
          <p>Hỏi để hiểu bài hơn. Từng khái niệm, từng ví dụ.</p>
        </div>
        <button type="button" className="btn-secondary" disabled={sending || (!messages.length && !input && !error)} onClick={resetConversation}>
          + Cuộc trò chuyện mới
        </button>
      </div>

      <section className="chat-panel" aria-label="Trò chuyện với trợ lý học tập">
        <div className="chat-panel-header">
          <span className="chat-avatar" aria-hidden="true">AI</span>
          <div><h2>Trợ lý ExamPro</h2><p>Giải thích dễ hiểu · Ví dụ thực tế · Câu hỏi luyện tập</p></div>
        </div>

        <div className="chat-conversation" ref={conversationRef} role="log" aria-label="Nội dung hội thoại" aria-live="polite" aria-relevant="additions" tabIndex={0}>
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span className="chat-welcome-mark" aria-hidden="true">AI</span>
              <h2>Hôm nay bạn muốn hiểu thêm điều gì?</h2>
              <p>Bắt đầu với một câu hỏi hoặc chọn một gợi ý bên dưới.</p>
              <div className="chat-suggestions">
                {suggestions.map(({ topic, question }) => (
                  <button type="button" key={topic} disabled={sending} onClick={() => { setInput(question); inputRef.current?.focus(); }}>
                    <strong>{topic}</strong><span>{question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <article className={`chat-message ${message.role}`} key={index}>
              <span className="chat-message-author">{message.role === "user" ? "Bạn" : "Trợ lý AI"}</span>
              <div className="chat-message-text">{message.content}</div>
              {message.incomplete && <p className="chat-incomplete">Câu trả lời đạt giới hạn độ dài. Bạn có thể hỏi tiếp để được giải thích thêm.</p>}
            </article>
          ))}

          {sending && <>
            <article className="chat-message user"><span className="chat-message-author">Bạn</span><div className="chat-message-text">{input.trim()}</div></article>
            <p className="chat-thinking" role="status">Trợ lý đang soạn câu trả lời…</p>
          </>}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit} aria-busy={sending}>
          {error && <div className="alert-box alert-error" role="alert">{error} Câu hỏi vẫn được giữ lại để bạn gửi lại.</div>}
          <label htmlFor="chat-question">Câu hỏi của bạn</label>
          <div className="chat-input-row">
            <textarea id="chat-question" ref={inputRef} rows={3} maxLength={2000} value={input} readOnly={sending}
              placeholder="Ví dụ: Giải thích khóa ngoại trong MySQL…" aria-describedby="chat-input-hint"
              onChange={(event) => setInput(event.target.value)} />
            <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>{sending ? "Đang trả lời…" : "Gửi câu hỏi"}</button>
          </div>
          <div className="chat-input-hint" id="chat-input-hint"><span>Nội dung trò chuyện được gửi đến dịch vụ AI để tạo câu trả lời.</span><span>{input.length}/2.000</span></div>
        </form>
      </section>
      <p className="chat-disclaimer">AI có thể trả lời chưa chính xác; hãy đối chiếu với tài liệu học. Hội thoại không lưu vào hệ thống và sẽ mất khi bạn rời trang hoặc tải lại.</p>
    </div>
  );
}
