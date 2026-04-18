# AIEXPENSER (v1.0) - MASTER PROJECT CONTEXT

Single source of truth for AI Assistant/IDE. Always refer to these rules, schemas, and exact CSS classes before generating any code.

# IMPORTANT

always refer to the aiexpenser-screens.htnl file for the ui design and layout.
project running on port 4000

## 1. CORE PHILOSOPHY & TECH STACK

- **Philosophy:** Privacy-First, 100% manual entry. No bank SMS reading, no bank credentials stored (Key differentiator from competitors).
- **Frontend:** React + Vite, Tailwind CSS (Custom classes strictly mapped), Radix UI (for 12 modals), Redux Toolkit. Feature-wise folder structure (`src/components/budget/`, etc.).
- **Backend:** Node.js + Express, MongoDB + Mongoose ODM, JWT + Bcrypt for Auth.
- **i18n:** i18next configured with `en.json` and `hi.json`.

## 2. PLANS, LIMITS & BUSINESS RULES

- **Basic (Free):** Max 2 accounts (+1 Cash auto-created), 3 months history, 3 budgets, 10 custom categories.
- **Pro (₹99/mo):** Unlimited everything. Unlocks Formal Loans, Recurring, Net Worth, Credit Card Cycles, and Exports.
- **Trial:** 14-day Pro trial on signup. Tracked via `isTrialUsed` flag to prevent re-use.
- **Pro Guard:** Every Pro feature needs a backend middleware check + frontend visual badge/lock.
- **Compliance:** Strictly DPDP Act 2023 compliant (30-day data retention policy).
- **Cash Account:** Auto-created on signup. 1 per user. Cannot be deleted or disabled.

## 3. UNIVERSAL TRANSACTION MODEL (No Separate Ledger)

We do NOT use a Ledger model. The `TransactionModel` handles all cash flows. Use exact types mapping to UI badges:

- `expense` (UI: `.txn-type-badge.expense` - Red)
- `income` (UI: `.txn-type-badge.income` - Green)
- `transfer` (UI: `.txn-type-badge.transfer` - Blue/Accent)
- `debt` (UI: `.txn-type-badge.debt` - Amber)
- `repayment` (UI: `.txn-type-badge.repayment` - Purple)
  _Status UI:_ `.status-dot.cleared` (Green) vs `.status-dot.pending` (Amber).

## 4. DATABASE SCHEMAS (MONGOOSE MAP)

Match these fields to the corresponding frontend components:

- **`userModel`:** `plan` ('basic'/'pro'), `isTrialUsed`, `onboardingDone`.
- **`settingsModel`:** `language`, `currency`, `fiscalYear` (APR-MAR default).
- **`accountModel`:** `accountType` (must match UI: 'bank', 'cash', 'credit', 'investment', 'ewallet'). Keep a `currentBalance` updated automatically. `isDefault` flag. Pro CCs need `creditLimit`, `statementDay`, `dueDay`.
- **`transactionModel`:** `type` (expense/income/transfer/debt/repayment), `amount`, `accountId`, `targetAccountId` (for transfers), `categoryId`. For debts: `counterparty`, `debtAction` (lent/borrowed mapped to `.direction-badge.lent` / `.borrowed`).
- **`budgetModel` (Pro):** `categoryId`, `amount`, `period`. UI maps spent vs total to `.progress-fill` states: `.safe` (Green), `.warn` (Amber), `.over` (Red).
- **`formalLoanModel` & `loanScheduleModel` (Pro):** Tracks `principal`, `interestRate`, `tenure`. Schedule outputs to `.amort-table` (columns: `.interest`, `.principal`, and `.paid-row`).
- **`recurringModel` (Pro):** `frequency`, `amount`, `nextDueDate`, `isActive` (Mapped to `.toggle.on` / `.toggle.off`).
- **`assetModel` (Pro):** `name`, `assetType` (investment/physical), `currentValue`.

## 5. FRONTEND UI & CSS CLASS RULES

When generating UI, strictly use the pre-defined CSS classes from our HTML design:

- **App Layout:** Use `.app-layout`, `.sidebar`, `.main-content`, and `.topbar`. Pro upgrade button is `.btn-upgrade`.
- **Modals:** Use `.modal-overlay` and `.modal`. Header uses `.modal-title`. Form grids use `.modal-grid`. Amount inputs must use `.amount-wrap` and `.amount-input`. Tabs use `.modal-tabs`.
- **Forms & Buttons:** Inputs use `.form-input`. Primary buttons use `.btn-primary` or `.btn-save`. Danger actions use `.danger-zone` and `.btn-danger`.
- **Cards & Stats:** Use `.card` and `.kpi-card`. Colors mapped via `.blue`, `.green`, `.red`, `.amber`, `.purple`.
- **Dashboard Widgets:** Upcoming items must use `.due-chip` (`.urgent` for red, `.soon` for amber, `.ok` for green).
- **Icons & Badges:** Use `.feat-icon`, `.nav-icon`, `.icon-btn`. Debt status badges are `.active` (amber), `.settled` (green), `.partial` (purple).

## 6. SCREENS INVENTORY (29 Total)

Use `Radix UI Dialog` for all 12 Modals. Don't modify global layouts when generating inner pages.

- **Pages (17):** Auth (SignIn/SignUp), Onboarding (Welcome, Prefs, FirstAcc, Trial), Dashboard, Transactions, Accounts, Budget, Recurring, Loans-Personal Debt, Loans-Formal Loans, Loan Details, Net Worth, Reports, Settings.
- **Modals (12):** Add/Edit Transaction, Account, Category, Party, Budget, Recurring, Formal Loan, Pay EMI, Prepayment Calc, Add Asset, Debt Settlement, Delete Account Confirm.
