# Sanitized Sprint Review Transcript - Week 5

Meeting date: July 4, 2026.

This transcript is a cleaned English summary of the Week 5 Sprint Review
recording. It preserves the meaning of the discussion while omitting private
deployment credentials, recording links, and other instructor-only evidence. The
team reports that recording was permitted.

## Transcript

Danila Naboishchikov opened the meeting and explained that the team was
preparing MVP v2. He noted that the sprint was focused more on development
process, documentation, bug fixes, and minor refinements than on large new
functionality. The team shared deployment access privately and clarified that
temporary credentials would be changed for production.

The team demonstrated the corrected recognition-score behavior. Previously,
the UI treated OpenCV LBPH distance as if higher meant better confidence, while
the model actually treats lower distance as a stronger match. The team changed
the display so the score meaning is now shown correctly.

The team explained that model management was improved: after authorized-person
changes, the recognition model can be restarted through the interface so the
model can reload updated data.

The team also presented service-status displays for the backend, camera/edge
agent, and recognition service, plus Access Logs improvements and clearer
handling for an unavailable camera.

The customer was asked to open the camera panel and check whether it was clear
that the camera was not working. The customer confirmed that the unavailable
camera state was clear. The team explained that when the Raspberry Pi camera is
enabled, the status changes accordingly.

The customer was then asked to inspect Access Logs and confirm that the
corrected score display was understandable. The team explained that unknown
persons and weaker matches are displayed differently from granted access
events. The customer confirmed that the score display was clear.

The team reported that they had tested the Raspberry Pi in the lab. The
Raspberry Pi was connected to the admin panel, video was displayed in the web
interface, and recognition worked in that local setup.

When asked for feedback on MVP v2, the customer did not raise new blocking
comments. The customer recommended using the remaining project time to test
everything on Raspberry Pi and improve recognition quality and speed. The team
agreed to focus on model quality, performance, and fake/spoofing handling where
possible.

The meeting ended with the customer wishing the team good luck and stating that
the team was working well on the project.
