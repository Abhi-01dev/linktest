package com.linktest.service;

import com.linktest.dto.MockTestDto.*;
import com.linktest.entity.*;
import com.linktest.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class MockTestService {

    private final MockTestRepository mockTestRepository;
    private final MockTestQuestionRepository mockTestQuestionRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;
    private final MockTestResponseRepository mockTestResponseRepository;
    private final MockTestProctoringEventRepository mockTestProctoringEventRepository;
    private final LoggingService loggingService;

    public MockTestService(
            MockTestRepository mockTestRepository,
            MockTestQuestionRepository mockTestQuestionRepository,
            MockTestAttemptRepository mockTestAttemptRepository,
            MockTestResponseRepository mockTestResponseRepository,
            MockTestProctoringEventRepository mockTestProctoringEventRepository,
            LoggingService loggingService) {
        this.mockTestRepository = mockTestRepository;
        this.mockTestQuestionRepository = mockTestQuestionRepository;
        this.mockTestAttemptRepository = mockTestAttemptRepository;
        this.mockTestResponseRepository = mockTestResponseRepository;
        this.mockTestProctoringEventRepository = mockTestProctoringEventRepository;
        this.loggingService = loggingService;
    }

    public List<MockTest> getAllTests(String status, String subject, String difficulty, String category, String createdBy, String search, User user) {
        String effectiveStatus = status;
        if (user == null || "STUDENT".equalsIgnoreCase(user.getRole())) {
            effectiveStatus = "published";
        }
        return mockTestRepository.findAllWithFilters(effectiveStatus, subject, difficulty, category, createdBy, search);
    }

    public Map<String, Object> getTestDetails(String id, User user) {
        MockTest test = mockTestRepository.findById(id).orElse(null);
        if (test == null) return null;

        boolean isTeacherOrAdmin = user != null && ("TEACHER".equalsIgnoreCase(user.getRole()) || "ADMIN".equalsIgnoreCase(user.getRole()));

        List<MockTestQuestion> questions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(id);
        List<Map<String, Object>> sanitizedQuestions = new ArrayList<>();

        for (MockTestQuestion q : questions) {
            Map<String, Object> qMap = new LinkedHashMap<>();
            qMap.put("id", q.getId());
            qMap.put("test_id", q.getTestId());
            qMap.put("question_text", q.getQuestionText());
            qMap.put("question_type", q.getQuestionType());
            qMap.put("options", q.getOptions());
            qMap.put("marks", q.getMarks());
            qMap.put("negative_marks", q.getNegativeMarks());
            qMap.put("topic", q.getTopic());
            qMap.put("difficulty", q.getDifficulty());
            qMap.put("order_index", q.getOrderIndex());
            qMap.put("image_url", q.getImageUrl());

            if (isTeacherOrAdmin) {
                qMap.put("answer_key", q.getAnswerKey());
                qMap.put("explanation", q.getExplanation());
            }

            sanitizedQuestions.add(qMap);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("test", test);
        res.put("questions", sanitizedQuestions);
        return res;
    }

    @Transactional
    public Map<String, Object> startOrResumeAttempt(String testId, User user, String ip) {
        MockTest test = mockTestRepository.findById(testId).orElse(null);
        if (test == null) {
            throw new IllegalArgumentException("Mock test not found.");
        }

        boolean isStudent = user != null && "STUDENT".equalsIgnoreCase(user.getRole());
        if (isStudent && !"published".equalsIgnoreCase(test.getStatus())) {
            throw new IllegalStateException("This examination is not currently available.");
        }

        // Check if candidate already has an active, unexpired attempt
        List<MockTestAttempt> activeAttempts = mockTestAttemptRepository.findActiveAttempts(user.getId(), testId);
        OffsetDateTime now = OffsetDateTime.now();

        MockTestAttempt attempt = null;
        for (MockTestAttempt act : activeAttempts) {
            if (act.getExpiresAt() != null && act.getExpiresAt().isAfter(now)) {
                attempt = act;
                break;
            } else if (act.getExpiresAt() != null && act.getExpiresAt().isBefore(now)) {
                // Auto-submit expired attempt
                submitAttempt(act.getId(), user, new SubmitAttemptRequest());
            }
        }

        if (attempt == null) {
            // Check attempt limit
            long completedAttempts = mockTestAttemptRepository.countByStudentIdAndTestId(user.getId(), testId);
            if (test.getMaxAttempts() != null && test.getMaxAttempts() > 0 && completedAttempts >= test.getMaxAttempts()) {
                throw new IllegalStateException("Maximum attempt limit (" + test.getMaxAttempts() + ") reached for this examination.");
            }

            attempt = new MockTestAttempt();
            attempt.setTestId(testId);
            attempt.setStudentId(user.getId());
            attempt.setStartedAt(now);

            int dur = test.getDurationMinutes() != null && test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
            attempt.setExpiresAt(now.plusMinutes(dur));
            attempt.setStatus("in_progress");
            attempt.setTotalScore(BigDecimal.ZERO);
            attempt.setMaxScore(test.getTotalMarks() != null ? test.getTotalMarks() : new BigDecimal("100.00"));

            Map<String, Object> snap = new LinkedHashMap<>();
            snap.put("title", test.getTitle());
            snap.put("duration_minutes", dur);
            snap.put("total_marks", attempt.getMaxScore());
            attempt.setTestSnapshot(snap);

            attempt = mockTestAttemptRepository.save(attempt);

            loggingService.logAudit(
                    user.getId(),
                    "MOCK_TEST_ATTEMPT_STARTED",
                    "mock_tests",
                    testId,
                    Map.of("attemptId", attempt.getId(), "ip", ip)
            );
        }

        // Fetch questions without answer keys
        List<MockTestQuestion> questions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(testId);
        List<Map<String, Object>> sanitizedQuestions = new ArrayList<>();
        for (MockTestQuestion q : questions) {
            Map<String, Object> qMap = new LinkedHashMap<>();
            qMap.put("id", q.getId());
            qMap.put("question_text", q.getQuestionText());
            qMap.put("question_type", q.getQuestionType());
            qMap.put("options", q.getOptions());
            qMap.put("marks", q.getMarks());
            qMap.put("negative_marks", q.getNegativeMarks());
            qMap.put("order_index", q.getOrderIndex());
            sanitizedQuestions.add(qMap);
        }

        // Fetch existing responses
        List<MockTestResponse> responses = mockTestResponseRepository.findByAttemptId(attempt.getId());
        Map<String, Object> responseMap = new LinkedHashMap<>();
        for (MockTestResponse r : responses) {
            responseMap.put(r.getQuestionId(), r);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", attempt);
        out.put("test", test);
        out.put("questions", sanitizedQuestions);
        out.put("responses", responseMap);
        out.put("server_time", OffsetDateTime.now());

        return out;
    }

    public Map<String, Object> getAttemptForTaker(String attemptId, User user) {
        MockTestAttempt attempt = mockTestAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) {
            throw new IllegalArgumentException("Attempt not found.");
        }
        if (!attempt.getStudentId().equals(user.getId()) && !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalStateException("Unauthorized access to this attempt.");
        }

        MockTest test = mockTestRepository.findById(attempt.getTestId()).orElse(null);
        List<MockTestQuestion> questions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(attempt.getTestId());
        List<MockTestResponse> responses = mockTestResponseRepository.findByAttemptId(attemptId);

        Map<String, Object> responseMap = new LinkedHashMap<>();
        for (MockTestResponse r : responses) {
            responseMap.put(r.getQuestionId(), r);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", attempt);
        out.put("test", test);
        out.put("questions", questions);
        out.put("responses", responseMap);
        out.put("server_time", OffsetDateTime.now());
        return out;
    }

    @Transactional
    public MockTestResponse saveResponse(String attemptId, User user, SaveAnswerRequest req) {
        MockTestAttempt attempt = mockTestAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) throw new IllegalArgumentException("Attempt not found.");
        if (!attempt.getStudentId().equals(user.getId())) throw new IllegalStateException("Unauthorized.");

        if (!"in_progress".equalsIgnoreCase(attempt.getStatus())) {
            throw new IllegalStateException("Attempt has already been submitted or completed.");
        }

        MockTestResponse resp = mockTestResponseRepository
                .findByAttemptIdAndQuestionId(attemptId, req.getQuestion_id())
                .orElse(new MockTestResponse());

        resp.setAttemptId(attemptId);
        resp.setQuestionId(req.getQuestion_id());
        resp.setResponseData(req.getResponse_data() != null ? req.getResponse_data() : new HashMap<>());
        resp.setIsMarkedForReview(req.getIs_marked_for_review() != null ? req.getIs_marked_for_review() : false);
        resp.setIsVisited(true);
        resp.setUpdatedAt(OffsetDateTime.now());

        return mockTestResponseRepository.save(resp);
    }

    @Transactional
    public MockTestProctoringEvent ingestProctoringEvent(String attemptId, User user, LogEventRequest req) {
        MockTestAttempt attempt = mockTestAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) throw new IllegalArgumentException("Attempt not found.");

        MockTestProctoringEvent evt = new MockTestProctoringEvent();
        evt.setAttemptId(attemptId);
        evt.setEventType(normalizeEventType(req.getEvent_type()));

        String rawSev = req.getSeverity();
        String normSev = (rawSev != null) ? rawSev.toLowerCase() : "warning";
        if (!normSev.equals("info") && !normSev.equals("warning") && !normSev.equals("critical")) {
            normSev = "warning";
        }
        evt.setSeverity(normSev);

        evt.setConfidence(req.getConfidence() != null ? req.getConfidence() : new BigDecimal("1.00"));
        evt.setDurationSeconds(req.getDuration_seconds() != null ? req.getDuration_seconds() : 0);
        evt.setMetadata(req.getMetadata() != null ? req.getMetadata() : new HashMap<>());

        MockTestProctoringEvent saved = mockTestProctoringEventRepository.save(evt);

        // Update attempt warning count if severity is warning/critical
        if ("warning".equalsIgnoreCase(normSev) || "critical".equalsIgnoreCase(normSev)) {
            int curWarnings = attempt.getWarningCount() != null ? attempt.getWarningCount() : 0;
            attempt.setWarningCount(curWarnings + 1);
            mockTestAttemptRepository.save(attempt);
        }

        return saved;
    }

    private String normalizeEventType(String raw) {
        if (raw == null || raw.isBlank()) return "TAB_HIDDEN";
        String upper = raw.trim().toUpperCase().replace("-", "_");
        switch (upper) {
            case "FACE_NOT_DETECTED":
            case "NO_FACE":
            case "FACE_MISSING":
                return "FACE_NOT_DETECTED";
            case "MULTIPLE_FACES":
            case "MULTI_FACE":
                return "MULTIPLE_FACES";
            case "CAMERA_DISCONNECTED":
            case "CAMERA_OFF":
                return "CAMERA_DISCONNECTED";
            case "CAMERA_PERMISSION_REVOKED":
                return "CAMERA_PERMISSION_REVOKED";
            case "TAB_HIDDEN":
            case "TAB_SWITCH":
            case "TAB_SWITCHED":
            case "VISIBILITY_HIDDEN":
                return "TAB_HIDDEN";
            case "WINDOW_BLURRED":
            case "WINDOW_BLUR":
            case "FOCUS_LOST":
                return "WINDOW_BLURRED";
            case "FULLSCREEN_EXIT":
            case "FULLSCREEN_EXITED":
                return "FULLSCREEN_EXIT";
            case "NETWORK_INTERRUPTION":
            case "OFFLINE":
                return "NETWORK_INTERRUPTION";
            case "AUDIO_ANOMALY":
            case "NOISE":
                return "AUDIO_ANOMALY";
            case "EXAM_TIME_EXPIRED":
            case "TIMEOUT":
                return "EXAM_TIME_EXPIRED";
            case "SUSPICIOUS_KEY_COMBINATION":
            case "COPY_PASTE":
            case "KEY_COMBINATION":
                return "SUSPICIOUS_KEY_COMBINATION";
            default:
                return "TAB_HIDDEN";
        }
    }

    @Transactional
    public Map<String, Object> submitAttempt(String attemptId, User user, SubmitAttemptRequest req) {
        MockTestAttempt attempt = mockTestAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) throw new IllegalArgumentException("Attempt not found.");

        if ("evaluated".equalsIgnoreCase(attempt.getStatus())) {
            return getAttemptResult(attemptId, user);
        }

        MockTest test = mockTestRepository.findById(attempt.getTestId()).orElse(null);
        List<MockTestQuestion> questions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(attempt.getTestId());
        List<MockTestResponse> responses = mockTestResponseRepository.findByAttemptId(attemptId);

        Map<String, MockTestResponse> responseMap = new HashMap<>();
        for (MockTestResponse r : responses) {
            responseMap.put(r.getQuestionId(), r);
        }

        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        int correctCount = 0;
        int incorrectCount = 0;
        int unansweredCount = 0;

        boolean negativeMarking = test != null && Boolean.TRUE.equals(test.getNegativeMarking());
        BigDecimal defaultPenalty = (test != null && test.getNegativeMarkPenalty() != null)
                ? test.getNegativeMarkPenalty() : new BigDecimal("1.00");

        for (MockTestQuestion q : questions) {
            BigDecimal qMarks = q.getMarks() != null ? q.getMarks() : new BigDecimal("4.00");
            maxScore = maxScore.add(qMarks);

            MockTestResponse resp = responseMap.get(q.getId());
            Integer selIdx = null;
            if (resp != null && resp.getResponseData() != null && !resp.getResponseData().isEmpty()) {
                Object selIdxObj = resp.getResponseData().get("selected_index");
                if (selIdxObj == null) selIdxObj = resp.getResponseData().get("selectedIndex");
                if (selIdxObj == null && resp.getResponseData().get("selected_options") instanceof List<?> list && !list.isEmpty()) {
                    selIdxObj = list.get(0);
                }
                if (selIdxObj instanceof Number) {
                    selIdx = ((Number) selIdxObj).intValue();
                } else if (selIdxObj instanceof String s && !s.isBlank()) {
                    try {
                        selIdx = Integer.parseInt(s.trim());
                    } catch (NumberFormatException ignored) {}
                }
            }

            if (selIdx == null) {
                unansweredCount++;
                if (resp != null) {
                    resp.setIsCorrect(false);
                    resp.setScoreAwarded(BigDecimal.ZERO);
                    resp.setEvaluationComment("Unanswered");
                    mockTestResponseRepository.save(resp);
                }
                continue;
            }

            Integer correctIdx = null;
            if (q.getAnswerKey() != null) {
                Object cObj = q.getAnswerKey().get("correct_index");
                if (cObj == null) cObj = q.getAnswerKey().get("correct_option_index");
                if (cObj == null) cObj = q.getAnswerKey().get("correctAnswer");
                if (cObj instanceof Number) {
                    correctIdx = ((Number) cObj).intValue();
                } else if (cObj instanceof String s && !s.isBlank()) {
                    try {
                        correctIdx = Integer.parseInt(s.trim());
                    } catch (NumberFormatException ignored) {
                        char c = s.trim().toUpperCase().charAt(0);
                        if (c >= 'A' && c <= 'Z') correctIdx = c - 'A';
                    }
                }
            }

            if (correctIdx != null && selIdx.equals(correctIdx)) {
                correctCount++;
                totalScore = totalScore.add(qMarks);
                resp.setIsCorrect(true);
                resp.setScoreAwarded(qMarks);
                resp.setEvaluationComment("Correct answer");
            } else {
                incorrectCount++;
                BigDecimal penalty = (q.getNegativeMarks() != null) ? q.getNegativeMarks() : defaultPenalty;
                if (negativeMarking) {
                    totalScore = totalScore.subtract(penalty);
                    resp.setScoreAwarded(penalty.negate());
                } else {
                    resp.setScoreAwarded(BigDecimal.ZERO);
                }
                resp.setIsCorrect(false);
                resp.setEvaluationComment("Incorrect answer");
            }

            mockTestResponseRepository.save(resp);
        }

        if (totalScore.compareTo(BigDecimal.ZERO) < 0) {
            totalScore = BigDecimal.ZERO;
        }

        BigDecimal percentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalScore.divide(maxScore, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal passPct = (test != null && test.getPassPercentage() != null) ? test.getPassPercentage() : new BigDecimal("40.00");
        boolean passed = percentage.compareTo(passPct) >= 0;

        OffsetDateTime now = OffsetDateTime.now();
        attempt.setSubmittedAt(now);
        attempt.setStatus("evaluated");
        attempt.setTotalScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setCorrectCount(correctCount);
        attempt.setIncorrectCount(incorrectCount);
        attempt.setUnansweredCount(unansweredCount);

        if (attempt.getStartedAt() != null) {
            long diffSec = java.time.Duration.between(attempt.getStartedAt(), now).getSeconds();
            attempt.setTimeSpentSeconds((int) Math.max(0, diffSec));
        }

        mockTestAttemptRepository.save(attempt);

        loggingService.logAudit(
                user.getId(),
                "MOCK_TEST_SUBMITTED",
                "mock_tests",
                attempt.getTestId(),
                Map.of("attemptId", attemptId, "score", totalScore, "passed", passed)
        );

        return getAttemptResult(attemptId, user);
    }

    public Map<String, Object> getAttemptResult(String attemptId, User user) {
        MockTestAttempt attempt = mockTestAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) throw new IllegalArgumentException("Attempt not found.");

        MockTest test = mockTestRepository.findById(attempt.getTestId()).orElse(null);
        List<MockTestQuestion> questions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(attempt.getTestId());
        List<MockTestResponse> responses = mockTestResponseRepository.findByAttemptId(attemptId);

        Map<String, MockTestResponse> responseMap = new HashMap<>();
        for (MockTestResponse r : responses) {
            responseMap.put(r.getQuestionId(), r);
        }

        boolean allowReview = test != null && (Boolean.TRUE.equals(test.getResultsPublished()) || Boolean.TRUE.equals(test.getAllowInstantResult()));

        List<Map<String, Object>> questionReview = new ArrayList<>();
        if (allowReview) {
            for (MockTestQuestion q : questions) {
                Map<String, Object> qData = new LinkedHashMap<>();
                qData.put("id", q.getId());
                qData.put("question_text", q.getQuestionText());
                qData.put("options", q.getOptions());
                qData.put("marks", q.getMarks());
                qData.put("answer_key", q.getAnswerKey());
                qData.put("explanation", q.getExplanation());

                MockTestResponse resp = responseMap.get(q.getId());
                Map<String, Object> respData = resp != null ? resp.getResponseData() : null;
                qData.put("candidate_response", respData);
                qData.put("user_response", respData);
                qData.put("is_correct", resp != null ? resp.getIsCorrect() : false);
                qData.put("score_awarded", resp != null ? resp.getScoreAwarded() : BigDecimal.ZERO);

                questionReview.add(qData);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", attempt);
        out.put("test", test);
        out.put("review_allowed", allowReview);
        out.put("questions", questionReview);

        return out;
    }

    @Transactional
    public MockTest createMockTest(CreateTestRequest req, User user) {
        MockTest test = new MockTest();
        test.setTitle(req.getTitle());
        test.setDescription(req.getDescription());
        test.setInstructions(req.getInstructions());
        test.setSubject(req.getSubject());
        test.setTopic(req.getTopic());
        test.setDifficulty(req.getDifficulty() != null ? req.getDifficulty().toLowerCase() : "medium");
        test.setCategory(req.getCategory() != null ? req.getCategory().toLowerCase() : "mock_exam");
        test.setTags(req.getTags() != null ? req.getTags() : new ArrayList<>());
        test.setClassId(req.getClass_id());
        test.setBatchId(req.getBatch_id());
        test.setCourseId(req.getCourse_id());
        test.setScheduledStart(req.getScheduled_start());
        test.setScheduledEnd(req.getScheduled_end());
        test.setDurationMinutes(req.getDuration_minutes() != null ? req.getDuration_minutes() : 60);
        test.setTotalMarks(req.getTotal_marks() != null ? req.getTotal_marks() : new BigDecimal("100.00"));
        test.setPassPercentage(req.getPass_percentage() != null ? req.getPass_percentage() : new BigDecimal("40.00"));
        test.setMaxAttempts(req.getMax_attempts() != null ? req.getMax_attempts() : 1);
        test.setRandomizeQuestions(Boolean.TRUE.equals(req.getRandomize_questions()));
        test.setRandomizeOptions(Boolean.TRUE.equals(req.getRandomize_options()));
        test.setNegativeMarking(Boolean.TRUE.equals(req.getNegative_marking()));
        test.setNegativeMarkPenalty(req.getNegative_mark_penalty() != null ? req.getNegative_mark_penalty() : new BigDecimal("1.00"));
        test.setProctoringConfig(req.getProctoring_config() != null ? req.getProctoring_config() : new HashMap<>());
        test.setStatus(req.getStatus() != null ? req.getStatus() : "draft");
        test.setResultsPublished(Boolean.TRUE.equals(req.getResults_published()));
        test.setAllowInstantResult(req.getAllow_instant_result() != null ? req.getAllow_instant_result() : true);
        test.setShowExplanations(req.getShow_explanations() != null ? req.getShow_explanations() : true);
        test.setCreatedBy(user.getId());

        MockTest saved = mockTestRepository.save(test);

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            List<MockTestQuestion> questionEntities = new ArrayList<>();
            int idx = 1;
            for (Map<String, Object> q : req.getQuestions()) {
                MockTestQuestion item = mapQuestion(saved.getId(), q, idx++);
                questionEntities.add(item);
            }
            mockTestQuestionRepository.saveAll(questionEntities);
        }

        loggingService.logAudit(
                user.getId(),
                "MOCK_TEST_CREATED",
                "mock_tests",
                saved.getId(),
                Map.of("title", saved.getTitle())
        );

        return saved;
    }

    @Transactional
    public MockTest updateMockTest(String id, CreateTestRequest req, User user) {
        MockTest test = mockTestRepository.findById(id).orElse(null);
        if (test == null) throw new IllegalArgumentException("Test not found.");

        if (req.getTitle() != null) test.setTitle(req.getTitle());
        if (req.getDescription() != null) test.setDescription(req.getDescription());
        if (req.getInstructions() != null) test.setInstructions(req.getInstructions());
        if (req.getSubject() != null) test.setSubject(req.getSubject());
        if (req.getTopic() != null) test.setTopic(req.getTopic());
        if (req.getDifficulty() != null) test.setDifficulty(req.getDifficulty().toLowerCase());
        if (req.getCategory() != null) test.setCategory(req.getCategory().toLowerCase());
        if (req.getTags() != null) test.setTags(req.getTags());
        if (req.getClass_id() != null) test.setClassId(req.getClass_id());
        if (req.getBatch_id() != null) test.setBatchId(req.getBatch_id());
        if (req.getScheduled_start() != null) test.setScheduledStart(req.getScheduled_start());
        if (req.getScheduled_end() != null) test.setScheduledEnd(req.getScheduled_end());
        if (req.getDuration_minutes() != null) test.setDurationMinutes(req.getDuration_minutes());
        if (req.getTotal_marks() != null) test.setTotalMarks(req.getTotal_marks());
        if (req.getPass_percentage() != null) test.setPassPercentage(req.getPass_percentage());
        if (req.getMax_attempts() != null) test.setMaxAttempts(req.getMax_attempts());
        if (req.getRandomize_questions() != null) test.setRandomizeQuestions(req.getRandomize_questions());
        if (req.getRandomize_options() != null) test.setRandomizeOptions(req.getRandomize_options());
        if (req.getNegative_marking() != null) test.setNegativeMarking(req.getNegative_marking());
        if (req.getNegative_mark_penalty() != null) test.setNegativeMarkPenalty(req.getNegative_mark_penalty());
        if (req.getProctoring_config() != null) test.setProctoringConfig(req.getProctoring_config());
        if (req.getStatus() != null) test.setStatus(req.getStatus());
        if (req.getResults_published() != null) test.setResultsPublished(req.getResults_published());
        if (req.getAllow_instant_result() != null) test.setAllowInstantResult(req.getAllow_instant_result());
        if (req.getShow_explanations() != null) test.setShowExplanations(req.getShow_explanations());

        MockTest saved = mockTestRepository.save(test);

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            mockTestQuestionRepository.deleteByTestId(id);
            List<MockTestQuestion> questionEntities = new ArrayList<>();
            int idx = 1;
            for (Map<String, Object> q : req.getQuestions()) {
                MockTestQuestion item = mapQuestion(id, q, idx++);
                questionEntities.add(item);
            }
            mockTestQuestionRepository.saveAll(questionEntities);
        }

        loggingService.logAudit(
                user.getId(),
                "MOCK_TEST_UPDATED",
                "mock_tests",
                id,
                Map.of("title", saved.getTitle())
        );

        return saved;
    }

    @Transactional
    public void deleteMockTest(String id, User user) {
        mockTestQuestionRepository.deleteByTestId(id);
        mockTestRepository.deleteById(id);
        loggingService.logAudit(
                user.getId(),
                "MOCK_TEST_DELETED",
                "mock_tests",
                id,
                Map.of()
        );
    }

    @Transactional
    public MockTest duplicateMockTest(String id, User user) {
        MockTest original = mockTestRepository.findById(id).orElse(null);
        if (original == null) throw new IllegalArgumentException("Original test not found.");

        MockTest copy = new MockTest();
        copy.setTitle(original.getTitle() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setInstructions(original.getInstructions());
        copy.setSubject(original.getSubject());
        copy.setTopic(original.getTopic());
        copy.setDifficulty(original.getDifficulty());
        copy.setCategory(original.getCategory());
        copy.setTags(new ArrayList<>(original.getTags()));
        copy.setClassId(original.getClassId());
        copy.setBatchId(original.getBatchId());
        copy.setDurationMinutes(original.getDurationMinutes());
        copy.setTotalMarks(original.getTotalMarks());
        copy.setPassPercentage(original.getPassPercentage());
        copy.setMaxAttempts(original.getMaxAttempts());
        copy.setRandomizeQuestions(original.getRandomizeQuestions());
        copy.setRandomizeOptions(original.getRandomizeOptions());
        copy.setNegativeMarking(original.getNegativeMarking());
        copy.setNegativeMarkPenalty(original.getNegativeMarkPenalty());
        copy.setProctoringConfig(new HashMap<>(original.getProctoringConfig()));
        copy.setStatus("draft");
        copy.setResultsPublished(false);
        copy.setAllowInstantResult(original.getAllowInstantResult());
        copy.setShowExplanations(original.getShowExplanations());
        copy.setCreatedBy(user.getId());

        MockTest savedCopy = mockTestRepository.save(copy);

        List<MockTestQuestion> originalQuestions = mockTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(id);
        List<MockTestQuestion> newQuestions = new ArrayList<>();
        for (MockTestQuestion oq : originalQuestions) {
            MockTestQuestion nq = new MockTestQuestion();
            nq.setTestId(savedCopy.getId());
            nq.setQuestionText(oq.getQuestionText());
            nq.setQuestionType(oq.getQuestionType());
            nq.setOptions(new ArrayList<>(oq.getOptions()));
            nq.setAnswerKey(new HashMap<>(oq.getAnswerKey()));
            nq.setMarks(oq.getMarks());
            nq.setNegativeMarks(oq.getNegativeMarks());
            nq.setExplanation(oq.getExplanation());
            nq.setTopic(oq.getTopic());
            nq.setDifficulty(oq.getDifficulty());
            nq.setOrderIndex(oq.getOrderIndex());
            nq.setImageUrl(oq.getImageUrl());
            newQuestions.add(nq);
        }
        mockTestQuestionRepository.saveAll(newQuestions);

        return savedCopy;
    }

    public Map<String, Object> getTestAnalytics(String testId) {
        List<MockTestAttempt> attempts = mockTestAttemptRepository.findByTestIdOrderByStartedAtDesc(testId);
        int total = attempts.size();
        if (total == 0) {
            return Map.of(
                    "total_attempts", 0,
                    "average_score", 0,
                    "pass_percentage", 0,
                    "highest_score", 0,
                    "lowest_score", 0
            );
        }

        BigDecimal sumScore = BigDecimal.ZERO;
        BigDecimal highest = BigDecimal.ZERO;
        BigDecimal lowest = new BigDecimal("999999");
        int passedCount = 0;

        for (MockTestAttempt a : attempts) {
            BigDecimal score = a.getTotalScore() != null ? a.getTotalScore() : BigDecimal.ZERO;
            sumScore = sumScore.add(score);
            if (score.compareTo(highest) > 0) highest = score;
            if (score.compareTo(lowest) < 0) lowest = score;
            if (Boolean.TRUE.equals(a.getPassed())) passedCount++;
        }

        BigDecimal avg = sumScore.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        BigDecimal passRate = BigDecimal.valueOf(passedCount * 100.0 / total).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("total_attempts", total);
        analytics.put("average_score", avg);
        analytics.put("pass_percentage", passRate);
        analytics.put("highest_score", highest);
        analytics.put("lowest_score", lowest.compareTo(new BigDecimal("999999")) == 0 ? 0 : lowest);

        return analytics;
    }

    @SuppressWarnings("unchecked")
    private MockTestQuestion mapQuestion(String testId, Map<String, Object> map, int defaultOrder) {
        MockTestQuestion q = new MockTestQuestion();
        q.setId("q-" + java.util.UUID.randomUUID().toString());
        q.setTestId(testId);
        q.setQuestionText((String) map.getOrDefault("question_text", ""));
        q.setQuestionType((String) map.getOrDefault("question_type", "mcq_single"));

        Object opts = map.get("options");
        if (opts instanceof List<?>) {
            List<Object> optList = new ArrayList<>((List<?>) opts);
            q.setOptions(optList);
        }

        Object aKey = map.get("answer_key");
        if (aKey instanceof Map<?, ?>) {
            q.setAnswerKey((Map<String, Object>) aKey);
        } else if (map.containsKey("correct_option_index")) {
            Map<String, Object> ak = new HashMap<>();
            ak.put("correct_index", map.get("correct_option_index"));
            q.setAnswerKey(ak);
        } else if (map.containsKey("correct_answers")) {
            Map<String, Object> ak = new HashMap<>();
            Object ca = map.get("correct_answers");
            ak.put("correct_answers", ca);
            if (ca instanceof List<?> caList && !caList.isEmpty()) {
                ak.put("correctAnswer", caList.get(0));
            }
            q.setAnswerKey(ak);
        } else if (map.containsKey("correctAnswer")) {
            Map<String, Object> ak = new HashMap<>();
            ak.put("correctAnswer", map.get("correctAnswer"));
            q.setAnswerKey(ak);
        }

        Object marks = map.get("marks");
        if (marks instanceof Number) {
            q.setMarks(BigDecimal.valueOf(((Number) marks).doubleValue()));
        } else if (marks instanceof String && !((String) marks).isBlank()) {
            q.setMarks(new BigDecimal((String) marks));
        }

        Object negMarks = map.get("negative_marks");
        if (negMarks instanceof Number) {
            q.setNegativeMarks(BigDecimal.valueOf(((Number) negMarks).doubleValue()));
        }

        q.setExplanation((String) map.get("explanation"));
        q.setTopic((String) map.get("topic"));
        String diff = (String) map.get("difficulty");
        q.setDifficulty(diff != null ? diff.toLowerCase() : "medium");
        q.setOrderIndex(defaultOrder);
        q.setImageUrl((String) map.get("image_url"));

        return q;
    }
}
