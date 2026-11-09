import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "23092007",
  charset: "utf8mb4",
  ssl: process.env.DB_HOST && process.env.DB_HOST !== "localhost" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
};

const dbName = process.env.DB_NAME || "ptit_online_exam";

export const pool = mysql.createPool({
  ...dbConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Khởi tạo CSDL, tạo bảng và dữ liệu mẫu tự động khi chạy server lần đầu
 */
export async function initializeDatabase() {
  // 1. Tạo Database nếu chưa tồn tại
  const tempConn = await mysql.createConnection(dbConfig);
  await tempConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await tempConn.end();

  // 2. Tạo 6 bảng có quan hệ khóa ngoại
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('STUDENT', 'TEACHER') NOT NULL DEFAULT 'STUDENT',
      student_code VARCHAR(30) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(30) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_subject_teacher FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT NOT NULL,
      content TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
      difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
      explanation TEXT,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_question_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id) ON DELETE CASCADE,
      CONSTRAINT fk_question_teacher FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_minutes INT NOT NULL DEFAULT 30,
      pass_score DECIMAL(4,2) NOT NULL DEFAULT 5.00,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_exam_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id) ON DELETE CASCADE,
      CONSTRAINT fk_exam_teacher FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      question_id INT NOT NULL,
      order_index INT NOT NULL DEFAULT 1,
      UNIQUE KEY uq_exam_question (exam_id, question_id),
      CONSTRAINT fk_eq_exam FOREIGN KEY (exam_id)
        REFERENCES exams(id) ON DELETE CASCADE,
      CONSTRAINT fk_eq_question FOREIGN KEY (question_id)
        REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      student_id INT NOT NULL,
      score DECIMAL(4,2) NOT NULL DEFAULT 0.00,
      correct_count INT NOT NULL DEFAULT 0,
      total_questions INT NOT NULL DEFAULT 0,
      time_spent_seconds INT NOT NULL DEFAULT 0,
      answers_json JSON NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sub_exam FOREIGN KEY (exam_id)
        REFERENCES exams(id) ON DELETE CASCADE,
      CONSTRAINT fk_sub_student FOREIGN KEY (student_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 3. Kiểm tra nếu chưa có dữ liệu thì seed dữ liệu mẫu chuẩn PTIT
  const [userCountRows] = await pool.query("SELECT COUNT(*) AS cnt FROM users");
  if (userCountRows[0].cnt === 0) {
    console.log("🌱 Đang khởi tạo dữ liệu mẫu PTIT vào MySQL...");
    const teacherPass = await bcrypt.hash("123456", 10);
    const studentPass = await bcrypt.hash("123456", 10);

    // Tạo Users
    const [teacherRes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_code)
       VALUES (?, ?, ?, 'TEACHER', 'GV001')`,
      ["TS. Nguyễn Văn Giảng", "teacher@ptit.edu.vn", teacherPass]
    );
    const teacherId = teacherRes.insertId;

    const [studentRes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_code)
       VALUES (?, ?, ?, 'STUDENT', 'B22DCCN001')`,
      ["Trần Minh Quân", "student@ptit.edu.vn", studentPass]
    );
    const studentId = studentRes.insertId;

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_code)
       VALUES (?, ?, ?, 'STUDENT', 'B22DCCN102')`,
      ["Lê Thị Hương Giang", "giang.lth@ptit.edu.vn", studentPass]
    );

    // Tạo 4 Môn học
    const subjectsData = [
      [
        "INT1434",
        "Lập trình Web",
        "Học phần phát triển ứng dụng Web Fullstack với ReactJS, Node.js, Express và CSDL quan hệ.",
        teacherId,
      ],
      [
        "INT1313",
        "Cơ sở dữ liệu",
        "Mô hình dữ liệu quan hệ, đại số quan hệ, ngôn ngữ truy vấn SQL và chuẩn hóa cơ sở dữ liệu.",
        teacherId,
      ],
      [
        "INT1336",
        "Mạng máy tính",
        "Kiến trúc phân tầng OSI, TCP/IP, định tuyến IP, DNS, HTTP và an toàn mạng căn bản.",
        teacherId,
      ],
      [
        "INT1306",
        "Cấu trúc dữ liệu & Giải thuật",
        "Danh sách liên kết, ngăn xếp, hàng đợi, cây nhị phân, đồ thị và các thuật toán sắp xếp, tìm kiếm.",
        teacherId,
      ],
    ];

    const subjectIds = [];
    for (const s of subjectsData) {
      const [res] = await pool.query(
        `INSERT INTO subjects (code, name, description, created_by) VALUES (?, ?, ?, ?)`,
        s
      );
      subjectIds.push(res.insertId);
    }

    const [webId, dbId, netId, dsaId] = subjectIds;

    // Tạo Ngân hàng câu hỏi phong phú
    const questionsData = [
      // Môn 1: Lập trình Web
      [
        webId,
        "Trong React Router v6, component nào được dùng làm vùng giữ chỗ (placeholder) để hiển thị các route con trong Layout?",
        "<Switch />",
        "<Outlet />",
        "<RouterView />",
        "<ChildRoute />",
        "B",
        "EASY",
        "<Outlet /> được đặt trong component cha (như MainLayout) để render bất kỳ route con nào khớp với URL hiện tại.",
        teacherId,
      ],
      [
        webId,
        "Hook nào trong React được sử dụng để truy cập trực tiếp giá trị từ một Context đã khởi tạo?",
        "useState",
        "useEffect",
        "useContext",
        "useReducer",
        "C",
        "EASY",
        "useContext(MyContext) nhận vào đối tượng Context và trả về giá trị hiện tại được truyền từ Provider gần nhất.",
        teacherId,
      ],
      [
        webId,
        "Trong kiến trúc RESTful API với Express, mã trạng thái HTTP nào biểu thị yêu cầu tạo mới tài nguyên (POST) đã thành công?",
        "200 OK",
        "201 Created",
        "204 No Content",
        "400 Bad Request",
        "B",
        "EASY",
        "Mã 201 Created là chuẩn RESTful trả về khi một bản ghi mới vừa được khởi tạo thành công trên server.",
        teacherId,
      ],
      [
        webId,
        "Khi xác thực bằng JWT (JSON Web Token), client thường gửi token kèm theo mỗi request ở header nào?",
        "Authorization: Bearer <token>",
        "Set-Cookie: jwt=<token>",
        "X-Powered-By: <token>",
        "Content-Type: application/jwt",
        "A",
        "MEDIUM",
        "Chuẩn phổ biến nhất cho JWT là gửi trong HTTP Header 'Authorization' theo cú pháp 'Bearer <token>'.",
        teacherId,
      ],
      [
        webId,
        "Ưu điểm lớn nhất của thư viện quản lý state Zustand so với Redux truyền thống là gì?",
        "Bắt buộc phải bọc toàn bộ ứng dụng trong nhiều Provider lồng nhau",
        "Cấu hình gọn nhẹ, không cần boilerplate (actions/reducers phức tạp), hỗ trợ selector tránh re-render thừa",
        "Chỉ hoạt động trên trình duyệt Safari",
        "Tự động thay thế hoàn toàn cơ sở dữ liệu MySQL",
        "B",
        "MEDIUM",
        "Zustand sử dụng hook-based store cực kỳ ngắn gọn, không cần Context Provider bọc ngoài và tối ưu re-render nhờ cơ chế selector.",
        teacherId,
      ],
      [
        webId,
        "Hàm middleware xử lý lỗi tập trung (Error-handling middleware) trong Express.js bắt buộc phải khai báo đủ bao nhiêu tham số?",
        "2 tham số: (req, res)",
        "3 tham số: (req, res, next)",
        "4 tham số: (err, req, res, next)",
        "1 tham số: (err)",
        "C",
        "HARD",
        "Express nhận diện error middleware thông qua chữ ký hàm có đúng 4 tham số (err, req, res, next).",
        teacherId,
      ],

      // Môn 2: Cơ sở dữ liệu (MySQL)
      [
        dbId,
        "Trong MySQL, câu lệnh nào dùng để lấy các bản ghi từ hai bảng khi có sự khớp nhau ở trường khóa ngoại?",
        "INNER JOIN",
        "DROP TABLE",
        "ALTER VIEW",
        "TRUNCATE",
        "A",
        "EASY",
        "INNER JOIN trả về các hàng khi có ít nhất một giá trị khớp ở cả hai bảng liên kết.",
        teacherId,
      ],
      [
        dbId,
        "Để biểu diễn mối quan hệ nhiều - nhiều (N - N) giữa bảng Đề thi (exams) và Câu hỏi (questions) trong MySQL, cách thiết kế chuẩn là gì?",
        "Lưu mảng ID câu hỏi dạng chuỗi phân cách dấu phẩy trong bảng exams",
        "Tạo một bảng trung gian (ví dụ: exam_questions) chứa hai khóa ngoại trỏ tới exams.id và questions.id",
        "Gộp hai bảng exams và questions thành một bảng duy nhất",
        "Không thể biểu diễn quan hệ N-N trong MySQL",
        "B",
        "MEDIUM",
        "Chuẩn hóa CSDL quan hệ (3NF) yêu cầu tách quan hệ N-N thành bảng trung gian với 2 khóa ngoại.",
        teacherId,
      ],
      [
        dbId,
        "Mệnh đề nào trong SQL được dùng để lọc kết quả SAU KHI đã gom nhóm bằng GROUP BY?",
        "WHERE",
        "ORDER BY",
        "HAVING",
        "LIMIT",
        "C",
        "MEDIUM",
        "WHERE lọc các dòng trước khi nhóm, còn HAVING lọc các nhóm sau khi đã thực hiện GROUP BY và hàm tổng hợp (COUNT, AVG, SUM).",
        teacherId,
      ],
      [
        dbId,
        "Ràng buộc khóa ngoại `ON DELETE CASCADE` trong MySQL có ý nghĩa gì?",
        "Cấm xóa bản ghi ở bảng cha trong mọi trường hợp",
        "Khi xóa bản ghi ở bảng cha, các bản ghi con tham chiếu tới nó sẽ tự động được xóa theo",
        "Tự động nhân đôi bản ghi con khi xóa bản ghi cha",
        "Đổi giá trị khóa ngoại thành số âm",
        "B",
        "HARD",
        "ON DELETE CASCADE giúp đảm bảo toàn vẹn tham chiếu bằng cách tự động xóa các bản ghi phụ thuộc ở bảng con.",
        teacherId,
      ],

      // Môn 3: Mạng máy tính
      [
        netId,
        "Giao thức HTTP/HTTPS hoạt động ở tầng nào trong mô hình TCP/IP?",
        "Tầng Ứng dụng (Application Layer)",
        "Tầng Giao vận (Transport Layer)",
        "Tầng Mạng (Network Layer)",
        "Tầng Vật lý (Physical Layer)",
        "A",
        "EASY",
        "HTTP, DNS, FTP, SMTP đều là các giao thức thuộc tầng Ứng dụng (Application Layer).",
        teacherId,
      ],
      [
        netId,
        "Cổng (Port) mặc định của dịch vụ cơ sở dữ liệu MySQL là bao nhiêu?",
        "80",
        "443",
        "3306",
        "27017",
        "C",
        "EASY",
        "MySQL mặc định lắng nghe trên cổng 3306 (trong khi 80 là HTTP, 443 là HTTPS, 27017 là MongoDB).",
        teacherId,
      ],
      [
        netId,
        "Giao thức nào đảm nhiệm việc phân giải tên miền (Domain Name) thành địa chỉ IP?",
        "DHCP",
        "DNS",
        "ICMP",
        "ARP",
        "B",
        "MEDIUM",
        "DNS (Domain Name System) là hệ thống phân giải tên miền thành địa chỉ IP tương ứng.",
        teacherId,
      ],

      // Môn 4: Cấu trúc dữ liệu & Giải thuật
      [
        dsaId,
        "Độ phức tạp thời gian trung bình của thuật toán Tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp có n phần tử là bao nhiêu?",
        "O(n)",
        "O(log n)",
        "O(n log n)",
        "O(n^2)",
        "B",
        "EASY",
        "Mỗi bước Binary Search chia đôi không gian tìm kiếm nên độ phức tạp thời gian là O(log n).",
        teacherId,
      ],
      [
        dsaId,
        "Cấu trúc dữ liệu Ngăn xếp (Stack) hoạt động theo nguyên tắc nào?",
        "FIFO (First In - First Out)",
        "LIFO (Last In - First Out)",
        "Random Access",
        "Priority Queue",
        "B",
        "EASY",
        "Stack hoạt động theo cơ chế Vào sau - Ra trước (LIFO: Last In, First Out).",
        teacherId,
      ],
    ];

    const insertedQuestionIds = [];
    for (const q of questionsData) {
      const [res] = await pool.query(
        `INSERT INTO questions 
          (subject_id, content, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        q
      );
      insertedQuestionIds.push({ id: res.insertId, subjectId: q[0] });
    }

    // Tạo 4 Đề thi mẫu
    const examsData = [
      [
        webId,
        "Đề thi Cuối kỳ: Lập trình Web Fullstack (React + Express + MySQL)",
        "Đánh giá toàn diện kiến thức về React Router v6, Context API, Zustand, RESTful API với Express và bảo mật JWT.",
        25,
        5.0,
        1,
        teacherId,
      ],
      [
        dbId,
        "Đề kiểm tra Giữa kỳ: Hệ quản trị CSDL MySQL & Thiết kế Quan hệ",
        "Kiểm tra kỹ năng truy vấn JOIN, GROUP BY, HAVING, thiết kế khóa ngoại và chuẩn hóa cơ sở dữ liệu.",
        20,
        5.0,
        1,
        teacherId,
      ],
      [
        netId,
        "Đề ôn tập: Kiến trúc Mạng máy tính & Giao thức TCP/IP",
        "Tổng hợp các câu hỏi trắc nghiệm trọng tâm về mô hình OSI, TCP/IP, DNS, HTTP và cổng dịch vụ.",
        15,
        5.0,
        1,
        teacherId,
      ],
      [
        dsaId,
        "Đề luyện tập nhanh: Cấu trúc dữ liệu & Giải thuật căn bản",
        "Ôn tập độ phức tạp thuật toán, tìm kiếm nhị phân, ngăn xếp và hàng đợi.",
        15,
        5.0,
        1,
        teacherId,
      ],
    ];

    const examIds = [];
    for (const ex of examsData) {
      const [res] = await pool.query(
        `INSERT INTO exams (subject_id, title, description, duration_minutes, pass_score, is_published, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ex
      );
      examIds.push({ examId: res.insertId, subjectId: ex[0] });
    }

    // Gán câu hỏi vào từng đề thi (Bảng trung gian exam_questions)
    for (const ex of examIds) {
      const matchingQuestions = insertedQuestionIds.filter(
        (q) => q.subjectId === ex.subjectId
      );
      let order = 1;
      for (const mq of matchingQuestions) {
        await pool.query(
          `INSERT INTO exam_questions (exam_id, question_id, order_index) VALUES (?, ?, ?)`,
          [ex.examId, mq.id, order++]
        );
      }
    }

    // Tạo 1 lượt nộp bài mẫu của sinh viên Trần Minh Quân cho đề Lập trình Web
    const webQuestions = insertedQuestionIds.filter((q) => q.subjectId === webId);
    const sampleAnswers = {};
    webQuestions.forEach((wq, idx) => {
      // Giả sử đúng 5/6 câu
      const correctKeys = ["B", "C", "B", "A", "B", "A"];
      sampleAnswers[wq.id] = correctKeys[idx] || "A";
    });

    await pool.query(
      `INSERT INTO submissions (exam_id, student_id, score, correct_count, total_questions, time_spent_seconds, answers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        examIds[0].examId,
        studentId,
        8.33,
        5,
        6,
        420,
        JSON.stringify(sampleAnswers),
      ]
    );

    console.log("✅ Khởi tạo CSDL MySQL và dữ liệu mẫu PTIT hoàn tất!");
  }
}
