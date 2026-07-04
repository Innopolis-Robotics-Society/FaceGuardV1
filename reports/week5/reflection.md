# Week 5 Reflection

The repository work highlighted that architecture documentation is most useful
when it follows implemented boundaries instead of planned components. The
current FaceGuard split between central services and edge recognition explains
both the product shape and the remaining synchronization risk around model
rebuilds.

The LBPH score bug also showed why naming matters across layers. A field named
`confidence` stored a raw distance, so the safest MVP v2 correction is to
document and display the value as distance while preserving compatibility.

Release, UAT, and Sprint Review lessons remain Pending until the team completes
the actual review and private evidence package.
