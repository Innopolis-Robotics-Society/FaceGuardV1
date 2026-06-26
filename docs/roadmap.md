# Roadmap

This roadmap summarizes product direction. The detailed Product Backlog lives in GitHub Issues and the GitHub Project views.

## Delivered Sprint / MVP v1

- [US-01: View all people with access](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/13)
- [US-02: Add a person to the access list](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/14)
- [US-03: View system dashboard](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/15)
- [US-11: View connected entrance camera](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/24)
- [PBI-01: Persist authorized people in the central backend](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/25)
- [PBI-02: Connect the People page to the backend API](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/26)
- [PBI-03: Implement the add-person flow with reference photographs](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/27)
- [PBI-04: Implement authorized-person removal](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/28)
- [PBI-05: Integrate the real camera and face-recognition agent](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/29)
- [PBI-06: Expose camera image and status to the web application](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/30)
- [PBI-07: Store recognition and access events](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/31)
- [PBI-08: Display recent recognition events on the dashboard](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/32)
- [PBI-09: Connect dashboard metrics and charts to real data](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/33)
- [PBI-10: Integrate and verify the MVP v1 end-to-end workflow](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/34)

## Current Sprint / Assignment 4 Quality Increment

Assignment 4 shifts the immediate focus from maximizing feature count to reducing product and delivery risk:

- Stabilize the MVP v1 recognition workflow on Ubuntu/laptop cameras before Raspberry Pi deployment.
- Address selected customer feedback from the MVP v1 review.
- Define maintained quality requirements and automated quality requirement tests.
- Add unit, integration, coverage, CI, and additional QA evidence for critical product paths.
- Keep UAT scenarios, Definition of Done, and release evidence current for later Sprints.

The authoritative Assignment 4 Sprint container must be the GitHub milestone assigned to selected Sprint PBIs. The public report index is [reports/week4/README.md](../reports/week4/README.md).

## Expected Next Sprint / MVP v2

- [US-04: Operate in low-light conditions](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/16)
- [US-05: Monitor service status](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/17)
- [US-06: Receive a scanner decision signal](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/18)
- [US-07: Use a clear admin web interface](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/19)
- [US-08: Manage access remotely](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/20)
- [US-09: Review access-attempt events](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21)
- [US-10: Edit or remove authorized people](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22)
- [BUG-01: Recognition agent requires restart after authorized-person changes](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35)
- Recognition calibration and anti-spoofing research
- Hardened remote access, authentication, and operational monitoring

## Risks and Decision Gates

- Customer review accepted the MVP v1 direction and requested Ubuntu stabilization before Raspberry Pi deployment.
- Assignment 4 quality gates must continue to run after submission and must not be treated as one-time evidence.
- Camera and hardware access must be available for real-device verification.
- The network path from the central backend to the device agent must be confirmed.
- The recognition threshold must be calibrated with representative images before later production-like use.
- Recognition data currently requires an agent restart after authorized-person changes; this is tracked in [BUG-01](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35).
- Assignment 3 requires at least 15 qualifying PBIs; Course Tasks and removed items do not count.
