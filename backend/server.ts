import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ollama from 'ollama';

// Load environment variables
dotenv.config();

/** 
 * INTERFACES 
 */
interface ChatRequestBody {
  userGoal: string;
}

interface ExtractionResult {
  sql: string | null;
  error: string | null;
}

interface ApiResponse {
  assistantText: string;
  sql?: string | null;
  data?: any;
  error?: string;
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const DB_CONFIG = process.env.DATABASE_URL || "postgresql://mesut@localhost:5432/springbootmicroservicesdemo";
const MODEL = process.env.LLM_MODEL || "qwen2.5-coder";

// Optional Ollama HTTP endpoint (containerized Ollama)
const OLLAMA_URL = process.env.OLLAMA_URL;

async function callOllamaChat(opts: { model: string; messages: any[]; tools?: any[] }) {
  if (OLLAMA_URL) {
    const fetchFn = (globalThis as any).fetch;
    const base = OLLAMA_URL.replace(/\/$/, '');
    const endpoints = ['/api/chat', '/chat', '/v1/chat', '/v1/generate', '/api/generate'];

    for (const ep of endpoints) {
      const url = `${base}${ep}?model=${encodeURIComponent(opts.model)}`;
      try {
        const resp = await fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: opts.model, messages: opts.messages, tools: opts.tools })
        });

        if (resp.status === 404) {
          // try next endpoint
          console.warn(`Ollama endpoint ${url} returned 404, trying next fallback`);
          continue;
        }

        if (!resp.ok) {
          const body = await resp.text().catch(() => '<non-text body>');
          throw new Error(`Ollama HTTP error ${resp.status} at ${url}: ${body}`);
        }

        const contentType = resp.headers.get('content-type') || '';

        if (contentType.includes('ndjson') || contentType.includes('application/x-ndjson')) {
          // NDJSON streaming response: aggregate message.content across chunks
          const text = await resp.text();
          const lines = text.split(/\r?\n/).filter(Boolean);
          const parsed: any[] = [];
          const parts: string[] = [];
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              parsed.push(obj);
              const content = obj.message?.content;
              if (typeof content === 'string') parts.push(content);
            } catch (e) {
              // ignore parse errors for partial lines
            }
          }

          const aggregated = parts.join('');
          const message = { role: 'assistant', content: aggregated };
          console.log(`Ollama HTTP (ndjson): used endpoint ${url}`);
          return { message, raw: parsed } as any;
        }

        const data = await resp.json();
        const message = data.choices?.[0]?.message || data;
        console.log(`Ollama HTTP: used endpoint ${url}`);
        return { message, raw: data } as any;
      } catch (err) {
        // If fetch itself failed (network), throw immediately
        if ((err as any).message && !(err as any).message.includes('404')) {
          throw err;
        }
        // otherwise continue to try next endpoint
      }
    }

    throw new Error('Ollama HTTP: no valid endpoint responded (checked multiple fallbacks)');
  }

  // Fallback to the installed `ollama` SDK when no HTTP URL is set
  return await ollama.chat({ model: opts.model, messages: opts.messages, tools: opts.tools });
}

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set in .env, using default connection string');
}

// Transport configuration
const transport = new StdioClientTransport({
  command: "sh",
  args: ["-c", `PG_READ_ONLY=false npx -y @modelcontextprotocol/server-postgres "${DB_CONFIG}"`]
});

const client = new Client(
  { name: "web-db-agent", version: "1.0.0" }, 
  { capabilities: {} }
);

/**
 * Robust SQL Extraction & Safety Guard
 */
function extractAndValidateSQL(content: string, args: any): ExtractionResult {
  try {
    let sql: string | null = null;

    if (args?.sql) sql = args.sql;

    if (!sql && content && content.includes('{')) {
      try {
        const jsonMatch = content.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          sql = parsed.arguments?.sql || parsed.sql || parsed.query;
        }
      } catch (e) { /* silent fail on parsing */ }
    }

    if (!sql && content) {
      const markdownMatch = content.match(/```(?:sql)?\s*([\s\S]*?)\s*```/i);
      if (markdownMatch) sql = markdownMatch[1].trim();
    }

    if (!sql && content) {
      const sqlRegex = /(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER)[\s\S]*?;/gi;
      const match = content.match(sqlRegex);
      if (match) sql = match[0].trim();
    }

    if (!sql) return { sql: null, error: null };

    // Write Protection
    const forbiddenKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"];
    const isWriteOperation = forbiddenKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, "i").test(sql!)
    );

    if (isWriteOperation) {
      return { sql, error: "Modification operations are not allowed. Only data retrieval is permitted." };
    }

    return { sql, error: null };
  } catch (err) {
    return { sql: null, error: "Internal error during SQL extraction." };
  }
}

/**
 * Persistent Connection Logic
 */
async function initDB(): Promise<void> {
  try {
    await client.connect(transport);
    console.log("🟢 Connected to Postgres via MCP");
  } catch (err) {
    console.error("🔴 MCP Connection Error: Backend will fail to execute queries.");
  }
}
initDB();

/**
 * Main API Route with comprehensive error handling
 */
app.post('/api/chat', async (req: Request, res: Response<ApiResponse>) => {
  // 1. Guard against empty body
  const { userGoal } = req.body as ChatRequestBody;
  if (!userGoal) {
    return res.status(400).json({ assistantText: "Invalid prompt: No input provided.", data: null });
  }

  try {
    // 2. Tool listing guard
    let tools: any[] = [];
    try {
      const toolSet = await client.listTools();
      tools = toolSet.tools;
    } catch (e) {
      console.error("MCP Tool List Error:", e);
    }
    
    // 3. Ollama Chat Execution
    const response = await callOllamaChat({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a SQL expert. 
DATABASE SCHEMA:
- 'employee' table: id (int), name (text), age (int), email (text)
- 'address' table: id (int), city (text), state (text), employee_id (ARRAY of integers)

CRITICAL JOIN RULE: 
The 'address.employee_id' column is a PostgreSQL ARRAY. 
Use: SELECT * FROM employee e JOIN address a ON e.id = ANY(a.employee_id);

STRICT RULE: Only use SELECT queries. If the request involves adding, changing, or deleting data, respond that it is not allowed.`
        },
        { role: 'user', content: userGoal }
      ],
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema
        }
      }))
    });

    const msg = response.message;
    const toolArgs = msg.tool_calls?.[0]?.function?.arguments;
    const { sql: sqlToRun, error: validationError } = extractAndValidateSQL(msg.content || "", toolArgs);

    // 4. Handle Validation Errors (Mutations)
    if (validationError) {
      return res.json({ 
        assistantText: validationError, 
        sql: sqlToRun, 
        data: null 
      });
    }

      // 5. Query Execution Guard
    if (sqlToRun) {
      try {
        const result = await client.callTool({ 
          name: "query", 
          arguments: { sql: sqlToRun } 
        });
        
        let dbData: any = null;
        if (Array.isArray(result.content) && result.content[0]?.type === 'text') {
            const textValue = (result.content[0] as { text: string }).text;
            try { 
              dbData = JSON.parse(textValue); 
            } catch { 
              dbData = textValue; 
            }
        }

        // --- NEW: NULL / EMPTY CHECK ---
        // If dbData is null, undefined, or an empty array, return "0" or a specific prompt
        if (!dbData || (Array.isArray(dbData) && dbData.length === 0)) {
          return res.json({ 
            assistantText: "No records found matching your criteria (Result: 0).",
            sql: sqlToRun, 
            data: 0 // Explicitly return 0 as requested
          });
        }

        return res.json({ 
          assistantText: "Query executed successfully.",
          sql: sqlToRun, 
          data: dbData 
        });
        
      } catch (dbErr: any) {
        return res.json({ 
          assistantText: `Database Error: The query failed.`,
          sql: sqlToRun,
          error: dbErr.message,
          data: null 
        });
      }
    }
      else {
      // Conversational response or invalid query logic
      return res.json({ 
        assistantText: msg.content || "I'm sorry, I couldn't generate a valid query for that request.", 
        data: null 
      });
    }

  } catch (err: any) {
    console.error("General Chat Error:", err);
    // Return a safe error instead of crashing
    return res.status(200).json({ 
      assistantText: "Invalid prompt or internal processing error. Please try a different request.", 
      data: null 
    });
  }
});

/**
 * Global Uncaught Exception Catchers
 */
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));