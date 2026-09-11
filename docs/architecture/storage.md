# Storage architecture

Phakathi Flow separates metadata from binary storage.

## Principle

- PostgreSQL stores file/document metadata, relationships, permissions and audit history.
- Binary files live in an object/file provider.
- Business modules should call the backend storage service, not provider SDKs directly.

## Supported providers

### local

Used for local development. Files are written under the configured upload directory and served through `/uploads`.

### netlify-blobs

Supported for Netlify-hosted office pilot deployments. Uploads are stored in the `phakathi-flow-uploads` blob store and read through `/api/integrations/uploads/:filename`.

### s3

Reserved for production S3-compatible storage. The abstraction is present, but the provider is intentionally not pretending to work until real credentials and client wiring are configured.

## Required production metadata

Documents should store:

- title
- MIME type
- size
- storage provider
- storage key
- access level
- related client/account/project/task
- uploader
- created/updated timestamps
- deleted/archived state

## Security requirements

- Never expose provider credentials to the browser.
- Validate MIME type and size before accepting uploads.
- Keep download routes permission-aware before exposing sensitive HR, CRM or DAM files.
- Audit document access where confidentiality matters.
- Keep binary storage external to PostgreSQL.

## Current implementation

`backend/src/services/storageService.js` provides the provider-neutral boundary. Existing upload behavior is preserved while removing direct provider logic from the integration route.
