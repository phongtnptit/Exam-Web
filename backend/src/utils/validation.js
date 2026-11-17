export const isText = (value, max = Infinity) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export const isId = (value) =>
  ["string", "number"].includes(typeof value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

export const isNumber = (value) =>
  ["string", "number"].includes(typeof value) && String(value).trim() !== "" && Number.isFinite(Number(value));

export function validateExam(body) {
  if (!isId(body.subjectId) || !isText(body.title, 255) || (body.description !== undefined && typeof body.description !== "string")) {
    return "Vui lòng nhập môn học, tiêu đề (tối đa 255 ký tự) và mô tả hợp lệ.";
  }
  if (!isNumber(body.durationMinutes) || !Number.isInteger(Number(body.durationMinutes)) || Number(body.durationMinutes) < 5 || Number(body.durationMinutes) > 180) {
    return "Thời gian làm bài phải là số nguyên từ 5 đến 180 phút.";
  }
  if (!isNumber(body.passScore) || Number(body.passScore) < 0 || Number(body.passScore) > 10) {
    return "Điểm đạt phải nằm trong khoảng 0 đến 10.";
  }
  if (![0, 1, false, true].includes(body.isPublished)) return "Trạng thái xuất bản không hợp lệ.";
  if (!Array.isArray(body.questionIds) || body.questionIds.length === 0 || !body.questionIds.every(isId)) {
    return "Đề thi phải có ít nhất một câu hỏi hợp lệ.";
  }
  if (new Set(body.questionIds.map(Number)).size !== body.questionIds.length) return "Danh sách câu hỏi bị trùng.";
  return "";
}

export function validateQuestion(body) {
  if (!isId(body.subjectId) || ![body.content, body.optionA, body.optionB, body.optionC, body.optionD].every((value) => isText(value))) {
    return "Vui lòng nhập môn học, nội dung và đủ 4 phương án không để trống.";
  }
  if (!["A", "B", "C", "D"].includes(body.correctAnswer)) return "Đáp án đúng phải là A, B, C hoặc D.";
  if (!["EASY", "MEDIUM", "HARD"].includes(body.difficulty === undefined ? "MEDIUM" : body.difficulty)) return "Độ khó không hợp lệ.";
  if (body.explanation !== undefined && typeof body.explanation !== "string") return "Giải thích phải là văn bản.";
  return "";
}
