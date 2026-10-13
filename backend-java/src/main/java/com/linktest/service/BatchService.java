package com.linktest.service;

import com.linktest.dto.BatchDto.*;
import com.linktest.entity.*;
import com.linktest.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchTeacherRepository batchTeacherRepository;
    private final BatchEnrollmentRepository batchEnrollmentRepository;
    private final UserRepository userRepository;
    private final LoggingService loggingService;

    public BatchService(
            BatchRepository batchRepository,
            BatchTeacherRepository batchTeacherRepository,
            BatchEnrollmentRepository batchEnrollmentRepository,
            UserRepository userRepository,
            LoggingService loggingService) {
        this.batchRepository = batchRepository;
        this.batchTeacherRepository = batchTeacherRepository;
        this.batchEnrollmentRepository = batchEnrollmentRepository;
        this.userRepository = userRepository;
        this.loggingService = loggingService;
    }

    public List<Batch> getBatches(String search, String status, String courseId, User user) {
        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            return batchRepository.findBatchesForTeacher(user.getId());
        }
        return batchRepository.findAllWithFilters(search, status, courseId);
    }

    public Map<String, Object> getBatchDetail(String batchId, User user) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) return null;

        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, user.getId());
            if (!isAssigned) {
                throw new IllegalStateException("Forbidden: You are not assigned to this batch.");
            }
        }

        List<Map<String, Object>> teachers = batchTeacherRepository.findTeacherDetailsByBatchId(batchId);
        List<Map<String, Object>> students = batchEnrollmentRepository.findStudentDetailsByBatchId(batchId);

        Map<String, Object> batchMap = new LinkedHashMap<>();
        batchMap.put("id", batch.getId());
        batchMap.put("name", batch.getName());
        batchMap.put("code", batch.getCode());
        batchMap.put("course_id", batch.getCourseId());
        batchMap.put("class_id", batch.getClassId());
        batchMap.put("class_teacher_id", batch.getClassTeacherId());
        batchMap.put("description", batch.getDescription());
        batchMap.put("start_date", batch.getStartDate());
        batchMap.put("end_date", batch.getEndDate());
        batchMap.put("capacity", batch.getCapacity());
        batchMap.put("status", batch.getStatus());
        batchMap.put("created_at", batch.getCreatedAt());
        batchMap.put("updated_at", batch.getUpdatedAt());
        batchMap.put("teachers", teachers);
        batchMap.put("students", students);

        return batchMap;
    }

    @Transactional
    public Batch createBatch(CreateBatchRequest req, User user) {
        if (req.getCode() != null && !req.getCode().isBlank()) {
            if (batchRepository.findByCode(req.getCode().trim().toUpperCase()).isPresent()) {
                throw new IllegalArgumentException("Batch code '" + req.getCode().trim().toUpperCase() + "' is already in use.");
            }
        }

        Batch batch = new Batch();
        batch.setName(req.getName());
        batch.setCode(req.getCode() != null ? req.getCode().trim().toUpperCase() : null);
        batch.setCourseId(req.getCourse_id());
        batch.setClassId(req.getClass_id());
        batch.setClassTeacherId(req.getClass_teacher_id());
        batch.setDescription(req.getDescription() != null ? req.getDescription() : "");
        batch.setStartDate(req.getStart_date());
        batch.setEndDate(req.getEnd_date());
        batch.setCapacity(req.getCapacity() != null ? req.getCapacity() : 40);
        batch.setStatus(req.getStatus() != null ? req.getStatus() : "Active");

        Batch saved = batchRepository.save(batch);

        loggingService.logAudit(
                user.getId(),
                "BATCH_CREATED",
                "batch",
                saved.getId(),
                Map.of("name", saved.getName(), "code", saved.getCode() != null ? saved.getCode() : "")
        );

        return saved;
    }

    @Transactional
    public Batch updateBatch(String batchId, CreateBatchRequest req, User user) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) throw new IllegalArgumentException("Batch not found.");

        if (req.getName() != null) batch.setName(req.getName());
        if (req.getCode() != null && !req.getCode().isBlank()) {
            String newCode = req.getCode().trim().toUpperCase();
            Optional<Batch> existing = batchRepository.findByCode(newCode);
            if (existing.isPresent() && !existing.get().getId().equals(batchId)) {
                throw new IllegalArgumentException("Batch code '" + newCode + "' is already in use.");
            }
            batch.setCode(newCode);
        }
        if (req.getCourse_id() != null) batch.setCourseId(req.getCourse_id());
        if (req.getClass_id() != null) batch.setClassId(req.getClass_id());
        if (req.getClass_teacher_id() != null) batch.setClassTeacherId(req.getClass_teacher_id());
        if (req.getDescription() != null) batch.setDescription(req.getDescription());
        if (req.getStart_date() != null) batch.setStartDate(req.getStart_date());
        if (req.getEnd_date() != null) batch.setEndDate(req.getEnd_date());
        if (req.getCapacity() != null) batch.setCapacity(req.getCapacity());
        if (req.getStatus() != null) batch.setStatus(req.getStatus());

        Batch saved = batchRepository.save(batch);

        loggingService.logAudit(
                user.getId(),
                "BATCH_UPDATED",
                "batch",
                batchId,
                Map.of("name", saved.getName())
        );

        return saved;
    }

    @Transactional
    public Batch archiveBatch(String batchId, User user) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) throw new IllegalArgumentException("Batch not found.");

        batch.setStatus("Archived");
        Batch saved = batchRepository.save(batch);

        loggingService.logAudit(
                user.getId(),
                "BATCH_ARCHIVED",
                "batch",
                batchId,
                Map.of("name", saved.getName())
        );

        return saved;
    }

    @Transactional
    public void deleteBatch(String batchId, User user) {
        batchRepository.deleteById(batchId);
        loggingService.logAudit(
                user.getId(),
                "BATCH_DELETED",
                "batch",
                batchId,
                Map.of()
        );
    }

    public List<Map<String, Object>> getBatchTeachers(String batchId, User user) {
        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, user.getId());
            if (!isAssigned) throw new IllegalStateException("Forbidden: You are not assigned to this batch.");
        }
        return batchTeacherRepository.findTeacherDetailsByBatchId(batchId);
    }

    @Transactional
    public BatchTeacher assignTeacher(String batchId, String teacherId, User user) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) throw new IllegalArgumentException("Batch not found.");

        User teacher = userRepository.findById(teacherId).orElse(null);
        if (teacher == null || !"TEACHER".equalsIgnoreCase(teacher.getRole())) {
            throw new IllegalArgumentException("Selected user is not an active faculty teacher.");
        }

        if (batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, teacherId)) {
            return batchTeacherRepository.findByBatchIdAndTeacherId(batchId, teacherId).get();
        }

        BatchTeacher bt = new BatchTeacher(batchId, teacherId, user.getId());
        BatchTeacher saved = batchTeacherRepository.save(bt);

        loggingService.logAudit(
                user.getId(),
                "BATCH_TEACHER_ASSIGNED",
                "batch_teacher",
                saved.getId(),
                Map.of("batchId", batchId, "teacherId", teacherId)
        );

        return saved;
    }

    @Transactional
    public void removeTeacher(String batchId, String teacherId, User user) {
        batchTeacherRepository.deleteByBatchIdAndTeacherId(batchId, teacherId);
        loggingService.logAudit(
                user.getId(),
                "BATCH_TEACHER_REMOVED",
                "batch_teacher",
                batchId + "-" + teacherId,
                Map.of("batchId", batchId, "teacherId", teacherId)
        );
    }

    public List<Map<String, Object>> getBatchStudents(String batchId, User user) {
        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, user.getId());
            if (!isAssigned) throw new IllegalStateException("Forbidden: You are not assigned to this batch.");
        }
        return batchEnrollmentRepository.findStudentDetailsByBatchId(batchId);
    }

    @Transactional
    public Map<String, Object> enrollStudents(String batchId, List<String> studentIds, User user) {
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) throw new IllegalArgumentException("Batch not found.");

        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, user.getId());
            if (!isAssigned) throw new IllegalStateException("Forbidden: You cannot enroll students into a batch you are not assigned to.");
        }

        int enrolledCount = 0;
        int alreadyEnrolled = 0;

        for (String sId : studentIds) {
            if (batchEnrollmentRepository.existsByBatchIdAndStudentId(batchId, sId)) {
                alreadyEnrolled++;
                continue;
            }
            BatchEnrollment be = new BatchEnrollment(batchId, sId, user.getId());
            batchEnrollmentRepository.save(be);
            enrolledCount++;
        }

        loggingService.logAudit(
                user.getId(),
                "BATCH_STUDENTS_ENROLLED",
                "batch_enrollment",
                batchId,
                Map.of("enrolledCount", enrolledCount, "alreadyEnrolled", alreadyEnrolled)
        );

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total_enrolled", enrolledCount);
        out.put("already_enrolled", alreadyEnrolled);
        out.put("batch_id", batchId);
        return out;
    }

    @Transactional
    public void removeStudent(String batchId, String studentId, User user) {
        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = batchTeacherRepository.existsByBatchIdAndTeacherId(batchId, user.getId());
            if (!isAssigned) throw new IllegalStateException("Forbidden: You cannot remove students from a batch you are not assigned to.");
        }

        batchEnrollmentRepository.deleteByBatchIdAndStudentId(batchId, studentId);
        loggingService.logAudit(
                user.getId(),
                "BATCH_STUDENT_REMOVED",
                "batch_enrollment",
                batchId + "-" + studentId,
                Map.of("batchId", batchId, "studentId", studentId)
        );
    }

    public List<Map<String, Object>> searchStudents(String query, int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 100));
        List<User> students = userRepository.searchStudents(query, org.springframework.data.domain.PageRequest.of(0, boundedLimit));
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : students) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("full_name", u.getFullName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("status", u.getStatus());
            out.add(m);
        }
        return out;
    }
}
