# User Stories

## Personas and roles

- **Administrator:** manages authorized people, reviews access events, and monitors the FaceGuard installation through the web panel.
- **Person requesting access:** approaches the protected entrance and needs a clear access decision from the scanner.
- **System operator:** maintains the deployed device and needs service-health information for troubleshooting.
- **Unknown visitor:** a person who is not present in the authorized database and must not be granted access.

## Initial proposed MVP v1 scope

The initial proposed MVP v1 scope is intentionally small and contains only Must Have stories:

- **US-01** - View all people with access
- **US-02** - Add a person to the access list
- **US-03** - View system dashboard

This scope provides a coherent administrator workflow that can be implemented and reviewed early: open the dashboard, inspect the authorized-person list, and add a new authorized person. The scope will be refined and estimated in Assignment 3.

## US-01: View all people with access

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want to **view all people who have been granted access in one place**,
so that **I can quickly manage their access rights**.

### Notes and constraints

The list should show each authorized person and their basic details. Search and filtering may be added after the initial MVP v1 scope.

---

## US-02: Add a person to the access list

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want to **add a person to the access list**,
so that **the system can treat this person as authorized**.

### Notes and constraints

The first version should store a name, notes, and reference face image. Schedules and advanced permission rules are outside the initial MVP v1 scope.

---

## US-03: View system dashboard

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want to **see a dashboard with the main access-control metrics**,
so that **I can quickly understand the current system state**.

### Notes and constraints

The dashboard should show registered people, access attempts, granted and denied events, and recent activity. MVP v0 uses mock data; MVP v1 should connect the dashboard to real or integration-test data where available.

---

## US-04: Operate in low-light conditions

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want the **system to recognize people reliably in low-light entrance conditions**,
so that **the protected area remains usable and secure throughout the day**.

### Notes and constraints

The required outcome is reliable operation without bright visible lighting. IR illumination, an IR-capable camera, or another suitable technical approach must be evaluated during implementation.

---

## US-05: Monitor service status

**Requirement Status:** Active

**MoSCoW priority:** Should Have

As a **system operator**,
I want to **see the status of the main services**,
so that **I can notice when the camera, recognition service, or server is unavailable**.

### Notes and constraints

MVP v0 shows mocked Online, Warning, and Offline states. Real service monitoring may be connected incrementally after the core administrator workflow.

---

## US-06: Receive a scanner decision signal

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As a **person requesting access**,
I want to **receive a clear light or sound signal from the scanner**,
so that **I know whether I am allowed to enter**.

### Notes and constraints

A green indication means access granted. A red indication means access denied. The signal should be immediate and understandable without using the admin panel.

---

## US-07: Use a clear admin web interface

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want a **clear and visually consistent web interface**,
so that **I can manage access without requiring technical knowledge**.

### Notes and constraints

The interface should be readable, responsive, and focused on common access-management tasks. Destructive actions should request confirmation.

---

## US-08: Manage access remotely

**Requirement Status:** Active

**MoSCoW priority:** Must Have

As an **administrator**,
I want to **manage the authorized-person list through a web interface**,
so that **I can grant or revoke access without being physically next to the device**.

### Notes and constraints

Production deployment should use HTTPS and authenticated administrator access. Role separation and two-factor authentication are security improvements planned after the initial MVP v1 workflow is functional.

---

## US-09: Review access-attempt events

**Requirement Status:** Active

**MoSCoW priority:** Should Have

As an **administrator**,
I want a **log of successful and failed access attempts**,
so that **I can audit incidents and understand who attempted to enter**.

### Notes and constraints

Events should include time, access result, device or entrance, and available recognition details. CSV export is useful but is not required for the initial MVP v1 scope.

---

## US-10: Edit or remove authorized people

**Requirement Status:** Active

**MoSCoW priority:** Should Have

As an **administrator**,
I want to **edit or remove people from the authorized list**,
so that **access data remains correct when a person's status changes**.

### Notes and constraints

Following the customer decision from June 13, 2026, revoking access removes the person from the authorized list. The current scope does not keep a separate recognized-but-blocked identity state. Removal should require confirmation.
