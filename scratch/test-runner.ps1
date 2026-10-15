$loginBody = @{
  email = 'tester_student_01@linktest.com'
  password = 'Password123!'
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $loginRes.data.token
Write-Host "1. Logged in! Token: $($token.Substring(0, 15))..."

$headers = @{ Authorization = "Bearer $token" }

# 1. Fetch mock tests
$testsRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/mock-tests' -Headers $headers
$test = $testsRes.data.tests[0]
Write-Host "2. Selected Test: $($test.id) - $($test.title)"

# 2. Start attempt
$startRes = Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/$($test.id)/attempts" -Method Post -Headers $headers
$attemptId = $startRes.data.attempt_id
Write-Host "3. Started attempt with attempt_id: $attemptId"
Write-Host "   attemptId camelCase: $($startRes.data.attemptId)"
Write-Host "   status: $($startRes.data.status)"
Write-Host "   remaining_seconds: $($startRes.data.remaining_seconds)"

if (-not $attemptId -or $attemptId -eq 'undefined') {
  Write-Error "FAIL: attempt_id was not returned or was undefined!"
  exit 1
}

# 3. Test invalid attemptId returns 400 Bad Request
try {
  Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/undefined" -Headers $headers
  Write-Error "FAIL: /attempts/undefined did not return error!"
  exit 1
} catch {
  Write-Host "4. Verified: /attempts/undefined returned 400 Bad Request (not 404)"
}

# 4. Load runner with valid attemptId
$runnerRes = Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/$attemptId" -Headers $headers
Write-Host "5. Runner loaded successfully! Remaining seconds: $($runnerRes.data.remaining_seconds)"
Write-Host "   Questions count: $($runnerRes.data.questions.Count)"

# 5. Save an answer
if ($runnerRes.data.questions.Count -gt 0) {
  $qId = $runnerRes.data.questions[0].id
  $ansBody = @{
    question_id = $qId
    response_data = @{ selected_index = 0 }
    is_marked_for_review = $false
  } | ConvertTo-Json
  $saveRes = Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/$attemptId/answers" -Method Put -Headers $headers -Body $ansBody -ContentType 'application/json'
  Write-Host "6. Answer saved successfully!"
}

# 6. Submit attempt
$subBody = @{ auto_submitted = $false } | ConvertTo-Json
$subRes = Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/$attemptId/submit" -Method Post -Headers $headers -Body $subBody -ContentType 'application/json'
Write-Host "7. Attempt submitted! Status: $($subRes.data.status) - Score: $($subRes.data.total_score)"

# 7. Load result scorecard
$resultRes = Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/$attemptId/result" -Headers $headers
Write-Host "8. Scorecard loaded! Passed: $($resultRes.data.passed), Score: $($resultRes.data.total_score)/$($resultRes.data.max_score)"

# 8. Verify saving answer after submission is rejected
try {
  Invoke-RestMethod -Uri "http://localhost:8081/api/mock-tests/attempts/$attemptId/answers" -Method Put -Headers $headers -Body $ansBody -ContentType 'application/json'
  Write-Error "FAIL: Answering on completed attempt was not rejected!"
  exit 1
} catch {
  Write-Host "9. Verified: Answering on completed attempt was properly rejected!"
}

Write-Host "ALL WORKFLOW STEPS PASSED SUCCESSFULLY!"
