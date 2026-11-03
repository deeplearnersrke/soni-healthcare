# Step-by-step setup

The target site is:

`https://deeplearnersrke.github.io/soni-healthcare/`

This assumes you will create a GitHub repository named **soni-healthcare** under the `deeplearnersrke` account. Do not overwrite the existing `deeplearnersrke.github.io` repository.

## Part A — Create the Google Sheet and Apps Script API

1. Sign in to the Google account owned by Soni HealthCare/the clinic. Prefer a dedicated clinic account and turn on two-step verification.
2. Open [script.google.com](https://script.google.com/) and create a **New project**. Name it `Soni HealthCare Certificate API`.
3. Open `apps-script/Code.gs` from this ZIP, copy the complete contents, and replace the starter code in the Apps Script editor.
4. In `setInitialAdminPassword()`, change the `initialPassword` placeholder to a unique password of at least 14 characters. Do not reuse an email or Google account password.
5. Save the project. In the function dropdown, select `setupClinic` and click **Run**. Approve the requested Google Sheets permission. This creates the certificate spreadsheet and saves its ID in Script Properties. In the execution log, open the spreadsheet URL and confirm a `Certificates` tab exists.
6. Select `setInitialAdminPassword` and click **Run** once. This stores a salted SHA-256 password hash in Script Properties. After it succeeds, immediately remove the plaintext password from the source (replace it with the placeholder), save, and run no further password setup unless intentionally changing the admin password.
7. Deploy the script: **Deploy → New deployment → Select type: Web app**.
8. Set **Execute as: Me** (the clinic account that owns the Sheet). Set **Who has access: Anyone** so patients can verify a QR code without signing in. The API itself keeps creation/list/revoke protected by its server-side session check. This public endpoint is necessary for QR verification; keep the spreadsheet private.
9. Click **Deploy**, complete authorisation if prompted, and copy the Web app URL ending in `/exec`.
10. If you later change Apps Script code, use **Deploy → Manage deployments → Edit → New version → Deploy**. Saving code alone does not update an existing versioned deployment.

Official Apps Script deployment guide: https://developers.google.com/apps-script/guides/web

## Part B — Configure and test React locally

1. Extract this ZIP.
2. Open a terminal in `soni-healthcare-project/frontend/`.
3. Copy `.env.example` to `.env`.
4. Replace the example value with your Apps Script `/exec` URL:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

5. Install Node.js 20 or newer if it is not already installed.
6. Run:

```bash
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue  
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install --omit=optional --no-audit --no-fund

npm install @rollup/rollup-win32-x64-msvc --no-save --no-audit --no-fund

npm install
npm run dev
```

7. Open the local URL shown by Vite (usually `http://localhost:5173/soni-healthcare/`).
8. Test the doctor login, issue a clearly labelled test certificate using fictional data, confirm the row appears in Google Sheets, check the PDF/QR code, and open the verification link. Do not use a real patient's details during initial testing.
9. Test revocation and confirm the public verification page shows the revoked status.

## Part C — Publish at `/soni-healthcare/` on GitHub Pages

1. Create a new public or private repository named `soni-healthcare` under `deeplearnersrke` (the repository can be public while the Sheet and Apps Script project remain private).
2. Upload the contents of the `soni-healthcare-project/` folder to the root of that repository. Ensure `.github/workflows/deploy.yml` is included.
3. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
4. Add a secret named `VITE_APPS_SCRIPT_URL` and set its value to the Apps Script `/exec` URL. This is an endpoint URL, not a password; the admin password is never put in the frontend.
5. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
6. Open the **Actions** tab. The `Deploy Soni HealthCare to GitHub Pages` workflow should run after the first push. Wait for it to finish successfully.
7. Open `https://deeplearnersrke.github.io/soni-healthcare/`.

The Vite `base` path is already set to `/soni-healthcare/`. If you rename the repository, update `frontend/vite.config.js` and the `BASE` constant in `frontend/src/main.jsx` to match the new path.

## Part D — Clinic workflow Up 

1. Doctor/admin opens the website and clicks **Doctor Login**.
2. The authorised issuer enters the admin password.
3. Enter patient information and the medically appropriate certificate wording. Required fields are patient name, gender, issue date, reason, doctor and registration number.
4. Click **Save record & download PDF**. The record is saved in the private Google Sheet and a PDF is downloaded with a unique certificate ID and QR code.
5. The doctor checks all details, signs and applies the clinic seal in the designated blank area. Do not issue an unsigned PDF.
6. The patient/employer can scan the QR code to see whether the record exists and whether it is valid or revoked. Clinical reason/treatment details are not displayed publicly.

## Changing the admin password

Edit `initialPassword` in `setInitialAdminPassword()` to the new unique password, run the function once, then remove the plaintext password from source and save. Existing sessions remain valid until their 30-minute expiry; sign out from the admin browser after changing it.

## Troubleshooting

- **Admin password is not configured:** run `setupClinic()` then configure and run `setInitialAdminPassword()` as described above.
- **Apps Script URL is not configured:** create `frontend/.env` from `.env.example`, or add the GitHub Actions secret and redeploy.
- **Request timeout / cannot connect:** check the `/exec` URL, redeploy the latest Apps Script version, and confirm access is set to Anyone. Test with a fictional record first.
- **Changes do not appear on GitHub Pages:** check Actions for a failed build. Confirm Pages source is GitHub Actions and the repository is named `soni-healthcare`.
- **PDF letterhead missing:** do not move or rename `frontend/public/assets/soni-letterhead.png`.
- **QR opens the wrong path:** verify the site is deployed at `/soni-healthcare/`; the app's verification link uses that base path.

## Important deployment note

Apps Script web apps can be deployed to run as the owner and accept requests through `doGet`/`doPost`. This project uses a hidden form POST to avoid sending patient details or passwords in URL query strings. Do not change it to put the password or health data in a GET URL. Keep the Sheet private.
