// Seed Mock Tests & Questions for LinkTest Secure Examination System
// Includes multi-category tests, proctoring settings, and 10 diverse question types

export const SEED_MOCK_TESTS = [
  {
    id: 'mock-test-fsd-101',
    title: 'Full-Stack Web Development All-India Mock Exam 2026',
    description: 'Comprehensive mock examination covering React 18, Node.js internals, PostgreSQL transactions, Web Security (CORS, JWT, XSS, CSRF), and System Architecture.',
    instructions: '1. This examination is strictly proctored with automated face presence and window focus monitoring.\n2. Ensure your webcam remains on and your face is centered in the video frame.\n3. Leaving full-screen mode or switching browser tabs will be recorded as proctoring warning events.\n4. Negative marking is applied: -1.0 mark for each incorrect MCQ answer. Unanswered questions do not incur a penalty.\n5. Numerical questions do not have negative marks.\n6. The examination will automatically submit when the timer expires.',
    subject: 'Computer Science & Engineering',
    topic: 'Full-Stack Architecture & Security',
    difficulty: 'medium',
    category: 'mock_exam',
    tags: ['Full-Stack', 'React', 'Node.js', 'PostgreSQL', 'Security', 'WebRTC'],
    created_by: 'user-teacher-001', // Pre-seeded teacher: teacher@linktest.io
    class_id: 'class-cs-a',
    batch_id: 'batch-cs-a1',
    course_id: null,
    scheduled_start: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
    scheduled_end: new Date(Date.now() + 86400000 * 30).toISOString(), // Open for 30 days
    duration_minutes: 45,
    total_marks: 40.00,
    pass_percentage: 50.00,
    max_attempts: 3,
    randomize_questions: true,
    randomize_options: true,
    negative_marking: true,
    negative_mark_penalty: 1.00,
    proctoring_config: {
      webcam_required: true,
      face_detection: true,
      multi_face_warning: true,
      face_absence_warning: true,
      fullscreen_required: true,
      tab_switch_warning: true,
      audio_check_required: false,
      max_warnings: 5
    },
    status: 'published',
    results_published: true,
    allow_instant_result: true,
    show_explanations: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'mock-test-dsa-202',
    title: 'Data Structures & Algorithms Diagnostic Assessment',
    description: 'Standard practice test evaluating Trees, Graphs, Dynamic Programming, Heap queues, and Amortized Complexity analysis.',
    instructions: '1. Standard practice assessment with optional proctoring.\n2. You may flag questions for review and navigate freely.\n3. Partial credit is enabled on multiple-select questions.\n4. Take this assessment to identify learning gaps before mid-term evaluations.',
    subject: 'Data Structures & Algorithms',
    topic: 'Trees, Graphs & Dynamic Programming',
    difficulty: 'hard',
    category: 'practice',
    tags: ['DSA', 'Algorithms', 'Trees', 'Graphs', 'DP'],
    created_by: 'user-teacher-001',
    class_id: 'class-cs-a',
    batch_id: null,
    course_id: null,
    scheduled_start: new Date(Date.now() - 7200000).toISOString(),
    scheduled_end: new Date(Date.now() + 86400000 * 60).toISOString(),
    duration_minutes: 30,
    total_marks: 30.00,
    pass_percentage: 45.00,
    max_attempts: 5,
    randomize_questions: false,
    randomize_options: true,
    negative_marking: true,
    negative_mark_penalty: 0.50,
    proctoring_config: {
      webcam_required: false,
      face_detection: false,
      multi_face_warning: false,
      face_absence_warning: false,
      fullscreen_required: false,
      tab_switch_warning: true,
      audio_check_required: false,
      max_warnings: 10
    },
    status: 'published',
    results_published: true,
    allow_instant_result: true,
    show_explanations: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'mock-test-interview-303',
    title: 'AI & Cloud Systems Technical Interview Screening',
    description: 'Timed aptitude and technical screening exam simulating FAANG/Top Product Company engineering interview rounds.',
    instructions: '1. High-stakes screening examination.\n2. Strict proctoring active: Webcam and Fullscreen required.\n3. Tab switches and loss of face visibility beyond 5 occurrences will mark your attempt for faculty review.\n4. Be concise and precise in short-answer and case-study questions.',
    subject: 'Software Engineering & Cloud Architecture',
    topic: 'System Design & Distributed Systems',
    difficulty: 'advanced',
    category: 'interview_prep',
    tags: ['Interview', 'System Design', 'Microservices', 'Distributed Systems'],
    created_by: 'user-teacher-001',
    class_id: null,
    batch_id: null,
    course_id: null,
    scheduled_start: new Date(Date.now() - 86400000).toISOString(),
    scheduled_end: new Date(Date.now() + 86400000 * 45).toISOString(),
    duration_minutes: 60,
    total_marks: 50.00,
    pass_percentage: 60.00,
    max_attempts: 2,
    randomize_questions: true,
    randomize_options: true,
    negative_marking: true,
    negative_mark_penalty: 1.00,
    proctoring_config: {
      webcam_required: true,
      face_detection: true,
      multi_face_warning: true,
      face_absence_warning: true,
      fullscreen_required: true,
      tab_switch_warning: true,
      audio_check_required: false,
      max_warnings: 4
    },
    status: 'published',
    results_published: false,
    allow_instant_result: false,
    show_explanations: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export const SEED_MOCK_TEST_QUESTIONS = [
  // --- Questions for Test 1 (Full-Stack Web Dev Mock Exam) ---
  {
    id: 'q-fsd-01',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'Which PostgreSQL isolation level prevents both Non-Repeatable Reads and Phantom Reads?',
    question_type: 'mcq_single',
    options: [
      'Read Committed',
      'Read Uncommitted',
      'Repeatable Read',
      'Serializable'
    ],
    answer_key: { correct_index: 3 },
    marks: 4.00,
    negative_marks: 1.00,
    explanation: 'Serializable is the highest transaction isolation level in PostgreSQL. It guarantees strict serializability by detecting read/write dependencies and aborting conflicting concurrent transactions, eliminating Dirty Reads, Non-Repeatable Reads, and Phantom Reads.',
    topic: 'PostgreSQL Transactions',
    difficulty: 'medium',
    order_index: 1,
    case_passage: null,
    image_url: null,
    metadata: {}
  },
  {
    id: 'q-fsd-02',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'Which of the following HTTP security headers mitigate Cross-Site Scripting (XSS) and Clickjacking attacks? (Select ALL that apply)',
    question_type: 'mcq_multiple',
    options: [
      'Content-Security-Policy (CSP)',
      'X-Frame-Options: DENY',
      'Access-Control-Allow-Origin: *',
      'X-Content-Type-Options: nosniff'
    ],
    answer_key: { correct_indices: [0, 1, 3] }, // Options 0, 1, 3 are correct
    marks: 5.00,
    negative_marks: 1.00,
    explanation: 'Content-Security-Policy restricts scripts and resources (mitigating XSS). X-Frame-Options: DENY prevents the page from being embedded in iframes (mitigating Clickjacking). X-Content-Type-Options: nosniff blocks MIME-type sniffing. Access-Control-Allow-Origin: * is a CORS header and does not prevent XSS or clickjacking.',
    topic: 'Web Application Security',
    difficulty: 'medium',
    order_index: 2,
    case_passage: null,
    image_url: null,
    metadata: { allow_partial_credit: true }
  },
  {
    id: 'q-fsd-03',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'In Node.js event loop architecture, I/O polling and callback execution occur in the Poll phase before Check (setImmediate) phase.',
    question_type: 'true_false',
    options: ['True', 'False'],
    answer_key: { correct_value: true },
    marks: 3.00,
    negative_marks: 1.00,
    explanation: 'True. In the libuv event loop, incoming I/O events are polled and callbacks are processed during the Poll phase. Once the poll phase becomes idle or reaches its threshold, the loop moves to the Check phase where setImmediate() callbacks run.',
    topic: 'Node.js Architecture',
    difficulty: 'easy',
    order_index: 3,
    case_passage: null,
    image_url: null,
    metadata: {}
  },
  {
    id: 'q-fsd-04',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'In React 18, the hook used to defer rendering a non-urgent part of the UI until more urgent updates have completed is use___________.',
    question_type: 'fill_blank',
    options: [],
    answer_key: { accepted_answers: ['DeferredValue', 'useDeferredValue', 'deferredValue'] },
    marks: 4.00,
    negative_marks: 0.00,
    explanation: 'useDeferredValue accepts a value and returns a new copy of the value that will defer to urgent updates (e.g., input typing) before re-rendering the deferred subtree.',
    topic: 'React 18 Concurrent Features',
    difficulty: 'medium',
    order_index: 4,
    case_passage: null,
    image_url: null,
    metadata: {}
  },
  {
    id: 'q-fsd-05',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'A developer configures an Express rate limiter allowing 100 requests per 15 minutes. What is the HTTP status code defined in RFC 6585 that the server must return when a client breaches this threshold?',
    question_type: 'numerical',
    options: [],
    answer_key: { target_value: 429, tolerance: 0 },
    marks: 4.00,
    negative_marks: 0.00,
    explanation: 'HTTP 429 Too Many Requests indicates the client has sent too many requests in a given amount of time ("rate limiting").',
    topic: 'REST API & Security',
    difficulty: 'easy',
    order_index: 5,
    case_passage: null,
    image_url: null,
    metadata: {}
  },
  {
    id: 'q-fsd-06',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'Match each Web Architecture concept with its primary mechanism or protocol:',
    question_type: 'matching',
    options: [
      { id: 'left_1', text: 'Real-time peer-to-peer media' },
      { id: 'left_2', text: 'Stateless user authentication' },
      { id: 'left_3', text: 'Full-duplex bidirectional socket' },
      { id: 'left_4', text: 'Cross-origin resource sharing' }
    ],
    answer_key: {
      pairs: {
        'left_1': 'WebRTC',
        'left_2': 'JSON Web Token (JWT)',
        'left_3': 'WebSocket (WSS)',
        'left_4': 'CORS Preflight (OPTIONS)'
      },
      available_targets: [
        'WebRTC',
        'JSON Web Token (JWT)',
        'WebSocket (WSS)',
        'CORS Preflight (OPTIONS)',
        'GraphQL Subscription',
        'Server-Sent Events (SSE)'
      ]
    },
    marks: 6.00,
    negative_marks: 1.00,
    explanation: 'WebRTC provides P2P audio/video streaming; JWT provides cryptographically signed stateless tokens; WebSocket enables full-duplex TCP communication; CORS preflight uses HTTP OPTIONS to verify allowed headers and origins.',
    topic: 'Web Protocols & Architecture',
    difficulty: 'medium',
    order_index: 6,
    case_passage: null,
    image_url: null,
    metadata: {}
  },
  {
    id: 'q-fsd-07',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'Analyze the authentication code snippet and explain why storing JWT in document.cookie with httpOnly and sameSite=strict is safer than storing in window.localStorage against Cross-Site Scripting (XSS).',
    question_type: 'subjective',
    options: [],
    answer_key: {
      rubric: 'Must explain that JavaScript cannot read httpOnly cookies via document.cookie even if an attacker executes arbitrary scripts via XSS, whereas window.localStorage is accessible directly by any client-side JavaScript.',
      keywords: ['httpOnly', 'localStorage', 'XSS', 'JavaScript', 'cookie']
    },
    marks: 6.00,
    negative_marks: 0.00,
    explanation: 'httpOnly flag prevents client-side scripts from reading the cookie value via document.cookie, making token theft via XSS impossible through direct DOM scraping. LocalStorage has zero script boundaries and can be read by any injected payload.',
    topic: 'Application Security',
    difficulty: 'hard',
    order_index: 7,
    case_passage: null,
    image_url: null,
    metadata: { manual_grading: true }
  },
  {
    id: 'q-fsd-08',
    test_id: 'mock-test-fsd-101',
    section_id: null,
    question_text: 'Based on the production incident report above, identify the root cause of the connection pool exhaustion and the primary architectural remedy.',
    question_type: 'case_study',
    case_passage: 'Incident Log: At 14:00 UTC, the LinkTest database reported: "FATAL: remaining connection slots are reserved for non-replication superuser connections". Metrics showed that every incoming HTTP request spawned a new new Pool() instance inside the route handler instead of reusing a shared singleton pool. Within 90 seconds of traffic spike (500 req/s), 100 max Postgres connections were exhausted.',
    options: [
      'PostgreSQL max_connections was too high; reduce it to 10.',
      'Route handlers created ephemeral pools per request; use a shared module-level Pool singleton with release() in finally block.',
      'The database query lacked an index on primary keys.',
      'Node.js garbage collector was disabled in production.'
    ],
    answer_key: { correct_index: 1 },
    marks: 8.00,
    negative_marks: 2.00,
    explanation: 'Instantiating new Pool() inside request handlers leaks connection slots rapidly. The standard pattern is a shared module singleton pool where clients are acquired and released back to the pool in a try/finally block.',
    topic: 'Database Reliability & Architecture',
    difficulty: 'hard',
    order_index: 8,
    image_url: null,
    metadata: {}
  }
];

export const SEED_MOCK_TEST_ATTEMPTS = [
  {
    id: 'attempt-demo-student-01',
    test_id: 'mock-test-fsd-101',
    student_id: 'user-student-001', // Pre-seeded student: student@linktest.io
    started_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() - 900000).toISOString(),
    submitted_at: new Date(Date.now() - 1000000).toISOString(),
    status: 'evaluated',
    total_score: 32.00,
    max_score: 40.00,
    percentage: 80.00,
    passed: true,
    correct_count: 6,
    incorrect_count: 1,
    unanswered_count: 1,
    time_spent_seconds: 2600,
    warning_count: 1,
    test_snapshot: {
      title: 'Full-Stack Web Development All-India Mock Exam 2026',
      total_marks: 40.00,
      duration_minutes: 45
    },
    proctoring_summary: {
      face_absence_events: 0,
      multiple_face_events: 0,
      tab_switch_events: 1,
      fullscreen_exit_events: 0,
      camera_disconnect_events: 0,
      total_events: 1,
      flagged: false
    },
    evaluator_remarks: 'Excellent performance across database and web security concepts.',
    evaluated_by: 'user-teacher-001',
    evaluated_at: new Date(Date.now() - 900000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString()
  }
];

export const SEED_MOCK_TEST_RESPONSES = [
  {
    id: 'resp-demo-01',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-01',
    response_data: { selected_index: 3 },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 4.00,
    is_correct: true,
    evaluation_comment: 'Correct: Serializable level chosen.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-02',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-02',
    response_data: { selected_indices: [0, 1, 3] },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 5.00,
    is_correct: true,
    evaluation_comment: 'All correct security headers selected.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-03',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-03',
    response_data: { selected_value: true },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 3.00,
    is_correct: true,
    evaluation_comment: 'Correct.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-04',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-04',
    response_data: { text: 'useDeferredValue' },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 4.00,
    is_correct: true,
    evaluation_comment: 'Exact match with React hook.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-05',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-05',
    response_data: { number: 429 },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 4.00,
    is_correct: true,
    evaluation_comment: 'Correct HTTP status code.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-06',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-06',
    response_data: {
      pairs: {
        'left_1': 'WebRTC',
        'left_2': 'JSON Web Token (JWT)',
        'left_3': 'WebSocket (WSS)',
        'left_4': 'CORS Preflight (OPTIONS)'
      }
    },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 6.00,
    is_correct: true,
    evaluation_comment: 'All 4 pairs accurately matched.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'resp-demo-07',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-07',
    response_data: { text: 'httpOnly cookies cannot be read by JavaScript via document.cookie, which completely shields them against token exfiltration during XSS. In contrast, localStorage can be read by any injected script.' },
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: 6.00,
    is_correct: true,
    evaluation_comment: 'Accurate analysis of httpOnly flag security boundary vs localStorage vulnerability.',
    evaluated_by: 'user-teacher-001',
    evaluated_at: new Date(Date.now() - 950000).toISOString()
  },
  {
    id: 'resp-demo-08',
    attempt_id: 'attempt-demo-student-01',
    question_id: 'q-fsd-08',
    response_data: { selected_index: 0 }, // Chosen wrong option 0 instead of 1
    is_marked_for_review: false,
    is_visited: true,
    score_awarded: -2.00,
    is_correct: false,
    evaluation_comment: 'Incorrect: Reducing max_connections does not solve client pool leaks.',
    evaluated_by: null,
    evaluated_at: new Date(Date.now() - 1000000).toISOString()
  }
];

export const SEED_MOCK_TEST_PROCTORING_EVENTS = [
  {
    id: 'event-demo-01',
    attempt_id: 'attempt-demo-student-01',
    event_type: 'TAB_HIDDEN',
    severity: 'warning',
    client_timestamp: new Date(Date.now() - 2400000).toISOString(),
    server_timestamp: new Date(Date.now() - 2400000).toISOString(),
    duration_seconds: 3,
    confidence: 1.00,
    metadata: { reason: 'User switched browser tab for 3 seconds.' },
    review_status: 'dismissed',
    review_notes: 'Brief 3-second focus change, verified accidental.',
    reviewed_by: 'user-teacher-001',
    reviewed_at: new Date(Date.now() - 900000).toISOString()
  }
];
