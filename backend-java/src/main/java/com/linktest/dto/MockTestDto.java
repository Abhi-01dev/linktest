package com.linktest.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MockTestDto {

    public static class SaveAnswerRequest {
        private String question_id;
        private Map<String, Object> response_data = new HashMap<>();
        private Boolean is_marked_for_review = false;
        private Boolean is_visited = true;

        public String getQuestion_id() { return question_id; }
        public void setQuestion_id(String question_id) { this.question_id = question_id; }

        public Map<String, Object> getResponse_data() { return response_data; }
        public void setResponse_data(Map<String, Object> response_data) { this.response_data = response_data; }

        public Boolean getIs_marked_for_review() { return is_marked_for_review; }
        public void setIs_marked_for_review(Boolean is_marked_for_review) { this.is_marked_for_review = is_marked_for_review; }

        public Boolean getIs_visited() { return is_visited; }
        public void setIs_visited(Boolean is_visited) { this.is_visited = is_visited; }
    }

    public static class LogEventRequest {
        private String event_type;
        private String severity;
        private BigDecimal confidence;
        private Integer duration_seconds;
        private Map<String, Object> metadata = new HashMap<>();
        private String client_timestamp;

        public String getEvent_type() { return event_type; }
        public void setEvent_type(String event_type) { this.event_type = event_type; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public BigDecimal getConfidence() { return confidence; }
        public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }

        public Integer getDuration_seconds() { return duration_seconds; }
        public void setDuration_seconds(Integer duration_seconds) { this.duration_seconds = duration_seconds; }

        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

        public String getClient_timestamp() { return client_timestamp; }
        public void setClient_timestamp(String client_timestamp) { this.client_timestamp = client_timestamp; }
    }

    public static class SubmitAttemptRequest {
        private Boolean auto_submitted = false;
        private String reason;
        private BigDecimal proctoring_score;

        public Boolean getAuto_submitted() { return auto_submitted; }
        public void setAuto_submitted(Boolean auto_submitted) { this.auto_submitted = auto_submitted; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public BigDecimal getProctoring_score() { return proctoring_score; }
        public void setProctoring_score(BigDecimal proctoring_score) { this.proctoring_score = proctoring_score; }
    }

    public static class CreateTestRequest {
        private String title;
        private String description;
        private String instructions;
        private String subject;
        private String topic;
        private String difficulty;
        private String category;
        private List<String> tags = new ArrayList<>();
        private String class_id;
        private String batch_id;
        private String course_id;
        private OffsetDateTime scheduled_start;
        private OffsetDateTime scheduled_end;
        private Integer duration_minutes = 60;
        private BigDecimal total_marks = new BigDecimal("100.00");
        private BigDecimal pass_percentage = new BigDecimal("40.00");
        private Integer max_attempts = 1;
        private Boolean randomize_questions = false;
        private Boolean randomize_options = false;
        private Boolean negative_marking = false;
        private BigDecimal negative_mark_penalty = new BigDecimal("1.00");
        private Map<String, Object> proctoring_config = new HashMap<>();
        private String status = "draft";
        private Boolean results_published = false;
        private Boolean allow_instant_result = true;
        private Boolean show_explanations = true;
        private List<Map<String, Object>> questions;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }

        public String getClass_id() { return class_id; }
        public void setClass_id(String class_id) { this.class_id = class_id; }

        public String getBatch_id() { return batch_id; }
        public void setBatch_id(String batch_id) { this.batch_id = batch_id; }

        public String getCourse_id() { return course_id; }
        public void setCourse_id(String course_id) { this.course_id = course_id; }

        public OffsetDateTime getScheduled_start() { return scheduled_start; }
        public void setScheduled_start(OffsetDateTime scheduled_start) { this.scheduled_start = scheduled_start; }

        public OffsetDateTime getScheduled_end() { return scheduled_end; }
        public void setScheduled_end(OffsetDateTime scheduled_end) { this.scheduled_end = scheduled_end; }

        public Integer getDuration_minutes() { return duration_minutes; }
        public void setDuration_minutes(Integer duration_minutes) { this.duration_minutes = duration_minutes; }

        public BigDecimal getTotal_marks() { return total_marks; }
        public void setTotal_marks(BigDecimal total_marks) { this.total_marks = total_marks; }

        public BigDecimal getPass_percentage() { return pass_percentage; }
        public void setPass_percentage(BigDecimal pass_percentage) { this.pass_percentage = pass_percentage; }

        public Integer getMax_attempts() { return max_attempts; }
        public void setMax_attempts(Integer max_attempts) { this.max_attempts = max_attempts; }

        public Boolean getRandomize_questions() { return randomize_questions; }
        public void setRandomize_questions(Boolean randomize_questions) { this.randomize_questions = randomize_questions; }

        public Boolean getRandomize_options() { return randomize_options; }
        public void setRandomize_options(Boolean randomize_options) { this.randomize_options = randomize_options; }

        public Boolean getNegative_marking() { return negative_marking; }
        public void setNegative_marking(Boolean negative_marking) { this.negative_marking = negative_marking; }

        public BigDecimal getNegative_mark_penalty() { return negative_mark_penalty; }
        public void setNegative_mark_penalty(BigDecimal negative_mark_penalty) { this.negative_mark_penalty = negative_mark_penalty; }

        public Map<String, Object> getProctoring_config() { return proctoring_config; }
        public void setProctoring_config(Map<String, Object> proctoring_config) { this.proctoring_config = proctoring_config; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Boolean getResults_published() { return results_published; }
        public void setResults_published(Boolean results_published) { this.results_published = results_published; }

        public Boolean getAllow_instant_result() { return allow_instant_result; }
        public void setAllow_instant_result(Boolean allow_instant_result) { this.allow_instant_result = allow_instant_result; }

        public Boolean getShow_explanations() { return show_explanations; }
        public void setShow_explanations(Boolean show_explanations) { this.show_explanations = show_explanations; }

        public List<Map<String, Object>> getQuestions() { return questions; }
        public void setQuestions(List<Map<String, Object>> questions) { this.questions = questions; }
    }
}
