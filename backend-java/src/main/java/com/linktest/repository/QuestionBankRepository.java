package com.linktest.repository;

import com.linktest.entity.QuestionBankItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBankItem, String> {

    @Query("SELECT q FROM QuestionBankItem q WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(q.questionText) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:subject IS NULL OR :subject = '' OR LOWER(q.subject) = LOWER(:subject)) AND " +
           "(:topic IS NULL OR :topic = '' OR LOWER(q.topic) = LOWER(:topic)) AND " +
           "(:difficulty IS NULL OR :difficulty = '' OR LOWER(q.difficulty) = LOWER(:difficulty)) AND " +
           "(:createdBy IS NULL OR :createdBy = '' OR q.createdBy = :createdBy)")
    Page<QuestionBankItem> findQuestions(
            @Param("search") String search,
            @Param("subject") String subject,
            @Param("topic") String topic,
            @Param("difficulty") String difficulty,
            @Param("createdBy") String createdBy,
            Pageable pageable
    );

    @Query("SELECT DISTINCT q.subject FROM QuestionBankItem q ORDER BY q.subject")
    List<String> findDistinctSubjects();

    @Query("SELECT DISTINCT q.topic FROM QuestionBankItem q WHERE LOWER(q.subject) = LOWER(:subject) ORDER BY q.topic")
    List<String> findDistinctTopicsBySubject(@Param("subject") String subject);

    @Query("SELECT DISTINCT q.topic FROM QuestionBankItem q ORDER BY q.topic")
    List<String> findAllDistinctTopics();

    @Query("SELECT q FROM QuestionBankItem q WHERE LOWER(q.questionText) = LOWER(:questionText) AND LOWER(q.subject) = LOWER(:subject)")
    List<QuestionBankItem> findDuplicates(@Param("questionText") String questionText, @Param("subject") String subject);
}
