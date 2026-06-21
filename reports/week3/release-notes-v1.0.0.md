# FaceGuard MVP v1 - Release Notes

Tag: `v1.0.0`

Release title: `FaceGuard MVP v1`

Target: final Assignment 3 commit on `main`

## Summary

FaceGuard MVP v1 delivers the first end-to-end access-control increment. It connects the administrator frontend, central backend, persistent database, local recognition agent, and camera integration path.

MVP v1 is hardware-dependent. The frontend and backend are runnable from the repository, while the recognition agent runs locally on a team laptop in development mode using a built-in or USB camera. This model was selected because the customer recommended stabilizing the recognition workflow on Ubuntu/laptop cameras before moving to Raspberry Pi and a fixed entrance camera.

## Implemented User Stories

- [US-01: View all people with access](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/13)
- [US-02: Add a person to the access list](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/14)
- [US-03: View system dashboard](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/15)
- [US-11: View connected entrance camera](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/24)

## Supporting PBIs

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

## Access and Run Instructions

Use the root [README.md](../../README.md) for exact local run instructions.

For laptop-camera testing:

```env
HARDWARE_MODE=development
CAMERA_INDEX=0
```

The camera and recognition agent are not exposed as a permanent public stream because they depend on local hardware and may process biometric data.

## Evidence

- [MVP v1 integration PR #37](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/37)
- [Week 3 report](./README.md)
- [Public sanitized demo video](https://drive.google.com/file/d/1ROzA_gZtCb6iZ-BpT2tHCJFFDoohaqqQ/view?usp=sharing)

## Known Limitation

After a person is added or removed, the recognition agent currently requires restart or model rebuild before the recognition model uses the updated data. This is tracked as [BUG-01 / issue #35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35).

## Notes for GitHub Release Publication

When publishing the GitHub Release:

- create tag `v1.0.0`;
- set release title to `FaceGuard MVP v1`;
- target the final Assignment 3 commit on `main`;
- paste these release notes into the GitHub release description;
- verify that the automatically generated source-code ZIP/tar.gz archives are available.
