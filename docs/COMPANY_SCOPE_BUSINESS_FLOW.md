# Company scope – business flow

This document describes how the platform uses **one selected company** so that **all data** (dashboard, analytics, workforce/promoters, contracts) belongs to that company. This is required for correct business handling.

---

## 1. Login and initial company

- On login, the app loads the user’s companies via **GET /api/user/companies**.
- The API sets the user’s **active company** when needed:
  - If the profile has no `active_company_id` but the user has at least one company, the API sets `active_company_id` to the **first company** they can access.
- The **company switcher** in the header shows:
  - The current active company, or
  - “No company” / “Retry” if the list failed to load or the user has no companies.
- So after login, the system **automatically** has a company context when the user has access to at least one company.

---

## 2. Selecting a company (switcher)

- When the user **selects a company** in the switcher:
  1. **POST /api/user/companies/switch** is called with the chosen `company_id`.
  2. The server updates **profiles.active_company_id** for that user.
  3. The frontend updates the company context and refetches data (e.g. React Query invalidation).
- From that moment, **all company-scoped APIs** use this `active_company_id` to filter data.

---

## 3. What is scoped by the selected company

Everything below uses the **active company** (resolved to the correct `party_id` or `company_id` where needed):

| Area | What is filtered | How |
|------|------------------|-----|
| **Promoters (workforce)** | List, detail, create | `employer_id` = active company’s party_id |
| **Contracts** | List, metrics, analytics | `first_party_id` / `second_party_id` = active company’s party_id |
| **Dashboard** | Promoter metrics (totals, active, alerts, compliance) | Same party_id for promoters/contracts |
| **Analytics** | Contract analytics, employer-promoters | Same resolution (shared `resolveActiveCompanyToPartyId`) |
| **Other company-scoped features** | HR, workflows, team, etc. | Use `active_company_id` as `company_id` where the table has `company_id` |

So: **one selected company → one set of data**. Dashboard, analytics, workforce (promoters), and contracts all fit that company.

---

## 4. Technical note: “party as company”

- A user’s “company” can be:
  - A row in **companies** (with `party_id` pointing to a party), or
  - A **party** used directly as the company (no company row; `active_company_id` is the party id).
- All company-scoped APIs that filter by **party** (promoters, contracts, dashboard metrics, analytics) use the shared helper **`resolveActiveCompanyToPartyId()`** in `lib/company-scope.ts`, which:
  - Treats `active_company_id` as a **party id** when it refers to an Employer party, and
  - Otherwise resolves **companies.party_id** for the given company id.
- This keeps behaviour consistent for both “normal” companies and “party as company”.

---

## 5. Summary for business

- **Login:** The system knows which company to use (from profile or first available company).
- **Switcher:** User can change company; the app and backend use that selection everywhere.
- **Data:** Dashboard, analytics, workforce (promoters), and contracts all show only data that **belongs to the selected company**, so the system is safe and correct for business use.
