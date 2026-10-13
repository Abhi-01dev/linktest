package com.linktest.service;

import com.linktest.dto.QuestionBankDto.*;
import com.linktest.entity.QuestionBankItem;
import com.linktest.entity.User;
import com.linktest.repository.QuestionBankRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final CsvParserService csvParserService;
    private final LoggingService loggingService;

    private static final List<String> VALID_ANSWERS = Arrays.asList("A", "B", "C", "D");
    private static final List<String> VALID_DIFFICULTIES = Arrays.asList("EASY", "MEDIUM", "HARD");

    public QuestionBankService(
            QuestionBankRepository questionBankRepository,
            CsvParserService csvParserService,
            LoggingService loggingService) {
        this.questionBankRepository = questionBankRepository;
        this.csvParserService = csvParserService;
        this.loggingService = loggingService;
    }

    public String getSampleTemplate() {
        List<String> headers = Arrays.asList(
                "question", "optionA", "optionB", "optionC", "optionD",
                "correctAnswer", "subject", "topic", "difficulty", "explanation", "marks"
        );

        List<Map<String, Object>> sampleRows = new ArrayList<>();

        Map<String, Object> r1 = new LinkedHashMap<>();
        r1.put("question", "Which of the following data structures operates on a Last-In First-Out (LIFO) basis?");
        r1.put("optionA", "Queue");
        r1.put("optionB", "Stack");
        r1.put("optionC", "Binary Search Tree");
        r1.put("optionD", "Priority Queue");
        r1.put("correctAnswer", "B");
        r1.put("subject", "Computer Science Fundamentals");
        r1.put("topic", "Linear Data Structures");
        r1.put("difficulty", "EASY");
        r1.put("explanation", "A stack operates strictly on the LIFO principle, where elements are inserted and removed from the same top end.");
        r1.put("marks", 4);
        sampleRows.add(r1);

        Map<String, Object> r2 = new LinkedHashMap<>();
        r2.put("question", "What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?");
        r2.put("optionA", "O(1)");
        r2.put("optionB", "O(n)");
        r2.put("optionC", "O(log n)");
        r2.put("optionD", "O(n log n)");
        r2.put("correctAnswer", "C");
        r2.put("subject", "Computer Science Fundamentals");
        r2.put("topic", "Tree Structures & Algorithms");
        r2.put("difficulty", "MEDIUM");
        r2.put("explanation", "Because the height of a balanced BST is kept proportional to log2(n), search operations take O(log n) comparisons.");
        r2.put("marks", 4);
        sampleRows.add(r2);

        Map<String, Object> r3 = new LinkedHashMap<>();
        r3.put("question", "In SQL relational databases, what does the ACID property \"Isolation\" ensure?");
        r3.put("optionA", "Changes are written permanently to disk after commit");
        r3.put("optionB", "Transactions execute independently without concurrent interference");
        r3.put("optionC", "Database constraints and integrity rules are never violated");
        r3.put("optionD", "All steps in a transaction succeed, or the entire operation is rolled back");
        r3.put("correctAnswer", "B");
        r3.put("subject", "Database Systems");
        r3.put("topic", "Transaction Management");
        r3.put("difficulty", "HARD");
        r3.put("explanation", "Isolation ensures that concurrent transactions execute as though they were run sequentially, preventing race conditions.");
        r3.put("marks", 4);
        sampleRows.add(r3);

        return csvParserService.generateCsv(headers, sampleRows);
    }

    public PreviewResponse previewCsv(String csvContent, User user) throws IOException {
        List<Map<String, String>> parsedRows = csvParserService.parseCsv(csvContent);

        PreviewResponse response = new PreviewResponse();
        response.setTotalRows(parsedRows.size());
        response.setDuplicateStrategy("skip");

        List<Map<String, Object>> previewRows = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();
        int validCount = 0;
        int duplicateCount = 0;

        for (Map<String, String> row : parsedRows) {
            int rowNum = Integer.parseInt(row.getOrDefault("__rowNumber", "0"));
            List<String> rowErrors = validateRow(row);

            String questionText = getVal(row, "question", "question_text");
            String subject = getVal(row, "subject");

            boolean isDuplicate = false;
            if (rowErrors.isEmpty() && !questionText.isEmpty() && !subject.isEmpty()) {
                List<QuestionBankItem> existing = questionBankRepository.findDuplicates(questionText, subject);
                if (!existing.isEmpty()) {
                    isDuplicate = true;
                    duplicateCount++;
                }
            }

            Map<String, Object> previewItem = new LinkedHashMap<>();
            previewItem.put("rowNumber", rowNum);
            previewItem.put("question", questionText);
            previewItem.put("optionA", getVal(row, "optionA", "option_a", "optA"));
            previewItem.put("optionB", getVal(row, "optionB", "option_b", "optB"));
            previewItem.put("optionC", getVal(row, "optionC", "option_c", "optC"));
            previewItem.put("optionD", getVal(row, "optionD", "option_d", "optD"));
            previewItem.put("correctAnswer", getVal(row, "correctAnswer", "correct_answer").toUpperCase());
            previewItem.put("subject", subject);
            previewItem.put("topic", getVal(row, "topic"));
            previewItem.put("difficulty", getVal(row, "difficulty").toUpperCase());
            previewItem.put("marks", getVal(row, "marks"));
            previewItem.put("explanation", getVal(row, "explanation"));
            previewItem.put("isValid", rowErrors.isEmpty());
            previewItem.put("isDuplicate", isDuplicate);
            previewItem.put("errors", rowErrors);

            previewRows.add(previewItem);

            if (rowErrors.isEmpty()) {
                validCount++;
            } else {
                Map<String, Object> errItem = new LinkedHashMap<>();
                errItem.put("rowNumber", rowNum);
                errItem.put("question", questionText);
                errItem.put("errors", rowErrors);
                errors.add(errItem);
            }
        }

        response.setPreviewRows(previewRows);
        response.setValidCount(validCount);
        response.setErrorCount(errors.size());
        response.setDuplicateCount(duplicateCount);
        response.setErrors(errors);

        return response;
    }

    @Transactional
    public ImportSummaryResponse importCsv(String csvContent, User user, String duplicateStrategy, String clientIp) throws IOException {
        List<Map<String, String>> parsedRows = csvParserService.parseCsv(csvContent);

        ImportSummaryResponse summary = new ImportSummaryResponse();
        summary.setTotalProcessed(parsedRows.size());

        List<QuestionBankItem> itemsToPersist = new ArrayList<>();
        List<Map<String, Object>> failedRows = new ArrayList<>();
        int skippedCount = 0;

        boolean allowDuplicates = "allow".equalsIgnoreCase(duplicateStrategy);

        for (Map<String, String> row : parsedRows) {
            int rowNum = Integer.parseInt(row.getOrDefault("__rowNumber", "0"));
            List<String> rowErrors = validateRow(row);

            if (!rowErrors.isEmpty()) {
                Map<String, Object> err = new LinkedHashMap<>();
                err.put("rowNumber", rowNum);
                err.put("question", getVal(row, "question", "question_text"));
                err.put("reason", String.join("; ", rowErrors));
                failedRows.add(err);
                continue;
            }

            String questionText = getVal(row, "question", "question_text");
            String subject = getVal(row, "subject");

            if (!allowDuplicates) {
                List<QuestionBankItem> existing = questionBankRepository.findDuplicates(questionText, subject);
                if (!existing.isEmpty()) {
                    skippedCount++;
                    continue;
                }
            }

            QuestionBankItem item = new QuestionBankItem();
            item.setQuestionText(questionText);

            List<String> options = new ArrayList<>();
            options.add(getVal(row, "optionA", "option_a", "optA"));
            options.add(getVal(row, "optionB", "option_b", "optB"));
            options.add(getVal(row, "optionC", "option_c", "optC"));
            options.add(getVal(row, "optionD", "option_d", "optD"));
            item.setOptions(options);

            String correctAnswer = getVal(row, "correctAnswer", "correct_answer").toUpperCase();
            item.setCorrectAnswer(correctAnswer);
            item.setCorrectOptionIndex(VALID_ANSWERS.indexOf(correctAnswer));

            item.setSubject(subject);
            item.setTopic(getVal(row, "topic"));

            String diff = getVal(row, "difficulty").toUpperCase();
            item.setDifficulty(VALID_DIFFICULTIES.contains(diff) ? diff : "MEDIUM");

            item.setExplanation(getVal(row, "explanation"));

            String marksStr = getVal(row, "marks");
            try {
                item.setMarks(marksStr.isBlank() ? new BigDecimal("4.00") : new BigDecimal(marksStr));
            } catch (Exception ex) {
                item.setMarks(new BigDecimal("4.00"));
            }
            item.setNegativeMarks(new BigDecimal("1.00"));
            item.setCreatedBy(user.getId());

            itemsToPersist.add(item);
        }

        if (!itemsToPersist.isEmpty()) {
            questionBankRepository.saveAll(itemsToPersist);
        }

        summary.setImportedCount(itemsToPersist.size());
        summary.setSkippedCount(skippedCount);
        summary.setFailedCount(failedRows.size());
        summary.setErrors(failedRows);

        loggingService.logAudit(
                user.getId(),
                "QUESTION_BANK_CSV_IMPORT",
                "question_bank",
                "BULK",
                Map.of(
                        "totalProcessed", parsedRows.size(),
                        "importedCount", itemsToPersist.size(),
                        "skippedCount", skippedCount,
                        "failedCount", failedRows.size(),
                        "duplicateStrategy", duplicateStrategy
                )
        );

        return summary;
    }

    public String generateErrorReport(List<Map<String, Object>> failedRows) {
        List<String> headers = Arrays.asList("rowNumber", "question", "reason");
        return csvParserService.generateCsv(headers, failedRows);
    }

    public Page<QuestionBankItem> getQuestions(
            String search, String subject, String topic, String difficulty, String createdBy, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return questionBankRepository.findQuestions(search, subject, topic, difficulty, createdBy, pageRequest);
    }

    public FilterOptionsResponse getFilterOptions() {
        List<String> subjects = questionBankRepository.findDistinctSubjects();
        List<String> topics = questionBankRepository.findAllDistinctTopics();
        return new FilterOptionsResponse(subjects, topics);
    }

    public QuestionBankItem findById(String id) {
        return questionBankRepository.findById(id).orElse(null);
    }

    public QuestionBankItem createQuestion(CreateQuestionRequest req, User user) {
        QuestionBankItem item = new QuestionBankItem();
        item.setQuestionText(req.getQuestion_text());
        item.setOptions(req.getOptions() != null ? req.getOptions() : Collections.emptyList());

        String corrAns = req.getCorrect_answer() != null ? req.getCorrect_answer().toUpperCase().trim() : "A";
        item.setCorrectAnswer(corrAns);
        item.setCorrectOptionIndex(req.getCorrect_option_index() != null ? req.getCorrect_option_index() : VALID_ANSWERS.indexOf(corrAns));

        item.setSubject(req.getSubject());
        item.setTopic(req.getTopic());
        item.setDifficulty(req.getDifficulty() != null ? req.getDifficulty().toUpperCase() : "MEDIUM");
        item.setExplanation(req.getExplanation());
        item.setMarks(req.getMarks() != null ? req.getMarks() : new BigDecimal("4.00"));
        item.setNegativeMarks(req.getNegative_marks() != null ? req.getNegative_marks() : new BigDecimal("1.00"));
        item.setCreatedBy(user.getId());

        QuestionBankItem saved = questionBankRepository.save(item);

        loggingService.logAudit(
                user.getId(),
                "CREATE_QUESTION",
                "question_bank",
                saved.getId(),
                Map.of("subject", saved.getSubject(), "topic", saved.getTopic())
        );

        return saved;
    }

    public void deleteQuestion(String id, User user) {
        questionBankRepository.deleteById(id);
        loggingService.logAudit(
                user.getId(),
                "DELETE_QUESTION",
                "question_bank",
                id,
                Map.of()
        );
    }

    private List<String> validateRow(Map<String, String> row) {
        List<String> errors = new ArrayList<>();
        String question = getVal(row, "question", "question_text");
        if (question.isBlank()) {
            errors.add("Question text is required.");
        }

        String optA = getVal(row, "optionA", "option_a", "optA");
        String optB = getVal(row, "optionB", "option_b", "optB");
        String optC = getVal(row, "optionC", "option_c", "optC");
        String optD = getVal(row, "optionD", "option_d", "optD");

        if (optA.isBlank() || optB.isBlank() || optC.isBlank() || optD.isBlank()) {
            errors.add("All 4 options (optionA, optionB, optionC, optionD) are required.");
        }

        String answer = getVal(row, "correctAnswer", "correct_answer").toUpperCase();
        if (!VALID_ANSWERS.contains(answer)) {
            errors.add("correctAnswer must be one of: A, B, C, D (found: '" + answer + "').");
        }

        String subject = getVal(row, "subject");
        if (subject.isBlank()) {
            errors.add("Subject is required.");
        }

        String topic = getVal(row, "topic");
        if (topic.isBlank()) {
            errors.add("Topic is required.");
        }

        String difficulty = getVal(row, "difficulty").toUpperCase();
        if (!difficulty.isBlank() && !VALID_DIFFICULTIES.contains(difficulty)) {
            errors.add("Difficulty must be EASY, MEDIUM, or HARD.");
        }

        return errors;
    }

    private String getVal(Map<String, String> map, String... keys) {
        for (String k : keys) {
            for (Map.Entry<String, String> e : map.entrySet()) {
                if (e.getKey().equalsIgnoreCase(k)) {
                    return e.getValue() != null ? e.getValue().trim() : "";
                }
            }
        }
        return "";
    }
}
