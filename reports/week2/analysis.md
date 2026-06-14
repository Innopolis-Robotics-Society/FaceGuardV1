# Week 2 Analysis

## Learning points

Writing stable user stories forced the team to separate user value from implementation details. 

MoSCoW prioritization showed that the first scope must remain small enough to implement and validate. The initial MVP v1 scope therefore contains [US-01](./user-stories.md#us-01-view-all-people-with-access), [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list), and [US-03](./user-stories.md#us-03-view-system-dashboard).


## Validated assumptions

- The initial MVP v1 should focus on viewing authorized people, adding a person, and viewing dashboard information.
- Protection against photo and video spoofing is valuable but may be implemented after the core MVP v1 workflow.
- Two states for access granted and denied is enough to efficiently manage the system.
## Needs clarification

- What confidence threshold is acceptable for granting access.
- How to protect the detection system from photo and video.
## Planned response

- Implement the initial MVP v1 stories in the order [US-01](./user-stories.md#us-01-view-all-people-with-access), [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list), and [US-03](./user-stories.md#us-03-view-system-dashboard).
- Keep photo/video spoofing defense outside the initial MVP v1 commitment and track it as a later technical task.
- Use the [MVP v0 smoke check](./mvp-v0-report.md#repeatable-smoke-check) after every deployment.
