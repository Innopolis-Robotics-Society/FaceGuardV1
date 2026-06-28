# Week 4 Reflection

Assignment 4 moved FaceGuard from a functional MVP toward a
quality-controlled increment. The previous Sprint proved that the system could
connect the administrator interface, backend, database, recognition agent, and
camera flow. Week 4 added a different kind of maturity: measurable quality
requirements, automated tests, coverage gates, and explicit CI jobs.

The most useful change was making quality requirements measurable. Instead of
describing quality in broad language, the team defined stable IDs, ISO/IEC
25010 sub-characteristics, response measures, and linked QRTs.
This made the quality work inspectable and easier to maintain.

QRT traceability also helped. Each quality requirement points to a test ID,
test file, test function, and CI job. That structure reduces ambiguity during
review: a reviewer can move from a requirement to the exact automated evidence
that verifies it.

The per-module coverage threshold is intentionally modest at 30%, but it is
more useful than a global percentage for this stage. It prevents a critical
module from being completely untested while unrelated files inflate global
coverage. The next step is to raise coverage through behavior-driven tests,
not by weakening the threshold or excluding risky modules.

Independent review remains important. PR #49, #50, #51, and #52 show review
records, and all selected Sprint work is merged to `main`.

Parallel PRs created both speed and coordination risk. The QA workflow was
prepared while product PRs for Access Logs, People editing/removal, and
Dashboard refresh were moving independently. That means product PRs can fail
link checks or carry generated files even when the QA PR is healthy. The team
should merge quality gates early enough that later PRs are checked consistently.

Documentation and evidence preparation still happened late. The Week 4 report
structure, evidence index, UAT scenarios, and customer review templates should
exist before the customer session, not after it. Preparing them earlier makes it
clear what evidence must be captured live.

The customer review and UAT evidence are now complete for the Assignment 4
scope. The follow-up customer message confirms that everything seems fine and
all user stories are approved.

In the next Sprint, the team should continue Raspberry Pi integration,
recognition-model improvement, anti-spoofing, PostgreSQL integration testing,
frontend component testing, and public/private evidence separation.
