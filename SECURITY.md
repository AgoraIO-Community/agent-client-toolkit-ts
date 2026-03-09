# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue.**

Instead, use [GitHub's private vulnerability reporting](https://github.com/AgoraIO-Conversational-AI/agent-client-toolkit-ts/security/advisories/new) to submit your report. This ensures the issue can be assessed and addressed before public disclosure.

For security issues in the broader Agora platform, please follow the reporting process at [https://www.agora.io/en/security](https://www.agora.io/en/security).

## Scope

This repository contains a client-side TypeScript SDK for Agora Conversational AI. Security concerns here typically involve:

- Code patterns that lead to hardcoded credentials (App ID, RTC tokens, RTM tokens)
- Examples that disable or bypass token authentication in production
- Patterns that expose App ID or secrets client-side beyond what is required
- Vulnerabilities in the event or message handling pipeline

## Secrets Handling

- Never commit App IDs, tokens, or certificates.
- Use environment variables for credentials in demos and examples.
- Use placeholder values (`APP_ID`, `RTC_TOKEN`, `RTM_TOKEN`) in documentation.

## Response

We aim to acknowledge reports within 48 hours and provide a resolution timeline within 7 days.
