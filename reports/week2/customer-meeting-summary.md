# Customer Meeting Summary - Meeting 2

**Date:** June 13, 2026

**Format:** Remote review with screen sharing

**Participants:** Customer and developers team

**Purpose:** Review the FaceGuard MVP v0 admin interface and clarify priorities for MVP v1

## Artifacts demonstrated

- Interactive admin-panel prototype and runnable frontend foundation
- Dashboard with access statistics and recent events
- Live Camera page with mocked camera and door controls
- People management and add-person flow
- Access Logs page
- System monitoring, service restart controls, and logs
- Recognition, camera, door, security, and interface settings

## Main discussion points

We demonstrated an MVP v0 frontend that uses mock data and placeholder controls. The customer reviewed the proposed administrator workflow for monitoring access events, managing authorized people, viewing a live camera, checking system health, and changing settings.

The main product question concerned people whose authorization is revoked. The team proposed either deleting the person or retaining the recognized identity with a blocked status. The customer rejected the additional blocked state as unnecessary complexity for the current scope.

The team also asked whether protection against photo/video impersonation must be included in MVP v1. The customer allowed this work to be deferred while encouraging the team to implement it later.

## Decisions

- A person in the authorized database is granted access; a person not in it is treated as unknown and denied access.
- Revoking access should remove the person from the authorized list rather than retain a separate blocked identity state.
- MVP v1 should prioritize the core access-control workflow.
- Photo/video spoofing defense may be implemented after MVP v1.
- The current interface direction can continue; the next technical focus should include recognition algorithms and integration.

## Customer feedback

The customer raised no major objections to the demonstrated visual interface and considered the direction acceptable. This was general design feedback, not explicit approval of all Assignment 2 artifacts.

## Resulting changes

- Update [US-10](./user-stories.md#us-10-edit-or-remove-authorized-people) so that it does not imply a separate deactivated-but-recognized state.
- Keep anti-spoofing/photo-video recognition outside the core MVP v1 commitment unless time permits.
- Reflect the two-outcome access model in the prototype, implementation, and Week 2 analysis.

## Action points

- Finalize a small initial proposed MVP v1 scope using stable user-story IDs.
- Present the final updated stories, priorities, and scope to the customer for explicit approval.
- Continue implementation of the core recognition and access-control workflow.
- Retain the customer consent evidence with the private submission materials.


## Approval status

The customer confirmed two scope decisions and gave general positive interface feedback. Recording, private instructor sharing, and publication permissions were confirmed. 