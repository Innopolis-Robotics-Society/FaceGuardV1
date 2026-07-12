# Sprint Review Summary

Status: Completed on July 4, 2026.

The Sprint Review was held remotely with the customer, Artyom Tuzov, and the
FaceGuard team. Recording was started after the meeting began and the team
reports that recording and review-material sharing were permitted. Private
recording links, credentials, and exact access details are intentionally not
committed to the public repository.

## Reviewed Increment

The team presented the MVP v2 increment as a maintenance and stabilization
sprint rather than a sprint focused on large new features. The demonstrated and
discussed work included:

- corrected recognition-score presentation for raw OpenCV LBPH distance;
- model-management controls, including restarting recognition/model loading
  through the interface;
- status displays for backend, camera/edge agent, and recognition service;
- clearer unavailable-camera handling in the camera panel;
- Access Logs improvements and corrected score meaning;
- architecture diagrams, ADRs, development-process documentation, tests, and
  published documentation structure.

## Customer UAT Results

The customer checked the unavailable-camera state and confirmed that it was
clearly visible. The customer also reviewed Access Logs score presentation and
confirmed that the confidence/distance display was clear.

The team also reported successful local lab testing with Raspberry Pi
connection, video display in the admin panel, and recognition working with the
Raspberry Pi setup.

## Customer Feedback

The customer did not raise blocking issues for the demonstrated MVP v2 scope.
The main recommendation for the remaining project time was to continue testing
on Raspberry Pi and improve recognition quality and performance. The customer
also highlighted fake/spoofing handling as a useful improvement direction.

## Outcome

The demonstrated MVP v2 scope was accepted for the Sprint Review. Remaining
work is improvement-oriented: Raspberry Pi stability testing, recognition
quality/performance improvements, and anti-spoofing work.
