## US-01: View all people with access

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want to **view all people who have been granted access in one place**,
so that **I can quickly manage their access rights**.

### Notes and constraints

The list should show each authorized person, access status, and last access event. Search and filtering can be added later.

---

## US-02: Add a person to the access list

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want to **add a person to the access list**,
so that **the system can treat this person as authorized**.

### Notes and constraints

The first version should store basic person data and access status. Schedules and advanced permission rules are outside the first scope.

---

## US-03: View system dashboard

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want to **see a dashboard with the main access control metrics**,
so that **I can quickly understand the current system state**.

### Notes and constraints

The dashboard should show registered people, access attempts, granted and denied events, and the latest access decision. MVP v0 may use mock data.

---

## US-04: Scan people correctly in the dark

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want the **system to scan people correctly in the dark**,
so that **the protected area stays secure at all times**.

### Notes and constraints

Hallways and entrances can be dark. Use IR or thermal. Should just work without turning on bright lights.

---

## US-05: Monitor service status

**Requirement status:** Active
**MoSCoW priority:** Should Have

As an **admin**,
I want to **see the status of the main services**,
so that **I can notice when the camera, recognition service, or server is unavailable**.

### Notes and constraints

MVP v0 may show mocked statuses such as Online, Warning, or Offline. Real service monitoring can be implemented later.

---

## US-06: Scanner decision signal

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a **user**,
I want **a clear signal (light/sound) from the scanner indicating its decision**,
so that **I know whether I am allowed to enter**.

### Notes and constraints

Green status means access granted. Red status means access denied. The signal should be clear and easy to understand.

---

## US-07: Clean admin web UI panel

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want a **clear and visually appealing web UI panel**,
so that **I can quickly manage access rights without technical knowledge**.

### Notes and constraints

The interface should be readable, responsive, and focused on the main access control actions.

---

## US-08: Remote access management via website

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a **user**,
I want a **website where I can manage access remotely**,
so that **I can grant or revoke access without being on site**.

### Notes and constraints

HTTPS, two-factor login. Regular people only see their own stuff. Same website as admin panel, just different permissions.

---

## US-09: Access attempt event log

**Requirement status:** Active
**MoSCoW priority:** Should Have

As an **admin**,
I want **a log of all access attempts (successful and failed)**,
so that **I can audit security incidents and review who tried to enter restricted areas**.

### Notes and constraints

Shows who tried, when, where, and why they got rejected (mask, dark, no rights). Export to CSV if someone wants to do a report.

---

## US-10: Edit or remove existing users

**Requirement status:** Active
**MoSCoW priority:** Should Have

As an **admin**,
I want to **edit or remove existing users from the access list**,
so that **access data stays correct when a person's status changes**.

### Notes and constraints

The admin should be able to update basic user information and deactivate or remove access. Destructive actions should require confirmation in later versions.
