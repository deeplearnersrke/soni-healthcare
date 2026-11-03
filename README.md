# Soni HealthCare — Clinic Website & Medical Certificate Portal

A React + Vite static website intended for `https://deeplearnersrke.github.io/soni-healthcare/` with Google Apps Script + Google Sheets as a lightweight API and certificate register.

## Features

- Public clinic homepage using the supplied Soni HealthCare letterhead details.
- Single-admin password login.
- Medical certificate form: patient name, gender, age, issue date, reason, treatment dates, rest advice, fit-to-work date, doctor and registration number, optional note.
- Saves certificate record to Google Sheets and downloads a PDF with the supplied clinic letterhead as its background.
- Adds a QR code linking to the public verification page.
- Public verification reveals certificate ID, patient name, issue date, issuing doctor and status; it does **not** expose diagnosis/reason, treatment dates, rest advice, age or private notes.
- Admin can view recent records and revoke an issued certificate.
- The generated PDF has an intentionally blank doctor signature/seal area. The authorised doctor must review, sign and seal it.

## Important clinical / privacy note

This is a workflow and record-keeping starter project, not a medical decision system. It does not decide whether a person is ill, prescribe rest, determine fitness for work, or authenticate a doctor's signature. A licensed/authorised treating doctor must examine or otherwise clinically assess the patient, decide the wording, check the generated PDF, and physically sign/seal it before issue. The supplied letterhead says **“Not for Medico-Legal Purpose”**; this is retained. Do not use this template for medico-legal certification.

The Google Sheet contains patient and health-related information. Restrict the spreadsheet and Apps Script project to authorised clinic personnel, use a dedicated clinic Google account, enable account MFA, avoid sharing the sheet publicly, and establish a clinic retention/consent policy. Confirm applicable Indian privacy and medical-record requirements before using real patient data. Public verification deliberately returns only a limited subset of fields, but a certificate ID and patient name are still personal information.

## Project layout

```text
soni-healthcare-project/
├── frontend/                 # React website, admin UI and PDF generation
│   ├── public/assets/soni-letterhead.png
│   ├── src/main.jsx
│   ├── src/style.css
│   ├── .env.example
│   └── vite.config.js        # base path /soni-healthcare/
├── apps-script/Code.gs       # Google Apps Script API
├── .github/workflows/deploy.yml
└── docs/                     # original supplied reference files
```

## Quick start

1. Follow [`SETUP.md`](SETUP.md) in order.
2. Configure and deploy the Apps Script first.
3. Put the Apps Script `/exec` URL in `frontend/.env` as `VITE_APPS_SCRIPT_URL`.
4. Install and run the frontend locally with `npm install` and `npm run dev` inside `frontend/`.
5. Build and deploy the repository using GitHub Actions.

## Technology

- React 18 + Vite
- jsPDF for browser-side PDF creation
- `qrcode` for QR generation
- Google Apps Script web app for server-side authorisation and Sheets access
- Google Sheets for certificate records

## Security design / limitations

- Password hash and random salt are kept in Apps Script Script Properties, not in the frontend or Sheet.
- A random session token is cached server-side for 30 minutes. The browser keeps it in `sessionStorage` and clears it on sign-out.
- All list/create/revoke actions validate the token on the server.
- Public verification is read-only.
- Login throttling is a basic shared Apps Script cache counter, not enterprise-grade identity management. This architecture is appropriate only for a small, low-volume clinic workflow after security review. For production clinical records, consider a properly authenticated backend and access audit trail.
- Apps Script and Google Sheets have quotas and are not a high-scale database.
