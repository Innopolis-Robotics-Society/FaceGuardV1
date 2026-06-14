# Week 2 Analysis

## Learning points

Writing stable user stories forced the team to separate user value from implementation details. For example, low-light operation is a required outcome in [US-04](./user-stories.md#us-04-operate-in-low-light-conditions), while IR illumination is only one possible implementation.

MoSCoW prioritization showed that the first scope must remain small enough to implement and validate. The initial MVP v1 scope therefore contains [US-01](./user-stories.md#us-01-view-all-people-with-access), [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list), and [US-03](./user-stories.md#us-03-view-system-dashboard).

Building the interactive prototype demonstrated that a single administrator interface can support several related workflows without duplicating screens. It also showed the importance of confirmation dialogs, success feedback, navigation, and meaningful mock data.

MVP v0 deployment work identified a difference between a runnable prototype and a production system. The current deployment demonstrates the interface and navigation, while recognition, camera input, authentication, and persistent storage remain integration work.

The customer review confirmed that interface demonstrations are useful for resolving scope questions before implementation. The discussion led directly to a simpler authorization model and reduced unnecessary state management.

## Validated assumptions

- A web admin panel is an appropriate primary interface for administrators. This is represented by the [interactive prototype](https://www.figma.com/make/SRfKSsmTXU7thEWzW2f78g/FaceGuard-Admin-Panel-Design?t=QgeFJjbXiSSuzG8h-1).
- The initial MVP v1 should focus on viewing authorized people, adding a person, and viewing dashboard information.
- The current course scope does not require a separate recognized-but-blocked identity state. A person is either in the authorized list or is treated as unknown.
- Protection against photo and video spoofing is valuable but may be implemented after the core MVP v1 workflow.
- Mock data is sufficient for MVP v0 interface validation, but it must be clearly identified as mock data in the [MVP v0 report](./mvp-v0-report.md).

## Needs clarification

- Which camera and illumination configuration provides acceptable recognition quality in the actual entrance lighting conditions.
- Whether mask handling must be included in MVP v1 or treated as a later recognition improvement.
- What confidence threshold is acceptable for granting access and how false acceptance and false rejection rates will be measured.
- How the Raspberry Pi agent, backend service, database, and frontend will authenticate and communicate in the deployed environment.
- Which events and images may be retained, for how long, and who may access them.
- Whether GitHub Pages will remain only a public frontend demonstration while the university VM hosts the integrated MVP.

## Planned response

- Implement the initial MVP v1 stories in the order [US-01](./user-stories.md#us-01-view-all-people-with-access), [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list), and [US-03](./user-stories.md#us-03-view-system-dashboard).
- Update [US-10](./user-stories.md#us-10-edit-or-remove-authorized-people) and the implementation to remove authorized people instead of maintaining a separate blocked state.
- Keep photo/video spoofing defense outside the initial MVP v1 commitment and track it as a later technical task.
- Test low-light recognition options before selecting hardware for [US-04](./user-stories.md#us-04-operate-in-low-light-conditions).
- Use the [MVP v0 smoke check](./mvp-v0-report.md#repeatable-smoke-check) after every deployment.
- Replace mock data incrementally while preserving the validated interface structure.
