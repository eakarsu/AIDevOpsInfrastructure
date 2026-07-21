# Operations and safety boundary

Use bootstrap and migrations explicitly before the non-destructive launcher. Demo seed is guarded and forbidden in production.

`/api/governed-changes` accepts only allowlisted environments, digest-pinned artifacts, rollback plans, independent approvals, and leased executions. It does not execute infrastructure directly. Cloud, Kubernetes, IaC, CI/CD, secrets, monitoring, ticketing, and policy adapters require sandbox credentials, least-privilege design, signed callbacks, idempotency tests, rollback drills, and operator approval before enablement.
