# Go-live checklist

- [ ] Clinic Google account is secured with two-step verification.
- [ ] Google Sheet is owned by the clinic account and is not shared publicly.
- [ ] Apps Script has been deployed as a Web App, executing as the clinic owner.
- [ ] Anonymous access is enabled only because public QR verification needs it.
- [ ] Admin password is unique, at least 14 characters, and plaintext has been removed from source code after hashing.
- [ ] `VITE_APPS_SCRIPT_URL` is set in local `.env` and GitHub Actions secret.
- [ ] Test data (fictional) was used for end-to-end testing.
- [ ] QR code opens the `/soni-healthcare/#/verify?id=...` page.
- [ ] Revoked certificate is shown as revoked.
- [ ] Doctor has approved the exact certificate wording and layout.
- [ ] Doctor reviews, signs and seals every certificate before it is issued.
- [ ] Clinic has approved patient notice/consent, access controls, retention and backup procedures.
