# Customer Review Transcript - Week 4

Status: Sanitized public transcript

Date: June 28, 2026

This transcript is based on the team-provided Week 4 customer-session
transcription. It is included as public evidence without recording links,
credentials, private deployment access, or biometric data.

## Transcript

**00:00:02 - Danila Naboishchikov**

Good afternoon. Today we would like to present the results of our second
sprint. It turned out slightly smaller than the previous one, and we mainly
focused on small but useful improvements.

First, we added a Refresh button to the dashboard page. When clicked, it fetches
the latest data from the database, so there is no longer a need to reload the
page.

We also improved the user management system and closed the corresponding user
story. During registration, we reduced the number of uploaded photos as
requested. We also slightly redesigned the user creation flow. User editing has
been improved as well.

**00:00:56 - Danila Naboishchikov**

We made several updates to the Access Logs. Now they display more detailed
information: what happened, when, and at what time. Despite the compact
interface, the information is now more comprehensive. It is also now possible to
delete individual events.

These are the main updates of this sprint. In addition, we implemented several
important quality-related improvements.

We added quality tests. For example, one test checks the availability of the
Health API. It must respond within 1 second in the automated threshold used for
the quality gate.

**00:01:52 - Danila Naboishchikov**

Next, security requirements. Without a valid access token, requests are rejected
with 401 or 403 errors. User data is not exposed.

The system rejects invalid names, for example empty or excessively long names.
We also added a confirmation step for user deletion to prevent accidental
removals.

We implemented unit tests for passwords, tokens, and validation. There are also
integration tests for the API, and coverage of critical modules is checked
against the documented threshold.

Currently, we are working on Docker Compose to enable centralized system
deployment.

**00:02:55 - Danila Naboishchikov**

We would like you to test several scenarios and provide feedback. I will now
send you a link to the current deployment.

**00:03:13 - Danila Naboishchikov**

First, we would like you to review the Access Logs. Please evaluate how clear
the interface is, how events are displayed, and how well the filters work.

**00:03:40 - Danila Naboishchikov**

The deployment access details are omitted from this public transcript. The team
continued the walkthrough and asked the customer to review whether the interface
was convenient, clear, and comfortable to use.

In Access Logs, there are filters. Currently, all events are on the same date.
If another date is selected, no logs are shown. Filters can be cleared. There is
also a confirmation step to prevent accidental clearing. Export to CSV is
available.

**00:05:28 - Danila Naboishchikov**

In the People section, deletion confirmation has also been added. During user
creation, we improved photo uploads. Now you can choose the number of photos:
5, 10, or 15. This is intended to prevent spam and database overload.

At this point, we would like to receive your approval for the second sprint.

Previously, there was also an issue in the second assignment: it was noted that
we did not have approval for user stories 1 through 10. We need to get your
approval for them as well. I can send you the link.

**00:06:38 - Artyom Tuzov**

Then please send me a message with what exactly you need from me.

**00:06:43 - Danila Naboishchikov**

Yes, I will.

That is all from our side. Do you have any questions about the updates? How
convenient and clear is everything? Is there anything you do not like?

**00:07:00 - Artyom Tuzov**

Can you remind me what was done in this sprint?

**00:07:04 - Danila Naboishchikov**

We updated the deletion system and added confirmation for users and logs. We
added a Dashboard refresh button so the page does not need to be reloaded. We
also made several critical fixes.

The sprint was relatively small but important. It reduces the risk of data loss.

**00:07:41 - Artyom Tuzov**

Alright. Do you need anything else from me?

**00:07:47 - Danila Naboishchikov**

No, I will send you a list of things to test and where we need feedback or
approval.

We would also like to discuss the next sprint: which tasks are the highest
priority for you.

**00:08:26 - Artyom Tuzov**

By the way, is the anti-spoofing system implemented?

**00:08:31 - Danila Naboishchikov**

No, we postponed it slightly to the next sprints.

**00:08:38 - Artyom Tuzov**

Got it. But working with hardware and anti-spoofing is important.

**00:08:47 - Danila Naboishchikov**

Understood. Then we will prioritize Raspberry Pi integration and improving the
recognition model, including anti-spoofing.

**00:09:06 - Artyom Tuzov**

Yes.

**00:09:08 - Danila Naboishchikov**

Great. Thank you for your time.

**00:09:16 - Artyom Tuzov**

Goodbye.
