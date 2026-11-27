package com.smallnukem.app;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.webkit.JavascriptInterface;

/**
 * The SNAndroid bridge — the one JavascriptInterface the gated web build
 * talks to (D17). The game calls SNAndroid.haptic(name) with semantic
 * names only; the shell owns the device-specific tuning.
 *
 * Names fired by the game (verified in the gated build):
 *   scram, detent, alarmPulse, uiTap, achievement
 */
public class SNBridge {

    private final Vibrator vibrator;
    private long lastDetentMs = 0;

    SNBridge(Context context) {
        Vibrator v = null;
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                VibratorManager vm =
                        (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vm != null) v = vm.getDefaultVibrator();
            } else {
                v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            }
        } catch (Exception ignored) {
        }
        vibrator = v;
    }

    @JavascriptInterface
    public void haptic(String name) {
        if (vibrator == null) return;
        try {
            if (!vibrator.hasVibrator()) return;
            if (name == null) name = "";
            switch (name) {
                case "scram":
                    // The rods drop: one heavy two-stage thump.
                    if (vibrator.hasAmplitudeControl()) {
                        vibrator.vibrate(VibrationEffect.createWaveform(
                                new long[]{0, 45, 35, 130},
                                new int[]{0, 200, 0, 255}, -1));
                    } else if (Build.VERSION.SDK_INT >= 29) {
                        vibrator.vibrate(VibrationEffect.createPredefined(
                                VibrationEffect.EFFECT_HEAVY_CLICK));
                    } else {
                        vibrator.vibrate(160);
                    }
                    break;
                case "alarmPulse":
                    // One double-pulse per call; the game re-fires while the
                    // alarm state holds — the shell never loops on its own.
                    if (vibrator.hasAmplitudeControl()) {
                        vibrator.vibrate(VibrationEffect.createWaveform(
                                new long[]{0, 30, 45, 30},
                                new int[]{0, 255, 0, 255}, -1));
                    } else {
                        vibrator.vibrate(new long[]{0, 25, 40, 25}, -1);
                    }
                    break;
                case "detent":
                    // Valve/rod notch tick, throttled shell-side to >=40 ms.
                    long now = System.currentTimeMillis();
                    if (now - lastDetentMs < 40) return;
                    lastDetentMs = now;
                    if (Build.VERSION.SDK_INT >= 29) {
                        vibrator.vibrate(VibrationEffect.createPredefined(
                                VibrationEffect.EFFECT_TICK));
                    } else {
                        vibrator.vibrate(12);
                    }
                    break;
                case "achievement":
                    // One confident double-click under the cinematic.
                    if (vibrator.hasAmplitudeControl()) {
                        vibrator.vibrate(VibrationEffect.createWaveform(
                                new long[]{0, 18, 32, 18},
                                new int[]{0, 230, 0, 230}, -1));
                    } else if (Build.VERSION.SDK_INT >= 29) {
                        vibrator.vibrate(VibrationEffect.createPredefined(
                                VibrationEffect.EFFECT_DOUBLE_CLICK));
                    } else {
                        vibrator.vibrate(new long[]{0, 15, 30, 15}, -1);
                    }
                    break;
                case "uiTap":
                default:
                    if (Build.VERSION.SDK_INT >= 29) {
                        vibrator.vibrate(VibrationEffect.createPredefined(
                                VibrationEffect.EFFECT_CLICK));
                    } else {
                        vibrator.vibrate(10);
                    }
                    break;
            }
        } catch (Exception ignored) {
            // Haptics are fire-and-forget: never let a device quirk reach the game.
        }
    }
}
