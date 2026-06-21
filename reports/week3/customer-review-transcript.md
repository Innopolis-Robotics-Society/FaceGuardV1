# Customer Review Transcript - Week 3

## Context

This transcript records the Week 3 MVP v1 customer review discussion. It is written in English and cleaned for readability while preserving the meaning of the conversation.

## Transcript

00:00:25 - Danila Naboishchikov

Today we are demonstrating MVP v1. In this version, we combined the admin set, backend, database, a recognition agent, and a real camera. We added a registration panel to secure access to the admin panel.

On the dashboard, real data is already displayed: access history, statistics, and recent events. Everything is already connected to the database.

Also, the camera is working - real video is being displayed, and we are about to connect it.

00:01:02 - Danila Naboishchikov

Oleg, for testing purposes I connected a virtual camera so we can test the recognition.

When triggered, a door-open event is simulated, mock data arrives, and the system recognizes users.

In the interface, the list of people who entered is shown at the bottom, and this data is also reflected in the dashboard.

It is also possible to edit photos. I uploaded several test images to the database so we can see how it works - this is only for testing.

00:01:15 - Artyom Tuzov

Uh-huh.

00:01:36 - Artyom Tuzov

I see, nice.

00:01:55 - Artyom Tuzov

Three photos?

00:01:57 - Oleg Korchagin

Yeah.

00:01:57 - Artyom Tuzov

Thirty photos.

00:02:00 - Oleg Korchagin

No, I just clicked a few times for testing. There is a "take user photo" button.

I pressed it several times, so that's why multiple images appeared.

00:02:05 - Artyom Tuzov

I see.

00:02:15 - Artyom Tuzov

We should probably set a limit on that.

00:02:17 - Oleg Korchagin

Yes, of course, I will fix that. Right now it's just a test mode, so the limit is not strict.

00:02:26 - Oleg Korchagin

We can also add a new user, and then the system should recognize them.

Right now it is not detecting them correctly yet.

There is a bug: to update the model, it needs to be rebuilt through the panel. I added a "restart recognition" button, but it doesn't fully refresh the model.

00:02:56 - Artyom Tuzov

Uh-huh.

00:02:59 - Oleg Korchagin

This is a temporary workaround. It currently works only on Windows. On Raspberry Pi it will be easier to implement.

00:03:09 - Danila Naboishchikov

But this was not in the scope of MVP v1, so it will be implemented later.

00:03:16 - Artyom Tuzov

So this is model restart?

00:03:19 - Danila Naboishchikov

Yes.

00:03:20 - Artyom Tuzov

Got it.

00:03:21 - Danila Naboishchikov

Yes, the restart bug will also be fixed. We have logged it.

00:03:27 - Artyom Tuzov

Okay.

00:03:27 - Danila Naboishchikov

In MVP v1, we implemented four main user stories:

- viewing the list of people with access;
- adding a new person with photos;
- viewing the dashboard and system metrics;
- connected camera and its status.

All backlog items are properly documented with acceptance criteria, story points, priority, assignee, and reviewer.

Now we would like to get your feedback: does the demo meet expectations? Any comments?

00:04:14 - Danila Naboishchikov

...

00:04:15 - Artyom Tuzov

Well, more than enough. I actually expected less.

00:04:22 - Danila Naboishchikov

Good. Eldar has joined, right?

00:04:26 - Artyom Tuzov

Yes, everything is great. Keep going in the same direction.

00:04:31 - Danila Naboishchikov

Alright. Next, we will fix bugs and expand backend functionality and its integration with the website. We will also connect the remaining features and continue working with Raspberry Pi.

00:04:42 - Artyom Tuzov

I would recommend first stabilizing everything properly on Ubuntu and testing it thoroughly. Windows and Ubuntu behave differently, so you need to adapt it to a Linux environment first, and only then move to Raspberry Pi.

00:04:57 - Danila Naboishchikov

Understood, we accept that plan.

00:05:03 - Artyom Tuzov

Yes.

00:05:10 - Danila Naboishchikov

Thank you for your time.

00:05:13 - Artyom Tuzov

Alright, good luck.

00:05:15 - Danila Naboishchikov

Have a good day.
