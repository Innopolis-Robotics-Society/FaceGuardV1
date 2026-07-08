# Sanitized Customer Meeting Transcript - Meeting 2

**Meeting date:** June 13, 2026

**Language:** English translation from Russian

**Participants:** Customer and developers team


**00:00:00**

**Team Presenter:** Good afternoon. Thank you for taking the time to meet with us. We would like to show you the MVP v0 version of our project. At the moment, we have implemented the web interface for the admin panel, but the real functionality has not yet been connected. I have started screen sharing and also sent you the link.

The first page is the dashboard. It shows the main events and statistics for access granted, access denied, and unknown-person detections. It also shows hourly statistics, summary figures, and the latest events.

**00:00:41**

**Team Presenter:** The recent events show who received or was denied access. Each event contains a name, or "Unknown" when the person was not recognized, together with the date, time, model confidence, and decision.

The next page is Live Camera. It will show what is currently happening. The current camera view and some settings are placeholders. We plan to include confidence and FPS settings and possibly door controls.

The People page contains the list of people. Administrators can edit or remove existing people and add new ones.

**00:01:21**

**Team Presenter:** When adding a person, we enter a name and notes, upload an image, and save the record.

We have a question about the access log and person status. Suppose an authorized person is added and is later no longer affiliated with the university. We need to revoke access. There are two options: remove the person completely from the database so that the system treats them as unknown, or keep recognizing the person but deny access. Do we need the second option, or is it unnecessary complexity?

**00:02:15**

**Customer Representative:** That is unnecessary complexity. In most cases, we only need the simpler model. [Partly inaudible.]

**00:02:28**

**Team Presenter:** Understood. We will remove that extra state. Everyone in the authorized database will be granted access, and everyone else will be treated as unknown and denied access.

Next is the System page. It shows technical information and service availability. If the camera, backend, or another component fails, its status is visible so that the administrator can understand what is broken.

**00:02:33**

**Customer Representative:** Yes.

**00:03:09**

**Team Presenter:** The page also shows Raspberry Pi temperature and provides controls for restarting individual services if something fails. Detailed system logs are available there as well.

The final page is Settings. It includes recognition confidence, camera FPS and resolution, door opening and closing timing, admin-panel security, theme, language, and notification settings.

This is the functionality we currently plan to implement. MVP v1 will add real behavior. We have one more question about recognizing attempts made with a photograph or video of an authorized person. Must this be implemented in MVP v1, or can it wait until a later version?

**00:04:14**

**Customer Representative:** It can wait, although you should try to implement it. If it is not included in the first version, you can finish it in the next one.

**00:04:22**

**Team Presenter:** Understood. We will not make it the main focus of MVP v1. We will focus on the core functionality first and add protection against photo and video attempts in a later version.

That concludes the demonstration. Do you have any comments about the functionality or visual interface that we should change?

**00:04:49**

**Customer Representative:** I do not have any major comments about the interface. It looks good. Continue in this direction and move on to the algorithms.

**00:05:00**

**Team Presenter:** Thank you. We can finish the meeting at this point. Thank you for your time.

**00:05:09**

**Customer Representative:** All right. Good luck.

**00:05:11**

**Team Presenter:** Goodbye.

**00:05:15**

*[Post-meeting administrative audio omitted.]*
