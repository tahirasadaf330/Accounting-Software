# SaaS Double Entry Accounting Software - Feature Specification

## Table of Contents

1. [User Roles and Access Control](#1-user-roles-and-access-control)
2. [Organization and Tenant Management](#2-organization-and-tenant-management)
3. [Chart of Accounts](#3-chart-of-accounts)
4. [Core Accounting Features](#4-core-accounting-features)
5. [Bank Reconciliation](#5-bank-reconciliation)
6. [Voucher and Transaction Management](#6-voucher-and-transaction-management)
7. [Trial Balance](#7-trial-balance)
8. [Statement of Account](#8-statement-of-account)
9. [AI/ML-Powered Features](#9-aiml-powered-features)
10. [Multi-Currency and Multi-Company Support](#10-multi-currency-and-multi-company-support)
11. [Tax Compliance and Automation](#11-tax-compliance-and-automation)
12. [Advanced Reporting and Dashboards](#12-advanced-reporting-and-dashboards)
13. [Audit Trail and Compliance](#13-audit-trail-and-compliance)
14. [Integration Capabilities](#14-integration-capabilities)
15. [Automation Features](#15-automation-features)
16. [Collaboration Features](#16-collaboration-features)
17. [Security Features](#17-security-features)
18. [Mobile Capabilities](#18-mobile-capabilities)
19. [Document Management](#19-document-management)
20. [Budgeting and Forecasting](#20-budgeting-and-forecasting)
21. [Inventory Management](#21-inventory-management)
22. [API Access for Third-Party Integrations](#22-api-access-for-third-party-integrations)
23. [Real-Time Notifications and Alerts](#23-real-time-notifications-and-alerts)
24. [Data Import/Export Capabilities](#24-data-importexport-capabilities)
25. [Multi-Language Support](#25-multi-language-support)
26. [White-Labeling Options](#26-white-labeling-options)
27. [Invoicing and Accounts Receivable](#27-invoicing-and-accounts-receivable)
28. [Bills and Accounts Payable](#28-bills-and-accounts-payable)
29. [Payroll Integration](#29-payroll-integration)
30. [Fixed Asset Management](#30-fixed-asset-management)

---

## 1. User Roles and Access Control

### 1.1 Predefined Roles

| Role | Description | Scope |
|------|-------------|-------|
| **Owner** | Full access to all features, settings, billing, and data. Can manage users and assign roles. | Organization-wide |
| **Chief Accountant** | Full access to accounting functions, reports, and settings. Can approve transactions and manage accountants. Cannot access billing or organization settings. | Accounting-wide |
| **Accountant** | Can create, edit, and post transactions, generate reports, and manage day-to-day accounting tasks. Cannot approve high-value transactions or modify system settings. | Assigned modules |

### 1.2 Custom Roles (Competitive Feature)

- Ability to create custom roles with granular, feature-level permissions
- Permissions configurable per module (e.g., Invoicing: Create, Edit, Delete, Approve)
- Account-level restrictions (limit access to specific accounts or cost centers)
- Transaction amount thresholds (e.g., Accountant can approve up to $5,000; above requires Chief Accountant)
- Time-based access (temporary roles for auditors or consultants)
- Read-only viewer role for stakeholders who only need report access

### 1.3 Role Hierarchy and Delegation

- Configurable approval chains based on role hierarchy
- Delegation of authority during absence (vacation mode)
- Role activity logs showing actions performed by each role

---

## 2. Organization and Tenant Management

### 2.1 Super Admin Portal

- Centralized dashboard to manage all organizations/tenants
- Create, suspend, and deactivate organizations
- Monitor usage metrics per organization (storage, transactions, users)
- System-wide announcements and notifications
- Subscription and billing management per organization
- Global system configuration (allowed features per plan tier)

### 2.2 Multi-Tenant Architecture

- Complete data isolation between organizations
- Per-tenant database or schema-level separation
- Tenant-specific configuration (fiscal year, currency, tax settings)
- Tenant onboarding wizard with guided setup
- Tenant data backup and restore capabilities

### 2.3 Subscription and Plan Management

- Multiple plan tiers (Free, Starter, Professional, Enterprise)
- Feature gating per plan tier
- Usage-based limits (number of users, transactions, storage)
- Upgrade/downgrade workflows with prorated billing
- Trial period management with automatic expiration handling

---

## 3. Chart of Accounts

### 3.1 4-Level Hierarchy Structure

```
Level 1: Account Category    (e.g., Assets)
Level 2: Account Group       (e.g., Current Assets)
Level 3: Account Sub-Group   (e.g., Bank Accounts)
Level 4: Account Detail      (e.g., ABC Bank - Operating Account)
```

### 3.2 Account Types

| Type | Description | Normal Balance |
|------|-------------|----------------|
| **Assets** | Resources owned by the business | Debit |
| **Liabilities** | Obligations owed by the business | Credit |
| **Equity** | Owner's interest in the business | Credit |
| **Revenue** | Income earned from operations | Credit |
| **Cost of Goods Sold** | Direct costs of producing goods/services | Debit |
| **Expenses** | Costs incurred in operations | Debit |

### 3.3 Account Features

- Unique account code with configurable numbering scheme (e.g., 1000-1999 for Assets)
- Account status: Active, Inactive, Frozen
- System-generated default chart of accounts (based on industry templates)
- Custom account creation with validation rules
- Prevent deletion of accounts with existing transactions
- Account merging utility for consolidation
- Tags and classifications for dimensional reporting
- Sub-ledger linking (AR, AP, Inventory, Fixed Assets)
- Account-level notes and descriptions
- Opening balance entry during setup

### 3.4 Industry-Specific Templates (Competitive Feature)

- Pre-built chart of accounts templates for common industries:
  - Retail / E-Commerce
  - Manufacturing
  - Services / Consulting
  - Healthcare
  - Real Estate
  - Non-Profit
  - Technology / SaaS
- Customizable templates that can be modified post-creation

---

## 4. Core Accounting Features

### 4.1 General Ledger

- Complete double-entry bookkeeping engine
- Automatic balancing validation (debits must equal credits)
- Multi-period posting with period open/close controls
- Fiscal year definition (calendar or custom)
- Period locking to prevent backdated entries
- Year-end closing entries with retained earnings calculation
- Reversing entries for accruals

### 4.2 Journal Entries

- Manual journal entry creation with multi-line support
- Automatic journal entries from sub-modules (invoicing, bills, payroll)
- Recurring journal entries on configurable schedules
- Journal entry templates for frequently used entries
- Attachment support for supporting documents
- Approval workflow for journal entries above threshold amounts
- Narration/memo field per line item
- Journal entry reversal capability
- Auto-numbering with configurable prefix and sequence

### 4.3 Accounts Receivable

- Customer master with complete contact and billing information
- Invoice generation and management (see Section 27)
- Payment recording and allocation
- Credit notes and refunds
- Customer aging reports (30/60/90/120 days)
- Customer statement generation
- Dunning letters and payment reminders
- Credit limit management per customer
- Customer-level discount rules

### 4.4 Accounts Payable

- Vendor/supplier master with contact and payment details
- Bill/invoice entry and management (see Section 28)
- Payment processing and allocation
- Debit notes
- Vendor aging reports
- Payment scheduling and batch payments
- Vendor credit tracking
- Early payment discount tracking (e.g., 2/10 Net 30)

### 4.5 Cash Management

- Cash book for tracking cash transactions
- Petty cash management with custodian assignment
- Cash flow statement (direct and indirect method)
- Cash position dashboard showing real-time balances
- Inter-account transfers with automatic double-entry posting

### 4.6 Financial Statements

- **Balance Sheet** (Statement of Financial Position)
  - Classified format (Current/Non-Current)
  - Comparative periods
  - Configurable grouping and subtotals
- **Income Statement** (Profit & Loss)
  - Multi-step format
  - By period, department, project, or cost center
  - Budget vs. actual comparison
- **Cash Flow Statement**
  - Direct and indirect methods
  - Automatic classification of operating, investing, and financing activities
- **Statement of Changes in Equity**
  - Tracking of capital contributions, withdrawals, and retained earnings
- **Notes to Financial Statements**
  - Configurable disclosure templates

---

## 5. Bank Reconciliation

### 5.1 Manual Reconciliation

- Upload bank statement files (CSV, OFX, QIF, MT940, CAMT.053)
- Side-by-side comparison of bank transactions and book entries
- One-click matching for exact amount matches
- Manual matching for partial or combined transaction matches
- Adjustment entries for bank charges, interest, and errors
- Reconciliation status tracking per bank account per period
- Reconciliation summary report showing matched, unmatched, and adjusted items

### 5.2 Automated Reconciliation (Competitive Feature)

- AI-powered fuzzy matching using amount, date, and description patterns
- Rule-based auto-matching with user-defined criteria
- Machine learning that improves matching accuracy over time based on user corrections
- Batch processing of large statement files
- Exception handling workflow for unmatched items
- Auto-creation of missing entries (bank charges, interest) with approval

### 5.3 Real-Time Bank Feeds (Competitive Feature)

- Open Banking API integration for live transaction feeds
- Support for major banks via aggregators (Plaid, TrueLayer, Salt Edge, Yodlee)
- Automatic daily synchronization of bank transactions
- Real-time balance verification
- Multi-bank support within a single organization
- Secure token-based authentication with bank institutions

### 5.4 Reconciliation Reports

- Bank reconciliation statement (per account, per period)
- Outstanding checks report
- Deposits in transit report
- Reconciliation history and audit trail
- Unreconciled items aging report

---

## 6. Voucher and Transaction Management

### 6.1 Voucher Types

| Voucher Type | Purpose | Auto-Generated Entries |
|-------------|---------|----------------------|
| **Payment Voucher** | Record payments made | Debit Expense/Liability, Credit Bank/Cash |
| **Receipt Voucher** | Record payments received | Debit Bank/Cash, Credit Revenue/Asset |
| **Journal Voucher** | General adjustments and transfers | User-defined debit and credit entries |
| **Contra Voucher** | Fund transfers between accounts | Debit Target Account, Credit Source Account |
| **Sales Voucher** | Record sales transactions | Debit AR/Cash, Credit Revenue + Tax Liability |
| **Purchase Voucher** | Record purchase transactions | Debit Expense/Inventory + Tax Asset, Credit AP/Cash |
| **Credit Note** | Sales returns or adjustments | Reverse of Sales Voucher |
| **Debit Note** | Purchase returns or adjustments | Reverse of Purchase Voucher |

### 6.2 Voucher Features

- Auto-numbering with configurable prefix per voucher type (e.g., PV-2026-0001)
- Multi-line entries with account, amount, description per line
- Mandatory balancing (total debits must equal total credits)
- Date validation against open fiscal periods
- Attachment of supporting documents (PDF, images)
- Narration field for transaction description
- Reference number for external document linking
- Cost center and project allocation per line item
- Tax code application per line item
- Voucher printing with customizable templates
- Voucher duplication for recurring transactions
- Draft/pending/approved/posted status workflow

### 6.3 Voucher Approval Workflow (Competitive Feature)

- Multi-level approval based on amount thresholds
- Role-based approval routing
- Email/push notification for pending approvals
- Bulk approval capability
- Rejection with reason and return to originator
- Approval delegation during absence
- Complete approval audit trail

---

## 7. Trial Balance

### 7.1 Trial Balance Reports

- Standard trial balance (all accounts with debit/credit balances)
- Adjusted trial balance (post-adjusting entries)
- Post-closing trial balance (after year-end close)
- Comparative trial balance (current vs. prior period)
- Consolidated trial balance (multi-entity)

### 7.2 Trial Balance Features

- Filter by date range, account group, account type
- Drill-down from trial balance to individual transactions
- Zero-balance account show/hide toggle
- Inactive account show/hide toggle
- Export to PDF, Excel, CSV
- Automatic validation of total debits equaling total credits
- Variance highlighting for significant period-over-period changes
- Multi-currency trial balance with translated amounts

---

## 8. Statement of Account

### 8.1 Customer Statement of Account

- Detailed transaction listing for a specific customer over a period
- Opening balance, transactions, and closing balance
- Aging summary (current, 30, 60, 90, 120+ days)
- Multiple formats: itemized, summary, balance forward
- Automatic generation and email distribution
- Customizable branding and layout
- Support for multiple currencies per customer

### 8.2 Vendor Statement of Account

- Mirror of customer statement for vendor/supplier accounts
- Reconciliation with vendor statements
- Payment history and outstanding balance tracking

### 8.3 General Account Statement

- Transaction history for any general ledger account
- Running balance calculation
- Filter by date range, transaction type, and amount
- Export and print capabilities

---

## 9. AI/ML-Powered Features

### 9.1 Smart Transaction Categorization

- ML model trained on organization's historical transaction data
- Automatic category suggestions for new transactions
- Learning from user corrections to improve accuracy over time
- Confidence scoring (high/medium/low) for each suggestion
- Bulk categorization for imported bank transactions
- Rule override capability when AI suggestion is incorrect
- Target: 90%+ accuracy after 3 months of learning

### 9.2 Anomaly Detection and Fraud Alerts

- Continuous monitoring of transaction patterns
- Detection of:
  - Duplicate payments or invoices
  - Transactions outside normal amount ranges
  - Unusual vendor activity or new vendor patterns
  - Timing anomalies (after-hours transactions)
  - Round-number transactions that may indicate fictitious entries
  - Unusual journal entry patterns (e.g., entries just below approval thresholds)
- Configurable sensitivity levels (low, medium, high)
- Alert dashboard with risk scoring
- Investigation workflow for flagged transactions
- Reporting for internal audit teams

### 9.3 AI-Powered Cash Flow Forecasting

- Predictive models using 12-24 months of historical data
- Seasonal pattern recognition and adjustment
- Accounts receivable collection probability estimates
- Accounts payable payment scheduling impact analysis
- Scenario modeling (what-if analysis)
- 30/60/90-day cash flow projections
- Automatic alerts for projected cash shortfalls
- Confidence intervals for forecast ranges
- Integration with budgeting module for variance analysis

### 9.4 Natural Language Query Interface

- Chat-based financial inquiry system
- Example queries:
  - "What were our total expenses last month?"
  - "Show me all overdue invoices above $5,000"
  - "Compare this quarter's revenue to last quarter"
  - "Which vendor did we pay the most this year?"
  - "What is our current cash position?"
- Context-aware follow-up questions
- Result display in charts, tables, or natural language
- Query history and saved queries
- Permission-aware responses (users only see data they have access to)

### 9.5 AI-Assisted Month-End Close

- Automated close checklist generation
- Intelligent identification of missing entries and accruals
- Auto-generation of standard adjusting entries (depreciation, prepaid amortization)
- Reconciliation status tracking across all accounts
- Close progress dashboard with completion percentage
- Estimated close time based on historical patterns
- Bottleneck identification and alerts
- Target: reduce close time by 50-75%

### 9.6 Intelligent Document Processing

- AI-powered OCR for receipt and invoice scanning
- Automatic extraction of: vendor name, date, amount, tax, line items
- Document classification (invoice, receipt, credit note, statement)
- Automatic matching to existing transactions
- Support for 200+ languages in document processing
- Learning from corrections to improve extraction accuracy
- Handwritten receipt processing capability

---

## 10. Multi-Currency and Multi-Company Support

### 10.1 Multi-Currency Transactions

- Support for 170+ world currencies
- Real-time exchange rate feeds from reliable sources (ECB, Open Exchange Rates)
- Historical exchange rate storage for audit compliance
- Manual exchange rate override capability
- Automatic calculation of realized gains/losses on settlement
- Unrealized gains/losses calculation at period end
- Foreign currency revaluation at reporting dates
- Currency-specific rounding rules
- Dual-currency display (transaction currency + base currency)

### 10.2 Multi-Company / Multi-Entity Management

- Separate books and chart of accounts per entity
- Entity types: Subsidiary, Branch, Department, Division
- Entity-specific fiscal year and tax settings
- Intercompany transaction processing
  - Automatic creation of corresponding entries in both entities
  - Intercompany balance tracking and reconciliation
- Consolidated financial statements
  - Automatic elimination of intercompany transactions
  - Minority interest calculations
  - Currency translation for foreign subsidiaries
- Entity-level and consolidated dashboards
- Cross-entity reporting and analysis

### 10.3 Multi-GAAP Support (Competitive Feature)

- Parallel reporting under different accounting standards (GAAP, IFRS)
- Standard-specific treatments for: leases, revenue recognition, financial instruments
- Side-by-side comparison of financial statements under different standards
- Jurisdiction-specific financial statement formats

---

## 11. Tax Compliance and Automation

### 11.1 Tax Configuration

- Multiple tax types: Sales Tax, VAT, GST, Withholding Tax, Excise Tax
- Tax rate management with effective date ranges
- Compound and tiered tax rate support
- Tax-exempt customer/product marking
- Reverse charge mechanism for cross-border transactions
- Tax group/category configuration
- Jurisdiction-based tax rules

### 11.2 Automated Tax Calculation

- Real-time tax calculation on transactions
- Tax-inclusive and tax-exclusive pricing modes
- Automatic application of correct tax rates based on:
  - Customer location
  - Product/service type
  - Transaction type (sale, purchase, import, export)
- Tax rounding rules per jurisdiction
- Tax override with reason tracking

### 11.3 Tax Reporting

- Tax summary reports by period
- VAT/GST return preparation
- Withholding tax certificates
- Tax liability tracking and reconciliation
- Tax payment tracking and due date alerts
- Exportable reports for tax authority submission

### 11.4 E-Invoicing Compliance (Competitive Feature)

- Support for country-specific e-invoicing mandates:
  - ZATCA (Saudi Arabia)
  - FTA (UAE)
  - GST (India)
  - PEPPOL (Europe)
  - SII (Spain)
- Real-time invoice validation against government systems
- QR code generation for compliant invoices
- Digital signature support
- XML/JSON format generation per standard

### 11.5 Making Tax Digital (MTD) Support

- Direct submission to HMRC (UK)
- VAT return auto-population from transaction data
- Digital link requirements compliance
- Submission history and acknowledgment tracking

---

## 12. Advanced Reporting and Dashboards

### 12.1 Real-Time Dashboards

- **Executive Dashboard**
  - Revenue and expense trends
  - Net profit/loss with period comparison
  - Cash position and forecast
  - Key financial ratios (current ratio, quick ratio, debt-to-equity)
  - Top customers by revenue
  - Top expenses by category
- **Accounting Dashboard**
  - Pending transactions and approvals
  - Reconciliation status
  - Overdue receivables and payables
  - Journal entry activity
  - Month-end close progress
- **Custom Dashboards**
  - Drag-and-drop widget placement
  - Configurable KPIs and metrics
  - Date range selection and comparison
  - Auto-refresh intervals
  - Dashboard sharing with team members

### 12.2 Dimensional Reporting (Competitive Feature)

- Report slicing by multiple dimensions without separate accounts:
  - Department
  - Project / Job
  - Cost Center
  - Location / Branch
  - Customer Segment
  - Product Line
- Cross-dimensional analysis (e.g., Revenue by Department by Quarter)
- Dimension hierarchy support (Region > Country > City)
- Dimension-based budgeting and variance analysis

### 12.3 Standard Report Library

- **Financial Reports**: Balance Sheet, Income Statement, Cash Flow, Equity Changes
- **Receivable Reports**: AR Aging, Customer Activity, Collection Efficiency
- **Payable Reports**: AP Aging, Vendor Activity, Payment Forecast
- **Bank Reports**: Bank Summary, Reconciliation Statement, Cash Position
- **Tax Reports**: Tax Summary, VAT Return, Withholding Tax Report
- **Management Reports**: Profit by Project, Revenue by Product, Cost Analysis
- **Comparative Reports**: Period vs. Period, Actual vs. Budget, Entity vs. Entity
- 50+ pre-built report templates

### 12.4 Custom Report Builder

- Drag-and-drop report designer
- Custom column selection and ordering
- Grouping, subtotaling, and grand totals
- Conditional formatting (highlight overdue items, negative values)
- Formula support for calculated fields
- Chart and graph embedding (bar, line, pie, waterfall)
- Save and share custom report definitions
- Schedule automatic report generation and email distribution

### 12.5 Report Export and Distribution

- Export formats: PDF, Excel, CSV, JSON
- Scheduled report generation (daily, weekly, monthly)
- Automatic email distribution to defined recipients
- Report printing with customizable headers and footers
- Batch report generation for multiple periods or entities

---

## 13. Audit Trail and Compliance

### 13.1 Immutable Audit Trail

- Field-level change tracking on all financial data
- Captured for every change:
  - Who (user ID and role)
  - When (timestamp with timezone)
  - What (field name, old value, new value)
  - Where (IP address, device)
  - Why (reason for change, if required)
- Tamper-proof logging (append-only, no edit or delete capability)
- Audit trail retention for configurable periods (minimum 7 years)
- Searchable and filterable audit log interface
- Audit trail export for external review

### 13.2 Compliance Features

- Period locking to prevent backdated entries
- Sequential voucher numbering enforcement
- Segregation of duties controls
- Four-eyes principle for critical transactions
- Document retention policies with automatic archival
- Compliance calendar with regulatory deadline tracking
- Pre-audit checklists and readiness assessment

### 13.3 Audit-Ready Report Packages (Competitive Feature)

- One-click generation of audit packages containing:
  - Financial statements with notes
  - Supporting schedules and reconciliations
  - Trial balance with drill-down
  - Significant transaction summaries
  - Management representation data
- Auditor portal with read-only access
- Audit query management and response tracking
- Prior period comparison and consistency checks

### 13.4 Data Compliance

- GDPR compliance features (data anonymization, right to erasure for non-financial PII)
- SOC 2 Type II alignment
- Data residency options (choose data storage region)
- Regular automated compliance scanning
- Privacy impact assessment tools

---

## 14. Integration Capabilities

### 14.1 Banking Integrations

- Open Banking API connections (Plaid, TrueLayer, Salt Edge, Yodlee)
- Automatic bank feed synchronization
- Real-time balance checks
- Payment initiation from within the platform
- Support for 5,000+ financial institutions globally
- Secure OAuth-based bank authentication

### 14.2 Payment Gateway Integrations

- **Stripe**: Invoice payments, subscription billing, refunds
- **PayPal**: Customer payment collection, mass payouts
- **Square**: POS integration, in-person payments
- **Razorpay**: India-specific payment processing
- **Wise**: International payments at lower fees
- **GoCardless**: Direct debit collection
- Automatic reconciliation of gateway transactions with invoices

### 14.3 E-Commerce Integrations

- **Shopify**: Sales, fees, taxes, and inventory sync
- **WooCommerce**: Order and payment data import
- **Amazon**: Marketplace fees and settlement reconciliation
- **eBay**: Auction and fixed-price sale tracking
- Automatic revenue recognition per order
- Returns and refund handling

### 14.4 Business Tool Integrations

- **CRM**: Salesforce, HubSpot (customer and deal sync)
- **Project Management**: Asana, Jira (project cost tracking)
- **HR/Payroll**: Gusto, ADP, BambooHR (payroll journal entries)
- **Communication**: Slack, Microsoft Teams (notifications and alerts)
- **Storage**: Google Drive, Dropbox, OneDrive (document storage)
- **BI Tools**: Power BI, Tableau, Looker (data export for analytics)

### 14.5 Integration Platform

- Pre-built connectors via Zapier, Make (Integromat)
- Unified API layer (Codat, Merge) for standardized data access
- Custom webhook configuration for event-driven integrations
- Integration health monitoring dashboard
- Error handling and retry logic for failed syncs

---

## 15. Automation Features

### 15.1 Recurring Transactions

- Scheduled creation of repeating entries:
  - Recurring invoices (subscriptions, rent)
  - Recurring bills (utilities, loan payments)
  - Recurring journal entries (depreciation, amortization)
- Configurable frequency: daily, weekly, bi-weekly, monthly, quarterly, annually
- Start date, end date, or occurrence count
- Review before posting option
- Automatic posting option for trusted recurring items
- Skip or modify individual occurrences

### 15.2 Automated Approval Workflows

- Configurable approval rules based on:
  - Transaction amount (threshold-based routing)
  - Transaction type
  - Department or cost center
  - Vendor type (new vs. existing)
- Multi-level sequential approval chains
- Parallel approval for multiple approvers
- Escalation rules for delayed approvals
- Auto-approval for transactions below defined thresholds
- Mobile-friendly approval interface

### 15.3 Rule-Based Transaction Processing

- User-defined rules that automatically:
  - Categorize transactions by vendor name or description keywords
  - Apply tax codes based on transaction type
  - Assign cost centers or projects
  - Tag transactions for reporting dimensions
  - Flag transactions for review based on criteria
- Rule priority ordering and conflict resolution
- Rule testing before activation
- Rule activity logging

### 15.4 Automated Reminders and Follow-Ups

- Overdue invoice reminder schedules (3 days, 7 days, 14 days, 30 days)
- Payment due date reminders for outgoing bills
- Recurring task reminders for accounting team
- Escalation alerts for items past due date
- Customizable reminder templates with merge fields

### 15.5 Scheduled Report Generation

- Automatic generation of reports on defined schedules
- Email distribution to configured recipients
- Multiple format support (PDF, Excel)
- Conditional generation (only if data exists for the period)
- Report archive for historical reference

---

## 16. Collaboration Features

### 16.1 In-App Communication

- Comments and notes on individual transactions
- @mention team members to draw attention to specific items
- Comment threads for discussion on financial items
- Activity feed showing recent team actions
- Read receipts on comments and notifications

### 16.2 External Accountant / Auditor Portal (Competitive Feature)

- Dedicated portal for external accountants and auditors
- Invitation via email with granular permission settings
- Read-only access to specified accounts, reports, and documents
- Ability to add comments and queries
- Separate login tracking and audit trail
- Time-limited access with automatic expiration
- No impact on internal user license count

### 16.3 Task Management

- Create and assign accounting tasks to team members
- Task categories: reconciliation, review, approval, filing
- Due dates, priorities, and status tracking
- Task templates for recurring processes (month-end close checklist)
- Task dependencies (Task B can't start until Task A is complete)
- Team workload visibility
- Task completion notifications

### 16.4 Document Collaboration

- Shared document workspace per organization
- File versioning and history
- Co-annotation of financial documents
- Document review and sign-off workflows
- Centralized repository for contracts, agreements, and correspondence

---

## 17. Security Features

### 17.1 Authentication

- Multi-factor authentication (MFA) support:
  - TOTP authenticator apps (Google Authenticator, Authy)
  - SMS verification codes
  - Email verification codes
  - Hardware security keys (FIDO2/WebAuthn)
- Single Sign-On (SSO) via SAML 2.0 and OpenID Connect
- Password policy enforcement:
  - Minimum length and complexity requirements
  - Password expiration and history
  - Account lockout after failed attempts
- Biometric authentication on mobile (fingerprint, face recognition)

### 17.2 Data Protection

- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- End-to-end encryption for sensitive fields
- Database-level encryption
- Encrypted backups with key management
- Data masking for sensitive information in non-production environments

### 17.3 Access Control

- Granular role-based access control (RBAC) per module and feature
- IP whitelisting for organization-level access restriction
- Session management:
  - Configurable session timeouts
  - Concurrent session limits
  - Force logout capability
- Device trust management
- Geographic access restrictions
- Time-based access restrictions (business hours only)

### 17.4 Infrastructure Security

- Cloud hosting on SOC 2 compliant infrastructure (AWS, Azure, GCP)
- Regular penetration testing and vulnerability assessments
- DDoS protection
- WAF (Web Application Firewall) deployment
- Automated security patching
- Intrusion detection and prevention systems
- 99.9% uptime SLA with redundancy

### 17.5 Data Backup and Recovery

- Automated daily backups with configurable retention
- Point-in-time recovery capability
- Cross-region backup replication
- Disaster recovery plan with defined RTO and RPO
- Self-service data export for customer-managed backups
- Annual disaster recovery testing

---

## 18. Mobile Capabilities

### 18.1 Native Mobile Applications

- iOS and Android native apps
- Core feature parity with web application:
  - Create and send invoices
  - Record expenses and receipts
  - Approve pending transactions
  - View reports and dashboards
  - Access customer and vendor records
- Offline mode with automatic sync when connected
- Biometric login (fingerprint, face recognition)
- Push notification support

### 18.2 Mobile Receipt Capture

- Camera-based receipt scanning
- AI-powered OCR extraction of:
  - Vendor name
  - Date
  - Total amount
  - Tax amount
  - Individual line items
- Automatic expense entry creation from scanned receipt
- Receipt image storage and linking to transaction
- Batch scanning for multiple receipts
- GPS-based location tagging for expense context

### 18.3 Mobile-Optimized Experience

- Responsive design for tablet and phone form factors
- Touch-friendly interface with swipe gestures
- Quick-action shortcuts (scan receipt, create invoice, approve)
- Mobile-specific dashboard with key metrics
- Dark mode support
- Configurable home screen widgets

---

## 19. Document Management

### 19.1 Document Upload and Storage

- Support for PDF, JPG, PNG, TIFF, Word, Excel file types
- Drag-and-drop upload interface
- Bulk upload capability
- Automatic document tagging based on content
- Configurable storage limits per plan tier
- Cloud storage integration (Google Drive, Dropbox, OneDrive)

### 19.2 AI-Powered Document Processing (Competitive Feature)

- Deep learning OCR with 98%+ accuracy
- Multi-language document processing (200+ languages)
- Intelligent field extraction without template configuration
- Document type classification (invoice, receipt, credit note, bank statement)
- Handwriting recognition for receipts
- Table and line item extraction from complex documents
- Continuous learning from user corrections

### 19.3 Document Matching and Linking

- Automatic matching of documents to transactions
- Manual linking of documents to journal entries, invoices, or bills
- Multi-document attachment per transaction
- Document preview without download
- Document annotation and markup tools

### 19.4 Document Compliance

- Tamper-evident document storage
- Document retention policies with configurable periods
- Automatic archival of aged documents
- Compliant deletion with audit trail
- Digital signature verification
- Document access logging

### 19.5 Duplicate Detection (Competitive Feature)

- Intelligent duplicate identification using:
  - Amount matching
  - Date proximity
  - Vendor matching
  - Document fingerprinting (hash-based)
- Alert before processing potential duplicates
- Side-by-side comparison view
- Merge or dismiss duplicate suggestions

---

## 20. Budgeting and Forecasting

### 20.1 Budget Creation

- Annual budget creation by account, department, project, or cost center
- Monthly/quarterly breakdown of annual budgets
- Budget templates from prior year actuals
- Top-down and bottom-up budgeting approaches
- Budget import from Excel/CSV
- Multi-user budget collaboration with change tracking
- Budget version control (draft, submitted, approved, final)

### 20.2 Driver-Based Budgeting (Competitive Feature)

- Define budgets based on business drivers:
  - Headcount (salary, benefits per employee)
  - Units (cost per unit, revenue per unit)
  - Square footage (rent, utilities)
  - Percentage of revenue (marketing, R&D)
- Automatic budget recalculation when drivers change
- Driver assumption documentation and tracking

### 20.3 Multi-Scenario Planning (Competitive Feature)

- Create multiple budget scenarios:
  - Best case
  - Worst case
  - Most likely
  - Custom scenarios
- Side-by-side scenario comparison
- Probability-weighted scenario analysis
- One-click scenario switching for reporting
- Scenario assumption documentation

### 20.4 Rolling Forecasts (Competitive Feature)

- Continuously updated forecasts extending N months forward
- Automatic incorporation of actuals as they occur
- Blend of historical trends and manual adjustments
- AI-powered forecast suggestions based on patterns
- Variance analysis between forecast versions
- Forecast accuracy tracking over time

### 20.5 Budget vs. Actual Analysis

- Real-time comparison of budgeted vs. actual amounts
- Variance calculation (absolute and percentage)
- Favorable/unfavorable variance highlighting
- Drill-down from variance to underlying transactions
- Variance trend analysis over time
- Automatic alerts when variances exceed thresholds
- Budget utilization percentage tracking

---

## 21. Inventory Management

### 21.1 Inventory Tracking

- Real-time stock level monitoring
- Multiple warehouse/location support
- Batch and serial number tracking
- Expiry date tracking for perishable goods
- Stock movement history
- Automatic COGS calculation on sales

### 21.2 Inventory Valuation

- Supported methods:
  - FIFO (First In, First Out)
  - LIFO (Last In, First Out)
  - Weighted Average
  - Specific Identification
- Valuation method selection per product or globally
- Inventory valuation report at any date
- Lower of cost or market (LCM) analysis

### 21.3 Stock Operations

- Purchase orders with receiving workflow
- Sales orders with fulfillment tracking
- Stock transfers between locations
- Stock adjustments (damage, loss, found)
- Stocktake/physical count workflow
- Write-off processing with journal entry generation
- Return processing (customer and vendor)

### 21.4 Inventory Alerts and Reordering

- Configurable minimum and maximum stock levels
- Low stock alerts with notification
- Automatic reorder point calculation
- Suggested reorder quantities based on lead time and usage
- Purchase order generation from reorder suggestions

### 21.5 Inventory Reporting

- Stock on hand report
- Stock movement report
- Inventory aging report
- Slow-moving and obsolete stock analysis
- Inventory turnover analysis
- ABC analysis for inventory classification

---

## 22. API Access for Third-Party Integrations

### 22.1 RESTful API

- Comprehensive API covering all core entities:
  - Accounts, Transactions, Contacts, Invoices, Bills, Payments
  - Reports, Tax, Inventory, Documents
- OpenAPI 3.0 specification with interactive documentation (Swagger UI)
- Versioned API with deprecation policy (minimum 12-month support per version)
- Sandbox environment for development and testing
- Code samples in major languages (Python, JavaScript, PHP, Ruby, Java, C#)
- SDKs for popular platforms

### 22.2 Webhook Events

- Real-time event notifications for:
  - Transaction created, updated, deleted
  - Invoice sent, viewed, paid
  - Payment received, reconciled
  - Approval requested, approved, rejected
  - Bank feed synchronized
  - Report generated
- Configurable webhook endpoints per event type
- Webhook signature verification for security
- Retry logic for failed deliveries
- Webhook activity log and debugging tools

### 22.3 Authentication and Authorization

- OAuth 2.0 authentication for third-party applications
- API key authentication for server-to-server integration
- Scoped permissions per API client
- Rate limiting with configurable tiers
- Usage analytics dashboard for API consumers

### 22.4 Bulk Operations

- Batch endpoints for high-volume operations:
  - Bulk transaction import
  - Mass contact update
  - Batch invoice generation
- Asynchronous processing for large batches
- Progress tracking and status callbacks
- Error reporting with per-record detail

---

## 23. Real-Time Notifications and Alerts

### 23.1 Financial Alerts

- Cash balance threshold alerts (low balance warning)
- Large transaction alerts (above configured amount)
- Overdue invoice alerts (configurable aging thresholds)
- Budget overrun alerts (percentage-based triggers)
- Unusual activity alerts (AI-powered anomaly detection)
- Exchange rate movement alerts for multi-currency accounts
- Tax payment due date reminders

### 23.2 Operational Alerts

- Pending approval notifications
- Reconciliation completion/failure alerts
- Bank feed sync status notifications
- Import/export completion notifications
- Scheduled report generation alerts
- System maintenance notifications
- Subscription expiration warnings

### 23.3 Notification Channels

- **In-App**: Notification center with badge counts
- **Email**: Configurable email notifications with digest option
- **Push**: Mobile push notifications for critical alerts
- **Slack/Teams**: Integration with team communication tools
- **SMS**: Optional SMS for critical financial alerts
- **Webhook**: Programmatic notification for external systems

### 23.4 Notification Preferences

- Per-user notification configuration
- Channel preference per alert type
- Quiet hours / do-not-disturb settings
- Daily/weekly digest option to reduce notification fatigue
- Escalation rules for unacknowledged critical alerts

---

## 24. Data Import/Export Capabilities

### 24.1 Data Import

- Supported import formats: CSV, Excel (XLS, XLSX), OFX, QIF, QBO, JSON, XML
- Import wizards for:
  - Chart of accounts
  - Customer and vendor contacts
  - Opening balances
  - Historical transactions
  - Bank statements
  - Invoices and bills
  - Inventory items
- Intelligent column mapping with auto-detection
- Data validation with error reporting before import
- Preview and confirmation before committing import
- Import history log with rollback capability

### 24.2 Migration Tools (Competitive Feature)

- Guided migration from major platforms:
  - QuickBooks (Desktop and Online)
  - Xero
  - Sage
  - FreshBooks
  - Wave
  - Tally
- Automated data mapping from source to target formats
- Chart of accounts matching and reconciliation
- Historical data integrity verification
- Migration completeness report

### 24.3 Data Export

- Export formats: CSV, Excel, PDF, JSON, XML
- Full data export (all financial data for the organization)
- Selective export (by module, date range, or entity)
- Scheduled automatic exports to cloud storage or SFTP
- API-based programmatic data extraction
- Data portability guarantee (no vendor lock-in)
- Export audit trail logging

---

## 25. Multi-Language Support

### 25.1 Interface Localization

- Full UI translation for supported languages:
  - English (US, UK)
  - Arabic (with RTL support)
  - Urdu (with RTL support)
  - French
  - Spanish
  - German
  - Chinese (Simplified, Traditional)
  - Hindi
  - Portuguese
  - Japanese
  - Korean
  - Turkish
- User-level language preference
- Dynamic language switching without logout
- Localized date, number, and currency formatting per locale

### 25.2 Multi-Language Documents

- Invoices and statements generated in customer's preferred language
- Multi-language email templates for reminders and notifications
- Report headers and labels in selected language
- Internal records maintained in organization's base language
- Bilingual document option (two languages on same document)

### 25.3 Locale-Aware Formatting

- Number formatting per locale (1,000.00 vs 1.000,00)
- Date formatting per locale (MM/DD/YYYY vs DD/MM/YYYY)
- Currency symbol placement and formatting
- Calendar system support (Gregorian, Hijri, fiscal)
- Timezone-aware date and time display

---

## 26. White-Labeling Options

### 26.1 Brand Customization

- Custom logo placement (header, login page, reports, invoices)
- Color scheme customization (primary, secondary, accent colors)
- Custom typography selection
- Custom favicon and app icon
- Branded email templates
- Custom login page design
- Custom report headers and footers
- Branded mobile app appearance

### 26.2 Custom Domain

- Run platform on partner's domain (e.g., accounting.partnersite.com)
- SSL certificate provisioning and management
- Custom email sending domain
- DNS configuration assistance

### 26.3 Partner Management

- Multi-tenant partner dashboard
- Client organization provisioning and management
- Usage monitoring and reporting per client
- Revenue sharing and commission tracking
- Partner-defined pricing tiers and feature bundles
- Client billing management (partner bills client, or platform bills directly)
- Support ticket management and escalation

### 26.4 White-Label API

- Partner API for automated tenant provisioning
- Bulk client onboarding
- Custom onboarding flows
- Partner-branded API documentation
- Webhook events for partner-relevant activities

---

## 27. Invoicing and Accounts Receivable

### 27.1 Invoice Creation

- Professional invoice templates (10+ designs)
- Custom branding (logo, colors, fonts)
- Line items with description, quantity, rate, tax, and discount
- Support for products, services, and time-based billing
- Multi-currency invoicing
- Recurring invoice scheduling
- Invoice duplication for quick creation
- Proforma invoices and estimates/quotes
- Invoice-from-quote conversion

### 27.2 Invoice Delivery

- Email delivery with customizable message templates
- PDF attachment generation
- Shareable invoice link with online payment option
- Batch invoice sending
- Delivery tracking (sent, viewed, paid)
- Automatic payment reminders on schedule

### 27.3 Online Payments (Competitive Feature)

- Embedded payment links on invoices
- Multiple payment method acceptance:
  - Credit/debit cards (Stripe, Square)
  - Bank transfers (ACH, SEPA)
  - PayPal
  - Digital wallets
- Automatic payment recording and reconciliation
- Partial payment support
- Payment receipt generation

### 27.4 Credit Management

- Customer credit limits
- Credit hold enforcement on new orders
- Credit note creation and application
- Advance payment / deposit tracking
- Customer balance monitoring and alerts

---

## 28. Bills and Accounts Payable

### 28.1 Bill Management

- Bill entry with vendor, date, due date, and line items
- AI-powered bill capture (scan/upload and auto-extract)
- Purchase order matching (2-way and 3-way matching)
- Bill approval workflows with amount-based routing
- Recurring bill scheduling
- Bill duplication for quick entry
- Vendor credit tracking and application

### 28.2 Payment Processing

- Batch payment runs
- Payment scheduling based on due dates and cash availability
- Multiple payment methods: check, ACH, wire, digital
- Payment file generation for bank upload (NACHA, BACS, SEPA)
- Remittance advice generation and sending
- Early payment discount optimization
- Partial payment support

### 28.3 Vendor Management

- Vendor master with complete profile:
  - Contact details and addresses
  - Tax identification numbers
  - Payment terms and methods
  - Bank account details
  - Category and classification
- Vendor performance tracking
- 1099 / tax form preparation (US)
- Vendor self-service portal for invoice submission

---

## 29. Payroll Integration

### 29.1 Payroll Journal Entry Automation

- Automatic journal entry generation from payroll data
- Mapping of payroll components to chart of accounts:
  - Gross salary expense
  - Tax withholdings
  - Employee benefits
  - Employer contributions
  - Net pay liability
- Multi-department salary allocation
- Project-based labor cost distribution

### 29.2 Payroll System Connectors

- Pre-built integrations with popular payroll providers:
  - Gusto
  - ADP
  - Paychex
  - BambooHR
  - Paylocity
- Automatic data synchronization on each payroll run
- Reconciliation of payroll liabilities
- Year-end payroll reporting support

---

## 30. Fixed Asset Management

### 30.1 Asset Register

- Complete asset tracking with:
  - Asset description and identification number
  - Acquisition date and cost
  - Location and custodian
  - Category and class
  - Useful life and residual/salvage value
  - Current book value
  - Status: Active, Disposed, Written Off
- Asset photo and document attachment
- Barcode/QR code support for physical tracking

### 30.2 Depreciation

- Supported depreciation methods:
  - Straight-line
  - Declining balance
  - Double declining balance
  - Sum-of-years digits
  - Units of production
- Automatic monthly depreciation calculation and posting
- Depreciation schedule generation
- Mid-month/mid-year convention support
- Depreciation method change with prospective recalculation

### 30.3 Asset Lifecycle

- Asset acquisition (from purchase or capitalization)
- Asset improvement and revaluation
- Asset transfer between departments/locations
- Asset disposal (sale, scrapping, donation)
  - Automatic gain/loss calculation
  - Removal from active register
- Asset impairment testing and write-down
- Asset split and merge operations

### 30.4 Asset Reporting

- Asset register report
- Depreciation schedule
- Asset movement report
- Disposed assets report
- Insurance valuation report
- Tax depreciation vs. book depreciation comparison

---

## Appendix A: Recommended Technology Stack

### A.1 Stack Overview

| Category | Primary Choice | Complement / Alternative |
|----------|---------------|--------------------------|
| **Frontend** | React + Next.js | AG Grid Enterprise, Recharts, TanStack Query |
| **Backend (Core)** | NestJS (TypeScript) | Fastify adapter for performance |
| **Backend (AI/ML)** | Python FastAPI | Microservice for ML workloads |
| **Database** | PostgreSQL + TimescaleDB | Citus extension for horizontal scaling |
| **Caching** | Valkey (via AWS ElastiCache) | Redis Enterprise if multi-cloud needed |
| **Search** | Elasticsearch (Elastic Cloud) | -- |
| **Message Queue** | Apache Kafka | RabbitMQ for task queues |
| **AI/ML APIs** | Claude API (Anthropic) | OpenAI API as fallback |
| **AI/ML Libraries** | scikit-learn, PyTorch, Prophet | MLflow for model lifecycle |
| **OCR** | Azure Document Intelligence | GPT-4o for modern document interpretation |
| **Mobile** | React Native | Hermes engine for security |
| **Cloud Provider** | AWS | Multi-cloud at enterprise scale |
| **Container Orchestration** | Docker + Kubernetes (EKS) | AWS Lambda for event-driven tasks |
| **Real-Time** | Socket.IO | SSE for simple notifications |
| **Object Storage** | AWS S3 | Glacier for long-term archival |
| **Monitoring** | Grafana Cloud + Prometheus | Datadog at enterprise scale |
| **Authentication** | Keycloak (self-hosted) | Auth0 for early-stage teams |
| **CI/CD** | GitHub Actions + ArgoCD | Terraform for Infrastructure as Code |

---

### A.2 Frontend - React + Next.js

**Why React + Next.js:**

- **Market dominance**: 40%+ developer preference (Stack Overflow 2024). The React Compiler v1.0 (Oct 2025) delivers 12% faster page loads and 2.5x faster interactions via automatic memoization.
- **Largest hiring pool**: React leads all frontend frameworks in developer availability -- critical for scaling a team.
- **Financial-grade components**:
  - **AG Grid Enterprise** -- pivoting, Excel-like filtering, grouping, and aggregation perfect for ledgers and trial balance views. Canvas rendering supports hundreds of thousands of rows.
  - **Recharts / Visx** -- composable chart libraries for dashboards (bar, line, pie, waterfall charts).
  - **React Hook Form + Zod** -- performant large form handling with schema validation for voucher entries and journal posting.
  - **TanStack Query** -- server state management with caching, optimistic updates, and real-time sync.
- **Next.js advantages**: Server-Side Rendering for SEO, App Router with React Server Components for optimal data loading, built-in API routes as Backend-for-Frontend, Incremental Static Regeneration for report pages.
- **White-labeling ready**: Component architecture with Tailwind CSS design tokens enables brand theming per tenant.
- **TypeScript end-to-end**: Shared types, validation schemas (Zod), and DTOs with the NestJS backend -- eliminating an entire class of integration bugs.

**Key packages:**
```
react, next, typescript, tailwindcss
@ag-grid-enterprise/all-modules     # Data grids for ledgers
recharts / @visx/*                   # Chart visualizations
react-hook-form + zod               # Form management
@tanstack/react-query               # Server state
zustand                              # Client state management
socket.io-client                     # Real-time updates
react-i18next                        # Multi-language support
```

---

### A.3 Backend (Core) - NestJS (TypeScript)

**Why NestJS:**

- **Enterprise-grade Node.js**: 60k+ GitHub stars, recognized as the leader in enterprise Node.js development in 2025. Built-in support for CQRS, event sourcing, microservices, GraphQL, and WebSockets.
- **TypeScript-first**: Shares types, DTOs, and validation schemas with the React frontend. One language from database query to mobile screen.
- **Financial precision**: The `bigint-money` library provides BigInt-based calculations with Banker's Rounding (round-half-to-even) and 20-decimal precision. Combined with PostgreSQL NUMERIC/BIGINT, this eliminates floating-point errors (where `0.1 + 0.2 !== 0.3`).
- **Multi-tenancy patterns**: Middleware-based tenant resolution via `x-tenant-id` headers, integrated with PostgreSQL Row-Level Security for database-level isolation.
- **Performance**: With the Fastify adapter (replacing Express), achieves sub-100ms response times for standard API calls.
- **Modular architecture**: Each accounting module (GL, AR, AP, Inventory, etc.) is a self-contained NestJS module with its own controllers, services, and repositories.

**Architecture pattern:**
```
src/
  modules/
    auth/                # Authentication & RBAC
    tenants/             # Multi-tenant management
    chart-of-accounts/   # COA with 4-level hierarchy
    general-ledger/      # Core double-entry engine
    accounts-receivable/ # Invoicing, customer management
    accounts-payable/    # Bills, vendor management
    bank-reconciliation/ # Reconciliation engine
    vouchers/            # Voucher management
    reports/             # Report generation engine
    tax/                 # Tax calculation & compliance
    inventory/           # Inventory tracking
    fixed-assets/        # Asset management & depreciation
    budgeting/           # Budget & forecasting
    notifications/       # Alert & notification system
    documents/           # Document management & OCR
    integrations/        # Third-party connectors
  common/
    database/            # PostgreSQL + TypeORM/Prisma
    cache/               # Valkey/Redis integration
    queue/               # Kafka/RabbitMQ producers
    security/            # Guards, interceptors, pipes
    multi-tenancy/       # Tenant middleware & RLS
```

**Key packages:**
```
@nestjs/core, @nestjs/platform-fastify
@nestjs/typeorm / prisma              # ORM
@nestjs/microservices                  # Inter-service communication
@nestjs/websockets + socket.io         # Real-time
@nestjs/bull                           # Job queues
bigint-money                           # Financial precision
class-validator + class-transformer    # DTO validation
passport + @nestjs/jwt                 # Auth integration
```

---

### A.4 Backend (AI/ML) - Python FastAPI Microservice

**Why a separate FastAPI service for AI/ML:**

- Python is irreplaceable for ML: scikit-learn, PyTorch, TensorFlow, pandas, Prophet, and the entire ML ecosystem have no TypeScript equivalents at this maturity level.
- FastAPI is async-native with performance rivaling Node.js and Go.
- Runs as a dedicated microservice communicating with NestJS via Kafka messages or gRPC.

**AI/ML workloads handled:**
| Feature | Libraries / Approach |
|---------|---------------------|
| Transaction categorization | Fine-tuned BERT model + scikit-learn classifiers |
| Anomaly detection | Isolation Forest, Local Outlier Factor (scikit-learn) |
| Cash flow forecasting | Facebook Prophet + statsmodels |
| Natural language queries | Claude API / OpenAI API with function calling |
| Document OCR processing | Azure Document Intelligence SDK |
| Smart reconciliation | Custom fuzzy matching + ML ranking model |

**Key packages:**
```
fastapi, uvicorn, pydantic
scikit-learn                  # Classification, anomaly detection
torch (PyTorch)               # Deep learning models
transformers (HuggingFace)    # NLP models, fine-tuning
prophet                       # Time series forecasting
pandas, numpy                 # Data processing
mlflow                        # Model versioning & lifecycle
sentence-transformers         # Embeddings for similarity
azure-ai-formrecognizer       # OCR integration
anthropic / openai            # LLM API clients
```

---

### A.5 Database - PostgreSQL + TimescaleDB

**Why PostgreSQL:**

- **ACID compliance**: Full ACID with MVCC -- non-negotiable for financial software where every debit must equal its credit.
- **Financial data types**: `NUMERIC(20,4)` for exact decimal arithmetic. Store money as smallest units (cents/paise) in `BIGINT` columns. Avoid the `MONEY` type (locale-dependent behavior).
- **Multi-tenant isolation**: Row-Level Security (RLS) with `tenant_id` on every table. Database enforces isolation -- developers cannot accidentally leak cross-tenant data. For premium enterprise tenants, offer schema-per-tenant.
- **JSONB**: Flexible metadata, custom fields, chart of accounts configurations, OCR extraction results.
- **TimescaleDB extension**: Converts PostgreSQL into a time-series database for exchange rate history, account balance snapshots, and performance metrics -- without needing a separate database.
- **pgaudit extension**: Comprehensive audit logging required for financial compliance.
- **pgvector extension**: Store AI embeddings for similarity search in transaction categorization.
- **Scaling path**: Start vertical, add Citus extension for horizontal sharding when needed. PostgreSQL + Citus handles thousands of concurrent connections.
- **Cost**: Completely free and open source. Use AWS RDS PostgreSQL for managed hosting.

**Key schema patterns:**
```sql
-- Multi-tenant RLS pattern
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON transactions
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Financial precision
CREATE TABLE journal_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  voucher_id    UUID NOT NULL REFERENCES vouchers(id),
  account_id    UUID NOT NULL REFERENCES accounts(id),
  debit_amount  NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(18, 8),
  narration     TEXT,
  cost_center   UUID REFERENCES cost_centers(id),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID NOT NULL REFERENCES users(id),
  CONSTRAINT balance_check CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- 4-Level Chart of Accounts hierarchy
CREATE TABLE accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  code          VARCHAR(20) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  account_type  VARCHAR(50) NOT NULL,  -- asset, liability, equity, revenue, expense, cogs
  parent_id     UUID REFERENCES accounts(id),
  level         SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  normal_balance VARCHAR(6) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_system     BOOLEAN NOT NULL DEFAULT false,
  metadata      JSONB DEFAULT '{}',
  UNIQUE (tenant_id, code)
);
```

---

### A.6 Caching - Valkey (via AWS ElastiCache)

**Why Valkey over Redis:**

- Forked from Redis 7.2.4, maintained by the Linux Foundation with backing from AWS, Google Cloud, Oracle, and others.
- Truly open source (BSD license) -- Redis 8.0 moved to AGPLv3 which creates legal concerns.
- Valkey 8.0 delivers ~3x throughput (~1.19M requests/sec) through redesigned multi-threaded I/O.
- AWS ElastiCache natively supports Valkey, providing managed scaling and microsecond latency.

**Use cases in the accounting platform:**
| Use Case | Pattern |
|----------|---------|
| Session management | JWT token blacklisting, refresh token storage |
| Dashboard caching | Cached KPI calculations, balance summaries |
| Rate limiting | API endpoint throttling per tenant |
| Distributed locks | Prevent concurrent ledger modifications |
| Real-time pub/sub | Dashboard live updates, notification delivery |
| Exchange rates | Cached current rates with TTL-based refresh |

---

### A.7 Search Engine - Elasticsearch (Elastic Cloud)

**Why Elasticsearch:**

- **Proven at financial scale**: Major global banks (e.g., BBVA) run 45+ billion data points on Elasticsearch with 5ms simple query response and 200-400ms for complex financial calculations spanning 20 years of history.
- **Audit log search**: Financial compliance requires searching years of audit logs. Elasticsearch's frozen data tier stores rarely accessed data cost-effectively while maintaining searchability.
- **Transaction search**: Full-text search across narrations, references, vendor names with aggregations for financial analysis.
- **Document search**: Full-text search across OCR-extracted document content.
- **Log management**: Double duty as application search and log aggregation (ELK stack).

**Recommendation**: Use **Elastic Cloud** (managed) to avoid operational overhead of self-hosting. Budget $500-$2,000/month depending on data volume.

---

### A.8 Message Queue - Apache Kafka + RabbitMQ

**Dual approach for different workload types:**

| Component | Use For | Why |
|-----------|---------|-----|
| **Apache Kafka** | Event streaming, audit events, CDC, real-time feeds | Financial transactions are sequential event logs. Message retention enables replay for audit. Handles millions of messages/sec. |
| **RabbitMQ** | Task queues, async jobs | Complex routing with exchanges for OCR jobs, report generation, email dispatch, reconciliation tasks. Acknowledgment and dead-letter queues for reliability. |

**For MVP**: Start with RabbitMQ only. Introduce Kafka as scale demands grow. Alternatively, AWS SQS + SNS can serve as a simpler starting point.

---

### A.9 AI/ML APIs - Claude API + Self-Hosted Models

**Hybrid approach:**

| Workload | Approach | Reasoning |
|----------|----------|-----------|
| Natural language queries | Claude API (Anthropic) | Zero maintenance, continuous improvement, SOC 2 compliant |
| Transaction categorization | Self-hosted fine-tuned model | Domain-specific models outperform general models by 20-30% |
| Anomaly detection | Self-hosted (scikit-learn) | Runs per-tenant models on tenant-specific patterns |
| Cash flow forecasting | Self-hosted (Prophet) | Requires access to full historical data |
| Document understanding | Claude API / GPT-4o | Multi-modal understanding of complex documents |

**Cost estimate**: Cloud AI API usage ~$500-$3,000/month depending on query volume.

---

### A.10 OCR - Azure Document Intelligence

**Why Azure Document Intelligence:**

- Outperforms AWS Textract in field-level accuracy, particularly on non-standard documents and older invoices (2025 benchmarks).
- Custom model training for unique form layouts.
- Pre-built models for invoices, receipts, bank statements, and tax forms.
- Containerized option for on-premise deployment (financial compliance scenarios).
- Cost: ~$10 per 1,000 documents processed.

**Processing pipeline:**
```
Document Upload --> Azure Document Intelligence (extract fields, tables, line items)
                --> If confidence < threshold --> Claude API (interpret ambiguous data)
                --> Structured Data --> Auto-create transaction / match to existing
                --> Human Review Queue (if still uncertain)
```

---

### A.11 Mobile - React Native

**Why React Native:**

- **80-90% code sharing** with the React web frontend: authentication, data fetching, validation schemas, state management, and API clients.
- **Unified team**: React web developers can build mobile features without a new language. React Native leads in developer availability (6,413 LinkedIn postings vs 1,068 for Flutter in the US).
- **TypeScript across the stack**: Shared types with NestJS backend and Next.js frontend.
- **Offline support**: Mature ecosystem (React Native Offline, Redux Offline, SQLite) for offline-first financial data.
- **New Architecture (2025-2026)**: TurboModules + Fabric with JSI enable direct C++ native layer communication with zero bridge lag.
- **Security**: Hermes engine compiles to bytecode (not inspectable JS), plus code obfuscation for sensitive financial logic.

---

### A.12 Cloud Provider - AWS

**Why AWS:**

- **32% market share** with the broadest and most mature service portfolio.
- **Financial compliance**: ISO 27001, GDPR, FedRAMP, HIPAA, PCI DSS, SOC 1/2/3 certifications.
- **SaaS Factory**: AWS provides reference architectures specifically for multi-tenant SaaS applications.
- **Managed services for every component**:

| Service | AWS Managed Offering |
|---------|---------------------|
| PostgreSQL | RDS PostgreSQL / Aurora |
| Valkey/Redis | ElastiCache |
| Kafka | MSK (Managed Streaming for Kafka) |
| Kubernetes | EKS (Elastic Kubernetes Service) |
| Serverless | Lambda |
| Object Storage | S3 + Glacier |
| CDN | CloudFront |
| DNS | Route 53 |
| Secrets | Secrets Manager |
| Monitoring | CloudWatch |

**Cost management tips**: Use Reserved Instances (up to 72% savings), Spot Instances for non-critical workloads, and S3 Intelligent-Tiering for document storage.

---

### A.13 DevOps - Docker + Kubernetes (EKS)

**Containerized architecture with Kubernetes orchestration:**

- **Kubernetes (EKS)** for core long-running services: NestJS API, FastAPI ML, Elasticsearch.
- **Horizontal Pod Autoscaler** handles 1,000+ concurrent users per tenant.
- **AWS Lambda** for event-driven workloads: webhook delivery, OCR triggers, scheduled reports (scale-to-zero for cost efficiency).
- Organizations report 20-30% lower IT costs through Kubernetes-driven resource optimization.

**CI/CD pipeline:**
```
GitHub Actions (pipeline orchestration)
  --> Docker (containerization)
  --> Terraform (Infrastructure as Code)
  --> Helm (Kubernetes package management)
  --> ArgoCD (GitOps-based deployments)
  --> Kubernetes (EKS) with canary/blue-green deployments
```

---

### A.14 Real-Time Communication - Socket.IO + SSE

| Channel | Technology | Use Case |
|---------|-----------|----------|
| Interactive dashboards | Socket.IO | Bidirectional, room/namespace per tenant, auto-fallback |
| Simple notifications | Server-Sent Events | Lightweight, browser-native, "report ready" alerts |

Socket.IO integrates directly with NestJS via `@nestjs/websockets` and `@nestjs/platform-socket.io`. ~8 million weekly npm downloads with strong community support.

---

### A.15 Authentication - Keycloak

**Why Keycloak for a multi-tenant financial SaaS:**

- **Multi-tenancy via Realms**: Each tenant gets a dedicated Realm with isolated users, roles, and configurations.
- **Protocol support**: SAML 2.0, OpenID Connect, OAuth 2.0, LDAP -- essential for enterprise SSO with Active Directory, Okta, etc.
- **Fine-grained RBAC**: Role-based + policy-based authorization. Supports permissions like "can view but not post journal entries" or "can approve transactions up to $10,000."
- **Built-in MFA**: No paid-tier upgrade required (Auth0 charges per MAU).
- **Self-hosted control**: Full control over user data and compliance. Critical for financial software.
- **Cost**: Open source, no per-MAU fees. Runs in your existing Kubernetes cluster.

**Trade-off**: Requires team to handle operations (patching, scaling, monitoring). For teams < 4 engineers, Auth0 may be worth the cost until you can invest in self-hosted infra.

---

### A.16 Monitoring - Grafana Cloud + Prometheus

**Phased approach:**

| Phase | Stack | Cost |
|-------|-------|------|
| **MVP to Series A** | Grafana Cloud + Prometheus + Loki + Tempo | Free tier / Pro from $19/month |
| **Scale (Series B+)** | Evaluate Datadog ($15-$23/host/month) | $1,000-$5,000/month |

- Prometheus for metrics collection (open source, industry standard).
- Grafana for visualization (best-in-class dashboards for financial operations monitoring).
- Loki for log aggregation, Tempo for distributed tracing.
- OpenTelemetry for instrumentation (avoids vendor lock-in).

---

### A.17 Monthly Infrastructure Cost Estimates

| Stage | Monthly Cost | Description |
|-------|-------------|-------------|
| **MVP** | $500 - $1,500 | Minimal EKS, small RDS, free-tier monitoring |
| **Growth** (100 tenants) | $3,000 - $8,000 | Scaled EKS, RDS Multi-AZ, ElastiCache, S3 |
| **Scale** (1,000+ tenants) | $10,000 - $25,000 | Full stack with Kafka, Elasticsearch, multi-region |
| **Enterprise** (10,000+ tenants) | $25,000 - $75,000 | Multi-AZ, reserved instances, dedicated support |

**Additional costs:**
| Item | Estimated Cost |
|------|---------------|
| AI API usage (Claude/OpenAI) | $500 - $3,000/month |
| OCR processing | ~$10 per 1,000 documents |
| AG Grid Enterprise license | ~$1,500 - $3,000/year per developer |
| Elastic Cloud | $500 - $2,000/month |
| Domain & SSL | $100 - $500/year |

## Appendix B: Message Queue Architecture

### B.1 When to Use Kafka vs RabbitMQ

The system uses a **dual-broker strategy**: Apache Kafka for ordered event streaming (where sequence, replay, and fan-out matter), and RabbitMQ for task-oriented work distribution (where routing flexibility, retry, and acknowledgment semantics matter).

**Decision Rule:**
- If you are saying **"something happened"** (a voucher was posted, a rate changed) → **Kafka**
- If you are saying **"do this work"** (process this OCR document, send this email) → **RabbitMQ**

| Criteria | Use Kafka | Use RabbitMQ |
|----------|-----------|--------------|
| Ordering required per entity | Yes | No |
| Multiple consumers need same event | Yes (consumer groups) | Possible but less natural |
| Event replay / reprocessing needed | Yes (log retention) | No (consumed = gone) |
| Immutable event log (audit) | Yes | No |
| Stream processing (aggregations) | Yes (Kafka Streams) | No |
| Task distribution across workers | Overkill | Yes (competing consumers) |
| Complex routing (priority, TTL, DLX) | Limited | Yes (exchanges, bindings) |
| Request-reply pattern | Awkward | Yes (reply-to queues) |
| Retry with exponential backoff | Must build custom | Yes (DLX + TTL chains) |
| Rate limiting per consumer | Less natural | Yes (prefetch) |

---

### B.2 Financial Transaction Processing

#### B.2.1 Voucher Posting & Ledger Update Pipeline

> **Priority: CRITICAL** | **Broker: Apache Kafka**

**Why a queue is needed:** When a voucher is posted, the system must fan out to 7+ downstream services (ledger writer, trial balance cache, budget variance checker, AI anomaly detection, dashboard refresh, audit trail, tax calculation). Without a queue, the posting API must synchronously call all services -- adding 2-3 seconds latency and creating partial failure scenarios where the voucher posts but the audit trail is missed.

**Why Kafka:** Ledger entries MUST be processed in order per account. Kafka partition-key ordering (`tenant_id:journal_id`) guarantees this. A single posted event is consumed by 7 independent consumer groups without duplication.

```
Producer: Voucher Service (after approval completes)
    |
    v
Kafka Topic: "ledger.voucher.posted"
    Partition Key: {tenant_id}:{journal_id}
    |
    ├── Consumer Group 1: Ledger Writer Service
    |       → Writes debit/credit entries to GL tables
    |       → Updates running account balances
    |
    ├── Consumer Group 2: Trial Balance Cache Service
    |       → Incrementally updates cached TB for affected accounts
    |
    ├── Consumer Group 3: Budget Variance Service
    |       → Compares posted amount against budget allocations
    |       → Emits "budget.variance.alert" if threshold exceeded
    |
    ├── Consumer Group 4: AI Anomaly Detection Service
    |       → Feeds transaction into ML model for scoring
    |       → Emits "anomaly.detected" if score > threshold
    |
    ├── Consumer Group 5: Dashboard WebSocket Service
    |       → Pushes real-time balance updates to connected clients
    |
    ├── Consumer Group 6: Audit Trail Service
    |       → Writes immutable audit log entry
    |
    └── Consumer Group 7: Tax Calculation Service
            → Recalculates tax liability if tax-relevant accounts affected
```

**Example event payload:**
```json
{
  "event_id": "evt_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_type": "voucher.posted",
  "timestamp": "2026-02-01T14:23:45.123Z",
  "tenant_id": "tenant_acme_corp",
  "payload": {
    "voucher_id": "vch_20260201_00847",
    "voucher_type": "journal_entry",
    "voucher_number": "JV-2026-0847",
    "fiscal_period": "P10",
    "posting_date": "2026-02-01",
    "currency": "USD",
    "narration": "Office rent payment for February 2026",
    "posted_by": "user_jsmith_4821",
    "approved_by": "user_mwilliams_1092",
    "line_items": [
      {
        "account_code": "5100.10.001",
        "account_name": "Office Rent Expense",
        "cost_center": "CC-ADMIN",
        "debit": 5000.00,
        "credit": 0.00
      },
      {
        "account_code": "1100.20.005",
        "account_name": "Business Checking - Chase",
        "debit": 0.00,
        "credit": 5000.00
      }
    ],
    "total_debit": 5000.00,
    "total_credit": 5000.00
  },
  "metadata": {
    "schema_version": "2.1",
    "idempotency_key": "idem_vch_20260201_00847_post"
  }
}
```

---

#### B.2.2 Approval Workflow State Machine

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Approval transitions must trigger notifications, update dashboards, and maintain audit trails without blocking the approver's UI. Unapproved items that are not acted upon within X hours must auto-escalate.

**Why RabbitMQ:** Different approval levels need different routing. RabbitMQ topic exchanges support patterns like `approval.level1.#` and `approval.level2.#`. Per-message TTL with dead-letter exchange routing handles auto-escalation -- an approval request enters a queue with a 24-hour TTL, and when it expires, it dead-letters to an escalation queue.

```
Producer: Voucher Service (on submit / on approval action)
    |
    v
RabbitMQ Exchange: "workflow.approvals" (topic exchange)
    |
    ├── "approval.submitted.level1" → Queue with 24h TTL
    |   → Dead Letter → Escalation Queue
    |
    ├── "approval.action.approved" → Completion Queue
    |   → If final approval: triggers Kafka "ledger.voucher.posted"
    |   → If intermediate: routes to next approval level
    |
    └── "approval.action.rejected" → Rejection Queue
        → Notifies submitter, returns voucher to draft
```

---

#### B.2.3 Multi-Currency Exchange Rate Propagation

> **Priority: HIGH** | **Broker: Apache Kafka (compacted topic)**

**Why a queue is needed:** When exchange rates change, open foreign-currency invoices need unrealized gain/loss recalculation, multi-currency account balances need revaluation, and dashboards need refreshing. Without event-driven propagation, services poll on their own schedule causing stale/inconsistent rates.

**Why Kafka compacted topic:** Kafka log compaction keeps only the latest rate per currency pair. A consumer that was offline for hours reads just the latest value per key. Multiple consumer groups (revaluation, invoicing, dashboard, history) all consume the same stream.

```
Producer: Exchange Rate Sync Service (scheduled pulls from ECB, Open Exchange Rates)
    |
    v
Kafka Topic: "reference.exchange-rates" (compacted)
    Partition Key: {base_currency}:{quote_currency}
    |
    ├── Consumer: Foreign Currency Revaluation Service
    ├── Consumer: Invoice Valuation Service
    ├── Consumer: Dashboard Service
    └── Consumer: Rate History Archiver
```

---

#### B.2.4 Recurring Transaction Execution

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** On the 1st of each month, across 500 tenants with ~200 recurring templates each, the system must generate 100,000 vouchers. Without a queue, this either takes hours (serial) or crashes the database (parallel without backpressure).

**Why RabbitMQ:** Tasks need work distribution (competing consumers), acknowledgment (retry on crash), and prefetch-based rate limiting. No ordering between tenants is required.

```
Producer: Recurring Transaction Scheduler (cron)
    |
    v
RabbitMQ Queue: "recurring-generation-queue" (prefetch=5 per worker)
    → 10 Worker Instances
        → Creates voucher from template
        → If auto-post: produces to Kafka "ledger.voucher.posted"
        → If approval required: produces to RabbitMQ "workflow.approvals"
        → Dead Letter Queue for failures
```

---

### B.3 AI/ML Pipeline

#### B.3.1 AI Transaction Auto-Categorization

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** When 500 bank transactions arrive via bank feed sync, synchronous ML inference would take 25-100 seconds, timing out the HTTP connection. ML inference is GPU-intensive (50-200ms per transaction) and must be distributed across worker pools.

**Why RabbitMQ:** Work distribution with priority (manual imports prioritized over background syncs), prefetch-based GPU memory management, and retry with backoff for overloaded ML services.

```
Producer: Bank Feed Sync Service / CSV Import Service
    |
    v
RabbitMQ Queues:
    ├── "categorization-high-priority" (user-triggered imports)
    └── "categorization-normal" (background bank feed syncs)
        → ML Inference Workers (GPU instances)
            → If confidence >= 85%: auto-categorize
            → If confidence < 85%: flag for human review
            → Training feedback → "categorization-training-feedback" queue
```

---

#### B.3.2 AI Anomaly Detection Pipeline

> **Priority: HIGH** | **Broker: Apache Kafka**

**Why a queue is needed:** Every posted voucher must be analyzed for anomalies (duplicate payments, unusual amounts, timing anomalies, Benford's Law violations) without blocking the posting flow. Adding 200-500ms of synchronous anomaly detection to every voucher post would cripple month-end close performance.

**Why Kafka:** Anomaly detection needs complete event history for pattern comparison. Kafka Streams supports windowed aggregations ("total payments to vendor X in the last 7 days") directly on the stream. Consumer lag is tolerable -- anomaly detection falling behind must never slow the ledger.

```
Source: Kafka Topic "ledger.voucher.posted" (existing)
    |
    v
Kafka Streams: Anomaly Detection Pipeline
    ├── Stage 1: Feature Extraction (z-scores, Benford fit, frequency)
    ├── Stage 2: Model Inference (ensemble scoring)
    └── Stage 3: Alert Routing
        → Score > 0.9: "anomaly.critical" topic
        → Score 0.7-0.9: "anomaly.warning" topic
        → Score < 0.7: metrics only
```

---

#### B.3.3 NLP Financial Query Processing

> **Priority: MEDIUM** | **Broker: RabbitMQ**

**Why a queue is needed:** NLP queries involving LLM calls take 2-10 seconds. Without a queue, API threads are blocked, and under load the server runs out of threads. Queries have variable processing time (simple balance lookup: 100ms, multi-period comparison: 10 seconds).

**Why RabbitMQ:** Request-reply pattern with exclusive reply queues per user session. TTL on reply messages handles user navigation (abandoned queries auto-expire).

```
API Gateway → RabbitMQ "nlp-processing-queue"
    → NLP Workers (parse → translate to SQL → execute → format)
    → Reply Queue: "nlp-reply-{session_id}" (TTL=60s, auto-delete)
```

---

#### B.3.4 Cash Flow Forecasting Pipeline

> **Priority: MEDIUM** | **Broker: Apache Kafka**

**Why a queue is needed:** Forecasts must update when invoices are issued, bills entered, or payments made -- not just on a schedule. Without event-driven updates, a large invoice issued at 9 AM doesn't appear in the forecast until the next batch run.

**Why Kafka:** Consumes from multiple existing topics (`voucher.posted`, `invoice.lifecycle`, `bill.lifecycle`, `payment.processed`) using Kafka Streams join semantics. Reprocessing is needed when the forecasting model is improved.

```
Multiple Kafka Topics → Kafka Streams: Cash Flow Aggregator
    → Materializes: current cash position, AR/AP aging, seasonal patterns
    → Produces: "forecast.cashflow.updated"
        ├── Consumer: Dashboard Service (projection charts)
        └── Consumer: Alert Service ("low cash" warnings)
```

---

### B.4 Document Processing

#### B.4.1 OCR Document Processing Pipeline

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** OCR processing takes 3-15 seconds per document. Synchronous processing of 10 uploaded documents would take 30-150 seconds, always timing out the HTTP connection. OCR is CPU/GPU-intensive (1-2GB RAM per concurrent document).

**Why RabbitMQ:** Multi-stage pipeline with per-stage queues allows independent scaling (10 GPU OCR workers but only 3 entity matching workers). Retry with exponential backoff for poor-quality scans (30s → 2min → 10min → manual review).

```
User Upload → RabbitMQ Pipeline:
    Stage 1: "ocr-extraction-queue" (prefetch=1, GPU workers)
        → Extracts raw text + bounding boxes
    Stage 2: "ocr-field-extraction-queue" (prefetch=3, NLP workers)
        → Identifies: date, amount, vendor, line items, tax
    Stage 3: "ocr-entity-matching-queue" (prefetch=5)
        → Matches vendor to existing records
        → Maps line items to Chart of Accounts
        → Creates draft voucher/bill
    Dead Letter → "ocr-failed-dlq" → Manual review queue
```

---

### B.5 Reporting & Analytics

#### B.5.1 Scheduled Report Generation

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** A monthly financial statement package (P&L, Balance Sheet, Cash Flow, Trial Balance) takes 30-120 seconds to generate. On the 1st of the month, 500 tenants trigger monthly reports simultaneously. Without a queue, all 500 compete for database connections and most timeout/fail.

**Why RabbitMQ:** Heavy task distribution with priority (ad-hoc user requests prioritized over scheduled background reports). Delayed message delivery for scheduled times.

```
Report Scheduler / User Request
    → RabbitMQ "report-generation-queue" (priority queue)
        → Report Workers (4-8 instances, prefetch=1)
            → Queries ledger, applies COA hierarchy rollup
            → Renders to PDF/Excel
            → Stores in S3
            → Notifies user / emails recipients
```

---

#### B.5.2 Real-Time Dashboard Materialization

> **Priority: HIGH** | **Broker: Apache Kafka**

**Why a queue is needed:** With 1,000+ users refreshing dashboards every 30 seconds, direct database queries create 33+ complex aggregation queries per second -- competing with transactional writes. Pre-computed materialized views are essential.

**Why Kafka:** Kafka Streams materializes aggregated views (revenue by period, AR aging buckets, expense by category) from the same `ledger.voucher.posted` stream, guaranteeing consistency with the general ledger. State stores (RocksDB) enable sub-millisecond dashboard reads.

```
Kafka Topic "ledger.voucher.posted" (existing)
    → Kafka Streams: Dashboard Materialization
        → State Stores: revenue-by-period, expense-by-category,
                        ar-aging, ap-aging, bank-balances, budget-utilization
        → Dashboard API queries state stores (sub-ms reads)
        → WebSocket pushes updates to connected clients
```

---

### B.6 Integrations & External Systems

#### B.6.1 Bank Feed Synchronization (Open Banking)

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Across 500 tenants with 3 bank accounts each, 1,500 bank syncs per cycle must respect per-bank API rate limits (e.g., Plaid allows 100 requests/minute). Without a queue, simultaneous requests exhaust rate limits and fail.

**Why RabbitMQ:** Per-bank-API queues allow precise rate control. Priority queues for user-triggered "Sync Now" over scheduled syncs. Dead-letter retry for transient bank API failures (503, rate limit).

```
Scheduler / User "Sync Now"
    → RabbitMQ Exchange: "banking.sync" (topic exchange)
        ├── "bank-sync-plaid" queue (prefetch=10, rate-limited)
        ├── "bank-sync-truelayer" queue (prefetch=5)
        └── "bank-sync-dlq" → Auth re-authentication / user alerts
    → On success: produces to "ai.categorization" + "reconciliation.pending"
```

---

#### B.6.2 Webhook Delivery to Third-Party Systems

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Webhook endpoints may be slow (5-second timeout), failing, or rate-limited. One tenant's failing endpoint must not delay all other deliveries. Reliable at-least-once delivery requires retry with exponential backoff.

**Why RabbitMQ:** Per-endpoint queues isolate slow endpoints. Dead-letter exchange chains with escalating TTL implement retry tiers (30s → 2min → 10min → 1hr → 6hr → permanent failure). Manual acknowledgment ensures delivery only after receiving 2xx response.

```
Kafka events → Webhook Router (looks up registered webhooks)
    → RabbitMQ "webhook-deliver-{endpoint_hash}" (per endpoint)
        → Delivery Worker: HTTP POST + HMAC signature
            → 2xx: ACK ✓
            → 5xx/timeout: NACK → retry tier queues
            → Permanent failure after max retries → disables endpoint
```

---

#### B.6.3 AI-Powered Bank Reconciliation

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Matching 500 bank transactions against 600 ledger entries is an O(n*m) computation taking 30-60 seconds. Synchronous execution times out the HTTP request when users click "Auto-Reconcile."

**Why RabbitMQ:** Heavy compute per task (one bank account at a time), user-triggered needs priority over scheduled runs, no cross-account dependency.

```
User "Auto-Reconcile" / Scheduler
    → RabbitMQ "reconciliation-jobs" (priority queue, prefetch=1)
        → Reconciliation Workers
            → Exact match → fuzzy match → multi-match
            → High confidence: auto-reconcile
            → Low confidence: create suggestions for user review
            → Produces "reconciliation.completed" to Kafka
```

---

### B.7 Notifications & Communication

#### B.7.1 Multi-Channel Notification Delivery

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Email (100ms-3s), push (50ms), Slack (100ms), and SMS (200ms) have different delivery characteristics. A slow SMTP handshake must not block push notification delivery. SMS rate limits must be respected to avoid cost explosions.

**Why RabbitMQ:** Per-channel queues with independent consumer pools. Priority queues (security alerts > routine notifications). Prefetch-based rate limiting per channel.

```
Notification Router (applies user preferences + quiet hours)
    → RabbitMQ Exchange: "notifications" (topic exchange)
        ├── "notification.email.*" → Email Workers (SES/SendGrid)
        ├── "notification.push.*" → Push Workers (Firebase/APNs)
        ├── "notification.slack.*" → Slack Workers
        └── "notification.sms.critical" → SMS Workers (Twilio, rate-limited)
```

---

### B.8 Audit & Compliance

#### B.8.1 Immutable Audit Trail Event Log

> **Priority: CRITICAL** | **Broker: Apache Kafka**

**Why a queue is needed:** Every data mutation must be logged. Audit logging must NEVER fail the primary operation. If the audit consumer is temporarily down, events must accumulate and be processed on recovery -- zero entries can be lost. This is a legal requirement (SOX compliance, GAAP/IFRS).

**Why Kafka:** Kafka's append-only log is inherently immutable. Ordering per entity is guaranteed. Retention can be set to 7+ years. Events can be replayed for auditors to reconstruct system state at any point in time. A compromised service cannot retroactively remove audit entries.

```
Every Service (producers) → Kafka Topic: "audit.events"
    Partition Key: {tenant_id}:{entity_type}:{entity_id}
    Retention: 7 years (or tiered to S3/Glacier)
    |
    ├── Consumer: Audit Log Writer → Immutable append-only table
    ├── Consumer: Compliance Monitor → Real-time violation detection
    |       (e.g., "User approved their own voucher")
    ├── Consumer: Audit Archiver → Cold storage (S3/Glacier)
    └── Consumer: Analytics Pipeline → Usage patterns, security monitoring
```

---

#### B.8.2 Tax Compliance Event Stream

> **Priority: CRITICAL** | **Broker: Apache Kafka**

**Why a queue is needed:** Missing a single taxable transaction means the tax return will be wrong, resulting in penalties. When tax rules change retroactively, all affected transactions must be reprocessed.

**Why Kafka:** Durability guarantees no events are lost. Ordering ensures running tax liability is accurate. Replay capability supports retroactive tax rule changes.

```
Kafka "ledger.voucher.posted" (filtered for tax-relevant entries)
    → Kafka Topic: "tax.transactions"
        ├── Consumer: Tax Accumulator (running liability per jurisdiction)
        ├── Consumer: Compliance Monitor (threshold alerts)
        └── Consumer: Tax Return Preparation (pre-fills returns)
```

---

### B.9 Scheduled / Background Jobs

#### B.9.1 Period-End Processing (Month Close / Year Close)

> **Priority: CRITICAL** | **Broker: RabbitMQ (orchestration) + Kafka (resulting events)**

**Why a queue is needed:** Month-end close is the most intensive batch operation -- sequential steps (verify → FX revaluation → depreciation → accruals → reports → lock period) each generating auto-vouchers. If the process crashes mid-step, there must be a mechanism to resume from the failed step.

**Why hybrid:** RabbitMQ orchestrates sequential steps (each step produces the trigger for the next). Resulting vouchers flow through the standard Kafka `ledger.voucher.posted` pipeline.

```
User initiates close → RabbitMQ "period-close" exchange
    Step 1: "close-step-verify" → Check for unposted/unreconciled items
    Step 2: "close-step-fx-revaluation" → Generate gain/loss entries → Kafka
    Step 3: "close-step-depreciation" → Calculate & post depreciation → Kafka
    Step 4: "close-step-accruals" → Generate accrual entries → Kafka
    Step 5: "close-step-reports" → Generate final TB, P&L, BS
    Step 6: "close-step-lock" → Set period status to "Closed"
    → Each step reports progress: "Step 3 of 6: Calculating depreciation..."
```

---

#### B.9.2 AR/AP Aging & Dunning Automation

> **Priority: HIGH** | **Broker: RabbitMQ**

**Why a queue is needed:** Daily aging calculation across all tenants with thousands of open invoices is a significant batch operation. Each overdue invoice triggers a dunning workflow (reminder emails at 7, 14, 30 days). Without a queue, parallel aging for all tenants takes hours; with workers, it completes in minutes.

**Why RabbitMQ:** Independent per-tenant aging jobs distributed across workers. Dunning emails must be throttled (prefetch) to avoid spam filter triggers.

```
Daily Scheduler → RabbitMQ "aging-calculation-queue"
    → Aging Workers
        → Calculate aging buckets for all open items per tenant
        → For each overdue item → "dunning-queue"
            → Dunning Workers
                → Check dunning level (1st, 2nd, 3rd reminder)
                → Generate notification → notification queue
                → Apply late fees if configured
                → Log dunning action for audit
```

---

#### B.9.3 Data Import/Export Processing

> **Priority: MEDIUM** | **Broker: RabbitMQ**

**Why a queue is needed:** A 50,000-row historical transaction import takes minutes. Synchronous processing always times out the HTTP connection. Without chunked processing through a queue, a crash at row 35,000 means reprocessing the entire file.

**Why RabbitMQ:** Long-running task with progress reporting via WebSocket. Chunked processing with acknowledgment (crash recovery from last committed chunk). Backpressure on database via prefetch.

```
User Upload → RabbitMQ Pipeline:
    ├── "import-validation-queue" → Parse, validate schema & referential integrity
    ├── "import-execution-queue" → Process in chunks of 1,000 rows
    |       → Reports progress: "Processed 15,000 of 50,000 rows"
    └── "export-generation-queue" → Generate CSV/Excel → S3 → download link
```

---

### B.10 Complete Topic & Queue Inventory

#### Kafka Topics (13 topics)

| # | Topic Name | Purpose | Partition Key | Retention |
|---|-----------|---------|---------------|-----------|
| 1 | `ledger.voucher.posted` | Core financial event stream | `tenant_id:journal_id` | 90 days |
| 2 | `ledger.voucher.reversed` | Reversal events | `tenant_id:journal_id` | 90 days |
| 3 | `invoice.lifecycle` | Invoice created/sent/paid/voided | `tenant_id:invoice_id` | 90 days |
| 4 | `bill.lifecycle` | Bill entered/approved/paid | `tenant_id:bill_id` | 90 days |
| 5 | `payment.processed` | Payment receipt/disbursement | `tenant_id:payment_id` | 90 days |
| 6 | `reference.exchange-rates` | FX rates (compacted) | `base:quote` | Compacted |
| 7 | `reconciliation.completed` | Bank reconciliation results | `tenant_id:account_id` | 30 days |
| 8 | `anomaly.detected` | AI anomaly alerts | `tenant_id` | 30 days |
| 9 | `forecast.cashflow.updated` | Cash flow projections | `tenant_id` | 7 days |
| 10 | `audit.events` | Immutable audit trail | `tenant_id:entity` | 7 years |
| 11 | `tax.transactions` | Tax-relevant transactions | `tenant_id:jurisdiction` | 7 years |
| 12 | `tenant.lifecycle` | Tenant provisioning/config | `tenant_id` | Compacted |
| 13 | `dashboard.updates` | Materialized dashboard changes | `tenant_id` | 1 day |

#### RabbitMQ Queues (27 queues)

| # | Queue Name | Purpose | Prefetch | Has DLQ |
|---|-----------|---------|----------|---------|
| 1 | `approval-level1-queue` | First-level approval routing | 10 | Yes |
| 2 | `approval-level2-queue` | Second-level (24h TTL escalation) | 5 | Yes |
| 3 | `approval-completion-queue` | Approved/rejected actions | 10 | Yes |
| 4 | `recurring-generation-queue` | Recurring transaction generation | 5 | Yes |
| 5 | `categorization-high-priority` | AI categorization (user imports) | 2 | Yes |
| 6 | `categorization-normal` | AI categorization (bank feeds) | 5 | Yes |
| 7 | `categorization-training-feedback` | ML model training data | 10 | Yes |
| 8 | `nlp-processing-queue` | NLP financial query processing | 3 | Yes |
| 9 | `ocr-extraction-queue` | Stage 1: OCR text extraction | 1 | Yes |
| 10 | `ocr-field-extraction-queue` | Stage 2: Field identification | 3 | Yes |
| 11 | `ocr-entity-matching-queue` | Stage 3: Entity matching | 5 | Yes |
| 12 | `bank-sync-plaid` | Bank feed sync (Plaid) | 10 | Yes |
| 13 | `bank-sync-truelayer` | Bank feed sync (TrueLayer) | 5 | Yes |
| 14 | `webhook-deliver-{endpoint}` | Per-endpoint webhook delivery | 3 | Yes |
| 15 | `webhook-retry-30s` | Webhook retry tier 1 | - | Yes |
| 16 | `webhook-retry-2m` | Webhook retry tier 2 | - | Yes |
| 17 | `webhook-retry-10m` | Webhook retry tier 3 | - | Yes |
| 18 | `notification-email-queue` | Email delivery (SES/SendGrid) | 5 | Yes |
| 19 | `notification-push-queue` | Push notifications (Firebase/APNs) | 10 | Yes |
| 20 | `notification-slack-queue` | Slack notifications | 5 | Yes |
| 21 | `notification-sms-queue` | SMS (critical only, rate-limited) | 2 | Yes |
| 22 | `report-generation-queue` | Report generation jobs | 1 | Yes |
| 23 | `reconciliation-jobs` | Bank reconciliation processing | 1 | Yes |
| 24 | `import-validation-queue` | Data import validation | 2 | Yes |
| 25 | `import-execution-queue` | Data import execution | 1 | Yes |
| 26 | `export-generation-queue` | Data export generation | 2 | Yes |
| 27 | `aging-calculation-queue` | AR/AP aging calculation | 3 | Yes |
| 28 | `dunning-queue` | Overdue invoice dunning | 5 | Yes |
| 29 | `close-step-{name}` | Period close orchestration | 1 | Yes |

---

### B.11 Architectural Principles

1. **The general ledger is the source of truth.** The Kafka topic `ledger.voucher.posted` is the single event stream from which all other financial state is derived. Dashboards, reports, tax calculations, and AI features are all consumers of this stream.

2. **Never block the posting path.** Any processing that can fail independently (AI, notifications, webhooks, dashboards) must be decoupled via message queue. The user should never see "voucher posting failed because the dashboard service was slow."

3. **Idempotency everywhere.** Every message includes an `idempotency_key` or `event_id`. In a double-entry system, applying the same voucher twice would break the trial balance. All consumers must check for duplicates before processing.

4. **Dead letter queues for every RabbitMQ queue.** In accounting, silent data loss is unacceptable. Every queue has a DLQ, every DLQ has monitoring and alerting.

5. **Start simple, scale later.** For MVP, start with RabbitMQ only (covers 80% of use cases). Introduce Kafka when event streaming, audit trail, and dashboard materialization become critical. Alternatively, use AWS SQS + SNS as a managed starting point.

---

## Appendix C: PostgreSQL High Availability & Load Balancing Architecture

### C.1 Cluster Topology

```
                            Internet
                               |
                        +------v------+
                        |     ALB     |
                        | (HTTPS/443) |
                        +------+------+
                               |
            +------------------+------------------+
            |                  |                  |
    +-------v-------+  +------v--------+  +------v--------+
    | App Server    |  | App Server    |  | App Server    |
    | + PgBouncer   |  | + PgBouncer   |  | + PgBouncer   |
    | (AZ-a)        |  | (AZ-b)        |  | (AZ-c)        |
    +-------+-------+  +------+--------+  +------+--------+
            |                  |                  |
            +------------------+------------------+
                               |
                    +----------v----------+
                    |    HAProxy Cluster   |
                    | (Active/Standby +    |
                    |  keepalived VIP)     |
                    | Port 5432: writes    |
                    | Port 5433: reads     |
                    +----------+----------+
                               |
         +---------------------+---------------------+
         |                     |                     |
+--------v--------+   +-------v---------+   +-------v---------+
| PostgreSQL      |   | PostgreSQL      |   | PostgreSQL      |
| PRIMARY         |   | SYNC REPLICA    |   | SYNC REPLICA    |
| + Patroni       |   | + Patroni       |   | + Patroni       |
| (AZ-a)          |   | (AZ-b)          |   | (AZ-c)          |
+-----------------+   +-----------------+   +-----------------+
         |                     |                     |
         +---------------------+---------------------+
                               |
                    +----------v----------+
                    |   etcd Cluster      |
                    | (3 nodes across AZs)|
                    | Leader election &   |
                    | cluster state       |
                    +---------------------+

                    +---------------------+
                    | Async Delayed       |
                    | Replica (1h delay)  |
                    | Corruption defense  |
                    +---------------------+
```

**Node Inventory:**
- 1 Primary (read-write) in AZ-a
- 2 Synchronous Replicas (hot standby, read-only) in AZ-b and AZ-c
- 1 Asynchronous Delayed Replica (1-hour delay) for corruption defense
- 3 etcd nodes (one per AZ) for distributed consensus
- 2 HAProxy nodes (active/standby with keepalived VIP)
- PgBouncer deployed as sidecar on each application server

---

### C.2 How Each Layer Works

#### Layer 1: PgBouncer (Connection Pooling)

**Problem:** PostgreSQL forks a new OS process for every client connection (~5-10 MB RAM each). With 1,000+ concurrent users per tenant across multiple tenants, direct connections would require thousands of backend processes, exhausting memory and causing context-switching overhead.

**Solution:** PgBouncer sits between the application and PostgreSQL, maintaining a pool of reusable backend connections.

```
5,000-50,000 client connections (across all tenants)
        |
        v
   PgBouncer (transaction pooling mode)
        |
        v
200-400 actual PostgreSQL backend connections
```

**Pool mode: Transaction pooling** -- a backend connection is assigned only for the duration of a single transaction. After COMMIT/ROLLBACK, it returns to the pool. This is ideal for accounting because:
- Accounting operations are transactional (debit + credit must be atomic) but short-lived (~100ms)
- Between transactions, users spend time viewing reports, filling forms -- they don't need a held connection
- Statement pooling is unsuitable because accounting requires multi-statement transactions (BEGIN; INSERT debit; INSERT credit; COMMIT)

**Key configuration:**
```ini
pool_mode = transaction
max_client_conn = 10000      # Total client connections across all pools
default_pool_size = 30        # Backend connections per (db, user) pair
min_pool_size = 5             # Keep minimum connections warm
max_db_connections = 300      # Total backend connections to one database
max_prepared_statements = 200 # Prepared statement support in txn mode
```

**HA approach:** Deploy PgBouncer as a sidecar on each application server/container. If an app server dies, its PgBouncer dies with it, but other app servers continue. No shared single point of failure.

---

#### Layer 2: HAProxy (Read/Write Splitting & Load Balancing)

**Problem:** With multiple PostgreSQL nodes, the application needs writes routed to the primary and reads distributed across replicas, with automatic rerouting after failover.

**Solution:** HAProxy operates at TCP level with separate ports for read and write traffic. It queries Patroni's REST API to determine each node's current role.

```
Application Code:
  DATABASE_WRITE_URL = "postgresql://haproxy:5432/accounting"
  DATABASE_READ_URL  = "postgresql://haproxy:5433/accounting"
```

**Health checks via Patroni REST API:**
```
backend pg_primary
    option httpchk GET /primary        # Returns 200 only on current primary
    http-check expect status 200
    server pg1 10.0.1.10:5432 check port 8008
    server pg2 10.0.2.10:5432 check port 8008
    server pg3 10.0.3.10:5432 check port 8008

backend pg_replicas
    option httpchk GET /replica        # Returns 200 only on healthy replicas
    http-check expect status 200
    balance roundrobin
    server pg1 10.0.1.10:5432 check port 8008
    server pg2 10.0.2.10:5432 check port 8008
    server pg3 10.0.3.10:5432 check port 8008
```

After failover, Patroni updates each node's role. HAProxy health checks detect the change within seconds and reroute traffic automatically.

**Read-after-write consistency:** When a user posts a voucher (write to primary) and immediately views the trial balance (read), they must see their own write. Solved with `synchronous_commit = remote_apply` -- the primary does not confirm COMMIT until the synchronous replica has replayed the transaction, making it visible to read queries on that replica.

---

#### Layer 3: Patroni (Automatic Failover & Cluster Management)

**Problem:** Streaming replication gives you standby servers, but it doesn't automatically detect primary failure, elect a new primary, or reconfigure remaining nodes. Without automation, failover requires manual DBA intervention -- incompatible with 99.9% SLA.

**Solution:** Patroni runs as a daemon alongside each PostgreSQL instance, managing leader election, failover, and reconfiguration using etcd for distributed consensus.

**How leader election works:**
1. The current leader holds a distributed lock (key with TTL) in etcd
2. The leader must renew this lock every `loop_wait` seconds (default: 10s)
3. If the leader fails to renew (crash, network issue), the lock expires after `ttl` seconds (default: 30s)
4. All standby Patroni nodes detect the expired lock
5. Each evaluates its eligibility (WAL position, replication lag)
6. Candidates attempt to acquire the lock -- etcd's Raft consensus ensures exactly one wins
7. The winner promotes its PostgreSQL via `pg_promote()`
8. Remaining standbys reconfigure to replicate from the new primary
9. HAProxy detects the role change and reroutes traffic

**Failover time:** 10-30 seconds for the full sequence.

**Split-brain prevention (critical for accounting):**
- Only one node can hold the etcd leader lock at a time (Raft consensus)
- When a node loses the lock, Patroni immediately demotes PostgreSQL to read-only
- Linux watchdog integration reboots the server if the Patroni process itself hangs
- `maximum_lag_on_failover` prevents promotion of a replica that is too far behind

**Key configuration:**
```yaml
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576     # 1MB max lag for failover candidate
    synchronous_mode: true
    postgresql:
      parameters:
        synchronous_commit: "remote_apply"
        synchronous_standby_names: "ANY 1 (replica_az_b, replica_az_c)"
```

---

#### Layer 4: PostgreSQL Streaming Replication

**How WAL (Write-Ahead Logging) replication works:**

Every data modification is first recorded as a WAL record before the actual data pages are changed on disk. The primary continuously streams these WAL records to standby servers:

```
Primary Server                              Standby Server
+------------------+                        +------------------+
| Client writes    |                        |                  |
|   |              |                        |                  |
|   v              |                        |                  |
| WAL record       |   TCP stream           |                  |
| written to disk  | ==================>    | WAL Receiver     |
|   |              |                        |   |              |
|   v              |                        |   v              |
| WAL Sender       |                        | Writes WAL to    |
|                  |                        | local disk        |
+------------------+                        |   |              |
                                            |   v              |
                                            | Startup Process  |
                                            | replays WAL      |
                                            | against data     |
                                            +------------------+
```

**Synchronous replication (recommended for accounting):**
- Primary waits for at least one replica to confirm before completing COMMIT
- `synchronous_commit = remote_apply` ensures the replica has replayed the transaction (visible to read queries)
- Quorum: `ANY 1 (replica_b, replica_c)` -- at least 1 of 2 replicas must confirm
- RPO = 0 (zero data loss for committed transactions)
- Additional write latency: 1-3ms within the same AWS region

**Delayed replica (corruption defense):**
- One additional async replica with `recovery_min_apply_delay = '1h'`
- Always 1 hour behind the primary
- If someone accidentally runs `DELETE FROM journal_entries WHERE ...`, this replica still has the correct data
- Window to catch and recover from logical corruption that streaming replicas would faithfully replicate

---

### C.3 Failover Sequence

```
Time  Primary(AZ-a)    etcd           Replica(AZ-b)   HAProxy        Application
 |
 |    [CRASHES]
 |    X-----------+
 |                |
 |                v
 |         Leader lock TTL
 |         expires (30s)
 |                |
 |                +------------> Detects expired lock
 |                               |
 |                               v
 |                           Evaluates WAL position
 |                           (must be within 1MB of primary)
 |                               |
 |                               v
 |                           Acquires leader lock
 |                <----------in etcd (Raft consensus)
 |                               |
 |                               v
 |                           pg_promote()
 |                           → Becomes new PRIMARY
 |                               |
 |                               v
 |                           Updates DCS          /primary → 200
 |                           with new role ------> on AZ-b
 |                                                    |
 |                                                    v
 |                                                Reroutes writes -----> Brief reconnect
 |                                                to AZ-b               (10-30s total)
 |
 |    [Recovers later]
 |    Detects timeline
 |    mismatch → pg_rewind
 |    → Becomes REPLICA
 |    of new PRIMARY
 v
```

**Total downtime: 10-30 seconds.** This is well within the 99.9% SLA budget of ~8.7 hours/year.

---

### C.4 Failure Scenarios

| Scenario | Detection | Recovery | Data Loss | Downtime |
|----------|-----------|----------|-----------|----------|
| **Primary crashes** | Patroni heartbeat fails, etcd lock expires | Replica promoted, HAProxy reroutes | Zero (sync replication) | 10-30 seconds |
| **Replica crashes** | HAProxy health check fails | Removed from read pool, reads continue on remaining replica(s) | None | Zero for writes, brief read redistribution |
| **Network partition** | Primary can't reach etcd, lock expires | Replica in etcd-majority partition promoted; old primary fenced and rebuilt | Possible rollback of in-flight transactions | 10-30 seconds |
| **Disk failure on primary** | PostgreSQL I/O errors, Patroni detects crash | Same as primary crash -- replica promoted | Zero (sync replication) | 10-30 seconds |
| **Entire AZ goes down** | All nodes in AZ unreachable | If primary was in failed AZ, replica in another AZ promoted. etcd maintains quorum (2 of 3) | Zero (sync replication) | 10-30 seconds |
| **Logical corruption** (bad DELETE/UPDATE) | Application-level checks (trial balance mismatch) | Promote delayed replica (if caught within 1h) or PITR from backup | Up to 1 hour (delayed replica) or RPO of backup | Minutes to hours depending on detection speed |

---

### C.5 Backup & Point-in-Time Recovery

```
Primary
  |
  ├──[Continuous WAL archiving]──> pgBackRest ──> S3 (same region)
  |                                             └──> S3 (DR region via CRR)
  |
  ├──[Weekly full backup]──────> pgBackRest ──> S3
  |   (pg_basebackup, parallel)
  |
  └──[Daily incremental backup]──> pgBackRest ──> S3
      (block-level delta)
```

**Point-in-Time Recovery (PITR):**
1. Restore the most recent base backup that precedes the target time
2. Replay archived WAL segments in sequence up to the target timestamp
3. Result: database state at any point in time with second-level granularity

```
Base Backup        WAL Segments (archived continuously)
(Sunday 2am)       [Mon] [Tue] [Wed] [Thu:14:30]
    |                |     |     |        |
    +================+=====+=====+========+
                                          ^
                              Target: "Restore to Thursday 14:29
                               just before the accidental DELETE"
```

**pgBackRest** is recommended for accounting because:
- Block-level incremental backups (most storage-efficient)
- Built-in `pgbackrest verify` for backup integrity validation
- Parallel backup/restore (faster RTO for large databases)
- Encryption at rest
- Native S3 support

**Backup verification (monthly):**
1. Restore latest backup to isolated test environment
2. Run PostgreSQL integrity checks (data checksums)
3. Run accounting validation: `SELECT SUM(debit) - SUM(credit) FROM journal_entries` must equal zero per voucher and globally
4. Alert if any validation fails

---

### C.6 Read/Write Traffic Flow

```
POST /api/vouchers (create voucher)           GET /api/trial-balance
        |                                              |
        v                                              v
   PgBouncer (sidecar)                          PgBouncer (sidecar)
        |                                              |
        v                                              v
   HAProxy :5432 (writes)                      HAProxy :5433 (reads)
        |                                              |
        v                                        +-----+------+
   PRIMARY (AZ-a)                                |            |
   - INSERT debit entry                    REPLICA-b    REPLICA-c
   - INSERT credit entry                   (AZ-b)       (AZ-c)
   - UPDATE account balances               round-robin or
   - COMMIT                                least-connections
        |
        | synchronous_commit = remote_apply
        | (waits for replica to replay)
        |
        v
   COMMIT acknowledged to application
   → Replica already has the data visible
   → User's next read (trial balance) sees the posted voucher
```

---

### C.7 Scaling Path

```
Phase 1: Single Primary + 2 Replicas (handles most SaaS scale)
    │
    │  When read load exceeds 2 replicas' capacity:
    v
Phase 2: Add Read Replicas (up to 5-10)
    │
    │  When data volume makes single-node queries slow:
    v
Phase 3: Table Partitioning (by fiscal_year + tenant_id hash)
    │    - Old fiscal years on cold storage
    │    - Active year partitions on fast NVMe
    │
    │  When write throughput exceeds single primary capacity:
    v
Phase 4: Citus Extension (horizontal sharding by tenant_id)
    │    - Each tenant's data co-located on one shard
    │    - Queries scoped to tenant execute on single node
    │
    │  When multi-region active-active writes are needed:
    v
Phase 5: Evaluate CockroachDB / YugabyteDB
```

**Table partitioning for 7-year retention:**
```sql
-- Range partition by fiscal year
CREATE TABLE journal_entries (
    id              bigint,
    tenant_id       uuid,
    fiscal_year     int,
    entry_date      date,
    ...
) PARTITION BY RANGE (fiscal_year);

CREATE TABLE journal_entries_2026
    PARTITION OF journal_entries
    FOR VALUES FROM (2026) TO (2027);

-- Old fiscal years: detach and archive to S3
ALTER TABLE journal_entries DETACH PARTITION journal_entries_2019;
```

Benefits: queries filtered by fiscal year scan only relevant partitions. VACUUM/REINDEX run on individual partitions. Old years archived without bloating active database.

---

### C.8 AWS Deployment Options Comparison

| Aspect | Self-Managed (EC2/EKS + Patroni) | RDS Multi-AZ Cluster | Aurora PostgreSQL |
|--------|-----------------------------------|---------------------|-------------------|
| **Failover time** | 10-30 seconds | ~35 seconds | 15-30 seconds |
| **SLA** | 99.9%+ (with proper ops) | 99.95% | 99.99% |
| **RPO** | 0 (sync replication) | 0 (sync replication) | 0 (shared storage) |
| **Read replicas** | Unlimited | 2 (included) | Up to 15 |
| **Extension support** | Full (Citus, pgvector, etc.) | Most standard extensions | Most standard extensions |
| **Configuration control** | Full (OS + PostgreSQL) | PostgreSQL params only | PostgreSQL params only |
| **Operational overhead** | High (DBA required) | Low | Lowest |
| **Connection pooling** | PgBouncer (self-managed) | RDS Proxy (managed) | RDS Proxy (managed) |
| **Backup tool** | pgBackRest (self-managed) | Automated (35 days) | Automated (35 days) |
| **Cost (2x r6g.2xlarge + 500GB)** | ~$2,550/mo + DBA | ~$3,750/mo | ~$5,000-5,500/mo |

**Recommendation:**
- **Startup / early stage:** Aurora PostgreSQL -- operational simplicity and 99.99% SLA justify the cost premium when downtime hurts more than infrastructure bills
- **Growth stage (50+ tenants):** Self-managed on EKS with Patroni -- cost savings and full control over extensions and configuration
- **Middle ground:** RDS Multi-AZ DB Cluster -- good balance of cost, simplicity, and reliability

---

### C.9 Monitoring Alerts for Accounting System

| Metric | Warning | Critical | Why It Matters |
|--------|---------|----------|----------------|
| Replication lag (time) | > 5s | > 30s | Stale reads on replicas → wrong trial balance |
| Replication lag (bytes) | > 50MB | > 500MB | Data loss risk on failover |
| Connection utilization | > 70% | > 90% | Connection exhaustion → 5xx errors |
| Transaction duration | > 5s | > 30s | Long transactions block vacuum, increase lag |
| Deadlocks/hour | > 5 | > 20 | Application concurrency issues |
| Dead tuples ratio | > 20% | > 50% | Table bloat → degraded query performance |
| Disk usage | > 70% | > 85% | Full disk = database crash |
| Cache hit ratio | < 99% | < 95% | Too many disk reads → slow queries |
| Inactive replication slot | > 1h | > 6h | WAL bloat consuming primary disk |
| Backup age | > 25h | > 49h | Backup pipeline may be failing |

---

## Appendix D: Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Uptime SLA** | 99.9% availability |
| **Response Time** | < 200ms for standard API calls |
| **Report Generation** | < 5 seconds for standard reports |
| **Concurrent Users** | Support 1,000+ per tenant |
| **Data Retention** | Minimum 7 years |
| **Backup Frequency** | Daily with 30-day retention |
| **RTO (Recovery Time)** | < 4 hours |
| **RPO (Recovery Point)** | < 1 hour |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Mobile Support** | iOS 15+, Android 12+ |
| **Accessibility** | WCAG 2.1 Level AA compliance |

## Appendix E: Pricing Tier Feature Matrix

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|-------------|------------|
| Users | 1 | 3 | 10 | Unlimited |
| Organizations | 1 | 1 | 3 | Unlimited |
| Transactions/month | 100 | 1,000 | Unlimited | Unlimited |
| Bank Connections | 1 | 3 | 10 | Unlimited |
| Chart of Accounts Levels | 2 | 3 | 4 | 4 |
| AI Features | Basic | Standard | Advanced | Full |
| Multi-Currency | - | 5 currencies | 50 currencies | Unlimited |
| API Access | - | - | Yes | Yes |
| White-Labeling | - | - | - | Yes |
| Custom Roles | - | - | Yes | Yes |
| Priority Support | - | - | Yes | Yes |
| Dedicated Account Manager | - | - | - | Yes |
