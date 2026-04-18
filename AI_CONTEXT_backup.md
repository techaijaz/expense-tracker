# AI_CONTEXT — aiexpenser

> Single source of truth for Antigravity IDE. Read this before any task.
> Last updated: April 2026 | Version: 1.0

---

# IMPORTANT

always refer to the aiexpenser-screens.htnl file for the ui design and layout.
project running on port 4000

## STACK

| Layer    | Tech                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| Frontend | React + Vite, Tailwind, Radix UI, Redux Toolkit, Recharts, Redux Persist (localStorage) |
| Backend  | Node.js + Express, JWT + Bcrypt, Winston logging, Joi validation                        |
| Database | MongoDB + Mongoose ODM                                                                  |
| Auth     | Email/password + Google OAuth, JWT (short expiry + refresh token)                       |
| i18n     | i18next — `src/locales/en.json` + `src/locales/hi.json`                                 |

---

## PLANS & LIMITS

|            | Basic (Free)       | Pro (₹99/mo or ₹799/yr)    |
| ---------- | ------------------ | -------------------------- |
| Accounts   | 2 (+ 1 cash, auto) | Unlimited                  |
| History    | 3 months           | Unlimited                  |
| Budgets    | 3                  | Unlimited                  |
| Categories | 10 custom          | Unlimited + sub-categories |
| Features   | Core only          | All modules below          |

**Trial:** 14-day Pro trial on signup, no credit card. `isTrialUsed` flag prevents re-use.

---

## MODULES OVERVIEW

| Module                 | Plan                                | Status                    |
| ---------------------- | ----------------------------------- | ------------------------- |
| Accounts               | Both                                | Update existing           |
| Transactions           | Both                                | Update existing           |
| Categories             | Both                                | Update existing           |
| Personal Debt (Udhar)  | Both                                | Update existing           |
| Formal Loans           | Pro                                 | NEW                       |
| Budget                 | Pro                                 | NEW                       |
| Recurring Transactions | Pro                                 | NEW                       |
| Credit Card Cycle      | Pro                                 | NEW                       |
| Net Worth Dashboard    | Pro                                 | NEW                       |
| Reports & Analytics    | Both (limited)                      | Update existing           |
| Export (CSV/JSON)      | Pro                                 | NEW                       |
| Notifications          | Basic: email only / Pro: push+email | NEW                       |
| Settings               | Both                                | Update existing           |
| Onboarding (4 screens) | Both                                | NEW                       |
| Auth                   | Both                                | Update (add Google OAuth) |

---

## DATABASE SCHEMAS

### userModel.js — ADD FIELDS

```js
plan: { type: String, enum: ['basic','pro'], default: 'basic' }
trialStart: Date
trialEnd: Date
isTrialUsed: { type: Boolean, default: false }
onboardingDone: { type: Boolean, default: false }
googleId: String
```

### accountModel.js — ADD FIELDS

```js
isCash: { type: Boolean, default: false }   // 1 per user, auto-created, cannot delete
creditLimit: Number                          // credit card only
statementDay: Number                         // 1-31, credit card only
dueDay: Number                               // 1-31, credit card only
minPaymentPercent: { type: Number, default: 5 }
```

### settingsModel.js — NEW (1:1 with user)

```js
userId: ObjectId (ref: User, unique)
language: { enum: ['en','hi'], default: 'en' }
currency: { default: 'INR' }
dateFormat: { enum: ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD'], default: 'DD/MM/YYYY' }
decimalPlaces: { default: 2 }
theme: { enum: ['dark','light','system'], default: 'dark' }
accentColor: { default: 'blue' }
fiscalYear: { enum: ['APR-MAR','JAN-DEC'], default: 'APR-MAR' }
```

### formalLoanModel.js — NEW

```js
userId, loanType: enum['car','home','personal','education','other']
lenderName, principal, interestRate, tenureMonths, emiAmount
startDate, processingFee, disbursementAccountId (ref: Account)
outstandingBalance, emisPaid: {default:0}
status: enum['active','closed','foreclosed']
```

### loanScheduleModel.js — NEW (auto-generated on loan creation)

```js
loanId, userId, emiNumber, dueDate
emiAmount, principalComponent, interestComponent
openingBalance, closingBalance
status: enum['pending','paid','overdue']
paidDate, paidAmount, transactionId (ref: Transaction)
```

### budgetModel.js — NEW

```js
userId, categoryId, amount
period: enum['monthly','weekly','yearly']
alertThreshold: {default: 80}  // percent
rolloverType: enum['none','rollover','savings']
isActive: {default: true}
```

### budgetPeriodModel.js — NEW (auto-created each period)

```js
budgetId, userId, periodStart, periodEnd
allocated, spent: {default:0}, carriedForward: {default:0}
```

### recurringModel.js — NEW

```js
userId, type: enum['expense','income','transfer']
amount, accountId, targetAccountId (transfer only), categoryId, description
frequency: enum['daily','weekly','monthly','quarterly','halfyearly','yearly']
entryType: enum['auto','reminder']
startDate, endDate, nextDueDate, lastProcessed
isActive: {default: true}
```

### creditCardCycleModel.js — NEW

```js
(userId, accountId, cycleStart, cycleEnd);
(totalSpend, billAmount, dueDate);
paymentStatus: enum[('unpaid', 'minimum_paid', 'fully_paid')];
(paymentDate, paymentAmount);
```

### assetModel.js — NEW (Net Worth)

```js
userId, name
assetType: enum['investment','physical']
currentValue, purchaseValue, purchaseDate, notes
isActive: {default: true}
```

### netWorthSnapshotModel.js — NEW

```js
(userId, snapshotDate, totalAssets, totalLiabilities, netWorth);
breakdown: {
  (liquid,
    investments,
    physical,
    receivables,
    formalLoans,
    creditCards,
    personalDebt);
}
```

---

## API ENDPOINTS

### Settings

```
GET  /api/settings
PUT  /api/settings
```

### Onboarding

```
POST /api/onboarding/complete
POST /api/onboarding/skip
```

### Formal Loans

```
GET    /api/formal-loans
POST   /api/formal-loans
GET    /api/formal-loans/:id
PUT    /api/formal-loans/:id
DELETE /api/formal-loans/:id
GET    /api/formal-loans/:id/schedule
POST   /api/formal-loans/:id/pay-emi
POST   /api/formal-loans/:id/prepay
```

### Budget

```
GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
GET    /api/budgets/summary          // current period
```

### Recurring

```
GET    /api/recurring
POST   /api/recurring
PUT    /api/recurring/:id
DELETE /api/recurring/:id
PATCH  /api/recurring/:id/pause
PATCH  /api/recurring/:id/resume
GET    /api/recurring/upcoming       // next 30 days
```

### Credit Card Cycle

```
GET  /api/cc-cycles/:accountId
GET  /api/cc-cycles/:accountId/current
POST /api/cc-cycles/:accountId/pay
```

### Net Worth

```
GET    /api/networth
GET    /api/networth/history
POST   /api/networth/assets
PUT    /api/networth/assets/:id
DELETE /api/networth/assets/:id
POST   /api/networth/snapshot
```

---

## SCREENS (29 total)

| #   | Screen                 | Type  | Status |
| --- | ---------------------- | ----- | ------ |
| 1   | Sign In                | Page  | Update |
| 2   | Sign Up                | Page  | Update |
| 3   | Onboarding Welcome     | Page  | NEW    |
| 4   | Step — Preferences     | Page  | NEW    |
| 5   | Step — First Account   | Page  | NEW    |
| 6   | Step — Pro Trial Offer | Page  | NEW    |
| 7   | Dashboard              | Page  | Update |
| 8   | Transactions           | Page  | Update |
| 9   | Accounts               | Page  | Update |
| 10  | Budget                 | Page  | NEW    |
| 11  | Recurring Transactions | Page  | NEW    |
| 12  | Loans — Personal Debt  | Page  | Update |
| 13  | Loans — Formal Loans   | Page  | NEW    |
| 14  | Loan Detail + Schedule | Page  | NEW    |
| 15  | Net Worth Dashboard    | Page  | NEW    |
| 16  | Reports & Analytics    | Page  | Update |
| 17  | Settings               | Page  | Update |
| 18  | Add/Edit Transaction   | Modal | Update |
| 19  | Add/Edit Account       | Modal | Update |
| 20  | Add/Edit Category      | Modal | Update |
| 21  | Add/Edit Party         | Modal | Update |
| 22  | Add Budget             | Modal | NEW    |
| 23  | Add Recurring          | Modal | NEW    |
| 24  | Add Formal Loan        | Modal | NEW    |
| 25  | Pay EMI                | Modal | NEW    |
| 26  | Prepayment Calculator  | Modal | NEW    |
| 27  | Add Asset (Net Worth)  | Modal | NEW    |
| 28  | Debt Settlement        | Modal | Update |
| 29  | Delete Account Confirm | Modal | Exists |

---

## FILE STRUCTURE

### Backend — New Files

```
backend/src/model/settingsModel.js
backend/src/model/formalLoanModel.js
backend/src/model/loanScheduleModel.js
backend/src/model/budgetModel.js
backend/src/model/budgetPeriodModel.js
backend/src/model/recurringModel.js
backend/src/model/creditCardCycleModel.js
backend/src/model/assetModel.js
backend/src/model/netWorthSnapshotModel.js
backend/src/controller/settingsController.js
backend/src/controller/formalLoanController.js
backend/src/controller/budgetController.js
backend/src/controller/recurringController.js
backend/src/controller/creditCardController.js
backend/src/controller/netWorthController.js
backend/src/router/settingsRouter.js
backend/src/router/formalLoanRouter.js
backend/src/router/budgetRouter.js
backend/src/router/recurringRouter.js
backend/src/router/creditCardRouter.js
backend/src/router/netWorthRouter.js
backend/src/jobs/recurringJob.js           ← cron job for auto-entry
```

### Backend — Modify/Delete

```
backend/src/model/userModel.js             ← add: plan, trial, onboardingDone, googleId
backend/src/model/accountModel.js          ← add: isCash, creditLimit, statementDay, dueDay
backend/src/model/assetModel.js            ← DELETE (old, unused)
backend/src/model/businessModel.js         ← DELETE (old, unused)
backend/src/router/index.js                ← register all new routers
```

### Frontend — New Files

```
src/components/onboarding/Onboarding.jsx
src/components/onboarding/StepPreferences.jsx
src/components/onboarding/StepAccount.jsx
src/components/onboarding/StepTrial.jsx
src/components/budget/Budget.jsx
src/components/budget/BudgetCard.jsx
src/components/budget/AddBudgetPopup.jsx
src/components/recurring/Recurring.jsx
src/components/recurring/AddRecurringPopup.jsx
src/components/networth/NetWorth.jsx
src/components/networth/AssetCard.jsx
src/components/networth/AddAssetPopup.jsx
src/components/loans/FormalLoans.jsx
src/components/loans/LoanDetail.jsx
src/components/loans/AddFormalLoanPopup.jsx
src/components/loans/PayEmiPopup.jsx
src/components/loans/PrepaymentCalc.jsx
src/redux/settingsSlice.js
src/redux/budgetSlice.js
src/redux/recurringSlice.js
src/redux/netWorthSlice.js
src/locales/en.json
src/locales/hi.json
src/schema/formalLoanSchema.js
src/schema/budgetSchema.js
src/schema/recurringSchema.js
```

### Frontend — Modify

```
src/components/SignIn.jsx                   ← UI redesign + Google OAuth
src/components/SignUp.jsx                   ← UI redesign + Google OAuth
src/components/Dashboard.jsx               ← add: budget, loans, net worth widgets
src/components/Transections.jsx            ← add: notes/tags, pending status, advanced filters
src/components/Accounts.jsx                ← add: credit card cycle, isCash rule enforcement
src/components/Loans.jsx                   ← split: PersonalDebt + FormalLoans tabs
src/components/settings/RegionalSpecs.jsx  ← add: language, date format, fiscal year
src/components/TransectionPopup.jsx        ← add: notes, tags, pending status
src/redux/reducer.js                        ← register new slices + persist config
src/routes/ProtectedRoute.jsx              ← onboarding redirect logic
src/App.jsx                                ← new routes: budget, recurring, networth, onboarding
```

---

## DEVELOPMENT PHASES

```
Phase 1 — Foundation Fix
  - Delete: assetModel.js, businessModel.js
  - Update userModel + accountModel
  - Create settingsModel + controller + router
  - Auto-create Cash account + default settings on signup
  - settingsSlice (Redux)
  - Register all routers in index.js

Phase 2 — Core Updates
  - TransactionModel: add notes, tags, pending, recurringId
  - TransactionPopup: notes/tags/pending UI
  - Transactions page: advanced filters
  - Settings page: language, date format, fiscal year
  - Reports: advanced analytics, date range, drill down
  - Accounts: isCash rule, credit card fields
  - i18n: install i18next + en.json + hi.json
  - Onboarding: 4 screens + skip logic
  - ProtectedRoute: onboarding redirect

Phase 3 — New Features (Backend)
  - Formal Loan: models + EMI amortization utility + controller + router
  - Budget: models + controller + router
  - Recurring: model + controller + router + cron job
  - Credit Card Cycle: model + controller + router
  - Net Worth: models + controller + router

Phase 4 — New Features (Frontend)
  - Formal Loan: FormalLoans + LoanDetail + 3 modals + loanSlice
  - Budget: Budget + BudgetCard + AddBudgetPopup + budgetSlice
  - Recurring: Recurring + AddRecurringPopup + recurringSlice
  - Credit Card Cycle: integrate into Accounts page
  - Net Worth: NetWorth + AssetCard + AddAssetPopup + netWorthSlice
  - Dashboard: budget widgets, loan overview, net worth card
  - Sidebar: Budget + Recurring + Net Worth links

Phase 5 — Polish & Launch
  - UI redesign: all screens
  - Pro/Basic enforcement (middleware + frontend guards)
  - 14-day trial logic
  - Notifications: browser push + email
  - DPDP Act compliance: deletion + export
  - Performance + bug fixes
  - Mobile responsive check
```

---

## BUSINESS RULES

- **Cash account:** Auto-created on signup. 1 per user. Cannot be deleted or disabled.
- **Basic account limit:** Max 2 accounts (excluding cash).
- **Credit card:** Only Pro users. Needs `creditLimit`, `statementDay`, `dueDay`.
- **Pro guard:** Every Pro feature needs middleware check + frontend lock.
- **Trial:** 14 days, no CC required. `isTrialUsed = true` after first activation.
- **Data deletion:** DPDP Act 2023 — 30-day soft delete, then permanent.
- **Security:** HTTPS only, bcrypt passwords, never store CVV/OTP/UPI PIN.
- **Onboarding skip:** Direct to dashboard, no reminder banners. Default settings auto-apply.
- **Fiscal year:** APR-MAR (default) or JAN-DEC, user-configurable.

---

## DEFAULTS (applied on signup)

```
dateFormat: DD/MM/YYYY
currency: INR
decimalPlaces: 2
theme: dark
language: English
cashAccount: auto-created
defaultCategories: Food, Transport, Shopping, Bills, Health, Entertainment, Other
```

---

## COMPETITORS (for context)

| Feature               | aiexpenser | MoneyView | Walnut | YNAB   |
| --------------------- | ---------- | --------- | ------ | ------ |
| No bank access needed | ✅         | ❌        | ❌     | ✅     |
| Formal loan tracking  | ✅         | ❌        | ❌     | ❌     |
| Personal debt (Udhar) | ✅         | ❌        | ❌     | ❌     |
| Hindi language        | ✅         | ❌        | ❌     | ❌     |
| Price                 | Free/₹99   | Free      | Free   | ~₹2000 |

**Key differentiator:** No bank credentials ever — full privacy, manual entry.

---

**Frontend folder structure:** Feature-wise organized — each feature gets its own folder under `src/components/`. Example: `src/components/budget/`, `src/components/loans/`, `src/components/networth/`. Never dump components in root `src/components/` unless they are truly global (shared UI, layout, etc.).

_When working on a task, reference the relevant section above. Don't ask for context already present here._
