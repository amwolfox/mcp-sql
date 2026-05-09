**Overview — high level**

- **Goal:** Turn plain-English user requests into safe, read-only SQL and return results.
- **Where AI sits:** The LLM (Ollama, configured by `LLM_MODEL`) generates SQL from the user prompt. The backend validates that SQL, then executes it via an MCP PostgreSQL tool and returns results.

**Main components**

- **Frontend:** page.tsx — chat UI, collects `userGoal`, shows assistant text and DB rows.
- **Backend:** server.ts — core logic: calls LLM, extracts SQL, validates, executes via MCP, returns results.
- **DB init:** init.sql — creates sample schema and data.
- **Compose / Containers:** docker-compose.yml + Dockerfiles — run Postgres, backend, frontend and link to local Ollama.

**Request flow — step-by-step (traceable in code)**

1. Frontend sends POST to `/api/chat` with JSON `{ userGoal: "..." }`. See `handleSend` in page.tsx.
2. Backend route at `/api/chat` receives the request. See route in server.ts.
3. Backend calls the LLM via `callOllamaChat(...)`:
   - If `OLLAMA_URL` is set it POSTs to local Ollama HTTP endpoints; otherwise it falls back to the `ollama` SDK. See `callOllamaChat` near top of server.ts.
   - The backend sends a system message describing the schema and a user message containing `userGoal`. This is the prompt engineering entry point where AI is constrained with the schema and rules.
   - The wrapper supports multiple HTTP endpoint fallbacks and NDJSON streaming — it aggregates streamed chunks into one assistant message.
4. The LLM reply (assistant content) is inspected by `extractAndValidateSQL(content, args)`: tries multiple extraction strategies:
   - Prefers `args.sql` (if tools/function-call used).
   - Looks for JSON embedded in text and extracts `arguments.sql` or `sql`.
   - Parses SQL fenced code blocks (```sql```).
   - Falls back to regex matching SQL keywords.
   See `extractAndValidateSQL` in server.ts.
5. Validation: the code detects write operations using a forbidden-keywords list (INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE) and blocks them. If blocked, backend returns a safe message rather than executing.
6. If valid SELECT SQL is found, the backend invokes MCP to execute it:
   - The backend creates a `StdioClientTransport` that runs `@modelcontextprotocol/server-postgres` (spawned with the `DB_CONFIG`) and connects a `Client`. See transport & `client` setup near top of server.ts.
   - Execution: `client.callTool({ name: "query", arguments: { sql } })` runs through MCP, which restricts and mediates DB access. The returned `result.content` is parsed into `dbData`.
7. Backend returns JSON: `{ assistantText, sql, data }` to frontend; UI renders table if `data` is an array.

**Where AI is used (concrete places in code)**

- Prompt construction: system prompt injected before the user message in the `callOllamaChat` call (schema + CRITICAL JOIN RULE + STRICT RULE). See that system message in server.ts.
- Generation: the LLM generates assistant content that (ideally) contains SQL; code expects SQL to appear in the assistant content or as tool calls.
- Tooling: backend maps MCP tools into the `tools` parameter passed to the LLM, enabling the LLM to use tools/functions (function-calling style) when available.
- Streaming handling: `callOllamaChat` aggregates NDJSON chunks into final assistant text (to support streaming LLM responses).

**MCP integration and why it matters**

- `StdioClientTransport` runs the MCP server for Postgres (`server-postgres`) as a subprocess; backend connects using `Client`.
- MCP provides a controlled interface for executing queries. The backend delegates the actual DB query to `client.callTool` with `name: "query"`. This decouples executing SQL from directly using `pg` and allows tooling & safety checks provided by MCP.

**Safety & validation (interview-worthy details)**

- **Write-protection:** `extractAndValidateSQL` scans for forbidden keywords and denies write queries — simple but effective first-line guard.
- **Multiple extraction strategies:** Supports tool-calls, JSON output, fenced SQL, and regex — reduces brittle LLM output format failures.
- **MCP sandboxing:** Running `server-postgres` via MCP centralizes execution and can enforce additional run-time policies.
- **Error handling:** Graceful catches around LLM calls, MCP connect, query execution; returns informative assistantText and error fields.
- **Type safety:** Backend is TypeScript (types for request/response), frontend uses typed state — reduces runtime bugs.
- **Case-insensitive support:** DB init enables `citext` to make text matching case-insensitive, matching user expectations.

**Limitations & risks (good to mention in interviews)**

- **LLM hallucination:** Model might produce incorrect or unsafe SQL that bypasses naive protections (e.g., obfuscated write queries). Relying solely on regex-based keyword blocking has limits.
- **Extraction reliability:** Complex LLM outputs can break extraction heuristics; robust parsing or structured tool outputs are preferable.
- **Authorization:** No per-user auth or role-based DB permissions in current code; production must lock down DB user to read-only.
- **Performance & scale:** Spawning an MCP subprocess per backend process and streaming LLM requests have resource implications; caching and rate-limiting are needed.
- **Observability:** Add structured logs/metrics for prompt->query mapping and model performance.
- **Testability:** LLM-dependent behavior is harder to unit test; mocking or deterministic prompts + golden outputs help.

**Improvements you can propose / implement (interview action items)**

- Use LLM function-calls / structured JSON outputs (explicit `{"sql":"..."}`) to avoid brittle parsing.
- Add a SQL AST parse/validator (e.g., using a SQL parser) to verify query types and detect hidden mutations.
- Enforce DB user with SELECT-only rights and run MCP server with strict policies.
- Add audit/logging: store (prompt, generated SQL, user, timestamp, result hash).
- Add health endpoint that verifies Postgres and Ollama availability.
- Rate-limit and authenticate `/api/chat`.
- Add automated tests for LLM prompt→SQL examples and for the extraction layer.
- Move model calls to an async job queue if long-running and add streaming to frontend.

**Key lines/files to reference in interview**

- System prompt and LLM invocation: server.ts
- SQL extraction & validation: server.ts
- MCP transport + client usage: server.ts and query call at `client.callTool(...)` near server.ts
- Frontend request & message handling: page.tsx
- DB init and `citext`: init.sql
