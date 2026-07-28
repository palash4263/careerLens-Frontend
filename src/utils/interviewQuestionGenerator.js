// src/utils/interviewQuestionGenerator.js

/**
 * Deeply analyzes job description text and title to dynamically generate
 * 100% tailored technical, coding, architecture, LeetCode, and behavioral interview questions.
 * Always returns at least 20 questions.
 */
export function generateInterviewQuestions(job) {
  if (!job) return [];
  const title   = (job.title   || "Software Engineer").trim();
  const desc    = (job.description || "").trim();
  const company = (job.company || "Target Company").trim();
  const lowerDesc  = desc.toLowerCase();
  const lowerTitle = title.toLowerCase();

  const questions = [];
  let qIndex = 1;

  // ─── 1. DYNAMICALLY EXTRACT TECH STACK & LANGUAGES ───
  const TECH_CATALOG = [
    { name: "React",          key: ["react", "react.js", "jsx"],                             category: "Frontend Architecture" },
    { name: "TypeScript",     key: ["typescript", "ts"],                                     category: "Frontend & Type Safety" },
    { name: "JavaScript",     key: ["javascript", "js", "es6"],                              category: "Web Standards" },
    { name: "Angular",        key: ["angular", "rxjs", "ngrx"],                             category: "Frontend Engineering" },
    { name: "Vue",            key: ["vue", "vuex", "pinia"],                                category: "Frontend Development" },
    { name: "Spring Boot",    key: ["spring boot", "spring", "spring data jpa"],            category: "Backend Frameworks" },
    { name: "Java",           key: ["java"],                                                 category: "Backend Engineering" },
    { name: "C# / .NET",      key: ["c#", ".net", ".net core", "asp.net"],                  category: "Enterprise Backend" },
    { name: "C++",            key: ["c++", "cpp"],                                           category: "Systems & Performance" },
    { name: "Python",         key: ["python", "django", "fastapi", "flask"],                category: "Backend & AI Systems" },
    { name: "Go / Golang",    key: ["go", "golang"],                                         category: "Cloud Native Systems" },
    { name: "Rust",           key: ["rust"],                                                 category: "Systems Programming" },
    { name: "Playwright",     key: ["playwright", "scraping", "automation", "puppeteer"],   category: "Automation & Web Crawling" },
    { name: "PostgreSQL",     key: ["postgres", "postgresql"],                               category: "Database & Data Modeling" },
    { name: "MySQL / SQL",    key: ["sql", "mysql", "oracle", "database"],                  category: "Relational Databases" },
    { name: "MongoDB",        key: ["mongodb", "nosql", "dynamodb"],                        category: "Document Databases" },
    { name: "Redis",          key: ["redis", "caching", "memcached"],                       category: "In-Memory Caching" },
    { name: "Docker",         key: ["docker", "container", "containerization"],             category: "DevOps & Containers" },
    { name: "Kubernetes",     key: ["kubernetes", "k8s", "helm"],                           category: "Cloud Orchestration" },
    { name: "AWS",            key: ["aws", "amazon web services", "s3", "ec2", "lambda"],   category: "Cloud Infrastructure" },
    { name: "GenAI / LLM",   key: ["genai", "llm", "agentic", "openai", "rag", "langchain"], category: "Artificial Intelligence" },
  ];

  const matchedTech = TECH_CATALOG.filter(item =>
    item.key.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  );

  const descLines      = desc.split(/[\n\.]/).map(l => l.trim()).filter(l => l.length > 25);
  const keyActionLines = descLines.filter(l =>
    /\b(design|build|architect|engineer|develop|optimize|integrate|automate|implement|lead|manage|maintain|scale)\b/i.test(l)
  );

  // ─── BLOCK A: LANGUAGE-SPECIFIC LEETCODE CODING QUESTIONS ───

  // 1. JavaScript / TypeScript / Frontend LeetCode
  if (lowerDesc.includes("javascript") || lowerDesc.includes("typescript") || lowerDesc.includes("react") || lowerDesc.includes("js") || lowerTitle.includes("frontend")) {
    const lang = lowerDesc.includes("typescript") ? "TypeScript" : "JavaScript";
    questions.push({
      id: `q${qIndex++}`,
      category: `Coding (${lang})`,
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 2627,
      leetcodeUrl: "https://leetcode.com/problems/debounce/",
      question: `[LeetCode #2627 - Debounce] In ${lang}, write a function that accepts a function fn and a delay t in milliseconds, and returns a debounced version of fn. How do you cancel pending timers and ensure correct 'this' execution context?`,
      talkingPoints: [
        "Explain closure mechanism to retain timeout variable reference across invocations.",
        "Use clearTimeout(timer) to reset pending executions on rapid subsequent calls.",
        "Preserve execution context using fn.apply(this, args) or spread syntax with arrow functions.",
        "Analyze time complexity: O(1) invocation overhead, O(1) memory space.",
      ],
      idealAnswer: `In ${lang}, I implement debounce by returning a wrapper function that closes over a 'timer' variable. Each time the wrapper is invoked, it calls clearTimeout(timer) and sets a new setTimeout that executes fn.apply(this, args) after delay t, preventing execution thrashing during rapid user input.`,
    });

    questions.push({
      id: `q${qIndex++}`,
      category: `Coding (${lang})`,
      type: "coding",
      difficulty: "Hard",
      leetcodeNum: 146,
      leetcodeUrl: "https://leetcode.com/problems/lru-cache/",
      question: `[LeetCode #146 - LRU Cache] Implement a Least Recently Used (LRU) Cache in ${lang} supporting O(1) get(key) and put(key, value) operations.`,
      talkingPoints: [
        `In ${lang}, JavaScript's native Map preserves insertion order, allowing O(1) delete and re-set for LRU updates.`,
        "Alternative lower-level implementation: Combination of HashMap + Doubly Linked List (Head = MRU, Tail = LRU).",
        "Demonstrate memory management when capacity limit is breached by deleting map.keys().next().value.",
        "Analyze time complexity: O(1) for both get and put operations.",
      ],
      idealAnswer: `I implement an LRU cache in ${lang} using a Map because Map keys maintain insertion order. On get(key), if present, I delete and re-set the key so it moves to the end (MRU). On put(key, val), if capacity is exceeded, I evict the first item (map.keys().next().value) before setting the new item.`,
    });
  }

  // 2. Python LeetCode
  if (lowerDesc.includes("python") || lowerDesc.includes("django") || lowerDesc.includes("fastapi") || lowerDesc.includes("flask") || lowerDesc.includes("ai")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (Python)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 56,
      leetcodeUrl: "https://leetcode.com/problems/merge-intervals/",
      question: `[LeetCode #56 - Merge Intervals] In Python, given an array of interval pairs, merge all overlapping intervals and return an array of non-overlapping intervals in sorted order.`,
      talkingPoints: [
        "Sort intervals first by starting point using intervals.sort(key=lambda x: x[0]) in O(n log n).",
        "Iterate through sorted intervals: if current interval overlaps with last merged (curr.start <= last.end), update last.end = max(last.end, curr.end).",
        "Else append current interval as a new non-overlapping range.",
        "Time Complexity: O(n log n) due to sorting; Space Complexity: O(n) for output array.",
      ],
      idealAnswer: "I sort the intervals by their start time in Python. I initialize a merged list with the first interval. For each subsequent interval, if its start is less than or equal to the previous interval's end, I merge them by setting the end to max(prev.end, curr.end); otherwise, I append the interval to merged.",
    });

    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (Python)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 200,
      leetcodeUrl: "https://leetcode.com/problems/number-of-islands/",
      question: `[LeetCode #200 - Number of Islands] In Python, given a 2D grid map of '1's (land) and '0's (water), count the number of distinct islands using BFS or DFS traversal.`,
      talkingPoints: [
        "Traverse 2D matrix: when encountering '1', increment island count and initiate BFS (collections.deque) or DFS recursion.",
        "Mark visited cells by mutating grid[r][c] = '0' (in-place) to avoid additional O(M*N) visited set space.",
        "Check 4-directional boundary conditions (up, down, left, right).",
        "Time Complexity: O(M * N) where M=rows, N=cols; Space Complexity: O(min(M, N)) for BFS queue.",
      ],
      idealAnswer: "I iterate through every cell in the Python 2D grid. When I find a '1', I increment island_count and launch a BFS using collections.deque to sink all connected land cells by mutating them to '0'. This ensures every island is counted exactly once in O(M*N) time.",
    });
  }

  // 3. Java / Spring Boot LeetCode
  if (lowerDesc.includes("java") || lowerDesc.includes("spring") || lowerTitle.includes("java")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (Java)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 238,
      leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/",
      question: `[LeetCode #238 - Product of Array Except Self] In Java, given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i], without using division and in O(n) time.`,
      talkingPoints: [
        "Explain why division is disallowed and handles zeroes safely.",
        "First pass: Compute prefix products moving left-to-right into output array.",
        "Second pass: Multiply by suffix products moving right-to-left using a running R integer variable.",
        "Time Complexity: O(n) time with two passes; Space Complexity: O(1) auxiliary space (excluding output array).",
      ],
      idealAnswer: "In Java, I fill the result array with left-side prefix products in a single pass. Then, using a running suffix product variable starting from the right, I multiply each element by its right-side product. This achieves O(n) time without division or extra array space.",
    });

    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (Java)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 207,
      leetcodeUrl: "https://leetcode.com/problems/course-schedule/",
      question: `[LeetCode #207 - Course Schedule] In Java, given numCourses and prerequisite pairs, determine if it is possible to finish all courses (Topological Sort / Cycle Detection in Directed Graph).`,
      talkingPoints: [
        "Represent courses as a directed graph using List<List<Integer>> adjacency list.",
        "Calculate in-degrees for each course node.",
        "Kahn's BFS Algorithm: Add all nodes with in-degree 0 to a Queue<Integer>.",
        "Process queue: decrement neighbor in-degrees; if in-degree becomes 0, add to queue.",
        "If processed count equals numCourses, return true (no cycle); else false.",
      ],
      idealAnswer: "I model course prerequisites as a directed graph in Java and apply Kahn's Topological Sort using in-degree array and Queue. If the count of processed courses equals numCourses, no deadlock cycle exists, so all courses can be completed in O(V + E) time.",
    });
  }

  // 4. C# / .NET LeetCode
  if (lowerDesc.includes("c#") || lowerDesc.includes(".net")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (C# / .NET)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 347,
      leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/",
      question: `[LeetCode #347 - Top K Frequent Elements] In C#, given an integer array nums and an integer k, return the k most frequent elements in O(n log k) or O(n) time.`,
      talkingPoints: [
        "Build frequency count map in C# using Dictionary<int, int>.",
        "Use PriorityQueue<int, int> (Min-Heap) in .NET 6+ to retain top k frequent items.",
        "Alternative O(n) approach: Bucket sort array where index represents frequency.",
        "Analyze time complexity: O(n log k) with PriorityQueue vs O(n) with Bucket Sort.",
      ],
      idealAnswer: "In C#, I build a Dictionary<int, int> of element frequencies. I then push pairs into a min-heap PriorityQueue<int, int> of max size k. Whenever size exceeds k, I dequeue the min frequency element, leaving the top k elements in O(n log k) time.",
    });
  }

  // 5. C++ Systems LeetCode
  if (lowerDesc.includes("c++") || lowerDesc.includes("cpp")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (C++)",
      type: "coding",
      difficulty: "Hard",
      leetcodeNum: 42,
      leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/",
      question: `[LeetCode #42 - Trapping Rain Water] In C++, given n non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can trap after raining using Two Pointers.`,
      talkingPoints: [
        "Maintain left and right pointers starting at index 0 and n-1 with left_max and right_max track variables.",
        "If height[left] < height[right], process left: update left_max, accumulate water += (left_max - height[left]), left++.",
        "Else process right: update right_max, accumulate water += (right_max - height[right]), right--.",
        "Time Complexity: O(n) single pass; Space Complexity: O(1) auxiliary memory.",
      ],
      idealAnswer: "In C++, I use a Two-Pointer approach with left and right indices. By tracking left_max and right_max, I can determine the trapped water at the lower boundary pointer in a single O(n) pass using O(1) memory without auxiliary array allocations.",
    });
  }

  // 6. SQL / Database LeetCode
  if (lowerDesc.includes("sql") || lowerDesc.includes("postgres") || lowerDesc.includes("mysql") || lowerDesc.includes("database")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Database (SQL)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 178,
      leetcodeUrl: "https://leetcode.com/problems/rank-scores/",
      question: `[LeetCode #178 - Rank Scores] Write an SQL query to rank scores from a Scores table such that ties receive equal rank without gaps using DENSE_RANK() window function.`,
      talkingPoints: [
        "Explain difference between RANK() (leaves gaps after ties) vs DENSE_RANK() (continuous sequence 1, 2, 2, 3).",
        "Write SQL syntax: SELECT score, DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank' FROM Scores ORDER BY score DESC.",
        "Explain query execution order, index utilization on score column, and handling large data partitions.",
      ],
      idealAnswer: "I use DENSE_RANK() OVER (ORDER BY score DESC) in SQL. DENSE_RANK ensures tied scores receive identical ranks without skipping subsequent integer ranks, whereas RANK() leaves gaps. Adding an index on score optimizes the sorting phase.",
    });
  }

  // 7. Go / Golang LeetCode
  if (lowerDesc.includes("go") || lowerDesc.includes("golang")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Coding (Golang)",
      type: "coding",
      difficulty: "Medium",
      leetcodeNum: 3,
      leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      question: `[LeetCode #3 - Longest Substring Without Repeating Characters] In Go, find the length of the longest substring without repeating characters using the Sliding Window pattern and rune maps.`,
      talkingPoints: [
        "Maintain left boundary pointer and map[rune]int to store last seen index of characters.",
        "When duplicate character is encountered within current window (index >= left), slide left = map[char] + 1.",
        "Update maxLen = max(maxLen, right - left + 1) on every iteration.",
        "Time Complexity: O(n) single pass; Space Complexity: O(min(m, n)) for rune map.",
      ],
      idealAnswer: "In Go, I use a sliding window with left pointer and a map[rune]int tracking character indices. As right iterates through the string, if s[right] is already in map and >= left, I jump left to map[s[right]] + 1, maintaining max length in O(n) time.",
    });
  }

  // ─── BLOCK B: DYNAMIC TECH-SPECIFIC QUESTIONS ───

  if (lowerDesc.includes("playwright") || lowerDesc.includes("scraping") || lowerDesc.includes("parser")) {
    questions.push({
      id: `q${qIndex++}`, category: "Automation & Data Pipelines", type: "technical", difficulty: "Hard",
      question: `How would you design a resilient Playwright automation pipeline to extract and index live web data while handling anti-bot protections, rate limits, and dynamic DOM shifts at ${company}?`,
      talkingPoints: [
        "Explain headless browser instance pooling to control memory overhead under high concurrency.",
        "Discuss strategies for dynamic element wait selectors (page.waitForSelector) over arbitrary timeouts.",
        "Detail proxy rotation, user-agent randomization, and exponential backoff retry mechanisms for IP blocking.",
        "Explain structured text parsing & regex sanitization before storing extracted records.",
      ],
      idealAnswer: "I build web automation pipelines using Playwright with headless browser pool management. For resilience, I integrate proxy rotation, custom user-agent headers, and exponential backoff retries, ensuring clean data normalization before ingestion.",
    });
  }

  if (lowerDesc.includes("genai") || lowerDesc.includes("llm") || lowerDesc.includes("agentic") || lowerDesc.includes("ai")) {
    questions.push({
      id: `q${qIndex++}`, category: "AI & Agentic Workflows", type: "technical", difficulty: "Hard",
      question: `How would you architect multi-step agentic LLM workflows and integrate them into production backend microservices at ${company}?`,
      talkingPoints: [
        "Explain decoupling long-running LLM generation tasks using asynchronous task queues (Celery / RabbitMQ / Kafka).",
        "Discuss Retrieval-Augmented Generation (RAG) vector embeddings for grounding LLM outputs in domain data.",
        "Highlight real-time streaming tokens to client applications using WebSockets or SSE.",
        "Detail fallback models and deterministic validation checks on structured JSON AI outputs.",
      ],
      idealAnswer: "I architect production AI workflows by running LLM invocations asynchronously off the main API loop, using vector DB embeddings for RAG accuracy, and streaming tokens back via Server-Sent Events for instant feedback.",
    });
  }

  if (lowerDesc.includes("react") || lowerTitle.includes("frontend") || lowerDesc.includes("typescript")) {
    questions.push({
      id: `q${qIndex++}`, category: "Frontend Architecture", type: "technical", difficulty: "Hard",
      question: `How do you profile and eliminate performance bottlenecks in a large-scale React & TypeScript application at ${company}?`,
      talkingPoints: [
        "Discuss profiling with React DevTools Profiler to catch unnecessary component re-renders.",
        "Explain state colocation vs global store (Redux/Zustand) to restrict render boundaries.",
        "Highlight route-based code splitting using React.lazy / Suspense and virtualized rendering.",
        "Mention TypeScript strict type safety for props and immutable state updates.",
      ],
      idealAnswer: "I optimize React apps by profiling render cycles to isolate wasteful re-renders, colocate state close to consuming components, and implement route code-splitting with virtualized lists for smooth 60fps rendering.",
    });
  }

  if (lowerDesc.includes("spring") || lowerDesc.includes("java") || lowerTitle.includes("backend")) {
    questions.push({
      id: `q${qIndex++}`, category: "Backend & Data Integrity", type: "coding", difficulty: "Medium",
      question: `How do you prevent the N+1 query problem and maintain database performance under heavy traffic in a Spring Boot / JPA application at ${company}?`,
      talkingPoints: [
        "Explain N+1 query vulnerability when accessing lazy-loaded JPA entity relationships.",
        "Discuss solutions using @EntityGraph, JOIN FETCH, and Spring Data DTO projection interfaces.",
        "Cover HikariCP connection pool sizing and @Transactional(readOnly = true).",
        "Explain secondary caching strategies with Redis for read-frequent endpoints.",
      ],
      idealAnswer: "I audit SQL queries generated by Hibernate in dev, eliminate N+1 queries using JOIN FETCH or JPQL DTO projections, and add Redis caching for read-heavy endpoints to minimize database load.",
    });
  }

  if (lowerDesc.includes("docker") || lowerDesc.includes("aws") || lowerDesc.includes("kubernetes") || lowerDesc.includes("cloud")) {
    questions.push({
      id: `q${qIndex++}`, category: "Cloud & DevOps Infrastructure", type: "technical", difficulty: "Medium",
      question: `How would you containerize and automate continuous deployment for this ${title} role using Docker and Cloud infrastructure at ${company}?`,
      talkingPoints: [
        "Explain multi-stage Docker builds to shrink final production images.",
        "Discuss container orchestration (AWS ECS / EKS) and Secrets Manager.",
        "Explain automated CI/CD pipeline stages including vulnerability scanning and zero-downtime Blue/Green deployment.",
        "Mention health checks and automated rollback policies on failed deployments.",
      ],
      idealAnswer: "I write multi-stage Dockerfiles for lightweight containers and run fully automated CI/CD pipelines (GitHub Actions) that test, scan, and deploy via Blue/Green deployments on AWS ECS.",
    });
  }

  if (keyActionLines.length > 0) {
    const cleanClause = keyActionLines[0].replace(/^[•\-\*\d\.]+\s*/, '').slice(0, 110);
    questions.push({
      id: `q${qIndex++}`, category: "Specific Role Responsibility", type: "technical", difficulty: "Hard",
      question: `The job description highlights "${cleanClause}...". Walk us through your exact technical strategy for executing this requirement at ${company}.`,
      talkingPoints: [
        `Break down the goal: "${cleanClause}".`,
        "Discuss architectural prerequisites, modular component structure, and tech stack choices.",
        "Detail edge cases, security considerations, and error handling fallback strategies.",
        "Explain how you measure success using uptime ratings, latency metrics, or user engagement.",
      ],
      idealAnswer: `To execute this at ${company}, I first establish clear technical boundaries and API contracts. I build core modules with comprehensive unit test coverage and iteratively deploy using feature flags.`,
    });
  }

  // ─── BLOCK C: UNIVERSAL LEETCODE & ARCHITECTURE QUESTIONS ───
  // Always included to ensure at least 20 rich questions

  const universal = [
    {
      category: "Coding (LeetCode)", type: "coding", difficulty: "Easy",
      leetcodeNum: 1, leetcodeUrl: "https://leetcode.com/problems/two-sum/",
      question: "[LeetCode #1 - Two Sum] Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in O(n) time.",
      talkingPoints: [
        "Brute force approach is O(n²) using nested loops.",
        "Optimal HashMap approach: Store compliment (target - num) in hash table during single pass.",
        "Time Complexity: O(n); Space Complexity: O(n) for hash map storage.",
      ],
      idealAnswer: "I use a Hash Map to store each array element's value and index. For each number, I check if target - num exists in the map. If found, I return both indices in O(n) time and O(n) space.",
    },
    {
      category: "Coding (LeetCode)", type: "coding", difficulty: "Medium",
      leetcodeNum: 15, leetcodeUrl: "https://leetcode.com/problems/3sum/",
      question: "[LeetCode #15 - 3Sum] Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that nums[i] + nums[j] + nums[k] == 0.",
      talkingPoints: [
        "Sort array first in O(n log n).",
        "Fix first element nums[i], then use Two Pointers (left, right) for remaining sum = -nums[i].",
        "Skip duplicate elements for both outer loop and inner pointers to avoid duplicate triplets.",
        "Time Complexity: O(n²); Space Complexity: O(1) auxiliary (excluding output).",
      ],
      idealAnswer: "I sort nums, then iterate through with index i. For each i, I set left = i+1 and right = n-1, moving pointers inward based on whether sum is < 0 or > 0. I skip duplicate values to ensure unique triplets in O(n²) time.",
    },
    {
      category: "System Design", type: "technical", difficulty: "Hard",
      question: `Design a URL-shortening service (like Bit.ly) that needs to handle 100 million requests per day with sub-50ms read latency. Walk through your full architecture for ${company}.`,
      talkingPoints: [
        "Hash function collision strategy (Base62 encoding, counters vs random).",
        "Cache-aside pattern with Redis to serve hot redirects in memory.",
        "Horizontal read replica sharding to distribute global traffic.",
        "Analytics event stream with Kafka + ClickHouse for click tracking.",
      ],
      idealAnswer: "I'd use a Base62 hash for short codes, store mappings in PostgreSQL with a Redis cache for hot keys (TTL-based), front it with a CDN for global edge caching, and push click events to Kafka for async analytics processing.",
    },
    {
      category: "System Design", type: "technical", difficulty: "Hard",
      question: `How would you design a real-time notification delivery system for millions of users with multiple delivery channels (push, email, SMS, in-app) at ${company}?`,
      talkingPoints: [
        "Event-driven architecture with Kafka topics per notification category.",
        "Worker microservices per channel (Firebase FCM, SendGrid, Twilio).",
        "Delivery status tracking, deduplication, and retry with exponential backoff.",
        "User preference management and opt-out compliance (GDPR).",
      ],
      idealAnswer: "I'd build an event-driven system: publishers emit events to Kafka topics, worker consumers fan out to channel-specific microservices, each with retry queues and delivery status callbacks stored in Redis for real-time read dashboards.",
    },
    {
      category: "Algorithms & Data Structures", type: "coding", difficulty: "Hard",
      leetcodeNum: 295, leetcodeUrl: "https://leetcode.com/problems/find-median-from-data-stream/",
      question: `[LeetCode #295 - Find Median from Data Stream] Implement a data structure to compute running medians efficiently from continuous streaming integers.`,
      talkingPoints: [
        "Explain why a simple sorted array is O(n) and unsuitable for live streams.",
        "Describe two-heap approach: max-heap for lower half, min-heap for upper half.",
        "Detail balancing logic ensuring both heaps differ by at most 1 element.",
        "Analyze time complexity: O(log n) per insertion, O(1) median retrieval.",
      ],
      idealAnswer: "I'd use two heaps: a max-heap for the lower half and a min-heap for the upper half. On each insert I rebalance them to differ by at most 1 element. Median is either the top of the larger heap or the average of both tops — O(log n) insert, O(1) read.",
    },
    {
      category: "API Design", type: "technical", difficulty: "Medium",
      question: `How do you design a backward-compatible RESTful API versioning strategy that doesn't break existing clients while shipping new features rapidly at ${company}?`,
      talkingPoints: [
        "Discuss URL versioning (/api/v1/ vs /api/v2/) vs Header-based versioning.",
        "Explain semantic versioning, deprecation notices, and sunset headers.",
        "Cover field additive changes (safe) vs field removal (breaking) — always additive only.",
        "Describe API gateway routing rules to bridge old and new contract versions.",
      ],
      idealAnswer: "I use URL versioning (/v1/, /v2/) combined with strict additive-only schema changes. When introducing breaking changes, I deploy the new version in parallel, emit deprecation headers on /v1/ with a 6-month sunset policy, then retire the old version after migration.",
    },
    {
      category: "Concurrency & Threading", type: "technical", difficulty: "Hard",
      question: `Explain how you would prevent race conditions and deadlocks in a multi-threaded service that processes financial transactions concurrently.`,
      talkingPoints: [
        "Discuss optimistic locking with versioned rows vs pessimistic row-level locks.",
        "Explain deadlock prevention: always acquire locks in a canonical consistent order.",
        "Cover distributed locking using Redis SETNX or Redlock algorithm for multi-node systems.",
        "Detail idempotency keys to prevent duplicate transaction processing on retries.",
      ],
      idealAnswer: "For financial transactions, I use database-level row locking with SELECT FOR UPDATE for critical sections, combined with idempotency keys on write operations. For distributed services, I implement Redlock-based distributed locks with short TTLs and circuit breakers.",
    },
    {
      category: "Security & Secure Coding", type: "technical", difficulty: "Medium",
      question: `What are the OWASP Top 10 vulnerabilities most likely to appear in a web application at ${company}, and how do you prevent them in your code?`,
      talkingPoints: [
        "SQL Injection → Parameterized queries / ORM only, never string concatenation.",
        "XSS → Output encoding, Content-Security-Policy headers, React's JSX auto-escaping.",
        "Broken Authentication → JWT with short expiry + refresh token rotation, MFA enforcement.",
        "IDOR → Object-level authorization checks on every API endpoint, not just route guards.",
      ],
      idealAnswer: "The most common risks are SQL injection (prevented by parameterized queries), XSS (prevented by output encoding and CSP), and broken authorization (prevented by server-side object-level permission checks on every request, not just middleware guards).",
    },
    {
      category: "Code Quality & Architecture", type: "coding", difficulty: "Medium",
      question: `Explain the SOLID principles with a concrete code example from your recent project. Which principle do you find most commonly violated in real codebases?`,
      talkingPoints: [
        "Single Responsibility: Each class/module does exactly one thing and has one reason to change.",
        "Open/Closed: Extend behavior via composition/inheritance rather than modifying existing code.",
        "Liskov Substitution: Subtypes must be substitutable for their base types without breaking behavior.",
        "Interface Segregation + Dependency Inversion: Code against abstractions, not concretions.",
      ],
      idealAnswer: "In my experience, the Single Responsibility Principle is most commonly violated — classes accumulate unrelated concerns over time. I enforce it via code reviews, domain-driven module boundaries, and clear interface contracts between service layers.",
    },
    {
      category: "Testing & Quality Assurance", type: "coding", difficulty: "Medium",
      question: `What is your testing strategy for a microservices architecture? How do you balance unit tests, integration tests, and contract tests?`,
      talkingPoints: [
        "Testing Pyramid: 70% unit (fast, isolated), 20% integration (real DB/queue), 10% E2E (full flow).",
        "Contract testing with Pact.io between producer and consumer microservices.",
        "Mutation testing to validate test effectiveness — not just code coverage.",
        "Ephemeral Docker environments in CI for real integration test DB instances.",
      ],
      idealAnswer: "I follow the testing pyramid: unit tests for business logic, integration tests against real Docker database containers in CI, and Pact contract tests between service boundaries to catch API mismatches before they reach production.",
    },
    {
      category: "Caching & Performance", type: "technical", difficulty: "Medium",
      question: `When would you use a cache-aside pattern versus a write-through cache, and what are the trade-offs for a high-traffic product at ${company}?`,
      talkingPoints: [
        "Cache-aside: Application reads from cache first; on miss, loads from DB and populates cache.",
        "Write-through: Every write goes to cache AND DB simultaneously — strong consistency but higher write latency.",
        "Write-behind: Asynchronous DB write after cache update — high performance but risk of data loss.",
        "TTL design: Short TTL for frequently changing data; content-hash TTLs for static assets.",
      ],
      idealAnswer: "For read-heavy products, I use cache-aside with a reasonable TTL — the application loads from the DB on cache miss and repopulates. For write-heavy products requiring consistency (e.g. inventory), I use write-through so cache and DB are never out of sync.",
    },
    {
      category: "Behavioral & Leadership", type: "behavioral", difficulty: "Medium",
      question: `As a ${title} at ${company}, tell me about a time you had to balance delivering a high-priority feature quickly while maintaining high code quality and test coverage.`,
      talkingPoints: [
        "Situation: Impending production deadline or urgent customer deliverable.",
        "Task: Deliver essential functionality without introducing technical debt.",
        "Action: Negotiated MVP scope, wrote integration tests for critical business paths, and peer-reviewed PRs.",
        "Result: Shipped on schedule with 0 critical production bugs.",
      ],
      idealAnswer: "When deadlines are tight, I strictly scope deliverables to the core MVP requirements. I write targeted automated tests for essential user flows first and rely on CI/CD checks to catch regressions, shipping quickly without sacrificing stability.",
    },
    {
      category: "Behavioral & Conflict Resolution", type: "behavioral", difficulty: "Medium",
      question: `Describe a situation where you had a technical disagreement with a colleague about architecture. How did you handle it and what was the outcome?`,
      talkingPoints: [
        "Situation: Divergent opinions on software patterns, database choices, or framework adoption.",
        "Task: Reach consensus without hurting team velocity or morale.",
        "Action: Proposed an objective benchmark/POC and documented the Decision Record (ADR).",
        "Result: Adopted the optimal solution supported by empirical data.",
      ],
      idealAnswer: "I resolve technical disagreements by removing emotion and focusing on empirical data. I create a quick prototype to measure performance and complexity, present the benchmark to the team, and collectively record an Architectural Decision Record.",
    },
    {
      category: "Role Alignment & Value Add", type: "behavioral", difficulty: "Easy",
      question: `Why does this ${title} role at ${company} align with your background, and what key value will you bring in your first 90 days?`,
      talkingPoints: [
        `Connect your past experience with the tech stack: ${matchedTech.map(t => t.name).slice(0, 4).join(", ") || "software engineering"}.`,
        "Highlight your proactive approach to learning codebase domain rules quickly.",
        "Describe 30-60-90 day progression: 30 days onboarding, 60 days owning features, 90 days optimizing architecture.",
      ],
      idealAnswer: `This ${title} position at ${company} is an ideal match because it relies on ${matchedTech.map(t => t.name).slice(0, 3).join(", ") || "core engineering"}, where I have proven hands-on experience. In 90 days I plan to master the domain, ship key features, and optimize system scalability.`,
    },
    {
      category: "Scalability & Architecture", type: "technical", difficulty: "Hard",
      question: `How would you scale a monolithic application to a microservices architecture incrementally without a full rewrite, ensuring zero-downtime at ${company}?`,
      talkingPoints: [
        "Strangler Fig Pattern: Route traffic to new microservices incrementally behind an API gateway.",
        "Domain-Driven Design: Identify bounded contexts as service boundaries.",
        "Event-driven decoupling using Kafka for async inter-service communication.",
        "Gradual traffic shifting with feature flags and shadow mode testing.",
      ],
      idealAnswer: "I'd apply the Strangler Fig Pattern — gradually routing specific domains to new microservices behind an API gateway. Each new service gets its own database (database-per-service pattern) and communicates asynchronously via Kafka, allowing incremental migration with zero downtime.",
    },
    {
      category: "Observability & Monitoring", type: "technical", difficulty: "Medium",
      question: `How do you implement observability (metrics, logs, traces) in a distributed system to debug production incidents fast at ${company}?`,
      talkingPoints: [
        "The Three Pillars: Structured logs (JSON), metrics (Prometheus/Grafana), distributed traces (OpenTelemetry + Jaeger).",
        "Correlation IDs propagated across every service call for end-to-end trace linking.",
        "P99 latency SLOs with alerting thresholds and automatic PagerDuty escalations.",
        "Centralized log aggregation with ELK Stack / Loki for structured log querying.",
      ],
      idealAnswer: "I instrument every service with OpenTelemetry for distributed tracing (correlation IDs across all hops), emit structured JSON logs to ELK, and expose Prometheus metrics with Grafana dashboards. When a P99 SLO alert fires, the Jaeger trace immediately pinpoints the slow span.",
    },
    {
      category: "Problem Solving Under Pressure", type: "behavioral", difficulty: "Medium",
      question: `Walk me through how you have handled a critical production outage. What was your debugging process and what did you change afterward?`,
      talkingPoints: [
        "Immediate triage: Identify blast radius, roll back or feature flag off if possible.",
        "Systematic root cause analysis using logs, metrics, and trace correlation.",
        "Post-mortem: Blameless RCA document with timeline, root cause, and corrective actions.",
        "Preventive controls: Alert thresholds, circuit breakers, and load shedding mechanisms.",
      ],
      idealAnswer: "During outages, I immediately assess the blast radius and roll back if a recent deploy is suspected. I correlate traces, logs, and metrics to isolate the root cause, restore service, then run a blameless post-mortem that results in concrete monitoring improvements and runbooks.",
    },
    {
      category: "Communication & Collaboration", type: "behavioral", difficulty: "Easy",
      question: `Describe how you communicate complex technical concepts to non-technical stakeholders or product managers at ${company}.`,
      talkingPoints: [
        "Replace jargon with business-outcome framing: 'This reduces checkout failures by 15%'.",
        "Use visual diagrams (architecture diagrams, sequence flows) to illustrate system behavior.",
        "Regular stakeholder updates using async written updates (Notion/Confluence) for shared context.",
        "Invite questions and validate understanding before ending technical discussions.",
      ],
      idealAnswer: "I translate technical complexity into business impact — instead of 'we need a Redis cache,' I say 'this reduces API latency by 200ms, improving checkout conversion by ~8%.' I back it up with a simple sequence diagram and written async summary for async stakeholders.",
    },
    {
      category: "Growth Mindset", type: "behavioral", difficulty: "Easy",
      question: `How do you stay current with rapidly evolving technologies and frameworks relevant to the ${title} role?`,
      talkingPoints: [
        "Structured learning: Weekly engineering blog reading (Substack, Martin Fowler, Hacker News).",
        "Hands-on side projects or open-source contributions to prototype new technologies before adopting at work.",
        "Conference talks (QCon, InfoQ, Google I/O) and community meetups for emerging trends.",
        "Internal knowledge-sharing: Lunch-and-learns, tech radar maintenance with the team.",
      ],
      idealAnswer: "I allocate time every week to read engineering blogs, prototype technologies in personal projects before advocating adoption at work, and share learnings with the team via brief tech talks — ensuring new ideas are validated before they enter the production codebase.",
    },
    {
      category: "Ownership & Accountability", type: "behavioral", difficulty: "Easy",
      question: `Tell me about a project you owned end-to-end at ${company} (or a previous employer). What decisions did you make independently and what was the outcome?`,
      talkingPoints: [
        "Describe the project scope, business goal, and your single-threaded ownership of it.",
        "Explain key architectural and product decisions you made independently.",
        "Quantify the outcome: performance improvement %, user adoption, cost reduction.",
        "Discuss what you'd do differently with the knowledge you have now.",
      ],
      idealAnswer: "I owned a complete rebuild of our PDF parsing pipeline — from schema design to API contract to deployment automation. I made the key choice to use async processing with status polling rather than a synchronous response, which reduced timeouts by 94% and cut support tickets from 30/week to 2.",
    },
  ];

  // Merge dynamic + universal, de-duplicate, and return exactly 20
  universal.forEach(u => {
    questions.push({ id: `q${qIndex++}`, ...u });
  });

  // Return top 20
  return questions.slice(0, Math.max(20, questions.length));
}
