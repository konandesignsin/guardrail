## guardrail

Found **27** issues across 16 files.

| Severity | Category | File | Issue |
|----------|----------|------|-------|
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:3` | Supabase service_role key found: eyJh**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:4` | OpenAI API key hardcoded: sk-F**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:5` | Stripe secret key hardcoded: sk_l**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:6` | AWS access key hardcoded: AKIA**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:7` | Google API key hardcoded: AIza**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:8` | GitHub personal access token hardcoded: ghp_**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:9` | Generic API key hardcoded: API_**** |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:9` | Secret in public env variable: VITE_this-is-a-fake-api-key-for-testing... |
| 🔴 high | security | `test-fixtures\vulnerable-app\.env:10` | Secret in public env variable: VITE_this-should-not-be-in-public-env... |
| 🔴 high | security | `test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:21` | Policy with USING (true) allows all reads |
| 🔴 high | security | `test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:26` | Policy with WITH CHECK (true) allows all writes |
| 🔴 high | security | `test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:8` | Table "posts" created without Row Level Security |
| 🔴 high | security | `test-fixtures\vulnerable-app\src\App.tsx:9` | Dangerous delete() without filter — affects all rows |
| 🔴 high | security | `test-fixtures\vulnerable-app\src\App.tsx:17` | Admin status determined in client code |
| 🟡 medium | security | `test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:28` | Public storage bucket created |
| 🟡 medium | security | `test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:1` | Table "users" has RLS enabled but no policies |
| 🔵 low | quality | `src\checks\quality.ts:103` | TODO comment in source code |
| 🔵 low | quality | `src\cli.ts:21` | console.log left in source code |
| 🔵 low | quality | `src\cli.ts:31` | console.log left in source code |
| 🔵 low | quality | `src\cli.ts:36` | console.log left in source code |
| 🔵 low | quality | `test-fixtures\vulnerable-app\src\App.tsx:21` | console.log left in source code |
| 🔵 low | quality | `test-fixtures\vulnerable-app\src\App.tsx:23` | TODO comment in source code |
| 🔵 low | quality | `test-fixtures\vulnerable-app\src\App.tsx:24` | FIXME comment in source code |
| 🔵 low | quality | `src\action.ts:1` | File is never imported by any other file |
| 🔵 low | quality | `src\cli.ts:1` | File is never imported by any other file |
| 🔵 low | quality | `test-fixtures\vulnerable-app\src\App.tsx:1` | File is never imported by any other file |
| 🔵 low | quality | `test-fixtures\vulnerable-app\src\orphan.ts:1` | File is never imported by any other file |

<details>
<summary>Details & fixes</summary>

### secrets-003 — Supabase service_role key found: eyJh****
- **File:** test-fixtures\vulnerable-app\.env:3
- **Severity:** high | **Category:** security
- **Why it matters:** The service_role key bypasses Row Level Security and has full database access. If exposed in client code, anyone can read/write/delete all your data.
- **Fix:** Use the anon key in client code. Only use service_role in secure server-side environments (Node.js backend, Edge Functions with care).

### secrets-004 — OpenAI API key hardcoded: sk-F****
- **File:** test-fixtures\vulnerable-app\.env:4
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-004 — Stripe secret key hardcoded: sk_l****
- **File:** test-fixtures\vulnerable-app\.env:5
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-004 — AWS access key hardcoded: AKIA****
- **File:** test-fixtures\vulnerable-app\.env:6
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-004 — Google API key hardcoded: AIza****
- **File:** test-fixtures\vulnerable-app\.env:7
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-004 — GitHub personal access token hardcoded: ghp_****
- **File:** test-fixtures\vulnerable-app\.env:8
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-004 — Generic API key hardcoded: API_****
- **File:** test-fixtures\vulnerable-app\.env:9
- **Severity:** high | **Category:** security
- **Why it matters:** Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.
- **Fix:** Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).

### secrets-005 — Secret in public env variable: VITE_this-is-a-fake-api-key-for-testing...
- **File:** test-fixtures\vulnerable-app\.env:9
- **Severity:** high | **Category:** security
- **Why it matters:** VITE_ and NEXT_PUBLIC_ variables are embedded in your client-side JavaScript bundle. Anyone can view them by inspecting your website, even if they're "hidden" in config files.
- **Fix:** Never put secrets in VITE_ or NEXT_PUBLIC_ variables. Use server-side environment variables or a backend API to handle sensitive operations.

### secrets-005 — Secret in public env variable: VITE_this-should-not-be-in-public-env...
- **File:** test-fixtures\vulnerable-app\.env:10
- **Severity:** high | **Category:** security
- **Why it matters:** VITE_ and NEXT_PUBLIC_ variables are embedded in your client-side JavaScript bundle. Anyone can view them by inspecting your website, even if they're "hidden" in config files.
- **Fix:** Never put secrets in VITE_ or NEXT_PUBLIC_ variables. Use server-side environment variables or a backend API to handle sensitive operations.

### supabase-001 — Policy with USING (true) allows all reads
- **File:** test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:21
- **Severity:** high | **Category:** security
- **Why it matters:** USING (true) means any authenticated user can read all rows in this table. This is like having no security on your data at all.
- **Fix:** Replace with a proper condition:
  USING (auth.uid() = user_id)
This ensures users can only read their own data.

### supabase-002 — Policy with WITH CHECK (true) allows all writes
- **File:** test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:26
- **Severity:** high | **Category:** security
- **Why it matters:** WITH CHECK (true) means any user can insert or update any row. Someone could modify or delete data that doesn't belong to them.
- **Fix:** Replace with a proper condition:
  WITH CHECK (auth.uid() = user_id)
This ensures users can only modify their own data.

### supabase-004 — Table "posts" created without Row Level Security
- **File:** test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:8
- **Severity:** high | **Category:** security
- **Why it matters:** Without RLS, any authenticated user can read and write all data in this table. This is the #1 security mistake in Supabase apps.
- **Fix:** Add this after your CREATE TABLE:
  ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

### supabase-006 — Dangerous delete() without filter — affects all rows
- **File:** test-fixtures\vulnerable-app\src\App.tsx:9
- **Severity:** high | **Category:** security
- **Why it matters:** Calling .delete() without .eq() or .filter() will delete every row in the table. One bug could wipe out all your data.
- **Fix:** Always add a filter:
  .delete()
  .eq('id', targetId)
This ensures you only affect the specific row you intend to.

### supabase-008 — Admin status determined in client code
- **File:** test-fixtures\vulnerable-app\src\App.tsx:17
- **Severity:** high | **Category:** security
- **Why it matters:** Anyone can open browser dev tools and change localStorage to set isAdmin=true. Client-side checks are not security — they're just UI hints. Real authorization must happen on the server.
- **Fix:** Check admin status server-side using Supabase RLS policies or Edge Functions. Example:
  CREATE POLICY "Admins only"
  ON sensitive_table
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

### supabase-003 — Public storage bucket created
- **File:** test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:28
- **Severity:** medium | **Category:** security
- **Why it matters:** Public buckets allow anyone to read uploaded files without authentication. If users upload sensitive documents or photos, they become publicly accessible.
- **Fix:** Set public to false unless the bucket truly needs public access:
  INSERT INTO storage.buckets (id, public) VALUES ('avatars', false);

### supabase-005 — Table "users" has RLS enabled but no policies
- **File:** test-fixtures\vulnerable-app\supabase\migrations\001_initial.sql:1
- **Severity:** medium | **Category:** security
- **Why it matters:** RLS with no policies means NO ONE can access the table — not even the owner. Your app will get "permission denied" errors.
- **Fix:** Create at least one policy:
  CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

### quality-003 — TODO comment in source code
- **File:** src\checks\quality.ts:103
- **Severity:** low | **Category:** quality
- **Why it matters:** TODOs and FIXMEs are easy to forget. If this was important enough to note, it should be tracked in your issue tracker where it won't be lost.
- **Fix:** Either fix the issue now or create a ticket in your issue tracker and reference it: // TODO #123

### quality-002 — console.log left in source code
- **File:** src\cli.ts:21
- **Severity:** low | **Category:** quality
- **Why it matters:** Debug logs clutter the console in production and can expose sensitive data. They also signal unfinished code to other developers.
- **Fix:** Remove the console.log or use a proper logging library with log levels that can be disabled in production.

### quality-002 — console.log left in source code
- **File:** src\cli.ts:31
- **Severity:** low | **Category:** quality
- **Why it matters:** Debug logs clutter the console in production and can expose sensitive data. They also signal unfinished code to other developers.
- **Fix:** Remove the console.log or use a proper logging library with log levels that can be disabled in production.

### quality-002 — console.log left in source code
- **File:** src\cli.ts:36
- **Severity:** low | **Category:** quality
- **Why it matters:** Debug logs clutter the console in production and can expose sensitive data. They also signal unfinished code to other developers.
- **Fix:** Remove the console.log or use a proper logging library with log levels that can be disabled in production.

### quality-002 — console.log left in source code
- **File:** test-fixtures\vulnerable-app\src\App.tsx:21
- **Severity:** low | **Category:** quality
- **Why it matters:** Debug logs clutter the console in production and can expose sensitive data. They also signal unfinished code to other developers.
- **Fix:** Remove the console.log or use a proper logging library with log levels that can be disabled in production.

### quality-003 — TODO comment in source code
- **File:** test-fixtures\vulnerable-app\src\App.tsx:23
- **Severity:** low | **Category:** quality
- **Why it matters:** TODOs and FIXMEs are easy to forget. If this was important enough to note, it should be tracked in your issue tracker where it won't be lost.
- **Fix:** Either fix the issue now or create a ticket in your issue tracker and reference it: // TODO #123

### quality-003 — FIXME comment in source code
- **File:** test-fixtures\vulnerable-app\src\App.tsx:24
- **Severity:** low | **Category:** quality
- **Why it matters:** TODOs and FIXMEs are easy to forget. If this was important enough to note, it should be tracked in your issue tracker where it won't be lost.
- **Fix:** Either fix the issue now or create a ticket in your issue tracker and reference it: // TODO #123

### quality-007 — File is never imported by any other file
- **File:** src\action.ts:1
- **Severity:** low | **Category:** quality
- **Why it matters:** Orphan files are dead code. They add to bundle size (if imported elsewhere) or confusion about what the project actually does.
- **Fix:** If the file is truly unused, delete it. If it should be used, import it where needed.

### quality-007 — File is never imported by any other file
- **File:** src\cli.ts:1
- **Severity:** low | **Category:** quality
- **Why it matters:** Orphan files are dead code. They add to bundle size (if imported elsewhere) or confusion about what the project actually does.
- **Fix:** If the file is truly unused, delete it. If it should be used, import it where needed.

### quality-007 — File is never imported by any other file
- **File:** test-fixtures\vulnerable-app\src\App.tsx:1
- **Severity:** low | **Category:** quality
- **Why it matters:** Orphan files are dead code. They add to bundle size (if imported elsewhere) or confusion about what the project actually does.
- **Fix:** If the file is truly unused, delete it. If it should be used, import it where needed.

### quality-007 — File is never imported by any other file
- **File:** test-fixtures\vulnerable-app\src\orphan.ts:1
- **Severity:** low | **Category:** quality
- **Why it matters:** Orphan files are dead code. They add to bundle size (if imported elsewhere) or confusion about what the project actually does.
- **Fix:** If the file is truly unused, delete it. If it should be used, import it where needed.

</details>