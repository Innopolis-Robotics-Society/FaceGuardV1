# Week 5 Reflection

The repository work highlighted that architecture documentation is most useful
when it follows implemented boundaries instead of planned components. The
current FaceGuard split between central services and edge recognition explains
both the product shape and the remaining synchronization risk around model
rebuilds.

The LBPH score bug also showed why naming matters across layers. A field named
`confidence` stored a raw distance, so the safest MVP v2 correction is to
document and display the value as distance while preserving compatibility.

The July 4, 2026 Sprint Review confirmed that the customer understood the
unavailable-camera state and the corrected recognition-score display. It also
showed that public documentation needs to distinguish accepted MVP v2 behavior
from remaining engineering improvements: Raspberry Pi stability, recognition
speed and quality, and fake/spoofing handling.

The supplied Week 5 screenshots closed the public evidence gap for hosted
documentation, relevant CI/pages evidence, reviewed PR #65, release v2.0.0,
architecture documentation, Access Logs confidence presentation, and Live Camera
offline-state handling. The later milestone and project-board screenshots closed
the Sprint planning/status evidence gap, and the public demo video link closed
the demo artifact gap. The System service-status screenshot closed the final
public screenshot gap for US-05.
