$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8081/api"
$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host "Running: $Name ... " -NoNewline
    try {
        $result = & $Action
        Write-Host "PASSED" -ForegroundColor Green
        $results.Add([PSCustomObject]@{
            Workflow = $Name
            Status = "PASSED"
            Details = if ($result) { $result } else { "Success" }
        })
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $results.Add([PSCustomObject]@{
            Workflow = $Name
            Status = "FAILED"
            Details = $_.Exception.Message
        })
    }
}

# 1. Health & Diagnostics
Test-Step "1. Health Endpoint" {
    $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($res.success -ne $true -or ($res.data.status -ne "UP" -and $res.data.status -ne "operational")) { throw "Health status not UP/operational" }
    "Status: $($res.data.status), Platform: $($res.data.platform)"
}

Test-Step "2. AI Tutor Diagnostics" {
    $res = Invoke-RestMethod -Uri "$baseUrl/ai/status" -Method Get
    if ($res.success -ne $true) { throw "AI diagnostics returned false" }
    "Model: $($res.data.model), Available: $($res.data.available)"
}

Test-Step "3. LiveKit WebRTC Diagnostics" {
    $res = Invoke-RestMethod -Uri "$baseUrl/livekit/status" -Method Get
    if ($res.success -ne $true) { throw "LiveKit diagnostics returned false" }
    "Provider: $($res.data.provider), Server: $($res.data.serverUrl)"
}

# 2. Authentication
$adminToken = $null
$teacherToken = $null
$studentToken = $null
$adminUser = $null
$teacherUser = $null
$studentUser = $null

Test-Step "4. Admin Authentication" {
    $body = @{ email = "admin@linktest.io"; password = "Admin123!" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.data.token) { throw "No token returned" }
    $script:adminToken = $res.data.token
    $script:adminUser = $res.data.user
    "Logged in as: $($res.data.user.full_name) ($($res.data.user.role))"
}

Test-Step "5. Teacher Authentication" {
    $body = @{ email = "teacher@linktest.io"; password = "Teacher123!" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.data.token) { throw "No token returned" }
    $script:teacherToken = $res.data.token
    $script:teacherUser = $res.data.user
    "Logged in as: $($res.data.user.full_name) ($($res.data.user.role))"
}

Test-Step "6. Student Authentication" {
    $body = @{ email = "student@linktest.io"; password = "Student123!" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.data.token) { throw "No token returned" }
    $script:studentToken = $res.data.token
    $script:studentUser = $res.data.user
    "Logged in as: $($res.data.user.full_name) ($($res.data.user.role))"
}

# 3. RBAC & Security Restrictions
Test-Step "7. Security: Unauthenticated request rejected" {
    try {
        $null = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get
        throw "Should have been rejected"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -in 401, 403) {
            "Correctly rejected with HTTP $($_.Exception.Response.StatusCode.value__)"
        } else {
            throw "Unexpected status code: $($_.Exception.Response.StatusCode.value__)"
        }
    }
}

Test-Step "8. Security: Student forbidden from Admin endpoint" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    try {
        $null = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get -Headers $headers
        throw "Student was allowed into admin endpoint"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            "Correctly forbidden with HTTP 403"
        } else {
            throw "Unexpected status code: $($_.Exception.Response.StatusCode.value__)"
        }
    }
}

# 4. Admin Management: Dashboard, Users, Batches, Teacher Assignment
$createdBatchId = $null
Test-Step "9. Admin Dashboard & User Management" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $dash = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get -Headers $headers
    $users = Invoke-RestMethod -Uri "$baseUrl/admin/users?limit=10" -Method Get -Headers $headers
    "Users count: $($users.data.total), Stats: $($dash.data.total_users) users, $($dash.data.total_courses) courses"
}

Test-Step "10. Admin Batch Creation & Teacher Assignment" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $batchBody = @{
        name = "E2E Verification Batch $timestamp"
        code = "E2E-$timestamp"
        status = "active"
        max_capacity = 30
    } | ConvertTo-Json
    $batchRes = Invoke-RestMethod -Uri "$baseUrl/batches" -Method Post -Body $batchBody -ContentType "application/json" -Headers $headers
    $script:createdBatchId = $batchRes.data.batch.id
    
    # Assign teacher
    $assignBody = @{ teacher_id = $teacherUser.id } | ConvertTo-Json
    $assignRes = Invoke-RestMethod -Uri "$baseUrl/batches/$createdBatchId/teachers" -Method Post -Body $assignBody -ContentType "application/json" -Headers $headers
    
    "Created batch: $($batchRes.data.batch.name) (ID: $createdBatchId), Teacher assigned: $($assignRes.data.allocation.teacher_id)"
}

# 5. Teacher: Student Assignment, Question Management, CSV Import
Test-Step "11. Student Batch Enrollment" {
    $headers = @{ Authorization = "Bearer $teacherToken" }
    $enrollBody = @{ student_ids = @($studentUser.id) } | ConvertTo-Json
    $enrollRes = Invoke-RestMethod -Uri "$baseUrl/batches/$createdBatchId/students" -Method Post -Body $enrollBody -ContentType "application/json" -Headers $headers
    "Enrolled $($enrollRes.data.total_enrolled) student(s) into batch"
}

Test-Step "12. CSV Question Template Download" {
    $headers = @{ Authorization = "Bearer $teacherToken" }
    $csv = Invoke-RestMethod -Uri "$baseUrl/questions/csv/template" -Method Get -Headers $headers
    if (-not $csv -or -not $csv.Contains("question")) { throw "CSV template invalid" }
    "CSV Template size: $($csv.Length) chars, Header: $($csv.Split("`n")[0])"
}

Test-Step "13. CSV Question Preview & Validation" {
    $headers = @{ Authorization = "Bearer $teacherToken" }
    $csvSample = "question,optionA,optionB,optionC,optionD,correctAnswer,subject,topic,difficulty,explanation,marks`n`"What is the time complexity of binary search?`",`"O(n)`",`"O(log n)`",`"O(1)`",`"O(n^2)`",B,`"Computer Science`",`"Algorithms`",EASY,`"Binary search halves the search space each step.\`",2"
    $previewBody = @{
        csvContent = $csvSample
    } | ConvertTo-Json
    $previewRes = Invoke-RestMethod -Uri "$baseUrl/questions/csv/preview" -Method Post -Body $previewBody -ContentType "application/json" -Headers $headers
    if ($previewRes.data.validCount -lt 1) { throw "Validation failed: $($previewRes.data.errors)" }
    "Valid rows: $($previewRes.data.validCount), Total rows: $($previewRes.data.totalRows)"
}

Test-Step "14. CSV Question Import Execution" {
    $headers = @{ Authorization = "Bearer $teacherToken" }
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $csvSample = "question,optionA,optionB,optionC,optionD,correctAnswer,subject,topic,difficulty,explanation,marks`n`"What is the average lookup time of a hash table ($timestamp)?`",`"O(1)`",`"O(n)`",`"O(log n)`",`"O(n log n)`",A,`"Computer Science`",`"Hash Tables`",EASY,`"Hash tables provide average constant time lookup.\`",4"
    $importBody = @{
        csvContent = $csvSample
        duplicateStrategy = "skip"
    } | ConvertTo-Json
    $importRes = Invoke-RestMethod -Uri "$baseUrl/questions/csv/import" -Method Post -Body $importBody -ContentType "application/json" -Headers $headers
    if ($importRes.data.importedCount -lt 1) { throw "Import count was 0: $($importRes.data.errors)" }
    "Imported count: $($importRes.data.importedCount), Strategy: $($importRes.data.duplicateStrategy)"
}

# 6. Student: Mock Test / Quiz Flow: Start, Autosave, Submit, Result
Test-Step "15. Student Exam Flow (Create Test, Publish, Attempt, Autosave, Submit, Grade)" {
    $tHeaders = @{ Authorization = "Bearer $teacherToken" }
    $sHeaders = @{ Authorization = "Bearer $studentToken" }
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    
    # 1. Teacher creates a test
    $createBody = @{
        title = "Automated E2E Examination $ts"
        subject = "Computer Science"
        difficulty = "medium"
        duration_minutes = 30
        max_attempts = 3
        questions = @(
            @{
                question_text = "What is the Big-O time complexity of quicksort in the average case?"
                question_type = "mcq_single"
                marks = 5
                negative_marks = 1
                options = @(
                    @{ key = "A"; text = "O(n^2)" },
                    @{ key = "B"; text = "O(n log n)" },
                    @{ key = "C"; text = "O(n)" },
                    @{ key = "D"; text = "O(1)" }
                )
                correct_answers = @("B")
                explanation = "Quicksort has an average runtime of O(n log n)."
            },
            @{
                question_text = "Which protocol is connection-oriented?"
                question_type = "mcq_single"
                marks = 5
                negative_marks = 1
                options = @(
                    @{ key = "A"; text = "UDP" },
                    @{ key = "B"; text = "TCP" }
                )
                correct_answers = @("B")
                explanation = "TCP establishes a 3-way handshake."
            }
        )
    } | ConvertTo-Json -Depth 5
    
    $createdTest = Invoke-RestMethod -Uri "$baseUrl/mock-tests" -Method Post -Body $createBody -ContentType "application/json" -Headers $tHeaders
    $testId = $createdTest.data.test.id
    
    # 2. Teacher publishes the test
    $pubBody = @{ status = "published" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testId/publish" -Method Post -Body $pubBody -ContentType "application/json" -Headers $tHeaders
    
    # 2b. Student submits join request
    $joinReq = Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testId/join-request" -Method Post -Headers $sHeaders
    $reqId = $joinReq.data.id

    # 2c. Teacher approves join request
    $null = Invoke-RestMethod -Uri "$baseUrl/teacher/mock-tests/join-requests/$reqId/approve" -Method Post -Headers $tHeaders
    
    # 3. Student starts attempt
    $attemptRes = Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testId/attempts" -Method Post -Headers $sHeaders
    $attemptId = if ($attemptRes.data.attempt_id) { $attemptRes.data.attempt_id } else { $attemptRes.data.attempt.id }
    
    # 4. Student autosaves response
    $qId = $attemptRes.data.questions[0].id
    $saveBody = @{
        question_id = $qId
        response_data = @{ selected_key = "B" }
        is_marked_for_review = $false
    } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/answers" -Method Put -Body $saveBody -ContentType "application/json" -Headers $sHeaders
    
    # 5. Student submits attempt
    $submitBody = @{ proctoring_score = 98.5 } | ConvertTo-Json
    $submitRes = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/submit" -Method Post -Body $submitBody -ContentType "application/json" -Headers $sHeaders
    
    # 6. Student views result
    $resultRes = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/result" -Method Get -Headers $sHeaders
    
    # 7. Clean up test
    $null = Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testId" -Method Delete -Headers $tHeaders
    
    $st = if ($submitRes.data.attempt) { $submitRes.data.attempt.status } else { $submitRes.data.status }
    $sc = if ($resultRes.data.attempt) { $resultRes.data.attempt.total_score } else { $resultRes.data.total_score }
    $ms = if ($resultRes.data.attempt) { $resultRes.data.attempt.max_score } else { $resultRes.data.max_score }
    "Attempt ID: $attemptId, Status: $st, Score: $sc/$ms"
}

# 7. Audit & Security Logs, Reports Analysis
Test-Step "16. Audit Logs Inspection" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $logsRes = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs?limit=5" -Method Get -Headers $headers
    "Audit log entries: $($logsRes.data.total) total"
}

Test-Step "17. Security Logs Inspection" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $secRes = Invoke-RestMethod -Uri "$baseUrl/admin/security-logs?limit=5" -Method Get -Headers $headers
    "Security log entries: $($secRes.data.total) total"
}

Test-Step "18. Reports Overview & CSV Export" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $repRes = Invoke-RestMethod -Uri "$baseUrl/admin/reports" -Method Get -Headers $headers
    $csvExport = Invoke-RestMethod -Uri "$baseUrl/admin/reports/export" -Method Get -Headers $headers
    if (-not $csvExport -or -not $csvExport.Contains("Attempt ID")) { throw "Export CSV invalid" }
    "Reports Overview retrieved, CSV Export: $($csvExport.Length) bytes, Header: $($csvExport.Split("`n")[0])"
}

# 8. Clean up test batch (optional safe delete)
Test-Step "19. Cleanup E2E Test Batch" {
    if ($createdBatchId) {
        $headers = @{ Authorization = "Bearer $adminToken" }
        $null = Invoke-RestMethod -Uri "$baseUrl/batches/$createdBatchId" -Method Delete -Headers $headers
        "Deleted temporary batch $createdBatchId"
    } else {
        "No temporary batch to clean up"
    }
}

Write-Host "`n==============================================="
Write-Host "       E2E VERIFICATION TEST SUMMARY          "
Write-Host "==============================================="
$passedCount = ($results | Where-Object { $_.Status -eq "PASSED" }).Count
$failedCount = ($results | Where-Object { $_.Status -eq "FAILED" }).Count
Write-Host "Total Tests: $($results.Count) | Passed: $passedCount | Failed: $failedCount"
$results | Format-Table -AutoSize
