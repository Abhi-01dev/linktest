$baseUrl = "http://localhost:8081/api"
$results = @()

function Test-Step($id, $name, $script) {
    try {
        $res = & $script
        $status = $res.StatusCode
        $passed = $res.Passed
        $details = $res.Details
        $resText = if ($passed) { "PASS" } else { "FAIL" }
        $script:results += [PSCustomObject]@{
            Step = $id
            Endpoint = $name
            Status = $status
            Result = $resText
            Details = $details
        }
        Write-Host "[$id] $name -> Status: $status ($resText) - $details"
    } catch {
        $errStatus = 500
        if ($_.Exception.Response) {
            $errStatus = [int]$_.Exception.Response.StatusCode
        }
        $script:results += [PSCustomObject]@{
            Step = $id
            Endpoint = $name
            Status = $errStatus
            Result = "FAIL"
            Details = $_.Exception.Message
        }
        Write-Host "[$id] $name -> Status: $errStatus (FAIL) - $($_.Exception.Message)"
    }
}

Write-Host "=========================================="
Write-Host " RUNNING 20-STEP API SMOKE TEST SUITE    "
Write-Host "=========================================="

# 1. Health
Test-Step 1 "GET /health" {
    $r = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Platform healthy ($($r.data.status))" }
}

$adminToken = ""
# 2. Login
Test-Step 2 "POST /auth/login" {
    $body = @{ email = "admin@linktest.io"; password = "Admin123!" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:adminToken = $r.data.token
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $script:adminToken); Details = "Token acquired for admin" }
}

# 3. Current user
Test-Step 3 "GET /auth/me" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $r.data.user.role -eq "ADMIN"); Details = "User: $($r.data.user.email) ($($r.data.user.role))" }
}

# 4. Admin dashboard
Test-Step 4 "GET /admin/dashboard" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Dashboard stats retrieved ($($r.data.stats.user_count) users)" }
}

# 5. Course list
Test-Step 5 "GET /courses" {
    $r = Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Courses retrieved: $($r.data.courses.Count)" }
}

$testCourseId = ""
# 6. Course creation
Test-Step 6 "POST /courses" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $body = @{
        title = "Smoke Test Course $(Get-Random)"
        description = "Automated smoke test validation course"
        category = "Computer Science"
        level = "Intermediate"
        published = $true
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/courses" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:testCourseId = $r.data.course.id
    return @{ StatusCode = 201; Passed = ($r.success -eq $true -and $script:testCourseId); Details = "Course ID: $script:testCourseId" }
}

# 7. Batch list
Test-Step 7 "GET /batches" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/batches" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Batches count: $($r.data.batches.Count)" }
}

$testBatchId = ""
# 8. Batch creation
Test-Step 8 "POST /batches" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $body = @{
        name = "Smoke Test Batch $(Get-Random)"
        code = "SMK-$([Guid]::NewGuid().ToString().Substring(0, 6).ToUpper())"
        course_id = $testCourseId
        capacity = 30
        status = "Active"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/batches" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:testBatchId = $r.data.batch.id
    return @{ StatusCode = 201; Passed = ($r.success -eq $true -and $script:testBatchId); Details = "Batch ID: $script:testBatchId" }
}

# 9. Question list
Test-Step 9 "GET /questions/bank" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/questions/bank" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Questions count: $($r.data.questions.Count)" }
}

# 10. CSV import template / preview
Test-Step 10 "POST /questions/csv/preview" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $csvSample = "question,optionA,optionB,optionC,optionD,correctAnswer,subject,topic,difficulty,explanation,marks`n`"What is HTTP 200?`",`"OK`",`"Not Found`",`"Error`",`"Redirect`",A,`"Computer Science`",`"Networking`",EASY,`"Standard success status`",1"
    $body = @{ csvContent = $csvSample } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/questions/csv/preview" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $r.data.validCount -ge 1); Details = "Valid questions previewed: $($r.data.validCount)" }
}

$testExamId = ""
# 11. Mock-test creation
Test-Step 11 "POST /mock-tests" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $body = @{
        title = "Smoke Examination $ts"
        subject = "Computer Science"
        difficulty = "medium"
        duration_minutes = 30
        total_marks = 100
        pass_percentage = 40
        status = "published"
        questions = @(
            @{
                question_text = "What is the primary key in a relational database?"
                question_type = "mcq_single"
                marks = 100
                negative_marks = 0
                options = @(
                    @{ key = "A"; text = "Unique row identifier" },
                    @{ key = "B"; text = "Foreign table link" },
                    @{ key = "C"; text = "Volatile cache" },
                    @{ key = "D"; text = "Column comment" }
                )
                correct_answers = @("A")
                explanation = "A primary key uniquely identifies each record in a database table."
            }
        )
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:testExamId = $r.data.test.id
    return @{ StatusCode = 201; Passed = ($r.success -eq $true -and $script:testExamId); Details = "Exam ID: $script:testExamId" }
}

$studentLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = "student@linktest.io"; password = "Student123!" } | ConvertTo-Json) -ContentType "application/json"
$studentToken = $studentLogin.data.token

$attemptId = ""
$questionId = ""
# 12. Start attempt
Test-Step 12 "POST /mock-tests/:id/attempts" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testExamId/attempts" -Method Post -Headers $headers
    $script:attemptId = $r.data.attempt_id
    $script:questionId = $r.data.questions[0].id
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $script:attemptId); Details = "Attempt ID: $script:attemptId" }
}

# 13. Get attempt
Test-Step 13 "GET /mock-tests/attempts/:attemptId" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $r.data.questions.Count -ge 1); Details = "Questions in runner: $($r.data.questions.Count)" }
}

# 14. Save answer
Test-Step 14 "PUT /mock-tests/attempts/:attemptId/answers" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $body = @{
        question_id = $questionId
        response_data = @{ selected_key = "A" }
        is_visited = $true
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/answers" -Method Put -Headers $headers -Body $body -ContentType "application/json"
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Answer saved successfully" }
}

# 15. Submit attempt
Test-Step 15 "POST /mock-tests/attempts/:attemptId/submit" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $body = @{ auto_submitted = $false } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/submit" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and ($r.data.status -eq "submitted" -or $r.data.status -eq "evaluated")); Details = "Status: $($r.data.status)" }
}

# 16. Get result
Test-Step 16 "GET /mock-tests/attempts/:attemptId/result" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/mock-tests/attempts/$attemptId/result" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Result finalized, Score: $($r.data.attempt.total_score)" }
}

# 17. Reports
Test-Step 17 "GET /admin/reports/overview" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/admin/reports/overview" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Academic reports calculated" }
}

# 18. Audit logs
Test-Step 18 "GET /admin/audit-logs" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $r.data.total -gt 0); Details = "Total audit logs: $($r.data.total)" }
}

# 19. Security logs
Test-Step 19 "GET /admin/security-logs" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/admin/security-logs" -Method Get -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true -and $r.data.total -gt 0); Details = "Total security logs: $($r.data.total)" }
}

# 20. Logout
Test-Step 20 "POST /auth/logout" {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $r = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $headers
    return @{ StatusCode = 200; Passed = ($r.success -eq $true); Details = "Session terminated and audited" }
}

# Clean up
if ($testExamId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/mock-tests/$testExamId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" } | Out-Null
    } catch {}
}
if ($testBatchId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/batches/$testBatchId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" } | Out-Null
    } catch {}
}
if ($testCourseId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/courses/$testCourseId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" } | Out-Null
    } catch {}
}

Write-Host ""
Write-Host "=========================================="
Write-Host "         SMOKE TEST RESULTS SUMMARY       "
Write-Host "=========================================="
$results | Format-Table -AutoSize
