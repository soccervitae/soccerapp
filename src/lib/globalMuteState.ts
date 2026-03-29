// Global mute state for feed posts (Instagram-like behavior)
// When user unmutes one post, all posts unmute. When they mute one, all mute.

let _isGloballyMuted = true;

export const getGlobalMuteState = () => _isGloballyMuted;

export const setGlobalMuteState = (muted: boolean) => {
  _isGloballyMuted = muted;
  window.dispatchEvent(new CustomEvent('global-mute-change', { detail: { muted } }));
};

export const GLOBAL_MUTE_EVENT = 'global-mute-change';
