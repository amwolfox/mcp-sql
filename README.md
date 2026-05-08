# MCP SQL - AI-Powered Database Query Interface

A full-stack application that combines AI language models with the Model Context Protocol (MCP) to enable natural language database queries. Ask questions in plain English, and the system automatically generates and executes SQL queries.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Features](#features)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

MCP SQL is an intelligent database interface that leverages AI to bridge the gap between natural language and SQL. Instead of writing complex SQL queries, users can simply describe what data they need, and the system intelligently:

1. **Understands** the natural language request
2. **Generates** appropriate SQL queries
3. **Validates** queries for safety and permissions
4. **Executes** queries against PostgreSQL
5. **Returns** results in a user-friendly format

### Key Use Cases

- Business analysts querying data without SQL knowledge
- Rapid prototyping and data exploration
- Self-service data retrieval
- Educational tool for learning SQL through examples

---

## 🏗️ Architecture

### System Flow

```
User Request (Natural Language)
    ↓
Frontend (Next.js)
    ↓
Backend Express Server
    ↓
Ollama LLM (qwen2.5-coder)
    ↓
MCP PostgreSQL Server
    ↓
PostgreSQL Database
```

### Components

1. **Frontend**: Next.js React application for user interaction
2. **Backend**: Express.js server managing API requests and MCP communication
3. **LLM**: Ollama running qwen2.5-coder model for SQL generation
4. **Database**: PostgreSQL with MCP protocol for safe query execution
5. **MCP**: Model Context Protocol providing standardized tool interface

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **AI Model**: Ollama (qwen2.5-coder)
- **Database Protocol**: Model Context Protocol (MCP)
- **Database**: PostgreSQL

### Frontend
- **Framework**: Next.js 15+
- **UI**: React with TypeScript
- **Styling**: CSS Modules / Tailwind CSS
- **HTTP Client**: Fetch API

### Infrastructure
- **Port**: Backend on 3001, Frontend on 3000
- **CORS**: Enabled for cross-origin requests

---

## 📁 Project Structure

```
mcp sql/
├── backend/
│   ├── server.ts           # Main Express server with MCP integration
│   ├── package.json        # Backend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── notes               # Development notes
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx      # Root layout component
│   │   ├── page.tsx        # Main chat interface
│   │   └── globals.css     # Global styles
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   ├── next.config.ts      # Next.js configuration
│   ├── eslint.config.mjs   # ESLint rules
│   └── postcss.config.mjs  # PostCSS configuration
│
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (with npm or yarn)
- **Python**: 3.8+ (for virtual environment, optional)
- **PostgreSQL**: 12+ running locally
- **Ollama**: Installed with qwen2.5-coder model
- **Git**: For version control

### Quick Start

1. **Clone and Navigate**
   ```bash
   cd "your folder"
   ```

2. **Configure Environment**
   ```bash
   # Backend - create .env from example
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your database credentials
   nano backend/.env  # or open in your editor
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend (in new terminal)
   cd frontend && npm install
   ```

4. **Start Backend**
   ```bash
   cd backend
   npx ts-node server.ts
   # Expected output: 🚀 Backend running on http://localhost:3001
   ```

5. **Start Frontend** (in new terminal)
   ```bash
   cd frontend
   npm run dev
   # Access at http://localhost:3000
   ```

---

## 🔧 Backend Setup

### Environment Configuration

Create a `.env` file in the `backend/` directory with your configuration:

```bash
# Copy from example file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://mesut@localhost:5432/springbootmicroservicesdemo

# Server Configuration
PORT=3001

# LLM Model Configuration
LLM_MODEL=qwen2.5-coder
```

**Available Variables**:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://mesut@localhost:5432/springbootmicroservicesdemo` |
| `PORT` | Express server port | `3001` |
| `LLM_MODEL` | Ollama model name | `qwen2.5-coder` |

**Connection String Format**:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

⚠️ **Security Note**: Never commit `.env` to version control. It's listed in `.gitignore` by default.

### MCP Server Initialization

The backend launches a PostgreSQL MCP server via stdio:

```typescript
const transport = new StdioClientTransport({
  command: "sh",
  args: ["-c", `PG_READ_ONLY=false npx -y @modelcontextprotocol/server-postgres "${DB_CONFIG}"`]
});
```

**Note**: `PG_READ_ONLY=false` allows write operations (if needed). The backend restricts mutations through validation.

### Key Features

- ✅ **Automatic SQL Extraction**: Parses LLM output for SQL commands
- ✅ **Write Protection**: Blocks INSERT, UPDATE, DELETE, ALTER, etc.
- ✅ **Error Handling**: Comprehensive try-catch blocks with user-friendly messages
- ✅ **Connection Persistence**: Maintains long-lived MCP connection
- ✅ **CORS Support**: Allows frontend requests

### Database Connection

Verify PostgreSQL is running:

```bash
psql -U mesut -h localhost -d springbootmicroservicesdemo
```

---

## 🎨 Frontend Setup

### Project Structure

The Next.js frontend provides a chat-like interface for querying the database.

### Running Development Server

```bash
cd frontend
npm run dev
```

Access at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

---

## 📡 API Documentation

### Endpoint: `/api/chat`

**Method**: `POST`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```typescript
{
  "userGoal": "Find all employees in New York"
}
```

**Response**:
```typescript
{
  "assistantText": string,        // Human-readable response
  "sql": string | null,           // Generated SQL query (if any)
  "data": any,                    // Query results or null
  "error": string | null          // Error message (if any)
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userGoal": "How many employees are there?"}'
```

**Example Response**:
```json
{
  "assistantText": "Query executed successfully.",
  "sql": "SELECT COUNT(*) FROM employee;",
  "data": [{"count": 150}]
}
```

### Error Responses

| Status | Scenario |
|--------|----------|
| 400 | No input provided (`userGoal` missing) |
| 200 | Query execution with safe/unsafe results |

---

## 📊 Database Schema

### Employee Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | integer | PRIMARY KEY, generated by default as identity | Auto-incrementing ID |
| name | character varying(255) | | Employee name |
| age | integer | | Employee age |
| email | character varying(255) | | Employee email address |

**SQL Definition**:
```sql
CREATE TABLE employee (
  id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  name character varying(255),
  age integer,
  email character varying(255)
);
```

### Address Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | integer | PRIMARY KEY, generated by default as identity | Auto-incrementing ID |
| city | character varying(255) | | City name |
| state | character varying(255) | | State abbreviation |
| employee_id | integer[] | | PostgreSQL ARRAY of employee IDs |

**SQL Definition**:
```sql
CREATE TABLE address (
  id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  city character varying(255),
  state character varying(255),
  employee_id integer[] -- PostgreSQL ARRAY type
);
```

### Key Join Pattern

Since `address.employee_id` is a PostgreSQL ARRAY, use the `ANY` operator:

```sql
-- Find all addresses and their associated employees
SELECT e.id, e.name, e.email, a.city, a.state
FROM employee e 
JOIN address a ON e.id = ANY(a.employee_id);

-- Find all employees with addresses in a specific state
SELECT e.id, e.name, a.city, a.state
FROM employee e 
JOIN address a ON e.id = ANY(a.employee_id)
WHERE a.state = 'NY';
```

### Sample Data (for Testing)

Insert this dummy data into your database for testing:

```sql
-- Insert sample employees
INSERT INTO employee (name, age, email) VALUES
('John Smith', 28, 'john.smith@example.com'),
('Sarah Johnson', 34, 'sarah.johnson@example.com'),
('Michael Brown', 45, 'michael.brown@example.com'),
('Emily Davis', 29, 'emily.davis@example.com'),
('Robert Wilson', 52, 'robert.wilson@example.com'),
('Jessica Martinez', 31, 'jessica.martinez@example.com'),
('David Anderson', 38, 'david.anderson@example.com'),
('Lisa Taylor', 26, 'lisa.taylor@example.com'),
('James Thomas', 41, 'james.thomas@example.com'),
('Amanda Jackson', 35, 'amanda.jackson@example.com');

-- Insert sample addresses (employee_id is an ARRAY)
INSERT INTO address (city, state, employee_id) VALUES
('New York', 'NY', ARRAY[1, 2, 3]),
('Los Angeles', 'CA', ARRAY[4, 5]),
('Chicago', 'IL', ARRAY[6, 7, 8]),
('Houston', 'TX', ARRAY[9]),
('Phoenix', 'AZ', ARRAY[10]),
('Philadelphia', 'PA', ARRAY[1, 4]),
('San Antonio', 'TX', ARRAY[2, 5, 7]),
('San Diego', 'CA', ARRAY[3, 6]);
```

**To load this data**:

```bash
psql -U mesut -h localhost -d springbootmicroservicesdemo << 'EOF'
-- Insert sample employees
INSERT INTO employee (name, age, email) VALUES
('John Smith', 28, 'john.smith@example.com'),
('Sarah Johnson', 34, 'sarah.johnson@example.com'),
('Michael Brown', 45, 'michael.brown@example.com'),
('Emily Davis', 29, 'emily.davis@example.com'),
('Robert Wilson', 52, 'robert.wilson@example.com'),
('Jessica Martinez', 31, 'jessica.martinez@example.com'),
('David Anderson', 38, 'david.anderson@example.com'),
('Lisa Taylor', 26, 'lisa.taylor@example.com'),
('James Thomas', 41, 'james.thomas@example.com'),
('Amanda Jackson', 35, 'amanda.jackson@example.com');

-- Insert sample addresses
INSERT INTO address (city, state, employee_id) VALUES
('New York', 'NY', ARRAY[1, 2, 3]),
('Los Angeles', 'CA', ARRAY[4, 5]),
('Chicago', 'IL', ARRAY[6, 7, 8]),
('Houston', 'TX', ARRAY[9]),
('Phoenix', 'AZ', ARRAY[10]),
('Philadelphia', 'PA', ARRAY[1, 4]),
('San Antonio', 'TX', ARRAY[2, 5, 7]),
('San Diego', 'CA', ARRAY[3, 6]);
EOF
```

### Example Queries

```sql
-- Get all employees
SELECT * FROM employee;

-- Count employees by age
SELECT age, COUNT(*) FROM employee GROUP BY age;

-- Find all addresses with their employees
SELECT a.city, a.state, e.name, e.email
FROM address a
JOIN employee e ON e.id = ANY(a.employee_id)
ORDER BY a.city;

-- Find employees in New York
SELECT e.name, e.email, a.city, a.state
FROM employee e
JOIN address a ON e.id = ANY(a.employee_id)
WHERE a.state = 'NY';

-- Find employees older than 30
SELECT name, age, email FROM employee WHERE age > 30;

-- Find addresses with multiple employees
SELECT city, state, array_length(employee_id, 1) as employee_count
FROM address
WHERE array_length(employee_id, 1) > 1;

-- Count total employees in each state
SELECT a.state, COUNT(DISTINCT e.id) as employee_count
FROM address a
JOIN employee e ON e.id = ANY(a.employee_id)
GROUP BY a.state
ORDER BY employee_count DESC;
```

---

## ✨ Features

### Security & Validation

- 🔒 **Write Protection**: Blocks all modification queries (INSERT, UPDATE, DELETE, ALTER, CREATE, TRUNCATE)
- 🛡️ **SQL Injection Prevention**: Validates SQL through MCP query execution
- ⚠️ **Error Messages**: User-friendly error responses
- 🚫 **Strict Permission Model**: Read-only database operations

### SQL Extraction

The backend employs robust multi-stage SQL extraction:

1. **Direct Arguments**: Checks `args.sql`
2. **JSON Parsing**: Extracts from embedded JSON
3. **Markdown Code Blocks**: Parses ` ```sql ``` ` format
4. **Regex Matching**: Identifies SQL keywords and statements

### Database Operations

- ✅ SELECT queries (full support)
- ✅ Complex joins with ARRAY columns
- ✅ WHERE clauses and filtering
- ✅ Aggregations (COUNT, SUM, AVG, etc.)
- ❌ Data mutations (blocked by design)

### Error Handling

- Handles MCP connection failures gracefully
- Catches database execution errors
- Returns empty result set (value: 0) for no records
- Provides detailed error context in responses

---

## ⚙️ Configuration

### Backend Configuration

Edit `backend/server.ts`:

```typescript
// Database connection
const DB_CONFIG = "postgresql://USER@HOST:PORT/DATABASE";

// LLM model selection
const MODEL = "qwen2.5-coder";

// Server port
const PORT = 3001;
```

### System Prompt

The backend uses this system prompt for the LLM:

```
You are a SQL expert. 
DATABASE SCHEMA:
- 'employee' table: id (integer), name (character varying), age (integer), email (character varying)
- 'address' table: id (integer), city (character varying), state (character varying), employee_id (integer ARRAY)

CRITICAL JOIN RULE: 
The 'address.employee_id' column is a PostgreSQL ARRAY. 
Use: SELECT * FROM employee e JOIN address a ON e.id = ANY(a.employee_id);

STRICT RULE: Only use SELECT queries. If the request involves adding, changing, or deleting data, respond that it is not allowed.
```

### Frontend Configuration

Edit `frontend/next.config.ts`:

```typescript
// API endpoint configuration
const API_BASE_URL = "http://localhost:3001";
```

---

## 🔐 Security

### Write Protection Implementation

The `extractAndValidateSQL()` function blocks dangerous operations:

```typescript
const forbiddenKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"];

if (forbiddenKeywords.some(keyword => 
  new RegExp(`\\b${keyword}\\b`, "i").test(sql)
)) {
  return { 
    sql, 
    error: "Modification operations are not allowed. Only data retrieval is permitted." 
  };
}
```

### Best Practices

1. **Database User Permissions**: Configure PostgreSQL user with SELECT-only permissions
2. **Network Security**: Use VPN/firewall to protect database connections
3. **Input Validation**: LLM provides guardrails through system prompts
4. **Rate Limiting**: Consider implementing in production
5. **Logging**: Monitor all query attempts and errors

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `MCP Connection Error`

**Solution**:
```bash
# Verify MCP server is installed
npx -y @modelcontextprotocol/server-postgres --version

# Check PostgreSQL is running
psql -h localhost -U mesut -d springbootmicroservicesdemo -c "SELECT 1"
```

### Database Connection Failed

**Error**: `ECONNREFUSED`

**Steps**:
1. Verify PostgreSQL service is running
2. Check connection string in `server.ts`
3. Confirm user credentials
4. Test connection manually: `psql -U mesut -h localhost`

### Frontend Can't Reach Backend

**Error**: `CORS error` or `fetch failed`

**Solutions**:
- Verify backend is running on port 3001
- Check CORS headers are set in Express
- Ensure frontend is using correct API URL
- Check browser console for detailed errors

### SQL Extraction Not Working

**Issues & Fixes**:

| Symptom | Cause | Fix |
|---------|-------|-----|
| Always returns "0" results | SQL not extracted | Check LLM output format |
| Wrong query generated | Ambiguous prompt | Provide more specific requirements |
| Blocked mutation errors | User requests INSERT/UPDATE | Remind user system is read-only |

### Ollama Model Issues

**Ensure model is available**:
```bash
ollama pull qwen2.5-coder
ollama list  # Verify installation
```

---

## 📝 Development Notes

### Adding New Database Tables

1. Update system prompt in `backend/server.ts`
2. Document schema in this README
3. Test queries manually
4. Verify LLM generates correct JOIN syntax

### Extending Backend Features

- Add logging/monitoring
- Implement query caching
- Add authentication middleware
- Support multiple database backends

### Frontend Enhancements

- Add query history
- Implement result pagination
- Add export functionality (CSV, JSON)
- Improve UI/UX with charts

---

## 🤝 Contributing

To improve this project:

1. Test new features thoroughly
2. Update documentation
3. Maintain TypeScript type safety
4. Follow existing code style
5. Add error handling for edge cases

---

## 📄 License

This project is provided as-is for educational and development purposes.

---

## 📞 Support

For issues or questions:

1. Check the Troubleshooting section
2. Review backend logs for detailed errors
3. Test database connectivity separately
4. Verify all prerequisites are installed

---

## 🎓 Learning Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Ollama Documentation](https://ollama.ai/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)

---

**Last Updated**: May 2026  
**Status**: Active Development