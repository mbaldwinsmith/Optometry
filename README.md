# EliteSight HomeCare — Optometry Batch Portal & Clinical Document Generator

[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-0052cc.svg)](https://mbaldwinsmith.github.io/Optometry/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: Commercial](https://img.shields.io/badge/License-Commercial-0a2569.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-success.svg)](https://mbaldwinsmith.github.io/Optometry/)

A clinical-grade, offline-first Progressive Web Application (PWA) designed for **EliteSight HomeCare**. The portal automates the processing of Care Home optometry consultation spreadsheets, performing real-time optical prescription (Spex Rx) parsing, plain-English dementia-friendly summary generation, NHS GOS 3 vs. Private billing, automated 2-year recall calculation, and instant export of pixel-perfect A4 clinical reports and invoices.

---

## 🌟 Key Features

### 1. In-Browser Batch Ingestion & Real-Time Validation
* **Blink PMS & CSV Ingestion:** Ingest multi-resident care home rosters in seconds via PapaParse with flexible column aliasing.
* **Auto-Cleaning & Normalization:** Standardizes names to TitleCase, dates to `DD/MM/YYYY`, and formats dioptres (`+0.50`, `-0.75`).
* **Validation Engine:** Identifies missing fields or unseen residents with clear warning callouts.

### 2. Optical Prescription (Spex Rx) Engine
* **Full Prescription Matrix:** Captures Right Eye (`OD`) and Left Eye (`OS`) SPH, CYL, Axis, Prism, Near Add, Intermediate Add, and Monocular / Binocular PDs.
* **Dispensing Details:** Extracts distance frames (e.g. *Solo 837 Purple 52*), reading frames (e.g. *Solo 226 Bronze Flex Hinge*), and lens types.

### 3. Plain-English Dementia & Carer Vision Guide
* Translates complex prescriptions into empathetic, jargon-free explanations for patients with mild cognitive impairment, family members, and care staff.
* Clearly explains **Distance vs. Reading pair usage**, frame colors/identifiers, spectacle care routines, and emergency **SOS Advice** protocols.

### 4. 2-Year Automatic Recall Calculation
* Automatically projects the **Next Full Examination (+ 2 Years / 24 Months)** from the consultation date.
* Generates a facility-wide recall register for care home coordinators.

### 5. NHS GOS 3 vs. Private Billing
* Supports **NHS GOS 3 Optical Vouchers** alongside Private fee structures with 0% VAT medical billing exemption and SumUp BACS bank transfer remittance details.

### 6. Standardized A4 Document Outputs
* 🏢 **Care Home Optometry Overview Report:** Summary of examined residents, visual status, spectacles dispensed, and +2 year recall schedule.
* 👁️ **Patient Eyecare & Vision Summary:** Comprehensive patient/family report with Spex Rx table, dementia-friendly spectacle guide, and SOS advice.
* 🧾 **Itemized Optometry Invoice & Statement:** Billing breakdown with 7-day payment terms.

### 7. Client-Side Batch PDF & ZIP Archiving
* High-resolution A4 PDFs generated directly in the browser via `jspdf` and `html2canvas`.
* Bundles all individually named files into an organized ZIP archive:
  ```text
  📁 Fairhaven Care Home.zip
  ├── 00 - Fairhaven Care Home - Summary Report.pdf
  ├── 00 - Fairhaven Care Home - Cleaned Roster.csv
  ├── 📁 Reports/
  │   ├── Melanie Dudman - Eye Report.pdf
  │   └── ...
  └── 📁 Invoices/
      ├── Melanie Dudman - Invoice.pdf
      └── ...
  ```

### 8. Zero-Retention Security & Offline PWA
* **100% In-Memory Execution:** No patient identifiable data (PID) is ever uploaded to external servers.
* **PIN Authentication:** SHA-256 Web Crypto PIN protection (Default: `1397`) with 5-attempt lockout and 5-minute inactivity timer.
* **Offline-Ready:** Service Worker precaching allows full operation inside care homes with poor Wi-Fi.

---

## 📊 CSV Schema Specification

| Column Header | Format / Values | Description | Example |
| :--- | :--- | :--- | :--- |
| `Blink ID` | Text | Unique PMS identifier | `BLK-88201` |
| `Care Home` | Text | Facility name | `Fairhaven Care Home` |
| `Post Code` | Text | UK Postcode | `CB25 9EJ` |
| `Examination Date` | `DD/MM/YYYY` | Date of sight test | `24/08/2026` |
| `DOB` | `DD/MM/YYYY` | Resident Date of Birth | `14/03/1938` |
| `Optometrist` | Text | Attending optometrist | `Dr. Emma Taylor MCOptom` |
| `Resident First Name`| Text | First name | `Melanie` |
| `Resident Surname` | Text | Surname | `Dudman` |
| `Seen?` | `Yes / No` | Was resident examined? | `Yes` |
| `Funding` | `NHS / Private` | Funding eligibility | `NHS` |
| `Right SPH` | Dioptre | Right sphere power | `+0.50` |
| `Right CYL` | Dioptre | Right cylinder power | `-0.75` |
| `Right Axis` | Number | Right cylinder axis | `180` |
| `Right Near Add` | Dioptre | Right near addition | `+2.50` |
| `Left SPH` | Dioptre | Left sphere power | `+0.50` |
| `Left CYL` | Dioptre | Left cylinder power | `-0.75` |
| `Left Axis` | Number | Left cylinder axis | `90` |
| `Left Near Add` | Dioptre | Left near addition | `+2.50` |
| `Distance PD` | Number | Pupillary distance (mm) | `64` |
| `Notes` | Text | Consultation & frame notes | `SOS advice given. Dist: Solo 837 Purple` |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build locally:**
   ```bash
   npm run preview
   ```

---

## 🌐 Deployment to GitHub Pages

The application includes an automated CI/CD GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

To deploy:
1. Navigate to your repository on GitHub: **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
3. Push changes to `main`:
   ```bash
   git push origin main
   ```
4. Your application will be live at:
   **`https://mbaldwinsmith.github.io/Optometry/`**

---

## 🛠️ Technology Stack

* **Core:** [React 18](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/)
* **Build Tooling:** [Vite 6](https://vitejs.dev/)
* **Styling & UI:** [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
* **CSV Parsing:** [PapaParse](https://www.papaparse.com/)
* **Client-Side PDF & ZIP:** [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [JSZip](https://stuk.github.io/jszip/)
* **PWA Engine:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox Service Worker)

---

## 🏢 Company & Commercial Details

* **Company:** EliteSight HomeCare Ltd
* **Company Registration No:** `16396660` (England & Wales)
* **Registered Address:** 60B Green End Road, Cambridge, England, CB4 1RY
* **Contact:** `0800 865 4488` | `info@elitesighthomecare.com`
* **Website:** [elitesighthomecare.com](https://elitesighthomecare.com)

---

## 📄 License

This software and its branding assets are proprietary and confidential to **EliteSight HomeCare Ltd**. Unauthorized copying, distribution, modification, or commercial exploitation is strictly prohibited under the terms of the [Commercial Software License](LICENSE).

Copyright &copy; 2026 EliteSight HomeCare Ltd. All Rights Reserved.
