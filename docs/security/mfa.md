# MFA readiness

Phakathi Flow now has backend data-model readiness for MFA through the `mfa_credentials` table.

## Supported future directions

- TOTP authenticators such as Microsoft Authenticator, Google Authenticator or 1Password.
- WebAuthn/passkeys for device-bound authentication.

## Current phase boundary

This phase does not enable MFA prompts in the login flow. It only creates the safe database foundation so MFA can be implemented without redesigning users and sessions later.

## Security rules for implementation

- Do not create custom SMS-only MFA as the primary secure method.
- Do not store TOTP secrets in plaintext.
- Do not expose credential secrets, public-key challenge internals, or recovery codes through generic entity APIs.
- Require re-authentication before enabling, disabling or rotating MFA.
- Audit MFA enrollment, verification, disablement and recovery-code actions.

## Rollout plan

1. Add server-side MFA enrollment endpoints.
2. Add TOTP secret encryption and recovery-code hashing.
3. Add WebAuthn challenge storage.
4. Add UI enrollment flow under Settings.
5. Add conditional login challenge only after office pilot accounts are ready.
6. Add admin recovery process and audit reporting.
