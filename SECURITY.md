# Security Policy

## Reporting

If you find a vulnerability, please open a private security advisory on GitHub
or contact the repository owner directly. Please do not file public issues for
active vulnerabilities.

Helpful reports include:

- affected route, action, or component
- reproduction steps
- expected impact
- any relevant request/response details with secrets removed

## Secrets

This project expects production secrets to live in environment variables or the
hosting provider's secret store. Do not commit `.env.local`, service-role keys,
Resend API keys, cron secrets, cookies, or access tokens.

## Supported Versions

Security fixes are expected to land on the default branch first.
