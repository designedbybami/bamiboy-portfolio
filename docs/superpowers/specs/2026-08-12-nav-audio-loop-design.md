# Nav Audio Loop Design

## Goal

Replace the temporary ambient track used by the navigation sound control with a quiet, seamless excerpt of the uploaded instrumental song. The control should feel responsive to the music without competing with the portfolio content.

## Audio asset

- Keep the uploaded source MP3 unchanged.
- Produce a separate, web-optimized `public/audio/nav-loop.mp3`.
- Select a stable 20–30 second instrumental passage after inspecting the source for silence, loudness, and suitable phrase boundaries.
- Blend the final 2–3 seconds into the opening to remove an obvious loop seam.
- Apply conservative loudness treatment and retain additional runtime volume control in the browser.

## Playback behavior

- Playback starts only after the visitor presses the sound control.
- Runtime volume defaults to approximately 15%, with final adjustment based on the processed asset's loudness.
- The excerpt loops continuously while enabled.
- Pausing preserves `currentTime`; pressing play again resumes from that exact position.
- Playback failures and natural media events synchronize the UI with the actual audio state.

## Sound visualization

- Connect the media element to a Web Audio `AnalyserNode` after the visitor's first interaction.
- Sample real-time frequency/amplitude data on animation frames while audio is playing.
- Map the smoothed signal level to the existing dash path so its wave height follows the music rather than a fixed animation.
- Clamp and smooth the values to keep the motion subtle and readable.
- When playback pauses or fails, decay the visualized level smoothly to zero and morph the path back to the flat resting dash.
- Respect reduced-motion preferences by using a restrained or static playing state without continuous sampling-driven motion.

## Resilience and cleanup

- Create the audio graph only once and resume its `AudioContext` from user interaction.
- Cancel animation frames and close/disconnect audio resources when the component unmounts.
- Avoid autoplay and preserve the existing accessible play/pause labels and pressed state.

## Verification

- Inspect the processed clip duration, codec, loudness, and loop transition.
- Verify play, pause, resume-from-position, repeated looping, and state synchronization.
- Run project lint and production build checks.
- Confirm no unrelated in-progress files are modified.
