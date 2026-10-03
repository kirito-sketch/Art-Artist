/*
 * The launch splash belongs to an app launch, not to the app becoming visible.
 *
 * "A launch" is a new execution context: a page load of the installed (standalone) app, which is what
 * the operating system creates when the app is opened from the Home Screen after the previous instance
 * ended. Everything below lives in memory, in this module, so a new page load starts it fresh and nothing
 * about it can outlive the context it describes: no localStorage, no cookie, no timer. It is also not tied
 * to onboarding, sign-in or any other app state.
 *
 * Coming back to a context that is still alive (another app and back, Home, the phone locking, a short or
 * long time in the background, bfcache or pageshow) is not a launch, so none of those events is listened
 * to here, and the screen the person left is the screen they come back to. iOS exposes no event for "the
 * user force-quit this app"; the only thing it reveals is whether it created a new page or kept the old one,
 * and that is exactly what this follows.
 */

/** The splash index.html is already painting, captured the first time this script runs in this page. */
const boot = typeof document !== 'undefined' ? document.getElementById('aa-boot') : null;

const session = { hasPlayedLaunchSplash: false };

/** True once this page's launch splash has finished and left. Never reset within a page. */
export const hasPlayedLaunchSplash = () => session.hasPlayedLaunchSplash;

/** Called when the launch splash has finished and been removed. */
export const markLaunchSplashPlayed = () => {
  session.hasPlayedLaunchSplash = true;
};

/** The index.html splash, only while it is still part of the page (a finished one is detached for good). */
export const bootSplash = (): HTMLElement | null => (boot && boot.isConnected ? boot : null);

/** Does this execution context still owe a launch splash? Standalone app, and not yet played. */
export const launchSplashPending = (standalone: boolean) => standalone && !session.hasPlayedLaunchSplash;
