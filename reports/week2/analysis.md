# Week 2 Analysis

## Learning points

During Week 2, we learned that the first product scope must stay small and testable. The full FaceGuard idea includes recognition, hardware, logs, admin tools, and security features, but the first MVP v1 scope should focus only on the core administrator workflow.

Writing user stories helped us separate product value from implementation details. Instead of describing only technical tasks, we described what the administrator, system operator, and person requesting access need from the system.

The prototype and MVP v0 showed that a graphical admin interface is useful for explaining the product to the customer. The Dashboard, People page, Access Logs, System page, and Settings page helped us discuss the product more clearly than only describing it in text.

MVP v0 also showed that the frontend can be deployed and smoke-checked before the real recognition and backend integration are finished.

## Validated assumptions

The customer confirmed that the system should use a simple access model: people in the authorized database are allowed, and people not in the database are treated as unknown and denied access.

The customer accepted the current admin-interface direction and suggested continuing toward recognition algorithms and integration.

The team confirmed that MVP v0 can be a frontend foundation with mock data, as long as it is accessible, documented, and has a repeatable smoke check.

The initial proposed MVP v1 scope remains focused on:

* [US-01](./user-stories.md#us-01-view-all-people-with-access)
* [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list)
* [US-03](./user-stories.md#us-03-view-system-dashboard)

## Needs clarification

The exact recognition confidence threshold is still unknown and must be selected experimentally.

The final level of protection against photo or video spoofing still needs technical investigation. The customer said it is useful, but it can be postponed if the core MVP v1 workflow is not finished yet.

The exact integration plan between the frontend, backend, recognition module, Raspberry Pi, and door-control hardware still needs to be finalized.

The team still needs to verify the final deployment environment and hardware access conditions for later iterations.

## Planned response

For MVP v1, we will first implement the selected core stories: [US-01](./user-stories.md#us-01-view-all-people-with-access), [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list), and [US-03](./user-stories.md#us-03-view-system-dashboard).

We will keep the current MVP v0 frontend as the interface foundation and gradually replace mock data with real backend or integration-test data.

We will continue using the documented [MVP v0 smoke check](./mvp-v0-report.md#repeatable-smoke-check) after deployment changes.

Photo/video spoofing protection will be treated as a later technical risk unless the core recognition and access-management workflow is completed early.
