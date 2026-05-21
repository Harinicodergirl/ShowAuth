"""
feature_extraction.py
---------------------
Converts raw keyboard + mouse events sent from React JS tracker
into the 13 features expected by the ML model.
"""

import math
import numpy as np


# ── Constants ────────────────────────────────────────────────────────────────
HESITATION_LO = 0.5
HESITATION_HI = 1.0
PAUSE_THRESH  = 1.0
DIR_THRESH    = 45.0
MAX_DWELL     = 2.0


# ── Safe helpers ─────────────────────────────────────────────────────────────
def _safe_mean(lst):
    return float(np.mean(lst)) if lst else 0.0

def _safe_std(lst):
    return float(np.std(lst)) if lst else 0.0

def _safe_max(lst):
    return float(np.max(lst)) if lst else 0.0

def _euclidean(a, b):
    return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

def _angle(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    return math.degrees(math.atan2(dy, dx))

def _safe_float(val, fallback=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return fallback


# ── Keyboard features ────────────────────────────────────────────────────────
def extract_keyboard_features(key_events: list) -> dict:

    if not key_events:
        return {
            "mean_dwell": 0.0,
            "std_dwell": 0.0,
            "max_dwell": 0.0,
            "correction_count": 0.0,
            "backspace_frequency": 0.0,
            "shift_usage": 0.0,
        }

    dwell_times = []
    press_time = {}

    total_presses = 0
    backspace_count = 0
    shift_count = 0

    for event in key_events:
        key   = str(event.get("key") or event.get("Key") or "").lower().strip()
        etype = str(event.get("event") or event.get("Event") or "").lower().strip()
        epoch = _safe_float(event.get("epoch") or event.get("Epoch"))

        if not key or not etype or epoch == 0.0:
            continue

        # Ignore unusable keys
        if key == "tab":
            continue

        if etype == "pressed":
            press_time[key] = epoch
            total_presses += 1

            # corrections
            if key in ("backspace", "delete", "\b"):
                backspace_count += 1

            # shift detection (robust)
            if "shift" in key or "capslock" in key:
                shift_count += 1

        elif etype == "released" and key in press_time:
            dwell = epoch - press_time.pop(key)

            if 0 < dwell < MAX_DWELL:
                dwell_times.append(dwell * 1000)  # ms (IMPORTANT: consistent scaling)

    return {
        "mean_dwell": _safe_mean(dwell_times),
        "std_dwell": _safe_std(dwell_times),
        "max_dwell": _safe_max(dwell_times),
        "correction_count": float(backspace_count),
        "backspace_frequency": backspace_count / total_presses if total_presses else 0.0,
        "shift_usage": shift_count / total_presses if total_presses else 0.0,
    }


# ── Mouse features ───────────────────────────────────────────────────────────
def extract_mouse_features(mouse_events: list) -> dict:

    if not mouse_events:
        return {
            "avg_velocity": 0.0,
            "acceleration": 0.0,
            "total_distance": 0.0,
            "click_count": 0.0,
            "hesitation": 0.0,
            "pauses": 0.0,
            "direction_changes": 0.0,
        }

    velocities = []
    accelerations = []

    total_distance = 0.0
    click_count = 0
    hesitation = 0
    pauses = 0
    direction_changes = 0

    prev_coord = None
    prev_epoch = None
    prev_angle = None
    prev_velocity = None

    for event in mouse_events:

        etype = str(event.get("event") or event.get("Event") or "").lower().strip()
        epoch = _safe_float(event.get("epoch") or event.get("Epoch"))

        # coordinates
        coord = None
        if "x" in event and "y" in event:
            coord = [_safe_float(event["x"]), _safe_float(event["y"])]

        if not etype or epoch == 0.0:
            continue

        # click handling (robust across frontend implementations)
        if etype in ("left_press", "right_press", "click"):
            click_count += 1

        if etype == "movement" and coord:

            if prev_coord is not None and prev_epoch is not None:

                dt = epoch - prev_epoch
                dist = _euclidean(coord, prev_coord)

                total_distance += dist

                if dt > 0:
                    velocity = dist / dt
                    velocities.append(velocity)

                    if prev_velocity is not None:
                        accelerations.append(abs(velocity - prev_velocity) / dt)

                    prev_velocity = velocity

                    # hesitation
                    if HESITATION_LO <= dt < HESITATION_HI:
                        hesitation += 1

                    # pause
                    elif dt >= PAUSE_THRESH:
                        pauses += 1

                # direction change
                if dist > 1e-6:
                    angle = _angle(prev_coord, coord)

                    if prev_angle is not None:
                        delta = abs(angle - prev_angle)
                        if delta > 180:
                            delta = 360 - delta

                        if delta > DIR_THRESH:
                            direction_changes += 1

                    prev_angle = angle

            prev_coord = coord
            prev_epoch = epoch

    return {
        "avg_velocity": _safe_mean(velocities),
        "acceleration": _safe_mean(accelerations),
        "total_distance": total_distance,
        "click_count": float(click_count),
        "hesitation": float(hesitation),
        "pauses": float(pauses),
        "direction_changes": float(direction_changes),
    }


# ── Main feature vector builder ──────────────────────────────────────────────
def extract_features(payload: dict) -> list:

    if not payload:
        raise ValueError("Empty payload received.")

    key_events = payload.get("key_events") or []
    mouse_events = payload.get("mouse_events") or []

    if not key_events and not mouse_events:
        raise ValueError("No key or mouse events found.")

    kb = extract_keyboard_features(key_events)
    ms = extract_mouse_features(mouse_events)

    # MUST match model training order exactly
    return [
        kb["mean_dwell"],
        kb["std_dwell"],
        kb["max_dwell"],
        kb["correction_count"],
        kb["backspace_frequency"],
        kb["shift_usage"],
        ms["avg_velocity"],
        ms["acceleration"],
        ms["total_distance"],
        ms["click_count"],
        ms["hesitation"],
        ms["pauses"],
        ms["direction_changes"],
    ]