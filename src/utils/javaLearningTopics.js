// src/utils/javaLearningTopics.js

export const JAVA_TOPICS = [
  {
    id: "constructors",
    title: "Constructors",
    icon: "📦",
    category: "OOP Concepts",
    difficulty: "Beginner",
    time: "15 mins",
    importance: 5,
    description: "Learn how Java creates and initializes objects in JVM Heap memory.",
    prerequisites: ["Classes & Objects", "Methods"],
    objectives: [
      "Understand what constructors are and why they are necessary",
      "Learn the difference between Default, Parameterized, and Copy constructors",
      "Visualize constructor execution and object allocation inside the JVM Heap",
      "Master constructor overloading and the super() / this() keywords",
      "Practice FAANG interview questions on object initialization"
    ],
    nextTopicId: "oop-concepts",
    theory: {
      intro: "A Constructor in Java is a special block of code similar to a method that is automatically invoked when an instance of a class (an object) is created using the 'new' keyword.",
      why: "Without constructors, every object created would have default zero or null values, requiring manual initialization line-by-line. Constructors guarantee that an object is created in a valid, initialized state.",
      types: [
        {
          name: "Default Constructor (No-Arg)",
          desc: "Provided automatically by the Java compiler if no constructor is defined in the class. Initializes instance variables to default values (0, false, null).",
          code: `public class Student {\n    String name;\n    int age;\n\n    // Compiler provides: public Student() {}\n}`
        },
        {
          name: "Parameterized Constructor",
          desc: "Defined by the developer to accept arguments and assign customized state during object creation.",
          code: `public class Student {\n    String name;\n    int age;\n\n    public Student(String n, int a) {\n        this.name = n;\n        this.age = a;\n    }\n}`
        },
        {
          name: "Constructor Overloading",
          desc: "Defining multiple constructors in the same class with different parameter lists (type, count, or order).",
          code: `public class Student {\n    public Student() { this("Unknown", 18); }\n    public Student(String n, int a) { this.name = n; this.age = a; }\n}`
        }
      ],
      mistakes: [
        "Writing a return type (like void) on a constructor converts it into a regular method!",
        "Forgetting that if you define ANY constructor, Java compiler will NOT create a default no-arg constructor.",
        "Calling this() or super() anywhere other than the VERY FIRST line of a constructor body causes a compile error."
      ]
    },
    jvmSteps: [
      { step: 1, title: "Class Loading", desc: "JVM loads Student.class into Metaspace / Method Area." },
      { step: 2, title: "Heap Memory Allocation", desc: "JVM allocates memory on the Heap for the new Student object." },
      { step: 3, title: "Default Field Initialization", desc: "Instance fields (name=null, age=0) receive default values in Heap." },
      { step: 4, title: "Constructor Execution", desc: "Constructor frame pushed onto Stack; assigns passed arguments ('Palash', 22)." },
      { step: 5, title: "Reference Return", desc: "Heap reference address (e.g. 0x7f81a) assigned to stack variable 's1'." }
    ],
    codeSandbox: {
      filename: "ConstructorDemo.java",
      initialCode: `public class ConstructorDemo {
    public static void main(String[] args) {
        System.out.println("=== Creating Objects via Constructors ===");
        
        // Parameterized Constructor
        Developer dev1 = new Developer("Palash Mishra", "Full Stack Engineer", 4);
        dev1.displayProfile();
        
        // Overloaded Default Constructor
        Developer dev2 = new Developer();
        dev2.displayProfile();
    }
}

class Developer {
    String name;
    String role;
    int experienceYears;

    // Parameterized Constructor
    public Developer(String name, String role, int experienceYears) {
        this.name = name;
        this.role = role;
        this.experienceYears = experienceYears;
    }

    // Overloaded No-Arg Constructor using this() chaining
    public Developer() {
        this("Candidate", "Junior Engineer", 1);
    }

    public void displayProfile() {
        System.out.println("Dev: " + name + " | Role: " + role + " | Exp: " + experienceYears + " yrs");
    }
}`,
      expectedConsoleOutput: `=== Creating Objects via Constructors ===
Dev: Palash Mishra | Role: Full Stack Engineer | Exp: 4 yrs
Dev: Candidate | Role: Junior Engineer | Exp: 1 yrs`
    },
    quiz: [
      {
        question: "What happens if a developer adds a return type (like void) to a constructor declaration?",
        options: [
          "It compiles as a regular method, not a constructor",
          "It throws a RuntimeException",
          "It fails to compile due to syntax error",
          "It becomes a static constructor"
        ],
        answer: 0,
        explanation: "In Java, constructors have NO return type. Adding 'void' makes Java treat it as a standard method."
      },
      {
        question: "If a class defines a Parameterized Constructor but no No-Arg Constructor, what happens when 'new MyClass()' is called?",
        options: [
          "Compile-time Error: constructor MyClass() in class MyClass cannot be applied to given types",
          "Executes with default null values",
          "Java automatically generates a default constructor at runtime",
          "NullPointerException is thrown"
        ],
        answer: 0,
        explanation: "Java compiler only creates a default no-arg constructor if NO other constructors are explicitly written."
      },
      {
        question: "Where must this() or super() constructor chaining calls be placed inside a constructor?",
        options: [
          "Must be the very first statement in the constructor",
          "Anywhere before the return statement",
          "Must be the last statement in the constructor",
          "Inside a static initializer block"
        ],
        answer: 0,
        explanation: "Java syntax requires super() or this() to be the first line to guarantee parent initialization before child fields."
      }
    ],
    interviewQuestions: [
      {
        q: "Can a constructor be private in Java? What is the real-world use case?",
        a: "Yes! Private constructors prevent direct instantiation of a class from outside. Key use cases include: 1) Singleton Pattern (ensuring single object instance), 2) Utility classes with only static methods (like java.lang.Math or java.util.Collections), and 3) Builder Pattern.",
        points: ["Prevents new keyword usage externally", "Used in Singleton & Factory design patterns", "Used in utility classes with static methods"]
      },
      {
        q: "What is the difference between this() and super() in Java constructors?",
        a: "this() calls another constructor within the SAME class (constructor chaining). super() calls a constructor in the IMMEDIATE PARENT class. Both must be the first line of code in the constructor.",
        points: ["this() = Same class constructor", "super() = Parent class constructor", "Both must be line #1"]
      }
    ]
  },

  {
    id: "jvm-architecture",
    title: "JVM & Java Architecture",
    icon: "☕",
    category: "JVM & Memory",
    difficulty: "Intermediate",
    time: "20 mins",
    importance: 5,
    description: "Master Classloader, JIT Compiler, JVM Memory Areas, and Execution Engine.",
    prerequisites: ["Java Basics"],
    objectives: [
      "Understand ClassLoader sub-system (Loading, Linking, Initialization)",
      "Explore JVM Runtime Data Areas (Metaspace, Heap, Stack, PC Register, Native Stack)",
      "Learn how JIT Compiler translates bytecode to native machine code",
      "Trace execution of main() from .class file to CPU machine instructions"
    ],
    nextTopicId: "variables-datatypes",
    theory: {
      intro: "The Java Virtual Machine (JVM) is an abstract computing machine that enables a computer to run a Java program by interpreting or compiling bytecode into native machine instructions.",
      why: "JVM is the key behind Java's 'Write Once, Run Anywhere' (WORA) philosophy. Developers compile code into platform-independent .class bytecode, which any OS JVM can execute.",
      types: [
        { name: "ClassLoader", desc: "Loads .class files into memory, verifies bytecode, and initializes static variables." },
        { name: "Execution Engine", desc: "Contains Interpreter and JIT Compiler to convert bytecode to native hardware assembly." },
        { name: "Runtime Data Areas", desc: "Divided into Heap, Stack, Metaspace, Program Counter (PC) Registers, and Native Method Stacks." }
      ],
      mistakes: ["Confusing JDK vs JRE vs JVM.", "Assuming JVM executes .java files directly instead of .class bytecode."]
    },
    jvmSteps: [
      { step: 1, title: "Source Compilation", desc: "javac converts Main.java -> Main.class Bytecode." },
      { step: 2, title: "ClassLoader Subsystem", desc: "Bootstrap, Extension, and Application ClassLoaders load class into memory." },
      { step: 3, title: "Memory Allocation", desc: "Static members allocated in Metaspace; Stack frame initialized for main()." },
      { step: 4, title: "Execution & JIT Profiling", desc: "JIT Compiler compiles hot code blocks into native CPU assembly for 10x speed." }
    ],
    codeSandbox: {
      filename: "JvmArchitectureDemo.java",
      initialCode: `public class JvmArchitectureDemo {
    public static void main(String[] args) {
        System.out.println("=== JVM Memory Info ===");
        Runtime runtime = Runtime.getRuntime();
        System.out.println("Total JVM Memory: " + (runtime.totalMemory() / (1024 * 1024)) + " MB");
        System.out.println("Free JVM Memory:  " + (runtime.freeMemory() / (1024 * 1024)) + " MB");
        System.out.println("Max JVM Memory:   " + (runtime.maxMemory() / (1024 * 1024)) + " MB");
    }
}`,
      expectedConsoleOutput: `=== JVM Memory Info ===
Total JVM Memory: 256 MB
Free JVM Memory:  240 MB
Max JVM Memory:   4096 MB`
    },
    quiz: [
      {
        question: "Which component of JVM compiles hot bytecode sections directly into native machine code?",
        options: ["JIT Compiler", "Interpreter", "Garbage Collector", "ClassLoader"],
        answer: 0,
        explanation: "Just-In-Time (JIT) Compiler detects frequently executed code and compiles it into native machine code for maximum execution speed."
      }
    ],
    interviewQuestions: [
      {
        q: "What is Metaspace in Java 8+ and how does it differ from PermGen?",
        a: "Metaspace replaced PermGen in Java 8 for class metadata storage. Unlike PermGen which had a fixed size in JVM heap, Metaspace uses native system RAM, growing dynamically to prevent OutOfMemoryError: PermGen space.",
        points: ["Introduced in Java 8", "Uses Native RAM instead of JVM Heap", "Dynamic sizing prevents PermGen OOM"]
      }
    ]
  },

  {
    id: "oop-concepts",
    title: "OOP Concepts",
    icon: "🧩",
    category: "OOP Concepts",
    difficulty: "Beginner",
    time: "20 mins",
    importance: 5,
    description: "Master the 4 pillars of Object-Oriented Programming: Encapsulation, Inheritance, Polymorphism, Abstraction.",
    prerequisites: ["Constructors", "Methods"],
    objectives: [
      "Understand the 4 core OOP Pillars",
      "Apply modular object-oriented software design",
      "Recognize real-world OOP design patterns"
    ],
    nextTopicId: "inheritance",
    theory: {
      intro: "Object-Oriented Programming (OOP) is a programming paradigm based on the concept of 'objects' containing data (attributes) and code (methods).",
      why: "OOP improves code reusability, maintainability, scalability, and security in large enterprise applications.",
      types: [
        { name: "Encapsulation", desc: "Bundling data and methods together while restricting direct access using private access modifiers." },
        { name: "Inheritance", desc: "Mechanism where a child class acquires properties and behaviors of a parent class." },
        { name: "Polymorphism", desc: "Ability of an object to take many forms (Method Overloading & Overriding)." },
        { name: "Abstraction", desc: "Hiding internal complexity and showing only essential functionality through interfaces & abstract classes." }
      ],
      mistakes: ["Exposing raw fields public instead of using private + getters/setters."]
    },
    jvmSteps: [
      { step: 1, title: "Class Definition", desc: "Base and derived class templates loaded into Metaspace." },
      { step: 2, title: "Virtual Method Table (vtable)", desc: "JVM creates vtable for resolving polymorphic dynamic method dispatches at runtime." }
    ],
    codeSandbox: {
      filename: "OopDemo.java",
      initialCode: `public class OopDemo {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Palash Mishra", 5000.0);
        acc.deposit(1500.0);
        System.out.println("Account Holder: " + acc.getHolder());
        System.out.println("Current Balance: $" + acc.getBalance());
    }
}

class BankAccount {
    private String holder;
    private double balance;

    public BankAccount(String holder, double balance) {
        this.holder = holder;
        this.balance = balance;
    }

    public void deposit(double amt) { if (amt > 0) balance += amt; }
    public String getHolder() { return holder; }
    public double getBalance() { return balance; }
}`,
      expectedConsoleOutput: `Account Holder: Palash Mishra
Current Balance: $6500.0`
    },
    quiz: [
      {
        question: "Which OOP principle is achieved by using private instance variables with public getter/setter methods?",
        options: ["Encapsulation", "Polymorphism", "Inheritance", "Abstraction"],
        answer: 0,
        explanation: "Encapsulation protects data fields from unauthorized external access."
      }
    ],
    interviewQuestions: [
      {
        q: "What is the difference between Abstraction and Encapsulation?",
        a: "Abstraction hides complexity at the design level (showing WHAT a system does via interfaces). Encapsulation hides data at the implementation level (restricting HOW data is accessed via private fields).",
        points: ["Abstraction = What it does", "Encapsulation = How it hides data"]
      }
    ]
  },

  {
    id: "inheritance",
    title: "Inheritance",
    icon: "🧬",
    category: "OOP Concepts",
    difficulty: "Intermediate",
    time: "20 mins",
    importance: 5,
    description: "Learn extends, super keyword, method overriding, and why Java doesn't support multiple inheritance with classes.",
    prerequisites: ["OOP Concepts"],
    objectives: [
      "Understand Single, Multilevel, and Hierarchical inheritance",
      "Learn why Java avoids multiple class inheritance to prevent the Diamond Problem",
      "Master super keyword usage for field, method, and constructor invocation"
    ],
    nextTopicId: "polymorphism",
    theory: {
      intro: "Inheritance is a mechanism in Java where one class acquires the properties (fields) and behaviors (methods) of another class using the 'extends' keyword.",
      why: "Promotes code reuse, hierarchical classification, and enables Method Overriding for runtime polymorphism.",
      types: [
        { name: "Single Inheritance", desc: "Class B extends Class A." },
        { name: "Multilevel Inheritance", desc: "Class C extends Class B, which extends Class A." },
        { name: "Hierarchical Inheritance", desc: "Class B and Class C both extend Class A." }
      ],
      mistakes: ["Trying to extend multiple classes (e.g., class Child extends ParentA, ParentB -> Compile Error!)."]
    },
    jvmSteps: [
      { step: 1, title: "Superclass Loading", desc: "JVM loads Parent class before Child class into Metaspace." },
      { step: 2, title: "Constructor Chaining", desc: "Child constructor implicitly invokes super() as first line." }
    ],
    codeSandbox: {
      filename: "InheritanceDemo.java",
      initialCode: `public class InheritanceDemo {
    public static void main(String[] args) {
        SeniorEngineer eng = new SeniorEngineer("Palash", "Java Microservices");
        eng.work();
    }
}

class Employee {
    String name;
    public Employee(String name) { this.name = name; }
    public void work() { System.out.println(name + " is working on general tasks."); }
}

class SeniorEngineer extends Employee {
    String specialty;
    public SeniorEngineer(String name, String specialty) {
        super(name);
        this.specialty = specialty;
    }
    @Override
    public void work() {
        System.out.println(name + " is architecting " + specialty + " systems.");
    }
}`,
      expectedConsoleOutput: `Palash is architecting Java Microservices systems.`
    },
    quiz: [
      {
        question: "Why does Java NOT support Multiple Inheritance with classes?",
        options: ["To prevent the Diamond Problem ambiguity", "To save JVM Heap memory", "Because interfaces do not allow methods", "Java limits classes to 10 total methods"],
        answer: 0,
        explanation: "If two parent classes have a method with the same signature, a child class inheriting from both wouldn't know which method to execute."
      }
    ],
    interviewQuestions: [
      {
        q: "What is the Diamond Problem in C++ and how does Java solve it?",
        a: "The Diamond Problem occurs when a class inherits from two classes that share a common superclass, causing ambiguity in method resolution. Java solves it by disallowing multiple class inheritance with extends, allowing it only through Interfaces.",
        points: ["Ambiguity in method calls", "Java uses single extends + multiple implements"]
      }
    ]
  },

  {
    id: "polymorphism",
    title: "Polymorphism",
    icon: "🎭",
    category: "OOP Concepts",
    difficulty: "Intermediate",
    time: "20 mins",
    importance: 5,
    description: "Compile-time (Overloading) vs Runtime (Overriding) Polymorphism and Method Dispatch.",
    prerequisites: ["Inheritance"],
    objectives: [
      "Differentiate Compile-Time (Overloading) and Runtime (Overriding) Polymorphism",
      "Understand Dynamic Method Dispatch and virtual method invocation in JVM",
      "Learn covariance and @Override rules"
    ],
    nextTopicId: "interfaces",
    theory: {
      intro: "Polymorphism (Greek for 'many forms') allows objects of different classes to be treated as objects of a common superclass.",
      why: "Allows writing clean, extensible framework code that handles generic superclasses while executing specific child behaviors dynamically.",
      types: [
        { name: "Method Overloading (Compile-Time)", desc: "Same method name, different parameter lists in the SAME class." },
        { name: "Method Overriding (Runtime)", desc: "Same method signature in parent and child class; resolved dynamically at runtime." }
      ],
      mistakes: ["Attempting to override static or final methods (static methods are hidden, not overridden)."]
    },
    jvmSteps: [
      { step: 1, title: "vtable Inspection", desc: "JVM looks up method in actual runtime object's vtable." },
      { step: 2, title: "invokevirtual Bytecode", desc: "Executes method based on actual Heap instance, not reference variable type." }
    ],
    codeSandbox: {
      filename: "PolymorphismDemo.java",
      initialCode: `public class PolymorphismDemo {
    public static void main(String[] args) {
        Payment p1 = new CreditCardPayment();
        Payment p2 = new UpiPayment();

        p1.process(1500.0); // Runtime Polymorphism
        p2.process(500.0);  // Runtime Polymorphism
    }
}

abstract class Payment {
    abstract void process(double amount);
}

class CreditCardPayment extends Payment {
    void process(double amount) { System.out.println("Processing Credit Card payment of $" + amount); }
}

class UpiPayment extends Payment {
    void process(double amount) { System.out.println("Processing Instant UPI payment of $" + amount); }
}`,
      expectedConsoleOutput: `Processing Credit Card payment of $1500.0
Processing Instant UPI payment of $500.0`
    },
    quiz: [
      {
        question: "Can static methods be overridden in Java?",
        options: ["No, static methods are resolved at compile-time (Method Hiding)", "Yes, if using @Override annotation", "Only inside abstract classes", "Yes, if methods are public"],
        answer: 0,
        explanation: "Static methods belong to class reference, not instances, so they undergo Method Hiding, not Overriding."
      }
    ],
    interviewQuestions: [
      {
        q: "What is Dynamic Method Dispatch in Java?",
        a: "Dynamic Method Dispatch is the mechanism by which a call to an overridden method is resolved at runtime rather than compile-time based on the actual Heap object instance.",
        points: ["Runtime method resolution", "Uses invokevirtual bytecode", "Based on actual Heap instance"]
      }
    ]
  },

  {
    id: "collections-framework",
    title: "Collections Framework",
    icon: "📚",
    category: "Collections & Multithreading",
    difficulty: "Advanced",
    time: "30 mins",
    importance: 5,
    description: "Deep dive into ArrayList, LinkedList, HashMap internal hashing, HashSet, and ConcurrentHashMap.",
    prerequisites: ["Generics", "Interfaces"],
    objectives: [
      "Master List, Set, Queue, and Map interfaces",
      "Understand HashMap internal bucket & initial capacity (16, load factor 0.75)",
      "Learn LinkedList vs ArrayList performance & memory trade-offs"
    ],
    nextTopicId: "multithreading",
    theory: {
      intro: "The Java Collections Framework (JCF) is a unified architecture for representing and manipulating collections of objects efficiently.",
      why: "Provides ready-made high-performance data structures (lists, sets, maps) optimized for time & space complexity.",
      types: [
        { name: "List (ArrayList, LinkedList)", desc: "Ordered collection allowing duplicate elements." },
        { name: "Set (HashSet, TreeSet)", desc: "Unordered collection containing NO duplicate elements." },
        { name: "Map (HashMap, ConcurrentHashMap)", desc: "Key-value pair mappings with unique keys." }
      ],
      mistakes: ["Forgetting to override hashCode() and equals() when using custom classes as HashMap keys."]
    },
    jvmSteps: [
      { step: 1, title: "Hash Index Calculation", desc: "index = (n - 1) & hash(key)." },
      { step: 2, title: "Treeification Threshold", desc: "If bucket length > 8, linked nodes transform into Red-Black Tree in Java 8+." }
    ],
    codeSandbox: {
      filename: "HashMapInternalDemo.java",
      initialCode: `import java.util.*;

public class HashMapInternalDemo {
    public static void main(String[] args) {
        Map<String, Integer> salaryMap = new HashMap<>();
        salaryMap.put("Palash", 140000);
        salaryMap.put("Rahul", 120000);
        salaryMap.put("Ananya", 135000);

        System.out.println("HashMap entries: " + salaryMap);
        System.out.println("Palash's Salary: $" + salaryMap.get("Palash"));
    }
}`,
      expectedConsoleOutput: `HashMap entries: {Ananya=135000, Rahul=120000, Palash=140000}
Palash's Salary: $140000`
    },
    quiz: [
      {
        question: "What happens in Java 8 HashMap when a bucket's collision chain exceeds 8 nodes?",
        options: [
          "It converts the LinkedList bucket into a Red-Black Tree (O(log N))",
          "It throws a HashCollisionException",
          "It doubles the default capacity to 32",
          "It deletes the oldest entry"
        ],
        answer: 0,
        explanation: "Java 8 introduced Treeification: buckets exceeding 8 nodes transform into Red-Black Trees to improve worst-case lookup from O(N) to O(log N)."
      }
    ],
    interviewQuestions: [
      {
        q: "How does HashMap work internally in Java?",
        a: "HashMap uses an array of Nodes (buckets). Key's hashCode() is computed and mapped to an index using (n-1)&hash. If collision occurs, nodes form a linked list. In Java 8+, if bucket size exceeds 8 and total capacity >= 64, it treeifies into a Red-Black Tree.",
        points: ["Hashing & bucket index", "Collision handling via LinkedList", "Treeification to Red-Black Tree in Java 8"]
      }
    ]
  },

  {
    id: "streams-api",
    title: "Streams API",
    icon: "🌊",
    category: "Modern Java (8+)",
    difficulty: "Advanced",
    time: "25 mins",
    importance: 5,
    description: "Functional programming with filter(), map(), flatMap(), reduce(), and parallelStreams().",
    prerequisites: ["Lambda Expressions", "Collections Framework"],
    objectives: [
      "Master intermediate operations (filter, map, sorted, flatMap)",
      "Master terminal operations (collect, reduce, count, forEach)",
      "Understand lazy evaluation and parallel stream performance"
    ],
    nextTopicId: "multithreading",
    theory: {
      intro: "Introduced in Java 8, Streams API allows processing sequences of elements declaratively using functional pipelines.",
      why: "Replaces boilerplate for/while loops with clean, readable, parallelizable code pipelines.",
      types: [
        { name: "Intermediate Operations", desc: "Lazy operations that return a new Stream (e.g. filter(), map())." },
        { name: "Terminal Operations", desc: "Triggers execution pipeline and produces a result (e.g. collect(), reduce())." }
      ],
      mistakes: ["Reusing a Stream after a terminal operation has already executed (throws IllegalStateException)."]
    },
    jvmSteps: [
      { step: 1, title: "Pipeline Assembly", desc: "Intermediate operations chained lazily without processing data." },
      { step: 2, title: "Terminal Trigger", desc: "Terminal operation triggers single-pass data evaluation over source elements." }
    ],
    codeSandbox: {
      filename: "StreamDemo.java",
      initialCode: `import java.util.*;
import java.util.stream.*;

public class StreamDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Palash", "Amit", "Priya", "Rohan", "Prateek");

        List<String> result = names.stream()
            .filter(n -> n.startsWith("P"))
            .map(String::toUpperCase)
            .sorted()
            .collect(Collectors.toList());

        System.out.println("Filtered P Names: " + result);
    }
}`,
      expectedConsoleOutput: `Filtered P Names: [PALASH, PRATEEK, PRIYA]`
    },
    quiz: [
      {
        question: "Which of the following is an Intermediate Stream Operation in Java?",
        options: ["map()", "collect()", "forEach()", "reduce()"],
        answer: 0,
        explanation: "map() is intermediate because it returns a Stream. collect(), forEach(), and reduce() are terminal operations."
      }
    ],
    interviewQuestions: [
      {
        q: "What is the difference between map() and flatMap() in Java Streams?",
        a: "map() transforms each element into another element 1-to-1. flatMap() transforms each element into a Stream of elements and flattens multiple Streams into a single combined Stream 1-to-N.",
        points: ["map() = 1-to-1 transformation", "flatMap() = 1-to-N flattening Stream of Streams"]
      }
    ]
  }
];

export const ALL_JAVA_TOPIC_LIST = [
  { id: "jvm-architecture", title: "JVM & Java Architecture", icon: "☕", category: "JVM & Memory", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "Master Classloader, JIT Compiler, and Memory Areas." },
  { id: "variables-datatypes", title: "Variables & Data Types", icon: "🔢", category: "Core Java & Syntax", difficulty: "Beginner", time: "10 mins", stars: 4, desc: "Primitive types, wrappers, type casting, and variable scopes." },
  { id: "operators", title: "Operators", icon: "⚡", category: "Core Java & Syntax", difficulty: "Beginner", time: "10 mins", stars: 3, desc: "Arithmetic, relational, bitwise, and ternary operators." },
  { id: "control-statements", title: "Control Statements", icon: "🔄", category: "Core Java & Syntax", difficulty: "Beginner", time: "15 mins", stars: 4, desc: "If-else, switch expressions, loops, break and continue." },
  { id: "methods", title: "Methods", icon: "🛠️", category: "Core Java & Syntax", difficulty: "Beginner", time: "15 mins", stars: 4, desc: "Method signatures, pass-by-value, varargs, and recursion." },
  { id: "constructors", title: "Constructors", icon: "📦", category: "OOP Concepts", difficulty: "Beginner", time: "15 mins", stars: 5, desc: "Learn how Java creates and initializes objects." },
  { id: "oop-concepts", title: "OOP Concepts", icon: "🧩", category: "OOP Concepts", difficulty: "Beginner", time: "20 mins", stars: 5, desc: "Master Encapsulation, Inheritance, Polymorphism, Abstraction." },
  { id: "inheritance", title: "Inheritance", icon: "🧬", category: "OOP Concepts", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "extends, super keyword, and diamond problem resolution." },
  { id: "polymorphism", title: "Polymorphism", icon: "🎭", category: "OOP Concepts", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "Compile-time vs Runtime polymorphism and dynamic dispatch." },
  { id: "abstraction", title: "Abstraction", icon: "🔮", category: "OOP Concepts", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "Abstract classes vs interfaces and design patterns." },
  { id: "encapsulation", title: "Encapsulation", icon: "🔒", category: "OOP Concepts", difficulty: "Intermediate", time: "15 mins", stars: 5, desc: "Access modifiers, getters/setters, and immutable objects." },
  { id: "interfaces", title: "Interfaces", icon: "📑", category: "OOP Concepts", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "Default methods, static methods, and functional interfaces." },
  { id: "packages", title: "Packages", icon: "📦", category: "Core Java & Syntax", difficulty: "Beginner", time: "10 mins", stars: 3, desc: "Namespaces, package imports, and access control." },
  { id: "exception-handling", title: "Exception Handling", icon: "🛡️", category: "Core Java & Syntax", difficulty: "Intermediate", time: "20 mins", stars: 5, desc: "Try-catch-finally, checked vs unchecked, try-with-resources." },
  { id: "collections-framework", title: "Collections Framework", icon: "📚", category: "Collections & Multithreading", difficulty: "Advanced", time: "30 mins", stars: 5, desc: "ArrayList, HashMap internals, HashSet, and ConcurrentHashMap." },
  { id: "generics", title: "Generics", icon: "🏷️", category: "Core Java & Syntax", difficulty: "Advanced", time: "20 mins", stars: 4, desc: "Type erasure, wildcards (? extends T), and generic classes." },
  { id: "multithreading", title: "Multithreading", icon: "⚙️", category: "Collections & Multithreading", difficulty: "Advanced", time: "35 mins", stars: 5, desc: "Threads, Runnable, ExecutorService, volatile, and synchronized." },
  { id: "file-handling", title: "File Handling", icon: "📁", category: "Database & Files", difficulty: "Intermediate", time: "15 mins", stars: 4, desc: "FileReader, FileWriter, BufferedReader, and Java NIO." },
  { id: "jdbc", title: "JDBC", icon: "🗃️", category: "Database & Files", difficulty: "Intermediate", time: "25 mins", stars: 4, desc: "Connection, PreparedStatement, ResultSet, and Connection Pools." },
  { id: "streams-api", title: "Streams API", icon: "🌊", category: "Modern Java (8+)", difficulty: "Advanced", time: "25 mins", stars: 5, desc: "Functional pipelines: filter, map, flatMap, reduce, collect." },
  { id: "lambda-expressions", title: "Lambda Expressions", icon: "💥", category: "Modern Java (8+)", difficulty: "Advanced", time: "20 mins", stars: 5, desc: "Anonymous functions, Consumer, Supplier, Predicate, Function." },
  { id: "garbage-collection", title: "Garbage Collection", icon: "🗑️", category: "JVM & Memory", difficulty: "Advanced", time: "20 mins", stars: 5, desc: "G1GC, ZGC, Young & Old Generation, and Memory Leaks." },
  { id: "jvm-memory", title: "JVM Memory", icon: "🧠", category: "JVM & Memory", difficulty: "Advanced", time: "25 mins", stars: 5, desc: "Stack vs Heap memory, Metaspace, and OutOfMemoryErrors." },
  { id: "string-pool", title: "String Pool", icon: "🧵", category: "Core Java & Syntax", difficulty: "Intermediate", time: "15 mins", stars: 5, desc: "String immutability, String Constant Pool, intern(), StringBuilder." },
  { id: "interview-questions", title: "Interview Questions", icon: "🎯", category: "Interview Core", difficulty: "Advanced", time: "30 mins", stars: 5, desc: "Top 50 FAANG Java technical interview questions & solutions." }
];
