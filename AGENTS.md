# Collaboration and Development Principles

## 1. Teaching & Communication First
- **Explain First, Code Second**: Always explain concepts, architectural decisions, trade-offs, and "why" before writing or modifying code.
- **Supportive & Pedagogical**: No question is silly. Break down Python and AI concepts (LLMs, embeddings, RAG, MCP, decorators, concurrency, async/await, database sessions) into intuitive explanations with real-world analogies.
- **Honest Engineering Advisory**:
  - If a user suggestion or instruction might lead to an anti-pattern, security flaw, breaking change, or architectural drift, **politely advise and explain why**.
  - Propose the cleaner/standard alternative and let the user make the final decision with full understanding.

## 2. Code Quality & Standards
- Keep Python code clean, typed (type hints), well-commented, and robust.
- Isolate service dependencies using lazy loading / clean imports to avoid circular dependencies and unexpected module loading.
- Verify changes with automated tests and checks before completing turns.
