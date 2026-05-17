# AlgoVision Database Schema

This document outlines the database schema for AlgoVision, hosted on Supabase (PostgreSQL).

## 1. `users` Table
Stores user profiles, roles, and streak statistics.

| Column Name        | Type                     | Constraints                                  | Description |
| ------------------ | ------------------------ | -------------------------------------------- | ----------- |
| `id`               | `UUID`                   | PRIMARY KEY, References `auth.users(id)`     | Unique identifier, automatically links to Supabase Auth. |
| `email`            | `TEXT`                   | UNIQUE, NOT NULL                             | User's email address. |
| `full_name`        | `TEXT`                   | NULL                                         | User's full name. |
| `role`             | `TEXT`                   | DEFAULT 'user'                               | RBAC role for the user (e.g., user, admin). |
| `created_at`       | `TIMESTAMP WITH TIME ZONE`| DEFAULT `now()`                             | Timestamp of account creation. |
| `updated_at`       | `TIMESTAMP WITH TIME ZONE`| DEFAULT `now()`                             | Timestamp of the last profile update. |
| `current_streak`   | `INTEGER`                | DEFAULT 0                                    | The user's current consecutive days of practice. |
| `longest_streak`   | `INTEGER`                | DEFAULT 0                                    | The user's longest consecutive days of practice. |
| `last_active_date` | `DATE`                   | NULL                                         | The last UTC date the user submitted a practice problem. |

---

## 2. `algorithm_runs` Table
Stores performance execution metrics for algorithm visualizer runs.

| Column Name         | Type                     | Constraints                                  | Description |
| ------------------- | ------------------------ | -------------------------------------------- | ----------- |
| `id`                | `BIGINT`                 | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY    | Unique run identifier. |
| `user_id`           | `UUID`                   | References `users(id)`, ON DELETE CASCADE    | The user who executed the run. |
| `algorithm`         | `TEXT`                   | NOT NULL                                     | The specific algorithm name (e.g., `array_search`). |
| `data_structure`    | `TEXT`                   | NOT NULL                                     | The data structure used (e.g., `Array`, `Linked List`). |
| `operation`         | `TEXT`                   | NOT NULL                                     | The operation type (e.g., `search`, `insert`, `delete`). |
| `input_size`        | `INTEGER`                | NOT NULL                                     | The size of the dataset operated on. |
| `execution_time_ms` | `FLOAT`                  | NOT NULL                                     | Total execution time in milliseconds. |
| `memory_usage_kb`   | `FLOAT`                  | NOT NULL                                     | Approximate memory usage in kilobytes. |
| `operation_count`   | `INTEGER`                | NOT NULL                                     | Total number of atomic steps/comparisons executed. |
| `ran_at`            | `TIMESTAMP WITH TIME ZONE`| DEFAULT `now()`                             | The time the algorithm run was completed. |

---

## 3. `practice_attempts` Table
Logs submissions for coding practice problems.

| Column Name         | Type                     | Constraints                                  | Description |
| ------------------- | ------------------------ | -------------------------------------------- | ----------- |
| `id`                | `BIGINT`                 | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY    | Unique attempt identifier. |
| `user_id`           | `UUID`                   | References `users(id)`, ON DELETE CASCADE    | The user who submitted the code. |
| `problem_id`        | `INTEGER`                | NOT NULL                                     | The ID of the practice problem. |
| `submitted_code`    | `TEXT`                   | NOT NULL                                     | The raw source code submitted by the user. |
| `language_id`       | `INTEGER`                | NOT NULL                                     | The Judge0 language ID used for compilation. |
| `status`            | `TEXT`                   | NOT NULL                                     | The result status (e.g., `Accepted`, `Wrong Answer`). |
| `stdout`            | `TEXT`                   | NULL                                         | Standard output from the execution. |
| `stderr`            | `TEXT`                   | NULL                                         | Standard error or compilation traces. |
| `execution_time_ms` | `FLOAT`                  | NULL                                         | Execution time measured by Judge0. |
| `memory_usage_kb`   | `FLOAT`                  | NULL                                         | Memory footprint measured by Judge0. |
| `attempted_at`      | `TIMESTAMP WITH TIME ZONE`| DEFAULT `now()`                             | The timestamp of submission. |

---

## 4. `reports` Table
Tracks PDF performance reports generated by the user.

| Column Name    | Type                     | Constraints                                  | Description |
| -------------- | ------------------------ | -------------------------------------------- | ----------- |
| `id`           | `BIGINT`                 | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY    | Unique report identifier. |
| `user_id`      | `UUID`                   | References `users(id)`, ON DELETE CASCADE    | The user who generated the report. |
| `generated_at` | `TIMESTAMP WITH TIME ZONE`| DEFAULT `now()`                             | The timestamp the PDF was generated. |
| `download_url` | `TEXT`                   | NOT NULL                                     | The API endpoint path to download the raw PDF. |
| `metadata`     | `JSONB`                  | DEFAULT '{}'::jsonb                          | Additional parameters (e.g., algorithms included). |

---

## Row Level Security (RLS) Policies
- All tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- Users can only `SELECT`, `INSERT`, `UPDATE` their own data matching `auth.uid() = user_id`.
- Supabase Service Role (used by backend) automatically bypasses RLS for system operations.
