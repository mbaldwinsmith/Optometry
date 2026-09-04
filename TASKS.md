# TASKS.md — Optometry Report Generator & Clinical Document Portal
**Target Project:** EliteSight HomeCare — Optometry Batch Portal & Clinical Document Generator  
**Architecture Reference:** [EliteSight Audiology Portal](https://github.com/mbaldwinsmith/Audiology)  
**Security & Compliance:** Zero-Retention In-Memory Architecture (GDPR / NHS Data Security compliant)  
**Execution Note:** *Do not execute these tasks in the current repository; this document serves as the complete, phased implementation blueprint for the new repository.*

---

## 📋 Table of Contents
1. [Project Overview & Architectural Blueprint](#1-project-overview--architectural-blueprint)
2. [Data Schema & Clinical Domain Specifications](#2-data-schema--clinical-domain-specifications)
3. [Technology Stack & Dependencies](#3-technology-stack--dependencies)
4. [Target Repository Directory Layout](#4-target-repository-directory-layout)
5. [Granular Phase-by-Phase Task Breakdown](#5-granular-phase-by-phase-task-breakdown)
   - [Phase 1: Project Scaffolding & Build System](#phase-1-project-scaffolding--build-system)
   - [Phase 2: Types, Constants & Core Security Utilities](#phase-2-types-constants--core-security-utilities)
   - [Phase 3: Clinical Engines (Rx, Dementia Explainer, GOS Vouchers, Cleaners)](#phase-3-clinical-engines-rx-dementia-explainer-gos-vouchers-cleaners)
   - [Phase 4: CSV Ingestion, Validation & Sample Data Engine](#phase-4-csv-ingestion-validation--sample-data-engine)
   - [Phase 5: Print Engine & Standardized A4 Document Templates](#phase-5-print-engine--standardized-a4-document-templates)
   - [Phase 6: Interactive UI Components & Live Editor](#phase-6-interactive-ui-components--live-editor)
   - [Phase 7: PDF Generation, Batch ZIP Export & PWA Offline Engine](#phase-7-pdf-generation-batch-zip-export--pwa-offline-engine)
   - [Phase 8: Verification Suite, Linting & CI/CD Deployment](#phase-8-verification-suite-linting--cicd-deployment)
6. [Acceptance Criteria & Definition of Done](#6-acceptance-criteria--definition-of-done)

---

## 1. Project Overview & Architectural Blueprint

The **Optometry Report Generator** is an offline-first, client-side Progressive Web Application (PWA) designed for mobile optometry teams visiting care homes and domiciliary patients. It ingests resident consultation spreadsheets (exported from practice management systems like Blink), parses optical prescriptions (Spex Rx), generates plain-English, dementia-friendly patient summaries, tracks NHS GOS vs. Private funding, calculates 2-year examination recalls, and produces pixel-perfect A4 clinical reports and invoices.

### Core Architectural Pillars
1. **Zero-Retention Client-Side Processing**: 100% in-browser memory execution. No patient identifiable data (PID) or clinical records are ever transmitted to or stored on external servers or databases.
2. **Deterministic References & Audit Trails**: Deterministic generation of report references and invoice/voucher numbers based on care home initials, patient initials, DOB, and sequence keys (e.g. `FCH-MD1403-OPT1`).
3. **Dementia & Carer Friendly Communication**: Automatic translation of complex optometric formulas (SPH, CYL, Axis, Add) and clinical shorthand into warm, jargon-free, high-contrast text descriptions for patients with mild cognitive impairment, their families, and care workers.
4. **Three Standardized A4 Document Outputs**:
   - 🏢 **Care Home Optometry Overview Summary**: Visit overview, financial/GOS summary, clinical visual status, exceptions/unseen list, and +2 year recall register.
   - 👁️ **Patient Eyecare & Vision Summary**: Patient/family report with dementia-friendly spectacle guide, Spex Rx table, frame dispensing specs, SOS advice, and next examination date.
   - 🧾 **Itemized Optometry Invoice & GOS Voucher Statement**: Clear breakdown of NHS GOS 3 optical vouchers, patient private copay/upgrades, and 0% VAT medical billing.
5. **Client-Side PDF & ZIP Archiving**: In-browser rendering of high-resolution A4 PDFs via `html2canvas` + `jsPDF`, bundled into structured ZIP files via `jszip`.

---

## 2. Data Schema & Clinical Domain Specifications

### A. CSV Ingestion Schema (16 Required & Flexible Columns)
The parser must handle CSV exports from Blink / PMS systems and manual spreadsheets with flexible column aliasing:

| Column Name | Format / Values | Description | Example |
| :--- | :--- | :--- | :--- |
| `Blink ID` / `Patient ID` | String | Unique PMS identifier | `BLK-88291` |
| `Care Home` | String | Name of residential care facility | `Fairhaven Care Home` |
| `Post Code` | String | UK Postcode | `CB25 9EJ` |
| `Examination Date` / `Last Full Examination` | `DD/MM/YYYY` | Date of optometric consultation | `24/08/2026` |
| `DOB` | `DD/MM/YYYY` | Resident Date of Birth | `14/03/1938` |
| `Optometrist` | String | Name of examining clinician | `Dr. Emma Taylor MCOptom` |
| `Resident First Name` | String | Resident first name | `Melanie` |
| `Resident Surname` | String | Resident surname | `Dudman` |
| `Seen?` | `Yes / No` | Was resident examined? | `Yes` |
| `Reason not seen` | String | Reason if `Seen? = No` | `Asleep / Unwell` |
| `Funding` | `NHS / Private` | Funding eligibility status | `NHS` |
| `Right Eye Rx` | Text / Structured | Right eye Spex Rx (SPH, CYL, AXIS, ADD, PD) | `+0.50 / -0.75 x 180 (Near Add +2.50)` |
| `Left Eye Rx` | Text / Structured | Left eye Spex Rx (SPH, CYL, AXIS, ADD, PD) | `+0.50 / -0.75 x 90 (Near Add +2.50)` |
| `Dispense Details` | Text | Frames & lens types dispensed | `Dist: Solo 837 Purple; Near: Solo 226 Bronze` |
| `Voucher Type` | Text | NHS GOS 3 voucher code if applicable | `GOS 3 (Voucher A)` |
| `Notes` | Text | Clinical consultation notes & SOS advice | `SOS advice given. Change in near Rx. PD 32 R+L` |

### B. Optical Prescription (Spex Rx) Structure
Each eye (Right: `OD / RE`, Left: `OS / LE`) must capture:
- **SPH (Sphere):** e.g. `+0.50`, `-1.25`, `PLANO`
- **CYL (Cylinder):** e.g. `-0.75`, `+0.50`, `DS`
- **Axis:** `1` to `180` degrees
- **Prism:** e.g. `1.0 Δ BD`, `-`
- **Near Add:** e.g. `+2.50`
- **Near Prism:** e.g. `-`
- **Int Add (Intermediate Add):** e.g. `+1.25`, `-`
- **Int Prism:** e.g. `-`
- **PD (Pupillary Distance):** Monocular (e.g. `32mm R`, `32mm L`) or Binocular Total (e.g. `64mm`)

### C. Date Calculation & Recall Rules
- **Last Full Examination:** Consultation date (`DD/MM/YYYY`).
- **Next Full Examination:** Automatically computed as **`Last Full Examination + 2 Years`** (24 months), with manual override capability for clinical exceptions (e.g., 1-year recall for rapid cataract progression, diabetes, or glaucoma monitoring).

---

## 3. Technology Stack & Dependencies

```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "jszip": "^3.10.1",
    "lucide-react": "^0.475.0",
    "papaparse": "^5.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/jszip": "^3.4.1",
    "@types/node": "^22.13.4",
    "@types/papaparse": "^5.3.15",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vite-plugin-pwa": "^0.21.1"
  }
}
```

---

## 4. Target Repository Directory Layout

```text
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── public/
│   ├── favicon.ico
│   ├── logo.png                    # EliteSight Optical branding logo
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── print/
│   │   │   ├── BatchPrintContainer.tsx   # Offscreen print DOM container for @media print
│   │   │   ├── CareHomeReport.tsx        # A4 Care Home Executive Visit & Billing Report
│   │   │   ├── OptometryInvoice.tsx      # A4 Itemized Patient Invoice & GOS Voucher Statement
│   │   │   └── OptometryReport.tsx       # A4 Patient Eyecare & Vision Summary (Dementia-Friendly)
│   │   ├── BatchExportModal.tsx          # Progress modal for ZIP batch compilation
│   │   ├── BatchManager.tsx              # Master split-screen workspace & previewer
│   │   ├── EmptyState.tsx                # Drag-and-drop CSV upload & template loader
│   │   ├── Navbar.tsx                    # Header with branding, actions, PIN lock & session purge
│   │   ├── PatientEditor.tsx             # Interactive live editor for Rx, funding, frames & notes
│   │   └── PinLockModal.tsx              # 4-digit PIN verification & lockout modal
│   ├── types/
│   │   └── optometry.ts                  # Comprehensive TypeScript interfaces & types
│   ├── utils/
│   │   ├── cleaners.ts                   # Date math (+2 yrs), TitleCase, formatting utilities
│   │   ├── constants.ts                  # Company details, pricing, GOS vouchers, CSV headers
│   │   ├── csvParser.ts                  # PapaParse ingestion, Blink column mapping & validation
│   │   ├── dementiaCareExplainer.ts      # Clinical Rx -> Plain-English dementia & carer translation
│   │   ├── hash.ts                       # Deterministic reference & invoice hash generator
│   │   ├── notesParser.ts                # Regex & text extractor for frames, SOS advice & vouchers
│   │   ├── pdfGenerator.tsx              # jsPDF + html2canvas + JSZip batch export engine
│   │   ├── pricing.ts                    # NHS GOS voucher & private fee calculation engine
│   │   ├── rxParser.ts                   # Optical prescription normalizer & validator
│   │   ├── sampleData.ts                 # Realistic multi-resident care home sample dataset
│   │   ├── security.ts                   # Web Crypto SHA-256 PIN hashing, lockout & inactivity timer
│   │   └── testVerification.ts           # In-browser test runner & validation suite
│   ├── App.tsx                           # Root app component with global state & security guards
│   ├── index.css                         # Tailwind CSS directives, print styles & A4 constraints
│   └── main.tsx                          # React 18 DOM mount point
├── index.html                            # HTML entry point with meta tags & Google Fonts
├── package.json                          # Package scripts & dependencies
├── postcss.config.js                     # PostCSS config for Tailwind & Autoprefixer
├── tailwind.config.js                    # Custom color tokens, font families & print utilities
├── tsconfig.json                         # TypeScript configuration
└── vite.config.ts                        # Vite bundler config with PWA plugin
```

---

## 5. Granular Phase-by-Phase Task Breakdown

### Phase 1: Project Scaffolding & Build System

- [ ] **Task 1.1: Initialize Vite React TypeScript Project**
  - Initialize Vite with React + TypeScript template.
  - Configure `package.json` with all dependencies (`lucide-react`, `papaparse`, `jspdf`, `html2canvas`, `jszip`, `clsx`, `tailwind-merge`, `vite-plugin-pwa`).
  - Configure `tsconfig.json` with strict type checking (`"strict": true`, `"noImplicitAny": true`).

- [ ] **Task 1.2: Configure Tailwind CSS & Design System Tokens**
  - Create `tailwind.config.js` and `postcss.config.js`.
  - Add EliteSight Optical color palette:
    - Primary Navy: `#0A2569` (`brand-navy`)
    - Optical Blue / Cyan: `#0284C7` / `#0D9488` (`brand-cyan`, `brand-blue`)
    - Soft Backgrounds: `#F0FDF4` (NHS green tint), `#EFF6FF` (`brand-soft`), `#E0F2FE` (`brand-soft-dark`)
    - Dementia Alert Yellow: `#FEF3C7` (high contrast amber `#92400E` text)
  - Configure Google Fonts (`Inter` for UI, `Outfit` for clinical headers) in `index.html`.

- [ ] **Task 1.3: Define Exact A4 Print Stylesheet & Layout System**
  - In `src/index.css`, implement `@media print` rules, `.a4-page` container sizing (210mm x 297mm), zero-margin print resets, and `@page { size: A4 portrait; margin: 0; }`.
  - Include `.no-print` hiding rules and `.page-break` utilities to guarantee pixel-perfect PDF rendering without overlapping borders or page splitting.

- [ ] **Task 1.4: Configure Progressive Web App (PWA) Offline Engine**
  - Configure `vite.config.ts` with `VitePWA`:
    - Offline precaching of all HTML, JS, CSS, Google Fonts, and images.
    - Manifest configuration: `name: "EliteSight HomeCare — Optometry Portal"`, `short_name: "OptometryPortal"`, theme color `#0A2569`.
    - Provide placeholder/real icons (`pwa-192x192.png`, `pwa-512x512.png`, `logo.png`).

---

### Phase 2: Types, Constants & Core Security Utilities

- [ ] **Task 2.1: Author TypeScript Domain Models (`src/types/optometry.ts`)**
  - Define interfaces:
    - `RawCsvRow`: Handles Blink export headers and variations.
    - `EyeRx`: SPH, CYL, Axis, Prism, NearAdd, NearPrism, IntAdd, IntPrism, PD.
    - `SpexRx`: Right eye (`OD`), Left eye (`OS`), Binocular PD, Rx notes.
    - `DispenseInfo`: Distance frame (model, colour, eye size), Near frame, Intermediate/Bifocal frame, Lens type (SVD, SVN, Bifocal, Varifocal), Case/Cloth issued.
    - `PatientRow`: ID (from Blink), Care Home, Post Code, Exam Date, Next Exam Date (+2 years), DOB, Optometrist, First Name, Surname, Full Name, Seen, Reason Not Seen, Funding (`NHS` | `Private`), Voucher Type, SpexRx, DispenseInfo, DementiaExplanation, ClinicalNotes, SOSAdviceGiven, ReportRef, InvoiceNo, DueDate, LineItems, TotalAmount.
    - `InvoiceLineItem`: Description, quantity, unit, unitPrice, vatRate (0%), amount.
    - `CareHomeSummary`: Care Home name, Post Code, Exam Date, Optometrist, Total Patients, Seen Count, Unseen Count, NHS Count, Private Count, Total Revenue, Spectacles Ordered Count, Recall List.
    - `ValidationError`: Row, field, message, severity (`error` | `warning`).
    - `ParseResult`: CareHomeSummary, PatientRow lists, errors, warnings.
    - `CompanyDetails`: Legal name, reg no, address, phone, email, bank details (SumUp BACS).

- [ ] **Task 2.2: Define Clinical Constants & Pricing Configuration (`src/utils/constants.ts`)**
  - Configure `COMPANY_DETAILS`: EliteSight HomeCare Ltd, Reg No `16396660`, Cambridge address, phone `0800 865 4488`, SumUp BACS bank account details.
  - Define `PRICING_AND_VOUCHERS`:
    - NHS Sight Test Fee: `£0.00` (Direct GOS claim).
    - Private Domiciliary Sight Test: `£60.00`.
    - GOS 3 Optical Voucher values (e.g., Voucher A: `£42.40`, Voucher B: `£65.00`, etc.).
    - Private Frame / Lens Upgrade tiers.
    - Payment Terms: `7 Days`.
  - Define `CSV_REQUIRED_COLUMNS` with aliases for Blink ID, Exam Date, DOB, Name, Spex Rx, Funding, Dispense, Notes.

- [ ] **Task 2.3: Implement Client-Side PIN Security & Inactivity Guard (`src/utils/security.ts`)**
  - Use Web Crypto API (`crypto.subtle.digest('SHA-256')`) with salt for PIN hashing.
  - Store hash in `localStorage` under `elitesight_optometry_pin_hash_v2`.
  - Set default PIN to `1397`.
  - Implement lockout mechanism after 5 consecutive failed attempts.
  - Implement 5-minute inactivity timer (`INACTIVITY_TIMEOUT_MS = 300000`) listening to mouse/keyboard events.
  - Add session data purge function (`resetSessionData()`).

- [ ] **Task 2.4: Implement Deterministic Reference Generator (`src/utils/hash.ts`)**
  - `getCareHomeInitials(careHomeName)`: Extracts 2-4 uppercase initials (e.g. `Fairhaven Care Home` -> `FCH`).
  - `getPatientInitials(firstName, surname)`: Extracts initials (e.g. `Melanie Dudman` -> `MD`).
  - `getCompactDob(dob)`: Converts `14/03/1938` -> `1403`.
  - `generateReportRef()`: Formats `{CareHomeInitials}-{PatientInitials}{DOB_compact}-OPT{Index}` (e.g. `FCH-MD1403-OPT1`).
  - `generateInvoiceNo()`: Formats `{CareHomeInitials}-{PatientInitials}{DOB_compact}-INV{Index}` (e.g. `FCH-MD1403-INV1`).

---

### Phase 3: Clinical Engines (Rx, Dementia Explainer, GOS Vouchers, Cleaners)

- [ ] **Task 3.1: Build Data Cleaners & Date Calculation Engine (`src/utils/cleaners.ts`)**
  - `toTitleCase(text)`: Formats names properly with support for hyphens, apostrophes, and abbreviations (`O'Connor`, `Smith-Jones`, `NHS`, `UK`).
  - `normalizeDate(dateString)`: Normalizes ISO (`YYYY-MM-DD`), UK (`DD/MM/YYYY`), and timestamp dates to `DD/MM/YYYY`.
  - `calculateNextExamDate(lastExamDate, overrideMonths = 24)`:
    - Parses `DD/MM/YYYY`.
    - Automatically adds 2 years (24 months) to calculate the next routine recall date.
    - Formats output as `DD/MM/YYYY`.
  - `addDaysToDate(dateString, days)`: Calculates 7-day payment due dates.
  - `parseFunding(fundingStr)`: Normalizes to `'NHS'` or `'Private'`.

- [ ] **Task 3.2: Build Spex Rx Parser & Normalizer (`src/utils/rxParser.ts`)**
  - Parse unstructured or structured optical prescription text:
    - Example: `Right: SPH +0.50, CYL -0.75, Axis 180, Add +2.50, PD 32 | Left: SPH +0.50, CYL -0.75, Axis 90, Add +2.50, PD 32`
  - Normalize Sphere/Cylinder signs (`+` / `-`), format Decimals to 2 decimal places (`+0.50`, `-0.75`).
  - Validate Axis bounds (`1°` to `180°`).
  - Detect reading/near add (`Near Add +2.50`) and intermediate add.
  - Return strongly typed `SpexRx` object with fallback defaults.

- [ ] **Task 3.3: Build Dementia-Friendly & Carer Explanation Engine (`src/utils/dementiaCareExplainer.ts`)**
  - Develop an intelligent rule-based natural language generator that transforms technical optometry findings into reassuring, easy-to-read instructions for dementia patients, family members, and care home staff:
    - **Vision Description:** Explains distance clarity and reading focus in simple terms (e.g., *"Melanie's distance vision remains good with her distance glasses. She has received a new updated prescription to make reading books, puzzles, and letters clearer and more comfortable."*).
    - **Spectacle Use Guide (Which pair for what?):**
      - Distance Glasses: *"Wear when watching television, walking in the care home, and during social activities."*
      - Reading Glasses: *"Wear when reading, writing, eating meals, or doing craft activities."*
    - **Frame Identification Callout:** Matches frame details (e.g. *"Solo 837 Purple frame for Distance; Solo 226 Bronze frame with flexible hinges for Reading"*).
    - **Care & Cleaning Advice:** *"Clean lenses daily with a soft microfibre cloth. Store in the hard case when not in use. Avoid using clothing or tissues."*
    - **SOS Emergency Advice:** Highlight warning signs (sudden blurriness, flashing lights, floaters, red/painful eye) with instruction to contact EliteSight HomeCare or the care team immediately.

- [ ] **Task 3.4: Build Clinical Notes & Dispense Parser (`src/utils/notesParser.ts`)**
  - Extract dispensing notes and metadata using regex patterns:
    - `Dist:\s*([^\n\r]+)` -> Distance frame model/colour (e.g., `solo 837 purple 52`).
    - `Near:\s*([^\n\r]+)` -> Near frame model/colour (e.g., `solo 226 bronze flex hinge`).
    - `PDs?\s*(\d+[\.\d]*)\s*R?\+?L?` -> Distance and near PD measurements.
    - `GOS\s*3` / `Voucher\s*([A-D])` -> GOS 3 voucher issue notes.
    - `SOS advice given` -> Sets `sosAdviceGiven = true`.

- [ ] **Task 3.5: Build Pricing & GOS Voucher Billing Engine (`src/utils/pricing.ts`)**
  - Calculate itemized invoice items based on funding status and dispensed eyewear:
    - If `funding === 'NHS'`: Sight test billed at `£0.00` (NHS Funded). GOS 3 Voucher applied as a credit/statement entry. Any private frame/lens upgrades calculated as copay.
    - If `funding === 'Private'`: Domiciliary Examination (`£60.00`) + Private Spectacles.
  - Compute total balance due, ensuring 0% VAT medical exemption is clearly noted.

---

### Phase 4: CSV Ingestion, Validation & Sample Data Engine

- [ ] **Task 4.1: Build CSV Ingestion & Validation Pipeline (`src/utils/csvParser.ts`)**
  - Integrate `PapaParse` with header normalization and flexible column aliasing (handles Blink exports and manual CSVs).
  - Perform real-time validation:
    - Check missing mandatory fields (Name, Care Home, DOB, Exam Date).
    - Validate date formats.
    - Flag unseen residents and collect reasons.
  - Automatically calculate deterministic `reportRef`, `invoiceNo`, `nextExamDate` (+2 years), dementia explanations, and billing line items for each resident.
  - Generate aggregated `CareHomeSummary` metrics (total patients, seen count, unseen count, NHS vs. Private ratio, total value, spectacles ordered).

- [ ] **Task 4.2: Build CSV Template Generator & Multi-Resident Sample Dataset (`src/utils/sampleData.ts`)**
  - `generateCsvTemplate()`: Returns downloadable CSV string with full header schema and 3 illustrative rows.
  - `SAMPLE_OPTOMETRY_CSV`: Realistic 10-patient care home consultation dataset featuring:
    - Residents with varied optical prescriptions (Myopia, Hyperopia, Presbyopia, Astigmatism).
    - NHS GOS 3 vouchers issued and Private funding mix.
    - Realistic frame models (`Solo 837 Purple`, `Solo 226 Bronze Flex Hinge`).
    - Unseen resident reasons (`In hospital for physio`, `Resting in bed - unwell`).
    - Clinical notes with SOS advice and PD measurements.

---

### Phase 5: Print Engine & Standardized A4 Document Templates

- [ ] **Task 5.1: Build Patient Eyecare & Vision Summary Document (`src/components/print/OptometryReport.tsx`)**
  - Layout pixel-perfect A4 clinical document:
    - **Header:** EliteSight Optical logo, title *"Eyecare & Vision Summary"*, subtitle *"DOMICILIARY OPTOMETRIC ASSESSMENT"*, and `Ref: {patient.reportRef}` badge.
    - **Metadata Ribbon:** Care Home, Exam Date, Next Exam Date (**+2 Years Callout**), Examining Optometrist, Funding Badge (`NHS Funded (GOS)` or `Privately Funded`).
    - **Resident Details Card:** Full Name, DOB, Blink ID / Patient ID, Visit Date, Report Ref.
    - **Optical Prescription (Spex Rx) Grid:** Styled medical table displaying Right Eye (`OD`) and Left Eye (`OS`) SPH, CYL, Axis, Prism, Near Add, Intermediate Add, and PD.
    - **Dementia & Carer Friendly Vision Guide:** Prominent, high-contrast callout box explaining in plain English what the glasses are for, when to wear distance vs. reading pairs, and frame descriptions.
    - **Spectacles & Dispense Information:** Distance frame, Near frame, lens types (SVD, SVN, Bifocal), and frame fitting notes.
    - **SOS Clinical Advice & Safety Box:** Warning symptoms checklist (flashes, sudden vision loss, pain) and emergency contact protocols.
    - **Footer:** Company registration, Cambridge address, telephone, email, and optometrist signature line.

- [ ] **Task 5.2: Build Care Home Executive Summary Report (`src/components/print/CareHomeReport.tsx`)**
  - Layout pixel-perfect A4 administrative report:
    - **Header:** Care Home name, visit date, optometrist, EliteSight branding.
    - **Top KPI Cards:** Total Residents, Examined / Seen, Exceptions / Unseen, Total Spectacles Dispensed, Total Visit Value.
    - **Section 1: Financial & GOS Voucher Statement:** Table listing resident name, DOB, Blink ID, Invoice/Voucher No, Funding type, Spectacles ordered, and Total amount.
    - **Section 2: Clinical Vision & Eyewear Breakdown:** Metrics on distance/reading spectacles prescribed, NHS GOS 3 vouchers utilized, cataracts/glaucoma monitoring notes.
    - **Section 3: 2-Year Recall Register & Unseen Reschedule List:**
      - Clear table of unseen residents with recorded reasons.
      - **Recall Schedule:** Projected recall dates (Exam Date + 2 Years) for care home coordinator filing.
    - **Footer:** Full company legal details and SumUp BACS bank transfer information.

- [ ] **Task 5.3: Build Itemized Optometry Invoice & Voucher Statement (`src/components/print/OptometryInvoice.tsx`)**
  - Layout pixel-perfect A4 financial document:
    - Official invoice header, Invoice No (`FCH-MD1403-INV1`), Issue Date, Due Date (Visit + 7 days).
    - Bill-to Care Home & Resident details (including Blink ID).
    - Itemized billing table (Domiciliary sight test, Spectacle frame & lenses, GOS voucher deductions, private balances).
    - Grand total in GBP (£) with 0% VAT medical exemption declaration.
    - Remittance slip with SumUp BACS details (Bank name, Sort Code, Account Number, IBAN, Swift, Payment Reference).

- [ ] **Task 5.4: Build Batch Print Container (`src/components/print/BatchPrintContainer.tsx`)**
  - Offscreen container rendering all documents sequentially with CSS `.page-break` dividers for native browser printing (`window.print()`).

---

### Phase 6: Interactive UI Components & Live Editor

- [ ] **Task 6.1: Build Application Navigation Bar (`src/components/Navbar.tsx`)**
  - Brand header with EliteSight Optical logo, title, and status badges.
  - Action buttons:
    - **Upload CSV:** Trigger file dialog.
    - **Load Sample Data:** 1-click demonstration dataset loader.
    - **Download CSV Template:** Instant template generator.
    - **Security & PIN Lock:** Lock session button, Change PIN modal trigger.
    - **Purge Session:** Instant in-memory data wipe.

- [ ] **Task 6.2: Build Empty State & Upload Dropzone (`src/components/EmptyState.tsx`)**
  - Drag-and-drop CSV dropzone with visual hover effects.
  - Step-by-step guidance on Blink export columns and GOS/Private options.
  - Direct *"Load 10-Resident Sample Data"* quick-start button.

- [ ] **Task 6.3: Build Interactive Patient Record Live Editor (`src/components/PatientEditor.tsx`)**
  - Comprehensive live editing panel that updates in-memory records and previews instantaneously:
    - **Funding Selector:** Switch between `NHS Funded` and `Private Funded`.
    - **Spex Rx Form Grid:** Inputs for Right & Left SPH, CYL, Axis, Prism, Near Add, and PD.
    - **Dispense Fields:** Distance frame model/colour, Near frame model/colour, lens types.
    - **Dementia Text Overrides:** Textarea to customize or refine the dementia/carer plain-English explanation.
    - **Clinical Notes & SOS Advice:** Textarea for clinician consultation notes and checkbox for SOS advice.
    - **Recall Date Adjuster:** Default (+2 years) with date picker for clinical overrides.
    - **Quick Export Buttons:** Download individual Patient Report PDF or Invoice PDF.

- [ ] **Task 6.4: Build Master Batch Manager Workspace (`src/components/BatchManager.tsx`)**
  - Split-screen desktop layout and tabbed mobile pane:
    - **Left Sidebar (Resident Navigator):**
      - Search bar (by name, Blink ID, reference, invoice).
      - Quick filters: `All`, `Seen`, `Unseen`, `NHS`, `Private`, `Spectacles Ordered`.
      - Resident cards with visual status pills (NHS badge, Rx status, GOS voucher indicator).
    - **Right Main Workspace (Document Previewer & Actions):**
      - View Switcher Tabs: `Care Home Report`, `Patient Eyecare Summary`, `Patient Invoice`, `Batch Print Preview`.
      - Interactive zoom/fit controls for A4 document preview.
      - Edit Record toggle button opening `PatientEditor`.
      - Header action bar: `Print Document`, `Batch Print All`, `Export All to ZIP`.

- [ ] **Task 6.5: Build PIN Lock & Inactivity Modal (`src/components/PinLockModal.tsx`)**
  - 4-digit PIN pad with tactile button inputs and keyboard support.
  - Error shake animations, remaining attempt counter, and lockout screen after 5 failed attempts.
  - Change PIN tab with old PIN verification and confirmation.

- [ ] **Task 6.6: Build Root App Shell (`src/App.tsx`, `src/main.tsx`)**
  - State management for parsed dataset, selected patient, active view mode, PIN lock state, and inactivity listener.
  - Toast notification system for file uploads, PIN changes, and download events.

---

### Phase 7: PDF Generation, Batch ZIP Export & PWA Offline Engine

- [ ] **Task 7.1: Build Client-Side PDF Generator (`src/utils/pdfGenerator.tsx`)**
  - `convertElementToPdfBlob(element)`: Uses `html2canvas` at `scale: 2` (high-DPI crisp clinical text) and `jsPDF` (`format: 'a4'`, `unit: 'mm'`) to render multi-page documents offscreen.
  - `exportPatientReportPdf(patient)`: Individual Eyecare Summary download with sanitized filename (`{FirstName} {Surname} - Eye Report.pdf`).
  - `exportPatientInvoicePdf(patient)`: Individual Invoice download (`{FirstName} {Surname} - Invoice.pdf`).
  - `exportCareHomeReportPdf(summary)`: Executive Summary download (`{CareHome} - Care Home Summary Report.pdf`).

- [ ] **Task 7.2: Build 1-Click Batch ZIP Archive Exporter (`src/utils/pdfGenerator.tsx`)**
  - `exportBatchZipArchive(summary, patients, onProgress)`:
    - Generates all PDFs asynchronously with progress reporting.
    - Creates organized folder hierarchy in `JSZip`:
      ```text
      📁 Fairhaven Care Home.zip
      ├── 00 - Fairhaven Care Home - Summary Report.pdf
      ├── 00 - Fairhaven Care Home - Cleaned Roster.csv
      ├── 📁 Reports/
      │   ├── Melanie Dudman - Eye Report.pdf
      │   ├── Arthur Pendleton - Eye Report.pdf
      │   └── ...
      └── 📁 Invoices/
          ├── Melanie Dudman - Invoice.pdf
          ├── Arthur Pendleton - Invoice.pdf
          └── ...
      ```
    - Compresses with `DEFLATE` (level 6) and triggers automatic browser download.

- [ ] **Task 7.3: Build Batch Export Progress Modal (`src/components/BatchExportModal.tsx`)**
  - Modal displaying overall percentage progress bar, current document name, and animated loader during ZIP compilation.

---

### Phase 8: Verification Suite, Linting & CI/CD Deployment

- [ ] **Task 8.1: Build In-Browser Automated Verification Test Suite (`src/utils/testVerification.ts`)**
  - Programmatic tests executed on mount or via debug console:
    - CSV parsing & header normalization test.
    - Spex Rx parsing & sign validation test (+/- SPH, CYL, Axis 1-180).
    - Date calculation test: verifies `Last Full Exam + 2 Years` accurate leap-year handling.
    - Dementia explainer output test: verifies plain-English text generation.
    - Deterministic reference hash uniqueness test.
    - Inactivity timer and PIN hashing test.

- [ ] **Task 8.2: Accessibility (WCAG 2.1 AA) & Print Quality Audit**
  - Verify high color contrast on all text elements (especially dementia summary boxes and warning alerts).
  - Verify responsive mobile layout on viewport widths from 360px up to 4K displays.
  - Test print output in Chrome, Edge, Safari, and Firefox to ensure exact A4 margins and zero cutoffs.

- [ ] **Task 8.3: Build Automated GitHub Actions CI/CD (`.github/workflows/deploy.yml`)**
  - Create workflow to build TypeScript bundle (`npm run build`) and deploy artifacts to GitHub Pages on push to `main`.

- [ ] **Task 8.4: Author Project Documentation & README.md**
  - Write comprehensive `README.md` including features, CSV schema table, getting started instructions, company details, and license.

---

## 6. Acceptance Criteria & Definition of Done

A fully built implementation of the **Optometry Report Generator** must meet the following criteria:

1. **Functional Ingestion:** Accurately parses CSV spreadsheets containing Blink ID, resident names, DOB, care home, exam dates, Spex Rx values, funding types, and notes.
2. **Accurate Date Engine:** Automatically generates the Next Full Examination date as exactly **Last Exam Date + 2 Years** with manual adjustment capabilities.
3. **Spex Rx Grid:** Renders clear, standardized optical prescription tables (Right and Left SPH, CYL, Axis, Prism, Near Add, Intermediate Add, PD).
4. **Dementia & Carer Clarity:** Generates plain-English, empathetic explanations of vision and spectacle use (Distance vs. Reading pairs, frame descriptions, and SOS advice) suitable for mild dementia patients and care home staff.
5. **Funding & Billing:** Correctly separates and formats NHS GOS 3 vouchers vs. Private fees, generating itemized invoices with 0% VAT medical billing and SumUp BACS bank transfer details.
6. **A4 Precision:** All 3 document types (Care Home Summary, Patient Eyecare Summary, Invoice) render within standard A4 bounds with zero bleed or cut-off.
7. **Client-Side Export:** Successfully generates crisp, multi-page PDFs and packages complete ZIP archives with organized folder structures (`00_Summary.pdf`, `Reports/`, `Invoices/`).
8. **GDPR Zero-Retention & PIN Security:** Zero server communication; complete client-side in-memory execution; SHA-256 PIN protection with 5-attempt lockout and 5-minute inactivity lock.
9. **Offline PWA:** Fully installable and operable offline inside care home facilities.
