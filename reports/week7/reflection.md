# Week 7 Reflection

Week 7 was mostly a recovery and finalization Sprint. The most useful work was
not adding another large feature; it was making the repository say what the
product actually is, what it can do, and what remains unevidenced.

The main technical lesson is that small hardware assumptions matter. The Week 6
motor-based access-indicator assumption conflicted with the customer's expected
LED behavior. Replacing the servo path with a blue/yellow/red LED indicator made
the product match the customer's mental model better and reduced handover risk.

The main process lesson is that acceptance evidence cannot be reconstructed
after the fact. If documentation review, UAT, customer confirmation, final
release, or customer-side deployment is missing, the repository should say so
plainly and route the team to the next concrete action.

The July 19 status pass confirmed the lightweight local technical checks that
could be run without changing source files: LED-related agent syntax and MkDocs
strict documentation build. Docker Compose validation still needs a Docker-ready
environment. The same day, the recorded final customer review closed the
handover acceptance gap for independent use.

For final delivery, the highest-value remaining work is hardware proof if
available, final release publication, and the public sanitized MVP v3 demo.
