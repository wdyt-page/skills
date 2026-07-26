# Live review lifecycle

Live review wraps a running URL with WDYT's collaboration layer.

## What the human sees

The target application loads in an iframe in the human's browser. WDYT stores review metadata,
comments, drawings, and checkpoints; it does not copy or deploy the target application.

## Target constraints

- The reviewer must be able to reach the target URL.
- `localhost` refers to the reviewer's machine.
- The target must allow iframe embedding.
- Authentication inside the target remains the target application's responsibility.
- Cross-origin targets may provide only visual coordinates. Do not promise DOM selectors when
  the browser cannot inspect the frame.

## Review loop

1. Start and verify the development server.
2. Create one live review.
3. Give the stable review link to the human.
4. Wait only when explicitly asked.
5. Read structured feedback.
6. Edit and test the real codebase.
7. Add a checkpoint to the same review.

Do not upload exported wrapper HTML as a revision. A checkpoint records the target URL and
version moment; the underlying application remains the source of truth.

Never create a public tunnel automatically. Never put credentials into the review URL. Tell
the user when a target is available only on their own machine and cannot be opened by remote
teammates.
