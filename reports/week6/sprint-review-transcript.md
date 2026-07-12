# Sprint 4 Review — Transcript (Week 6)

**Date:** July 12, 2026
**Participants:** Customer, Oleg Korchagin (@privel)
**Language:** Translated from Russian to English

> Scope note: this recording is a short (~4.5 minute) technical check-in between the customer and Oleg covering antispoofing status, hardware indicator design, and next-week follow-up tasks. It does **not** cover a full documentation review, UAT walkthrough, or explicit transition-readiness sign-off — those remain open items (see `README.md` and `sprint-review-summary.md`).

---

**Customer:** Go ahead. I don't have that much time.

**Oleg:** Okay, one sec, let me open this. So this time we mostly worked on improving the agent, kind of on the frontend side, and there were no changes over the weekend. I was testing the antispoofing, and I can actually run it right now if you want.

**Customer:** Okay, so did you get it working on the hardware so the lights blink?

**Oleg:** We're just working with LEDs. I thought we were going with the gray motor — I didn't realize why the lights were needed.

**Customer:** The lights are there instead of the motor. Blue for access granted, yellow while calibrating, red if denied — some logic like that. Because I never got you the motor, right?

**Oleg:** Ah, I just hadn't seen that anywhere — I saw the LEDs were there and just didn't ask about it.

**Customer:** So did you actually build that functionality?

**Oleg:** I have it set up for the gray motor, on pin 17 — just connect it and it'll turn.

**Customer:** Alright, switch it over, you'll have time to prep it.

**Oleg:** Okay. I'll come test it Monday then.

**Customer:** Alright, what else do you have?

**Oleg:** Basically just the antispoofing work and model improvements. While testing it I found an open-source model trained by some enthusiast. Seems to be working now.

**Customer:** What FPS are you getting locally vs. on the Pi?

**Oleg:** Locally up to 60 — around 58. On the Pi it's stable at around 24 frames.

**Customer:** Twenty-four, with everything running — processing, all the models, everything?

**Oleg:** Yeah — as far as the stream goes, what the camera shows. The only thing is it freezes for a moment when it detects something, because that process kicks in.

**Customer:** Okay. What else? Oh, by the way — your main extra task this week is to clean up the repository: remove unnecessary code, check what's running efficiently, because I've noticed with a lot of teams the code is written nicely but isn't efficient memory-wise and so on. So go back through it, see if you find anything. Also update the README — all the docs you have for setup, running, all of that. Add a description to the GitHub repo — write one if it's missing, and add some tags too. And if you can manage it, write documentation on GitHub Pages about the functions — what does what, how, why it works.

**Oleg:** Mm-hm. Got it.

**Customer:** Basically, go through all the comments in the code and publish them.

**Oleg:** So basically just get the repository and files in order. Got it.

**Customer:** Yeah, yeah. And obviously prep so it all works on the Pi specifically, with the lights.

**Oleg:** Mm-hm. Okay, I'll rewrite it tonight then.

**Customer:** Alright, anything else?

**Oleg:** No, I think that's it.

**Customer:** Okay, if there's nothing else, have a good evening. Good luck.

**Oleg:** Thanks, you too.

---

*Private exact timecodes for the recording belong only in the Week 6 Moodle PDF, not here.*
