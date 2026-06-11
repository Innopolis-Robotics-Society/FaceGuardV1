## US-01: View all people with access

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want to **view all people who have been granted access in one place**,
so that **I can quickly manage their access rights**.

### Notes and constraints

Just a simple list of everyone who has access. Name, what they can open, when they last came in. Search and filter would be nice.

---

## US-02: Grant access to people

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want to **grant access to specific people**,
so that **they can enter certain places**.

### Notes and constraints

Pick a person, pick which rooms they can enter. Maybe add time limits like "only during work hours". Works with face and fingerprint.

---

## US-03: Detect people wearing masks correctly

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want the **system to correctly identify people wearing masks**,
so that **restricted rooms remain secure**.

### Notes and constraints

Need to recognize people even when half their face is covered. IR cameras should help. Admin can tweak how strict the check is.

---

## US-04: Scan people correctly in the dark

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want the **system to scan people correctly in the dark**,
so that **the room stays secure at all times**.

### Notes and constraints

Hallways and entrances can be dark. Use IR or thermal. Should just work without turning on bright lights.

---

## US-05: Fingerprint scanner support

**Requirement status:** Active
**MoSCoW priority:** Should Have

As an **admin**,
I want a **fingerprint scanner**,
so that **the system can recognise people not only by their faces**.

### Notes and constraints

Backup when camera fails. Need to register fingerprints when giving someone access. Not critical for first version since IR handles dark/masks pretty well.

---

## US-06: Scanner decision signal

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a **user**,
I want **a clear signal (light/sound) from the scanner indicating its decision**,
so that **I know whether I have access to this place**.

### Notes and constraints

Green light + short beep = come in. Red light + long beep = nope. Should be visible in the dark. Nobody wants to stand there wondering.

---

## US-07: Clean admin web UI panel

**Requirement status:** Active
**MoSCoW priority:** Must Have

As an **admin**,
I want a **clear and visually appealing web UI panel**,
so that **I can quickly change and manage access rights for different places**.

### Notes and constraints

Looks good, works on phone too. Shows who came in today, how many got rejected. Not a janky internal tool - something you're not embarrassed to use.

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

## US-10: Suspicious attempt notifications

**Requirement status:** Active
**MoSCoW priority:** Could Have

As an **admin**,
I want to **receive real-time notifications (email/telegram) about suspicious access attempts**,
so that **I can respond immediately to potential security breaches**.

### Notes and constraints

Get a ping if someone fails 5 times in a minute or tries to get in at 3am. Nice to have, not mandatory for launch.