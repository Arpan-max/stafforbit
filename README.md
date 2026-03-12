# 🌍 StaffOrbit - Enterprise Resource & Remote Team Management

StaffOrbit is a Multi-Tenant SaaS platform designed to handle the entire lifecycle of remote teams and outsourced hires. It empowers managers to track workforce utilization, manage bench leakage, onboard staff via bulk CSV, and intelligently deploy consultants to projects using advanced optimization algorithms.

## 🏗️ Core Architecture & Security

StaffOrbit is built as a **Multi-Tenant** application. This means multiple different companies can use the app simultaneously, but their data is completely isolated from one another.



* **Database (Supabase/PostgreSQL):** Uses strict **Row Level Security (RLS)**. Every table (`profiles`, `consultants`, `projects`, `companies`) has a `company_id`. RLS policies ensure that a manager logged in for "TechNova" mathematically cannot query or view data belonging to "DataCorp".
* **Ghost User Invitation Flow:** Managers can add staff members to their directory before the staff member even creates an account. A custom Supabase PostgreSQL Trigger (`handle_new_user`) listens for new sign-ups. If the email matches a "Ghost User", it automatically links their new secure `auth_id` to their pre-existing company profile.
* **Global Auth Context:** React's Context API (`AuthContext.jsx`) globally manages the user session, actively fetching the `company_id` and `role` upon login so redundant database calls are avoided across the app.

---

## 🗺️ Pages Breakdown

### 1. Login Page (`/login`)
* **File:** `src/pages/Login.jsx`
* **Functionality:** Handles secure authentication using Supabase's `signInWithPassword`. It provides inline error handling for incorrect credentials and immediately redirects authenticated users to the main dashboard.

### 2. Executive Dashboard (`/`)
* **File:** `src/pages/Dashboard.jsx`
* **Functionality:** The financial and operational command center. 
* **Logic:** It loops through all company consultants to calculate real-time metrics:
  * **Daily Bench Leakage:** Total daily cost of consultants whose `available_from` date is today or in the past.
  * **Utilization Rate:** The percentage of staff actively deployed vs. sitting on the bench.
  * **15-Day Risk:** Calculates how much capital will hit the bench in the next 15 days based on project end dates.
* **UI:** Uses `Recharts` to display a bar chart comparing "Deployed (Safe)" capital vs. "On Bench (Leakage)" capital.

### 3. Resource Directory (`/consultants`)
* **File:** `src/pages/Consultants.jsx`
* **Functionality:** A comprehensive list of the company's workforce.
* **Features:**
  * **Smart Search:** Filters consultants by name or specific skills (e.g., "React").
  * **Availability Badging:** Compares the consultant's `available_from` date to the current date to render visual badges ("Available Now" or "In X Days").
  * **Integration:** Hosts the `AddConsultantModal` and `BulkImport` components for workforce expansion.

### 4. Deployment Optimizer (`/projects`)
* **File:** `src/pages/Projects.jsx`
* **Functionality:** The interface for the Genetic Algorithm. Managers select an active project from a dropdown. The page fetches the project's required skills, maximum daily budget, and start date, then feeds this data into the algorithm to generate the perfect team.

---

## 🧩 Components Breakdown

* **`ManagerLayout.jsx`:** The wrapper component for all authenticated routes. It features a responsive sidebar navigation that collapses into a hamburger menu on mobile devices. Handles secure logout routing.
* **`AddConsultantModal.jsx`:** A modal form for manually adding a single staff member. It securely inserts a record into the `profiles` table first to generate an ID, then inserts the related skills and cost data into the `consultants` table.
* **`BulkImport.jsx`:** Powered by `PapaParse`, this component allows managers to upload a `.csv` file (Name, Email, Level, Cost, Skills). It processes the file row-by-row, inserting multiple staff members at once and providing a success/error summary.
* **`AuthContext.jsx`:** The security guard of the app. It wraps the entire application, listens for Supabase session changes, and restricts unauthenticated users from viewing secure routes in `App.jsx`.

---

## 🧬 The Hybrid Deployment Optimizer (Algorithm)

Assigning the perfect team involves balancing multiple competing variables (Skills, Budget, Availability). Checking every single mathematical combination of a 100-person agency would crash a browser. StaffOrbit solves this using a **Hybrid Optimizer** located in `src/utils/geneticAlgorithm.js`.



### Stage 1: The Exact Solver (For teams < 20 people)
If the company has a small workforce, the algorithm uses a highly optimized **Bitwise Exact Match Algorithm** (a variation of the Knapsack problem). It evaluates every possible team combination in milliseconds to guarantee absolute mathematical perfection.

### Stage 2: The Genetic Algorithm (For teams > 20 people)
If the workforce is large, checking every combination takes too long. The system automatically switches to a **Genetic Algorithm** inspired by evolutionary biology:

1. **The Chromosome:** A potential "Team" is represented as a binary array. (e.g., `[1, 0, 1]` means Consultant 1 and 3 are hired, but 2 is not).
2. **Generation 0:** We generate 50 random teams. To ensure the algorithm doesn't get stuck, we inject a "Heuristic Seed" (a team containing anyone who has at least one matching skill).
3. **The Fitness Function (Scoring):** Each team is given a score:
   * **Hard Constraints:** If the team costs more than the budget, has no members, or includes someone who is busy, they score `0` (instant disqualification).
   * **Skill Reward:** The team receives a massive point bonus (+50,000) for every required skill they successfully cover.
   * **Cost Penalty:** The total daily cost is subtracted from the score, forcing the algorithm to prefer cheaper teams that still meet the requirements.
4. **Evolution (Crossover & Mutation):** The top 50% of scoring teams survive. They are "bred" together by combining their binary arrays. A 10% mutation rate randomly flips `0`s to `1`s to maintain genetic diversity.
5. **The Result:** After 50 generations of evolution, the single highest-scoring chromosome is decoded back into a list of Consultants and presented to the Manager.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite
* **Routing:** React Router v6
* **Styling:** Tailwind CSS v4
* **Icons & Charts:** Lucide React, Recharts
* **Data Parsing:** PapaParse
* **Backend & Auth:** Supabase (PostgreSQL, GoTrue Auth)

---

## 🚀 Setup Instructions for Developers

1. Clone the repository and run `npm install`.
2. Create a `.env` file with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Ensure your Supabase database is configured with the StaffOrbit SQL schema.
4. Run `node seed.js` to populate the database with Multi-Tenant test data.
5. Run `npm run dev` to start the local development server.

---
*Developed as a comprehensive SaaS solution for modern remote workforce management.*