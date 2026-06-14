# Customer Meeting Notes - Meeting 2

**Date:** June 13, 2026
**Format:** Remote review with screen sharing
**Participants:** Customer representative, team presenter, and three additional team members

## Evidence status

These notes supplement the sanitized transcript. Permission to record was obtained before recording began, and permission for private instructor sharing and publication of the sanitized English transcript was confirmed.

## Chronological notes

### 00:00-00:41 - MVP v0 introduction and dashboard

The team explained that MVP v0 is currently an interactive admin-interface foundation with mock data rather than a complete functional access-control system. The presenter demonstrated the dashboard, including access statistics, hourly activity, and recent events. Event entries show a person or an unknown visitor, date and time, model confidence, and the resulting access decision.

### 00:41-01:21 - Live camera and people management

The team demonstrated the planned live-camera page. Camera data, FPS controls, recognition settings, and door controls are currently placeholders or mock controls. The People section supports the intended flow for viewing, adding, editing, and removing authorized people. A new-person form includes a name, notes, and an uploaded image.

### 01:21-02:33 - Access model decision

The team asked whether a previously authorized person should remain recognizable in the database with access disabled, or be removed and subsequently treated as unknown. The customer considered a separate recognized-but-blocked state unnecessary for the current scope.

**Decision:** Keep the model simple. Registered people are authorized; people not present in the authorized database are treated as unknown and denied access. Removing a person's access should remove that person from the authorized list rather than preserve a separate blocked identity state.

### 02:33-03:57 - System monitoring and settings

The presenter demonstrated service-status monitoring for components such as the camera and backend, Raspberry Pi temperature data, service restart controls, and detailed logs. The Settings page includes planned recognition confidence, camera FPS and resolution, door timing, admin security, theme, language, and notification settings. Most of these controls are prototype behavior rather than production integrations.

### 03:57-04:49 - Photo/video spoofing priority

The team asked whether protection against attempts using a photo or video of an authorized person must be completed in MVP v1. The customer said this capability could be postponed if necessary, although it remains desirable.

**Decision:** MVP v1 should focus on the core access-control workflow. Photo/video spoofing defense is deferred to a later iteration unless capacity remains after the core functionality is complete.

### 04:49-05:11 - General feedback and close

The customer had no major interface objections, considered the demonstrated direction acceptable, and advised the team to proceed to algorithm development. The meeting then ended.

## Artifacts presented

- Interactive FaceGuard admin-panel prototype
- MVP v0 frontend with mock data
- Dashboard and recent access events
- Live Camera page
- People management and add-person flow
- Access Logs page
- System monitoring and service controls
- Recognition, camera, door, security, and interface settings

## Confirmed feedback and decisions

- Use two practical outcomes in the current scope: access granted for registered people and access denied for unknown people.
- Do not add a separate recognized-but-blocked person state at this stage.
- Defer photo/video spoofing defense until after core MVP v1 functionality if necessary.
- Continue with the current admin-interface direction and focus next on recognition algorithms and functional integration.

## Approval and consent status

Permission to record, private instructor sharing, and publication of the sanitized English transcript were confirmed. The meeting recording itself does not explicitly capture approval of:

- the complete documented user-story set;
- every MoSCoW priority;
- a clearly enumerated initial proposed MVP v1 scope by stable story ID;
- written consent to the public MIT-licensed development model;

These approvals require separate written evidence or a follow-up meeting.

## Action items

- Update the user stories and constraints to remove the separate blocked-user state.
- Define and present a small initial MVP v1 scope using stable user-story IDs.
- Record explicit approval of the final user stories, priorities, and MVP v1 scope.
- Treat photo/video spoofing defense as post-MVP v1 work unless the core implementation is completed early.
- Retain the customer consent evidence with the private submission materials.
