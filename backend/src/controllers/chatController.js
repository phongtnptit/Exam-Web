const INSTRUCTIONS = `Bạn là Trợ lý học tập AI của PTIT ExamPro.
Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, ưu tiên giải thích từng bước và ví dụ.
Hỗ trợ ôn tập Lập trình Web, Cơ sở dữ liệu, Mạng máy tính, Cấu trúc dữ liệu và Giải thuật.
Khi tạo câu luyện tập, nói rõ đây là câu tự tạo, không phải câu lấy từ ngân hàng đề thi.
Bạn không có quyền truy cập database, tài khoản, điểm số hoặc đáp án đề thi của hệ thống.
Không bịa dữ liệu của hệ thống. Nếu chưa chắc, hãy nói rõ.
Trình bày dạng văn bản thuần, dùng xuống dòng và đánh số; tránh bảng và cú pháp Markdown phức tạp.`;

export async function chat(req, res) {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 11 ||
      messages.some((message, index) =>
        !message || message.role !== (index % 2 === 0 ? "user" : "assistant") ||
        typeof message.content !== "string" || !message.content.trim() ||
        message.content.length > (message.role === "user" ? 2000 : 12000)) ||
      messages.at(-1).role !== "user" ||
      messages.reduce((total, message) => total + message.content.length, 0) > 24000) {
    return res.status(400).json({ success: false, message: "Hội thoại không hợp lệ. Câu hỏi tối đa 2.000 ký tự; hãy bắt đầu cuộc trò chuyện mới nếu hội thoại quá dài." });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return res.status(503).json({ success: false, message: "Trợ lý AI chưa được cấu hình. Vui lòng liên hệ người quản lý hệ thống." });
  }

  try {

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
        contents: messages.map(({ role, content }) => ({
          role: role === "assistant" ? "model" : "user",
          parts: [{ text: content.trim() }],
        })),
        generationConfig: { maxOutputTokens: 1600 },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const invalidKey = details.error?.details?.some((detail) =>
        ["API_KEY_INVALID", "API_KEY_EXPIRED"].includes(detail.reason));
      const errors = {
        400: "Yêu cầu Gemini chưa hợp lệ. Hãy kiểm tra GEMINI_MODEL và cấu hình project trong Google AI Studio.",
        401: "API key Gemini không hợp lệ. Hãy kiểm tra GEMINI_API_KEY trong backend/.env.",
        402: "Project Gemini cần kiểm tra số dư hoặc cấu hình thanh toán trong Google AI Studio.",
        403: "API key hoặc project chưa có quyền gọi Gemini. Hãy kiểm tra quyền API và giới hạn của key.",
        404: "Model Gemini chưa khả dụng. Hãy kiểm tra GEMINI_MODEL và quyền truy cập của project.",
        429: "Gemini đã chạm giới hạn tốc độ hoặc hạn mức của project. Hãy kiểm tra Usage/Rate limits trong Google AI Studio; chờ rồi thử lại nếu bị giới hạn tạm thời.",
        503: "Gemini đang quá tải. Vui lòng thử lại sau.",
      };
      return res.status(response.status === 429 ? 429 : 502).json({
        success: false,
        message: invalidKey ? errors[401] : errors[response.status] || "Dịch vụ Gemini đang gặp sự cố. Vui lòng thử lại sau.",
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const blocked = (data.promptFeedback?.blockReason && data.promptFeedback.blockReason !== "BLOCK_REASON_UNSPECIFIED") ||
      ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(finishReason);
    if (blocked) {
      return res.status(422).json({ success: false, message: "Gemini không thể trả lời nội dung này. Hãy diễn đạt lại câu hỏi theo hướng học tập." });
    }

    const reply = (candidate?.content?.parts || [])
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n").trim();
    if (!reply || !["STOP", "MAX_TOKENS"].includes(finishReason)) {
      return res.status(502).json({ success: false, message: "Gemini chưa tạo được câu trả lời. Hãy thử câu hỏi ngắn hơn." });
    }
    return res.status(200).json({ success: true, data: {
      reply: reply.slice(0, 12000),
      incomplete: finishReason === "MAX_TOKENS" || reply.length > 12000,
    } });
  } catch (error) {
    const timeout = ["TimeoutError", "AbortError"].includes(error.name);
    return res.status(timeout ? 504 : 502).json({
      success: false,
      message: timeout ? "AI trả lời quá lâu. Vui lòng thử lại với câu hỏi ngắn hơn." : "Không kết nối được dịch vụ AI. Vui lòng thử lại sau.",
    });
  }
}
