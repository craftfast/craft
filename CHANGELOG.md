# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [0.2.0] - 2025-12-09

### Added

- Balance-based credit system with OpenRouter cost tracking
- User-selectable AI models with preferences sync
- Custom checkout modal for balance top-ups
- Environment variable management with auditing and encryption
- Agent activity indicator for live tool execution status
- Git versioning service with GitHub integration
- Vercel integration with deployment history tracking
- Admin APIs for billing, AI models, project management, and analytics
- Blog and documentation navigation
- Social media links in header and footer
- BetaBadge component and version management
- Sound notification settings with user preferences
- Rate limiting and CSRF protection for API routes
- GST handling and receipt generation for payments

### Changed

- Migrated from Polar to Razorpay for payment processing
- Refactored AI model management with database-driven service
- Enhanced sidebar navigation and project routing
- Improved UI components with better button styles and layouts
- Updated Content Security Policy configuration
- Streamlined API route handler exports
- Enhanced personalization settings for custom response tones

### Removed

- Polar webhook handlers and subscription management
- Referral system and related database tables
- Supabase integration card
- Sentry error tracking module

### Fixed

- Database interactions and type handling across API routes
- Sandbox heartbeat management with improved error handling
- Project name display with tooltip improvements

## [0.1.0] - 2025-09-22

### Added

- Initial public open-source setup
- Code of Conduct, CODEOWNERS, FUNDING
- Issue/PR templates, Support and Security policies
- CI workflow for lint, typecheck, build; optional tests
- Docs: getting-started, api-reference, components, deployment
