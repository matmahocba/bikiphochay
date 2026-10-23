/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { DragDropPair, Option, Question, QuestionType } from '../types';

// Cấu hình worker cho pdfjs nếu đang chạy trong trình duyệt
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  try {
    // Sử dụng CDN chính thức phiên bản tương ứng
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  } catch {
    // Fallback nếu không gán được workerSrc
  }
}

/**
 * Trích xuất toàn bộ văn bản thuần từ file Word (.docx, .doc), PDF (.pdf) hoặc Text (.txt)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. File Word (.docx)
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  // 2. File PDF (.pdf)
  if (fileName.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (pdfErr) {
      console.warn('Lỗi khi đọc PDF bằng pdfjs:', pdfErr);
      // Fallback: nếu lỗi worker hoặc pdf mã hoá, thử đọc thô
      throw new Error(
        'Không thể giải mã nội dung file PDF. Vui lòng kiểm tra file không bị đặt mật khẩu hoặc sao chép nội dung dán vào khung bên dưới.'
      );
    }
  }

  // 3. File văn bản thuần (.txt)
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // Fallback đọc văn bản thông thường
  try {
    return await file.text();
  } catch {
    throw new Error('Định dạng tệp chưa được hỗ trợ. Vui lòng tải lên tệp .docx, .pdf hoặc .txt');
  }
}

/**
 * Interface cho câu hỏi được phân tích (ParsedQuestion) trước khi lưu
 */
export interface ParsedQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  points: number;
  options?: Option[];
  correctOptionId?: string;
  acceptableAnswers?: string[];
  dragDropPairs?: DragDropPair[];
  essayGuide?: string;
  originalRawText?: string;
}

/**
 * Hàm phân tích thông minh toàn bộ chuỗi văn bản trích xuất từ Word / PDF thành danh sách câu hỏi
 */
export function parseQuestionsFromText(rawText: string, defaultLessonId = ''): ParsedQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  // Chuẩn hóa dòng kẻ và ngắt dòng
  const normalizedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ');

  // Tách các khối câu hỏi dựa trên các mẫu nhận diện:
  // "Câu 1:", "Câu 1.", "Câu 1 -", "Bài 1:", "Question 1:", "[Câu 1]", "1."
  // Dùng regex split lookahead
  const questionBlocks: string[] = [];
  const lines = normalizedText.split('\n');

  let currentBlock: string[] = [];
  const startPattern = /^\s*(câu|câu hỏi|bài|question)\s*(\d+)[\s.:\-–)]|^\s*(\d+)[\s.:\-–)]\s+(ai|khi|đâu|trong|hãy|cho|thiết bị|thuật toán|bản ghi|bảng|phần mềm|hệ điều hành|mạng|internet|tại sao|nêu|điền|ghép)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock.length > 0) currentBlock.push('');
      continue;
    }

    if (startPattern.test(trimmed) && currentBlock.length > 0) {
      questionBlocks.push(currentBlock.join('\n').trim());
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    const last = currentBlock.join('\n').trim();
    if (last) questionBlocks.push(last);
  }

  // Nếu không nhận diện được bằng dòng, thử split bằng regex toàn văn
  let finalBlocks = questionBlocks;
  if (finalBlocks.length <= 1) {
    const splitRegex = /(?=(?:^|\n)\s*(?:câu|câu hỏi|bài|question)\s*\d+[\s.:\-–)])/gi;
    const altSplit = normalizedText.split(splitRegex).map((s) => s.trim()).filter(Boolean);
    if (altSplit.length > 1) {
      finalBlocks = altSplit;
    }
  }

  const results: ParsedQuestion[] = [];

  finalBlocks.forEach((block, index) => {
    const parsed = parseSingleQuestionBlock(block, index, defaultLessonId);
    if (parsed) {
      results.push(parsed);
    }
  });

  return results;
}

/**
 * Phân tích chi tiết một khối văn bản đơn lẻ thành 1 câu hỏi
 */
function parseSingleQuestionBlock(
  block: string,
  index: number,
  _lessonId: string
): ParsedQuestion | null {
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const firstLine = lines[0];
  // Xóa tiền tố "Câu 1:", "Bài 1.", v.v. để lấy nội dung đề bài chính xác
  let prompt = firstLine.replace(
    /^\s*(?:câu|câu hỏi|bài|question)\s*\d+[\s.:\-–)]\s*/i,
    ''
  ).trim();

  // Nhận diện điểm số nếu có trong ngoặc đơn (ví dụ: [2 điểm], (1.5 điểm), (2đ))
  let points = 2.5;
  const pointsMatch = block.match(/\((\d+(?:[.,]\d+)?)\s*(?:điểm|đ|points?)\)/i);
  if (pointsMatch) {
    const p = parseFloat(pointsMatch[1].replace(',', '.'));
    if (!isNaN(p) && p > 0) points = p;
  }

  // Nhận diện lời giải thích / giải đáp
  let explanation: string | undefined = undefined;
  const explMatch = block.match(/(?:giải thích|lời giải|hướng dẫn giải|ghi chú|note)\s*[:：\-–]\s*([^\n]+(?:\n(?!(?:câu|đáp án|hướng dẫn chấm)).*)*)/i);
  if (explMatch) {
    explanation = explMatch[1].trim();
  }

  // Nhận diện đáp án đúng được ghi ở cuối hoặc trong text:
  // "Đáp án: A", "Đáp án đúng: B", "Key: C", "Đ/A: D"
  let specifiedCorrectKey: string | null = null;
  const ansMatch = block.match(/(?:đáp án|đáp án đúng|key|đ\/a|chọn)\s*[:：\-–]\s*([A-D])/i);
  if (ansMatch) {
    specifiedCorrectKey = ansMatch[1].toUpperCase();
  }

  // KIỂM TRA DẠNG CÂU HỎI
  // Dạng 1: Kiểm tra xem có phải Kéo thả / Ghép nối không
  const isDragDrop =
    /\[kéo thả\]|\[ghép nối\]|ghép các|nối cột|ghép nối/i.test(block) ||
    /->|→|==>|–>|:\s*ghép/.test(block);

  if (isDragDrop) {
    const pairs: DragDropPair[] = [];
    const pairRegex = /(?:[-*•]|\d+[.)])?\s*\[?([^\]\n\-–→]+)\]?\s*(?:->|→|==>|–>|:)\s*\[?([^\]\n]+)\]?/g;
    let match;
    while ((match = pairRegex.exec(block)) !== null) {
      const item = match[1].trim();
      const slot = match[2].trim();
      if (item && slot && !/^đáp án/i.test(item) && !/^giải thích/i.test(item)) {
        pairs.push({
          id: `dd_parsed_${Date.now()}_${pairs.length}`,
          itemText: item,
          slotLabel: slot,
        });
      }
    }

    if (pairs.length >= 2) {
      return {
        id: `q_parsed_${Date.now()}_${index}`,
        type: 'drag_and_drop',
        prompt: prompt || 'Ghép các thẻ đáp án vào vị trí đích thích hợp:',
        explanation,
        points,
        dragDropPairs: pairs,
        originalRawText: block,
      };
    }
  }

  // Dạng 2: Kiểm tra xem có các lựa chọn A, B, C, D không (Trắc nghiệm 4 lựa chọn)
  // Tìm các phương án A. B. C. D.
  const optionRegex = /(?:^|\s|\n)([*]?)([A-D])[\s.:\-–)]([^\n]+)/gi;
  const foundOptions: { key: string; text: string; isMarked: boolean }[] = [];

  let optMatch;
  while ((optMatch = optionRegex.exec(block)) !== null) {
    const star = optMatch[1];
    const key = optMatch[2].toUpperCase();
    let text = optMatch[3].trim();

    // Cắt bớt nếu dính đáp án hoặc giải thích
    text = text.replace(/(?:đáp án|giải thích|lời giải)[\s\S]*$/i, '').trim();

    if (text) {
      foundOptions.push({
        key,
        text,
        isMarked: star === '*' || optMatch[0].includes('(*)'),
      });
    }
  }

  // Lọc chỉ lấy duy nhất A, B, C, D
  const uniqueOptions = ['A', 'B', 'C', 'D'].map((key) => {
    const found = foundOptions.find((o) => o.key === key);
    return {
      key,
      text: found ? found.text : '',
      isMarked: !!found?.isMarked,
    };
  });

  const validOptionCount = uniqueOptions.filter((o) => o.text.trim().length > 0).length;

  if (validOptionCount >= 3) {
    // Đây là câu hỏi Trắc nghiệm 4 lựa chọn!
    const keyToId: Record<string, string> = {
      A: 'opt_a',
      B: 'opt_b',
      C: 'opt_c',
      D: 'opt_d',
    };

    let correctId = 'opt_a';
    if (specifiedCorrectKey && keyToId[specifiedCorrectKey]) {
      correctId = keyToId[specifiedCorrectKey];
    } else {
      const marked = uniqueOptions.find((o) => o.isMarked);
      if (marked) {
        correctId = keyToId[marked.key];
      }
    }

    // Ghép thêm dòng mô tả nếu prompt ban đầu bị ngắn
    const promptLines: string[] = [];
    for (const line of lines) {
      if (/^[A-D][\s.:\-–)]/i.test(line)) break;
      if (/^(?:đáp án|giải thích|lời giải)/i.test(line)) break;
      promptLines.push(line);
    }
    const fullPrompt = promptLines.join(' ').replace(
      /^\s*(?:câu|câu hỏi|bài|question)\s*\d+[\s.:\-–)]\s*/i,
      ''
    ).trim();

    return {
      id: `q_parsed_${Date.now()}_${index}`,
      type: 'multiple_choice',
      prompt: fullPrompt || prompt || `Câu hỏi số ${index + 1}`,
      explanation,
      points,
      options: [
        { id: 'opt_a', text: uniqueOptions[0].text || 'Phương án A' },
        { id: 'opt_b', text: uniqueOptions[1].text || 'Phương án B' },
        { id: 'opt_c', text: uniqueOptions[2].text || 'Phương án C' },
        { id: 'opt_d', text: uniqueOptions[3].text || 'Phương án D' },
      ],
      correctOptionId: correctId,
      originalRawText: block,
    };
  }

  // Dạng 3: Kiểm tra xem có phải câu hỏi Trả lời ngắn / Điền khuyết không
  const isFillInBlank =
    /\[điền khuyết\]|\[trả lời ngắn\]|điền vào chỗ trống|\.\.\.|___/i.test(block) ||
    /đáp án\s*[:：\-–]\s*([^\n]+)/i.test(block);

  if (isFillInBlank) {
    const rawAnswerMatch = block.match(/(?:đáp án|đáp án đúng|kết quả)\s*[:：\-–]\s*([^\n]+)/i);
    let answers: string[] = [];

    if (rawAnswerMatch) {
      answers = rawAnswerMatch[1]
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (answers.length > 0) {
      return {
        id: `q_parsed_${Date.now()}_${index}`,
        type: 'fill_in_the_blank',
        prompt: prompt || `Câu hỏi điền khuyết số ${index + 1}`,
        explanation,
        points,
        acceptableAnswers: answers,
        originalRawText: block,
      };
    }
  }

  // Dạng 4: Tự luận (Essay)
  // Nếu có từ khóa tự luận, hướng dẫn chấm hoặc là câu hỏi mở
  const isEssay =
    /\[tự luận\]|tự luận|hướng dẫn chấm|tiêu chí chấm/i.test(block) ||
    /hãy trình bày|em hãy giải thích|hãy nêu ý kiến|phân tích/i.test(prompt);

  let essayGuide = '';
  const guideMatch = block.match(/(?:hướng dẫn chấm|gợi ý đáp án|tiêu chí|đáp án mẫu)\s*[:：\-–]\s*([\s\S]+)/i);
  if (guideMatch) {
    essayGuide = guideMatch[1].trim();
  }

  return {
    id: `q_parsed_${Date.now()}_${index}`,
    type: isEssay ? 'essay' : 'multiple_choice',
    prompt: prompt || `Câu hỏi số ${index + 1}`,
    explanation,
    points,
    options: isEssay
      ? undefined
      : [
          { id: 'opt_a', text: 'Lựa chọn A' },
          { id: 'opt_b', text: 'Lựa chọn B' },
          { id: 'opt_c', text: 'Lựa chọn C' },
          { id: 'opt_d', text: 'Lựa chọn D' },
        ],
    correctOptionId: isEssay ? undefined : 'opt_a',
    essayGuide: isEssay ? (essayGuide || explanation) : undefined,
    originalRawText: block,
  };
}

/**
 * Mẫu văn bản chuẩn dùng cho Word/PDF để giáo viên tải về hoặc tham khảo
 */
export const SAMPLE_QUESTIONS_WORD_TEXT = `BỘ CÂU HỎI MẪU MÔN TIN HỌC THCS (CHUẨN ĐỊNH DẠNG WORD / PDF)

Câu 1: Thiết bị nào sau đây là thiết bị vào của máy tính?
A. Chuột máy tính
B. Màn hình máy tính
C. Máy in laser
D. Loa
Đáp án: A
Giải thích: Chuột và bàn phím là các thiết bị vào dùng để đưa dữ liệu và lệnh vào máy tính.

Câu 2: Hệ nhị phân gồm có hai chữ số nào sau đây?
A. 1 và 2
B. 0 và 1
C. 0 và 2
D. 1 và 10
Đáp án: B
Giải thích: Hệ nhị phân (Binary) chỉ sử dụng 2 chữ số là 0 và 1 để mã hóa thông tin.

Câu 3: [Điền khuyết] Đơn vị đo lượng thông tin cơ bản nhất trong máy tính là gì?
Đáp án: Byte, 1 byte, Byte (B)
Giải thích: Byte là đơn vị cơ bản đo dung lượng bộ nhớ, 1 Byte gồm 8 Bit.

Câu 4: [Kéo thả] Ghép các loại bộ nhớ của máy tính với đặc điểm tương ứng:
- RAM -> Bộ nhớ truy cập ngẫu nhiên, mất dữ liệu khi mất điện
- ROM -> Bộ nhớ chỉ đọc chứa chương trình khởi động
- Ổ đĩa cứng HDD/SSD -> Bộ nhớ ngoài lưu trữ dữ liệu lâu dài

Câu 5: [Tự luận] Em hãy nêu 3 biện pháp để bảo vệ an toàn thông tin cá nhân khi sử dụng Internet?
Hướng dẫn chấm:
- Đặt mật khẩu mạnh (gồm chữ hoa, chữ thường, số và ký tự đặc biệt).
- Không chia sẻ thông tin cá nhân (địa chỉ, số điện thoại, mật khẩu) cho người lạ.
- Không nhấn vào các đường link lạ hoặc tải tệp không rõ nguồn gốc.
`;

/**
 * Tải file mẫu văn bản Word/Text chuẩn để giáo viên soạn
 */
export function downloadSampleWordTemplate(): void {
  const blob = new Blob([SAMPLE_QUESTIONS_WORD_TEXT], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mau_De_Thi_Tin_Hoc_THCS.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
