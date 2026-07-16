/*
 * Pre-Hide Transition for OBS Studio
 * -----------------------------------
 * A minimal custom OBS *transition* source meant to be assigned as a
 * source's "Hide Transition" (right-click a source in a scene -> "Show/Hide
 * Transition..."). Unlike the built-in Fade/Slide/etc transitions, this one
 * does not visually transition anything itself -- instead, the moment OBS
 * asks it to start transitioning away from the source, it:
 *
 *   1. Sends a named JS event into the target source IF it's a browser
 *      source (via obs-browser's "javascript_event" proc handler), so the
 *      page itself can run a CSS/JS hide animation.
 *   2. Holds the source fully visible on screen for `duration` ms while
 *      that animation plays (the transition keeps rendering source A).
 *   3. After the delay, completes the transition, at which point OBS
 *      finishes hiding the source for real (visibility flips false /
 *      render stops).
 *
 * If the source being hidden is NOT a browser source (or has no matching
 * JS listener), this just behaves like an instant cut after `duration`
 * (or immediately if duration is 0) -- it never blocks indefinitely, so
 * it's always safe to assign.
 *
 * DURATION SOURCE: `duration` is read from OBS's own Show/Hide Transition
 * duration field (the spinner next to the transition dropdown), via a
 * scene-item lookup at the moment the transition starts -- see
 * find_owning_sceneitem() / obs_sceneitem_get_transition_duration(). This
 * transition also exposes its own "Fallback delay" property, which is
 * only used if that lookup can't find the owning scene item.
 *
 * NOTE on the obs-browser side: this plugin does NOT inject arbitrary JS.
 * obs-browser only exposes a proc handler that dispatches a named
 * CustomEvent into the page:
 *
 *     void javascript_event(string eventName, string jsonString)
 *
 * which (per obs-browser's own JS bindings) the page receives as a
 * standard DOM event. Your browser source's page needs something like:
 *
 *     window.addEventListener('obs-prehide', (e) => {
 *         const data = JSON.parse(e.detail || '{}');
 *         document.body.classList.add('hiding');
 *         // data.duration_ms tells you how long you have before the cut
 *     });
 *
 * (Exact event delivery -- e.detail vs CustomEvent payload shape -- is
 * determined by obs-browser's internal JS bridge; see README notes. If
 * your obs-browser build delivers it differently, adjust the listener
 * accordingly; the C side here is fixed regardless.)
 */

#include <obs-module.h>
#include <obs-frontend-api.h>
#include <util/threading.h>
#include <util/platform.h>
#include <util/dstr.h>

OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("prehide-transition", "en-US")

#define SETTING_DURATION_MS "duration_ms"
#define SETTING_EVENT_NAME  "event_name"
#define SETTING_FALLBACK_CUT "fallback_instant_if_no_browser"
#define SETTING_TARGET_SOURCE_NAME "target_source_name"  /* written by DSK before obs_transition_start; cleared after use */

#define DEFAULT_DURATION_MS 500
#define DEFAULT_EVENT_NAME  "obs-prehide"

struct prehide_transition {
	obs_source_t *source; /* this transition source itself */

	uint32_t duration_ms;
	struct dstr event_name;
	bool fallback_instant_if_no_browser;

	/* transition state */
	bool active;
	uint64_t start_time_ns;
	bool js_signal_sent;
	uint32_t effective_duration_ms; /* resolved once per transition_start: real OBS-set duration if found, else pt->duration_ms */
	char *target_source_name;       /* set by DSK before obs_transition_start; NULL means "all browser sources in scene" */
};

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

/* Returns true if `source` is (or wraps) an obs-browser "browser_source". */
static bool source_is_browser(obs_source_t *source)
{
	if (!source)
		return false;
	const char *id = obs_source_get_id(source);
	return id && strcmp(id, "browser_source") == 0;
}

/* ---------------------------------------------------------------------- */
/* Scene-item lookup: find the obs_sceneitem_t that has THIS transition   */
/* instance assigned as its Hide Transition, so we can read the real      */
/* duration the user set in OBS's own Show/Hide Transition UI (the        */
/* "duration" field stored on the scene item, NOT on this transition's    */
/* own settings -- see obs_sceneitem_get_transition_duration()).          */
/* ---------------------------------------------------------------------- */

struct find_item_ctx {
	obs_source_t *target_transition; /* the transition instance we're looking for (pt->source) */
	obs_sceneitem_t *found;          /* output: addref'd if found, NULL otherwise */
};

static bool find_item_cb(obs_scene_t *scene, obs_sceneitem_t *item, void *param)
{
	UNUSED_PARAMETER(scene);
	struct find_item_ctx *ctx = param;

	if (obs_sceneitem_is_group(item)) {
		/* Recurse into the group; if found inside, stop enumerating
		 * further siblings at this level too. */
		obs_sceneitem_group_enum_items(item, find_item_cb, ctx);
		if (ctx->found)
			return false;
		return true;
	}

	/* obs_sceneitem_get_transition does not increment a reference --
	 * it's safe to compare the raw pointer directly. */
	obs_source_t *hide_tr = obs_sceneitem_get_transition(item, false);
	if (hide_tr == ctx->target_transition) {
		obs_sceneitem_addref(item);
		ctx->found = item;
		return false; /* stop enumeration */
	}

	return true;
}

/* Searches every loaded scene (including nested groups) for the scene
 * item whose Hide Transition is `transition`. Returns an addref'd
 * obs_sceneitem_t on success (caller must obs_sceneitem_release()), or
 * NULL if not found (e.g. transition was just unassigned mid-flight).
 *
 * CAVEAT: obs_frontend_get_scenes() is a frontend-API call. It is called
 * here from transition_start(), which libobs invokes synchronously when
 * obs_transition_start() runs (typically from the graphics/video thread
 * during a visibility toggle). This works in practice in informal testing
 * patterns used by similar plugins, but has not been independently
 * verified against libobs's threading guarantees for obs_frontend_*
 * calls. If you see deadlocks, crashes, or stalls specifically when a
 * Hide Transition fires (and not otherwise), this lookup is the first
 * thing to suspect -- fall back to the "Fallback delay" property by
 * temporarily forcing find_owning_sceneitem() to return NULL. */
static obs_sceneitem_t *find_owning_sceneitem(obs_source_t *transition)
{
	struct obs_frontend_source_list scenes = {0};
	obs_frontend_get_scenes(&scenes);

	struct find_item_ctx ctx = {.target_transition = transition, .found = NULL};

	for (size_t i = 0; i < scenes.sources.num && !ctx.found; i++) {
		obs_scene_t *scene = obs_scene_from_source(scenes.sources.array[i]);
		if (scene)
			obs_scene_enum_items(scene, find_item_cb, &ctx);
	}

	obs_frontend_source_list_free(&scenes);
	return ctx.found;
}

/* Fires the JS event into a single confirmed browser_source. */
static void fire_js_event(struct prehide_transition *pt, obs_source_t *browser)
{
	proc_handler_t *ph = obs_source_get_proc_handler(browser);
	if (!ph)
		return;

	struct dstr json;
	dstr_init(&json);
	dstr_printf(&json, "{\"duration_ms\":%u}", pt->effective_duration_ms);

	calldata_t cd;
	calldata_init(&cd);
	calldata_set_string(&cd, "eventName",
			     pt->event_name.array && pt->event_name.len
				     ? pt->event_name.array
				     : DEFAULT_EVENT_NAME);
	calldata_set_string(&cd, "jsonString", json.array);

	bool ok = proc_handler_call(ph, "javascript_event", &cd);
	if (!ok) {
		blog(LOG_WARNING,
		     "[prehide-transition] target source '%s' has no "
		     "'javascript_event' proc handler (obs-browser too old?)",
		     obs_source_get_name(browser));
	}

	calldata_free(&cd);
	dstr_free(&json);
}

/* Enumerate callback: fires JS event on browser_source items in the scene,
 * recursing into groups. When pt->target_source_name is set (DSK case),
 * only fires on the source with that exact name. When NULL, fires on all
 * browser sources (normal whole-scene hide). */
static bool scene_broadcast_cb(obs_scene_t *scene, obs_sceneitem_t *item, void *param)
{
	UNUSED_PARAMETER(scene);
	struct prehide_transition *pt = param;

	if (obs_sceneitem_is_group(item)) {
		obs_sceneitem_group_enum_items(item, scene_broadcast_cb, pt);
		return true;
	}

	obs_source_t *src = obs_sceneitem_get_source(item);
	if (!src || !source_is_browser(src))
		return true;

	/* If DSK told us which specific source(s) to target, skip all others.
	 * target_source_name is a comma-separated list of source names set by
	 * DSK before obs_transition_start (see RefreshCompositeOutput). */
	if (pt->target_source_name) {
		const char *src_name = obs_source_get_name(src);
		/* Walk the CSV list looking for an exact token match. */
		const char *p = pt->target_source_name;
		bool matched = false;
		while (*p) {
			const char *comma = strchr(p, ',');
			size_t len = comma ? (size_t)(comma - p) : strlen(p);
			if (strlen(src_name) == len && strncmp(src_name, p, len) == 0) {
				matched = true;
				break;
			}
			p = comma ? comma + 1 : p + len;
		}
		if (!matched)
			return true;
	}

	fire_js_event(pt, src);
	return true;
}

/* Fires the configured JS event into the browser source via obs-browser's
 * proc handler. If `target` is a scene (DSK case: the transition's source A
 * is the scene being hidden, not the browser source directly), we walk the
 * scene's items and fire the event on every browser_source found inside it,
 * recursing into groups. Safe no-op if no browser source is found or the
 * proc isn't available. */
static void send_js_event(struct prehide_transition *pt, obs_source_t *target)
{
	if (!target)
		return;

	if (source_is_browser(target)) {
		/* Direct case: transition A is the browser source itself
		 * (normal per-source hide transition, not DSK). */
		fire_js_event(pt, target);
		return;
	}

	/* Scene case: transition A is a scene (e.g. DSK hides a scene that
	 * contains the browser source). Walk the scene's items. */
	obs_scene_t *scene = obs_scene_from_source(target);
	if (scene) {
		obs_scene_enum_items(scene, scene_broadcast_cb, pt);
		return;
	}

	blog(LOG_DEBUG,
	     "[prehide-transition] source A '%s' is neither a browser_source "
	     "nor a scene -- no JS event sent",
	     obs_source_get_name(target));
}

/* ---------------------------------------------------------------------- */
/* obs_source_info callbacks                                              */
/* ---------------------------------------------------------------------- */

static const char *prehide_get_name(void *unused)
{
	UNUSED_PARAMETER(unused);
	return obs_module_text("PreHideTransition.Name");
}

static void prehide_update(void *data, obs_data_t *settings)
{
	struct prehide_transition *pt = data;
	pt->duration_ms = (uint32_t)obs_data_get_int(settings, SETTING_DURATION_MS);
	pt->fallback_instant_if_no_browser =
		obs_data_get_bool(settings, SETTING_FALLBACK_CUT);

	const char *ev = obs_data_get_string(settings, SETTING_EVENT_NAME);
	dstr_copy(&pt->event_name, (ev && *ev) ? ev : DEFAULT_EVENT_NAME);
}

static void *prehide_create(obs_data_t *settings, obs_source_t *source)
{
	struct prehide_transition *pt = bzalloc(sizeof(*pt));
	pt->source = source;
	dstr_init(&pt->event_name);

	prehide_update(pt, settings);
	return pt;
}

static void prehide_destroy(void *data)
{
	struct prehide_transition *pt = data;
	dstr_free(&pt->event_name);
	bfree(pt->target_source_name);
	bfree(pt);
}

static obs_properties_t *prehide_properties(void *data)
{
	UNUSED_PARAMETER(data);
	obs_properties_t *props = obs_properties_create();

	obs_properties_add_int(props, SETTING_DURATION_MS,
				obs_module_text("PreHideTransition.DurationMs"),
				0, 60000, 50);
	/* Used as the delay duration when assigned via Downstream Keyer
	 * (DSK manages its own hide-transition duration internally and does
	 * not go through obs_sceneitem_set_transition, so there is no scene
	 * item to read from). When assigned as a normal per-source Hide
	 * Transition via right-click, the duration is read from OBS's own
	 * Show/Hide Transition duration spinner instead and this value is
	 * ignored. */

	obs_properties_add_text(props, SETTING_EVENT_NAME,
				 obs_module_text("PreHideTransition.EventName"),
				 OBS_TEXT_DEFAULT);

	obs_properties_add_bool(
		props, SETTING_FALLBACK_CUT,
		obs_module_text("PreHideTransition.FallbackInstant"));

	return props;
}

static void prehide_defaults(obs_data_t *settings)
{
	obs_data_set_default_int(settings, SETTING_DURATION_MS, DEFAULT_DURATION_MS);
	obs_data_set_default_string(settings, SETTING_EVENT_NAME, DEFAULT_EVENT_NAME);
	obs_data_set_default_bool(settings, SETTING_FALLBACK_CUT, true);
}

/* Called by libobs when the transition begins (obs_transition_start).
 * For a per-source Hide Transition, source A = the source being hidden,
 * source B = NULL/nothing. We use this moment to fire the JS signal. */
static void prehide_transition_start(void *data)
{
	struct prehide_transition *pt = data;
	pt->active = true;
	pt->js_signal_sent = false;
	pt->start_time_ns = os_gettime_ns();

	/* Resolve the real duration. For normal per-source hide transitions
	 * (right-click source -> Hide Transition), the duration is stored on
	 * the obs_sceneitem_t -- find it by searching every scene for the
	 * item whose hide transition pointer matches us.
	 *
	 * For DSK: the Downstream Keyer plugin manages its own hide
	 * transition and duration internally; it does NOT use
	 * obs_sceneitem_set_transition(), so find_owning_sceneitem() will
	 * return NULL and we fall back to this transition's own built-in
	 * duration_ms (DEFAULT_DURATION_MS = 500ms unless you edit the
	 * source). This is an inherent limitation of the DSK architecture --
	 * DSK calls obs_transition_start(tr, AUTO, hideTransitionDuration,
	 * nullptr) but that duration is not readable back from inside a
	 * transition callback. */
	obs_sceneitem_t *item = find_owning_sceneitem(pt->source);
	if (item) {
		pt->effective_duration_ms = obs_sceneitem_get_transition_duration(item, false);
		obs_sceneitem_release(item);
	} else {
		pt->effective_duration_ms = pt->duration_ms;
		blog(LOG_INFO,
		     "[prehide-transition] no owning scene item found (expected "
		     "if used via DSK); using built-in duration_ms fallback "
		     "(%u ms)",
		     pt->duration_ms);
	}

	obs_source_t *target = obs_transition_get_source(pt->source, OBS_TRANSITION_SOURCE_A);

	/* Read the target source name DSK may have written into our settings
	 * just before calling obs_transition_start. We read and immediately
	 * clear it so it never accidentally persists to the next trigger. */
	bfree(pt->target_source_name);
	pt->target_source_name = NULL;
	obs_data_t *settings = obs_source_get_settings(pt->source);
	const char *tsn = obs_data_get_string(settings, SETTING_TARGET_SOURCE_NAME);
	if (tsn && *tsn) {
		pt->target_source_name = bstrdup(tsn);
		obs_data_set_string(settings, SETTING_TARGET_SOURCE_NAME, "");
	}
	obs_data_release(settings);

	if (target) {
		send_js_event(pt, target);
		pt->js_signal_sent = true;
		obs_source_release(target);
	}

	/* If there's nothing to wait on (no browser source, and the user
	 * wants an instant fallback) we could shortcut here, but keeping the
	 * delay uniform makes behavior predictable -- it always honors
	 * effective_duration_ms regardless of target type. Set the OBS
	 * Show/Hide Transition duration to 0 if you want instant-cut
	 * behavior for non-browser sources. */
}

static void prehide_transition_stop(void *data)
{
	struct prehide_transition *pt = data;
	pt->active = false;
}

/* video_render drives the actual transition timing. We render source A
 * completely unchanged -- no visual fade is done here, since the actual
 * hide animation (if any) happens *inside* the browser page itself in
 * response to the JS event. This callback just needs to keep drawing A
 * at full opacity (and never draw B, which is empty/unused for a hide)
 * until duration_ms elapses. */
static void prehide_render_callback(void *data, gs_texture_t *a, gs_texture_t *b,
				     float t, uint32_t cx, uint32_t cy)
{
	UNUSED_PARAMETER(data);
	UNUSED_PARAMETER(b);
	UNUSED_PARAMETER(t);

	if (!a)
		return;

	gs_effect_t *effect = obs_get_base_effect(OBS_EFFECT_DEFAULT);
	gs_eparam_t *image = gs_effect_get_param_by_name(effect, "image");
	gs_effect_set_texture(image, a);

	while (gs_effect_loop(effect, "Draw"))
		gs_draw_sprite(a, 0, cx, cy);
}

static void prehide_video_render(void *data, gs_effect_t *effect)
{
	struct prehide_transition *pt = data;
	UNUSED_PARAMETER(effect);

	uint64_t elapsed_ns = pt->active ? (os_gettime_ns() - pt->start_time_ns) : 0;
	uint64_t duration_ns = (uint64_t)pt->effective_duration_ms * 1000000ULL;

	/* Draws source A (the source being hidden) into an offscreen texture
	 * internally, then calls prehide_render_callback to composite it. */
	obs_transition_video_render(pt->source, prehide_render_callback);

	if (pt->active && elapsed_ns >= duration_ns) {
		/* Time's up: tell libobs we're done so it can finish hiding
		 * the source for real. */
		obs_transition_force_stop(pt->source);
		pt->active = false;
	}
}

/* obs_transition_audio_render (unlike the video path) does take two
 * separate mix callbacks, one per source. Source A stays fully audible
 * the whole time; B is unused. */
static float prehide_mix_a(void *data, float t)
{
	UNUSED_PARAMETER(data);
	UNUSED_PARAMETER(t);
	return 1.0f;
}

static float prehide_mix_b(void *data, float t)
{
	UNUSED_PARAMETER(data);
	UNUSED_PARAMETER(t);
	return 0.0f;
}

static bool prehide_audio_render(void *data, uint64_t *ts_out,
				  struct obs_source_audio_mix *audio,
				  uint32_t mixers, size_t channels,
				  size_t sample_rate)
{
	struct prehide_transition *pt = data;
	/* Pass audio through from source A unaffected (a "hide" shouldn't
	 * mute audio mid-animation any more than a hard cut would have). */
	return obs_transition_audio_render(pt->source, ts_out, audio, mixers,
					    channels, sample_rate,
					    prehide_mix_a, prehide_mix_b);
}

static enum gs_color_space
prehide_video_get_color_space(void *data, size_t count,
			       const enum gs_color_space *preferred_spaces)
{
	struct prehide_transition *pt = data;
	UNUSED_PARAMETER(count);
	UNUSED_PARAMETER(preferred_spaces);
	/* obs_transition_video_get_color_space takes only the transition
	 * source itself -- it derives the space from whatever sub-source(s)
	 * are currently set on the transition. */
	return obs_transition_video_get_color_space(pt->source);
}

/* ---------------------------------------------------------------------- */
/* Registration                                                           */
/* ---------------------------------------------------------------------- */

struct obs_source_info prehide_transition_info = {
	.id = "prehide_transition",
	.type = OBS_SOURCE_TYPE_TRANSITION,
	.output_flags = OBS_SOURCE_VIDEO | OBS_SOURCE_CUSTOM_DRAW,
	.get_name = prehide_get_name,
	.create = prehide_create,
	.destroy = prehide_destroy,
	.update = prehide_update,
	.get_properties = prehide_properties,
	.get_defaults = prehide_defaults,
	.video_render = prehide_video_render,
	.audio_render = prehide_audio_render,
	.transition_start = prehide_transition_start,
	.transition_stop = prehide_transition_stop,
	.video_get_color_space = prehide_video_get_color_space,
};

bool obs_module_load(void)
{
	obs_register_source(&prehide_transition_info);
	blog(LOG_INFO, "[prehide-transition] plugin loaded");
	return true;
}

void obs_module_unload(void)
{
	blog(LOG_INFO, "[prehide-transition] plugin unloaded");
}