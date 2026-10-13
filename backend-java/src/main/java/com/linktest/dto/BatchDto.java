package com.linktest.dto;

import java.time.LocalDate;
import java.util.List;

public class BatchDto {

    public static class CreateBatchRequest {
        private String name;
        private String code;
        private String course_id;
        private String class_id;
        private String description;
        private LocalDate start_date;
        private LocalDate end_date;
        private Integer capacity = 40;
        private String status = "Active";
        private String class_teacher_id;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getCourse_id() { return course_id; }
        public void setCourse_id(String course_id) { this.course_id = course_id; }

        public String getClass_id() { return class_id; }
        public void setClass_id(String class_id) { this.class_id = class_id; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public LocalDate getStart_date() { return start_date; }
        public void setStart_date(LocalDate start_date) { this.start_date = start_date; }

        public LocalDate getEnd_date() { return end_date; }
        public void setEnd_date(LocalDate end_date) { this.end_date = end_date; }

        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getClass_teacher_id() { return class_teacher_id; }
        public void setClass_teacher_id(String class_teacher_id) { this.class_teacher_id = class_teacher_id; }
    }

    public static class AssignTeacherRequest {
        private String teacher_id;

        public String getTeacher_id() { return teacher_id; }
        public void setTeacher_id(String teacher_id) { this.teacher_id = teacher_id; }
    }

    public static class EnrollStudentsRequest {
        private List<String> student_ids;
        private String student_id;

        public List<String> getStudent_ids() { return student_ids; }
        public void setStudent_ids(List<String> student_ids) { this.student_ids = student_ids; }

        public String getStudent_id() { return student_id; }
        public void setStudent_id(String student_id) { this.student_id = student_id; }
    }
}
