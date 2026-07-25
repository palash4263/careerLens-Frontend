// src/utils/interviewQuestionGenerator.js

/**
 * Deeply analyzes job description text and title to dynamically generate
 * 100% tailored technical, coding, architecture, and behavioral interview questions.
 */
export function generateInterviewQuestions(job) {
  if (!job) return [];
  const title = (job.title || "Software Engineer").trim();
  const desc = (job.description || "").trim();
  const company = (job.company || "Target Company").trim();
  const lowerDesc = desc.toLowerCase();
  const lowerTitle = title.toLowerCase();

  const questions = [];
  let qIndex = 1;

  // 1. DYNAMICALLY EXTRACT TECH STACK & TOOLS FROM DESCRIPTION
  const TECH_CATALOG = [
    { name: "React", key: ["react", "react.js", "jsx"], category: "Frontend Architecture" },
    { name: "TypeScript", key: ["typescript", "ts"], category: "Frontend & Type Safety" },
    { name: "JavaScript", key: ["javascript", "js", "es6"], category: "Web Standards" },
    { name: "Angular", key: ["angular", "rxjs", "ngrx"], category: "Frontend Engineering" },
    { name: "Vue", key: ["vue", "vuex", "pinia"], category: "Frontend Development" },
    { name: "Spring Boot", key: ["spring boot", "spring", "spring data jpa", "spring mvc"], category: "Backend Frameworks" },
    { name: "Java", key: ["java"], category: "Backend Engineering" },
    { name: "C# / .NET", key: ["c#", ".net", ".net core", "asp.net"], category: "Enterprise Backend" },
    { name: "Python", key: ["python", "django", "fastapi", "flask"], category: "Backend & AI Systems" },
    { name: "Playwright", key: ["playwright", "scraping", "automation", "puppeteer", "selenium"], category: "Automation & Web Crawling" },
    { name: "PostgreSQL", key: ["postgres", "postgresql"], category: "Database & Data Modeling" },
    { name: "MySQL / SQL", key: ["sql", "mysql", "oracle", "database"], category: "Relational Databases" },
    { name: "MongoDB / NoSQL", key: ["mongodb", "nosql", "dynamodb"], category: "Document Databases" },
    { name: "Redis", key: ["redis", "caching", "memcached"], category: "In-Memory Caching" },
    { name: "Docker", key: ["docker", "container", "containerization"], category: "DevOps & Containers" },
    { name: "Kubernetes", key: ["kubernetes", "k8s", "helm"], category: "Cloud Orchestration" },
    { name: "AWS", key: ["aws", "amazon web services", "s3", "ec2", "lambda"], category: "Cloud Infrastructure" },
    { name: "GenAI / LLM", key: ["genai", "llm", "agentic", "openai", "rag", "langchain", "prompt"], category: "Artificial Intelligence" },
    { name: "Microservices", key: ["microservices", "microservice", "distributed"], category: "System Architecture" },
    { name: "GraphQL", key: ["graphql", "apollo"], category: "API Design" },
    { name: "REST API", key: ["rest", "restful", "api"], category: "API Services" }
  ];

  const matchedTech = TECH_CATALOG.filter(item => 
    item.key.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  );

  // 2. DYNAMICALLY EXTRACT KEY RESPONSIBILITY PHRASES FROM JOB DESCRIPTION
  const descLines = desc.split(/[\n\.]/).map(l => l.trim()).filter(l => l.length > 25);
  const keyActionLines = descLines.filter(l => 
    /\b(design|build|architect|engineer|develop|optimize|integrate|automate|implement|lead|manage|maintain|scale)\b/i.test(l)
  );

  // --- GENERATE TAILORED TECHNICAL & ARCHITECTURE QUESTIONS ---

  // Check for Playwright / Scraping / Data Crawling
  if (lowerDesc.includes("playwright") || lowerDesc.includes("scraping") || lowerDesc.includes("parser") || lowerDesc.includes("parsing") || lowerDesc.includes("indexing")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Automation & Data Pipelines",
      type: "technical",
      difficulty: "Hard",
      question: `In your role as ${title} at ${company}, how would you design a resilient Playwright automation pipeline to extract and index live web data while handling anti-bot protections, rate limits, and dynamic DOM shifts?`,
      talkingPoints: [
        "Explain headless browser instance pooling to control memory overhead under high concurrency.",
        "Discuss strategies for dynamic element wait selectors (page.waitForSelector) over arbitrary timeouts.",
        "Detail proxy rotation, user-agent randomization, and exponential backoff retry mechanisms for IP blocking.",
        "Explain structured text parsing & regex sanitization before storing extracted records in relational databases."
      ],
      idealAnswer: "I build web automation pipelines using Playwright with headless browser pool management. To handle dynamic sites, I rely on auto-waiting selectors and network interception rather than fixed sleeps. For resilience, I integrate proxy rotation, custom user-agent headers, and exponential backoff retries, ensuring clean data normalization before ingestion."
    });
  }

  // Check for GenAI / Agentic Workflows / LLMs
  if (lowerDesc.includes("genai") || lowerDesc.includes("llm") || lowerDesc.includes("agentic") || lowerDesc.includes("ai")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "AI & Agentic Workflows",
      type: "technical",
      difficulty: "Hard",
      question: `How would you architect multi-step agentic LLM workflows and integrate them into production backend microservices at ${company}?`,
      talkingPoints: [
        "Explain decoupling long-running LLM generation tasks using asynchronous task queues (Celery / RabbitMQ / Kafka).",
        "Discuss Retrieval-Augmented Generation (RAG) vector embeddings for grounding LLM outputs in domain data.",
        "Highlight real-time streaming tokens to client applications using WebSockets or Server-Sent Events (SSE).",
        "Detail fallback models and deterministic validation checks on structured JSON AI outputs."
      ],
      idealAnswer: "I architect production AI workflows by running LLM invocations asynchronously off the main API loop. I use vector DB embeddings (pgvector/Pinecone) for RAG accuracy, enforce JSON schema validation on model outputs, and stream tokens back to the user interface via Server-Sent Events for instant feedback."
    });
  }

  // Check for React / Frontend / TypeScript
  if (lowerDesc.includes("react") || lowerTitle.includes("front end") || lowerTitle.includes("frontend") || lowerDesc.includes("typescript")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Frontend Architecture",
      type: "technical",
      difficulty: "Hard",
      question: `The job description for ${title} emphasizes user-friendly web applications. How do you profile and eliminate performance bottlenecks in a large-scale React & TypeScript application at ${company}?`,
      talkingPoints: [
        "Discuss profiling with React DevTools Profiler to catch unnecessary component re-renders.",
        "Explain state colocation vs global store (Redux/Zustand) to restrict render boundaries.",
        "Highlight route-based code splitting using React.lazy / Suspense and virtualized rendering for long data lists.",
        "Mention TypeScript strict type safety for props and immutable state updates."
      ],
      idealAnswer: "I optimize React/TypeScript applications by profiling component render cycles to isolate wasteful re-renders. I colocate state as close to consuming components as possible, use React.memo/useCallback selectively, and implement route code-splitting with virtualized lists for smooth 60fps rendering."
    });
  }

  // Check for Spring Boot / Java / Backend
  if (lowerDesc.includes("spring") || lowerDesc.includes("java") || lowerTitle.includes("backend") || lowerTitle.includes("back end") || lowerTitle.includes("full stack") || lowerTitle.includes("fullstack")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Backend & Data Integrity",
      type: "coding",
      difficulty: "Medium",
      question: `The JD specifies building robust REST services with Spring Boot and Spring Data JPA. How do you prevent the N+1 query problem and maintain database performance under heavy traffic at ${company}?`,
      talkingPoints: [
        "Explain N+1 query vulnerability when accessing lazy-loaded JPA entity relationships.",
        "Discuss solutions using @EntityGraph, JOIN FETCH, and Spring Data DTO projection interfaces.",
        "Cover HikariCP connection pool sizing and transaction demarcation with @Transactional(readOnly = true).",
        "Explain secondary caching strategies with Redis for read-frequent endpoints."
      ],
      idealAnswer: "To prevent JPA performance degradation, I audit SQL queries generated by Hibernate using SQL logging in dev. I eliminate N+1 queries using JOIN FETCH or JPQL DTO projections so only required columns are fetched, combined with read-only transaction flags for performance optimization."
    });
  }

  // Check for C# / .NET
  if (lowerDesc.includes("c#") || lowerDesc.includes(".net")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Enterprise .NET Architecture",
      type: "coding",
      difficulty: "Medium",
      question: `How do you optimize asynchronous I/O operations and memory allocation in C# / .NET Core web APIs for ${company}?`,
      talkingPoints: [
        "Explain async/await state machine overhead and avoiding ValueTask vs Task misuse.",
        "Discuss avoiding thread pool starvation caused by blocking calls (.Result or .Wait()).",
        "Cover Entity Framework Core query tracking (AsNoTracking) for read-heavy operations.",
        "Mention memory management, IAsyncEnumerable for streaming large datasets, and Garbage Collection tuning."
      ],
      idealAnswer: "In .NET Core, I ensure async/await is used end-to-end without sync-over-async blocking to prevent thread pool starvation. For EF Core queries, I apply .AsNoTracking() on read operations and use IAsyncEnumerable to stream large result sets efficiently."
    });
  }

  // Check for Databases / SQL / PostgreSQL
  if (lowerDesc.includes("sql") || lowerDesc.includes("postgres") || lowerDesc.includes("database") || lowerDesc.includes("relational")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Database & Schema Design",
      type: "technical",
      difficulty: "Hard",
      question: `The requirements highlight designing relational schemas and ensuring data integrity. How do you approach database indexing, partitioning, and schema migrations at ${company}?`,
      talkingPoints: [
        "Discuss B-Tree, Composite, and Partial Indexing based on EXPLAIN ANALYZE query execution plans.",
        "Explain database migration tools (Flyway / Liquibase) for version-controlled schema upgrades.",
        "Detail ACID compliance, foreign key constraints, and multi-version concurrency control (MVCC).",
        "Cover database connection pooling and read-replica replication."
      ],
      idealAnswer: "I design normalized relational schemas with clear foreign key constraints and audit indexes using EXPLAIN ANALYZE. I manage all database modifications with automated Flyway migration scripts in CI/CD, keeping migrations zero-downtime and version-controlled."
    });
  }

  // Check for Docker / AWS / Cloud / DevOps
  if (lowerDesc.includes("docker") || lowerDesc.includes("aws") || lowerDesc.includes("kubernetes") || lowerDesc.includes("cloud") || lowerDesc.includes("devops")) {
    questions.push({
      id: `q${qIndex++}`,
      category: "Cloud & DevOps Infrastructure",
      type: "technical",
      difficulty: "Medium",
      question: `How would you containerize and automate continuous deployment for this ${title} project using Docker and Cloud infrastructure at ${company}?`,
      talkingPoints: [
        "Explain multi-stage Docker builds to strip compiler toolchains and shrink final production images.",
        "Discuss container orchestration (AWS ECS / EKS) and secrets management (AWS Secrets Manager).",
        "Explain automated CI/CD pipeline stages (linting, automated unit/integration testing, container scanning, zero-downtime deployment).",
        "Mention health checks and automated rollback policies."
      ],
      idealAnswer: "I write multi-stage Dockerfiles to create lightweight, minimal runtime containers. In CI/CD (GitHub Actions/GitLab), every commit runs automated test suites, scans container vulnerabilities, and deploys to AWS ECS using Blue/Green deployments for zero-downtime releases."
    });
  }

  // --- DYNAMIC QUESTION FROM SPECIFIC JOB RESPONSIBILITY CLAUSES ---
  if (keyActionLines.length > 0) {
    const rawActionLine = keyActionLines[0];
    const cleanClause = rawActionLine.replace(/^[•\-\*\d\.]+\s*/, '').slice(0, 110);

    questions.push({
      id: `q${qIndex++}`,
      category: "Specific Role Responsibility",
      type: "technical",
      difficulty: "Hard",
      question: `The job description highlights "${cleanClause}...". Walk us through your exact technical strategy for executing this requirement at ${company}.`,
      talkingPoints: [
        `Break down the goal: "${cleanClause}".`,
        "Discuss architectural prerequisites, modular component structure, and tech stack choices.",
        "Detail edge cases, security considerations, and error handling fallback strategies.",
        "Explain how you measure success using uptime ratings, latency metrics, or user engagement."
      ],
      idealAnswer: `To execute this requirement at ${company}, I first establish clear technical boundaries and API contracts. I build out core modules with comprehensive unit test coverage, implement automated monitoring to track response latencies, and iteratively deploy using feature flags.`
    });
  }

  // --- BEHAVIORAL & LEADERSHIP QUESTIONS (Tailored to Job Title & Company) ---

  questions.push({
    id: `q${qIndex++}`,
    category: "Behavioral & Leadership",
    type: "behavioral",
    difficulty: "Medium",
    question: `As a ${title} at ${company}, tell me about a time you had to balance delivering a high-priority feature quickly while maintaining high code quality and test coverage.`,
    talkingPoints: [
      "Situation: Impending production deadline or urgent customer deliverable.",
      "Task: Deliver essential functionality without introducing technical debt or breaking existing features.",
      "Action: Negotiated MVP scope boundaries, wrote automated integration tests for critical business paths, and peer-reviewed PRs.",
      "Result: Shipped the feature on schedule with 0 critical production bugs."
    ],
    idealAnswer: "When deadlines are tight, I strictly scope deliverables down to the core MVP requirements. I write targeted automated tests for essential user flows first and rely on CI/CD checks to catch regressions, allowing us to ship quickly without sacrificing stability."
  });

  questions.push({
    id: `q${qIndex++}`,
    category: "Behavioral & Conflict Resolution",
    type: "behavioral",
    difficulty: "Medium",
    question: `Describe a situation where you had a technical disagreement with a colleague about architecture or tech stack choices for a project similar to this role at ${company}. How did you handle it?`,
    talkingPoints: [
      "Situation: Divergent opinions on software patterns, database choices, or framework adoption.",
      "Task: Reach consensus without hurting team velocity or morale.",
      "Action: Proposed an objective benchmark/POC, evaluated trade-offs collaboratively, and documented the Decision Record (ADR).",
      "Result: Adopted the optimal technical solution supported by data."
    ],
    idealAnswer: "I resolve technical disagreements by removing emotion and focusing on empirical data. I create a quick prototype to measure performance, complexity, and maintainability, present the benchmark to the team, and collectively record an Architectural Decision Record."
  });

  questions.push({
    id: `q${qIndex++}`,
    category: "Role Alignment & Value Add",
    type: "behavioral",
    difficulty: "Easy",
    question: `Why does this ${title} role at ${company} align with your technical background, and what key value will you bring in your first 90 days?`,
    talkingPoints: [
      `Connect your past experience directly with the tech stack mentioned in the JD: ${matchedTech.map(t => t.name).slice(0, 4).join(", ") || "software engineering"}.`,
      "Highlight your proactive approach to learning codebase domain rules quickly.",
      "Describe 30-60-90 day progression: 30 days onboarding & first bug fix, 60 days owning core features, 90 days optimizing architecture and mentoring."
    ],
    idealAnswer: `This ${title} position at ${company} is an ideal match because it relies heavily on ${matchedTech.map(t => t.name).slice(0, 3).join(", ") || "core software engineering"}, where I have proven hands-on experience. In my first 90 days, I plan to master the domain, deliver key features, and help optimize system scalability.`
  });

  return questions;
}
