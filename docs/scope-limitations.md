## Scope
- SmartCare: real-time telehealth platform with PWA support for Holy Infant Saviour Somos Hospital and Medical Center Inc.
- Patient side: book online or in-person consults, secure video/voice calls, receive e-prescriptions, share medical records digitally.
- Doctor side: manage profiles, review patient data, and issue digitally signed prescriptions.
- Admin side: approve accounts, monitor analytics, manage feedback, and can trigger daily JSON backups of backend data.
- Security: role-based access and privacy-focused handling of medical data.

## Limitations
- No integrated payment system.
- Requires stable internet connectivity; performance degrades in low-connectivity areas.
- Cloud dependency: relies on Firebase (auth, data, storage) and WebRTC; outages or policy/quotas on these services directly impact availability. If Firebase goes down, core app functions pause until restored.
- No AI-assisted diagnostics.
- Limited language and accessibility options.
- Regional regulations may require additional compliance steps.
- Admin-specific constraints: no fine-grained RBAC beyond current roles; no built-in billing/plan management; analytics depend on Firebase uptime and current event coverage; backups are JSON exports and still rely on Firebase availability when running.

