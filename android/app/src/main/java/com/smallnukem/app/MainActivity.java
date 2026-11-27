package com.smallnukem.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

/**
 * Small Nukem — native shell for the gated web build.
 *
 * The shell's job is to disappear: load the bundled game full-screen,
 * keep the screen awake through a shift, honour its one bridge call
 * (SNAndroid.haptic), and never get in the way. The game ships in
 * assets/ and the app holds no INTERNET permission — fully offline.
 */
public class MainActivity extends Activity {

    private static final String TAG = "SmallNukem";
    private WebView webView;
    private OnBackInvokedCallback backCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Wake lock: the screen never dims mid-startup while the player
        // watches a slow pressure rise. Released automatically on background.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Draw into the display-cutout area (forced edge-to-edge at
        // targetSdk 36); the game keeps HUD elements inside safe-area insets.
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }

        // High-refresh request: prefer the fastest display mode at the
        // current resolution (Pixel 10: 120 Hz). A request, never an
        // assumption — the system still owns thermal/battery overrides.
        try {
            Display display = (Build.VERSION.SDK_INT >= 30)
                    ? getDisplay() : window.getWindowManager().getDefaultDisplay();
            if (display != null) {
                Display.Mode current = display.getMode();
                Display.Mode best = current;
                for (Display.Mode m : display.getSupportedModes()) {
                    if (m.getPhysicalWidth() == current.getPhysicalWidth()
                            && m.getPhysicalHeight() == current.getPhysicalHeight()
                            && m.getRefreshRate() > best.getRefreshRate()) {
                        best = m;
                    }
                }
                WindowManager.LayoutParams lp = window.getAttributes();
                lp.preferredDisplayModeId = best.getModeId();
                lp.preferredRefreshRate = best.getRefreshRate();
                window.setAttributes(lp);
            }
        } catch (Exception ignored) {
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);              // saves/settings persist in app-private data
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        // Bundled-game origin fix (Nov 25): the game draws its sprite PNGs
        // (file:///android_asset/sprites/...) into a 2D atlas canvas and
        // uploads it with WebGL texImage2D. With the default file:// origin
        // policy those images taint the atlas, texImage2D throws an uncaught
        // SecurityError, and the whole GL world renders black (DOM/2D HUD
        // unaffected). The app is fully offline with no INTERNET permission
        // and only ever loads its own assets, so file-origin access is safe.
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        // WebGL requires hardware acceleration (manifest) — nothing else to tune.

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file:")) return false;      // the game itself
                // Anything else (there should be nothing, offline) goes to the browser.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        // The one bridge the gated build talks to.
        webView.addJavascriptInterface(new SNBridge(this), "SNAndroid");

        try {
            android.content.pm.PackageInfo pi = WebView.getCurrentWebViewPackage();
            Log.i(TAG, "WebView package: " + (pi == null ? "unknown"
                    : pi.packageName + " " + pi.versionName));
        } catch (Exception ignored) {
        }

        hideSystemBars();

        // Predictive back (targetSdk 36): onBackPressed() is never called.
        // The gated build exposes no back hook, so Back backgrounds the task
        // instead of destroying the activity mid-shift — same as Home.
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = () -> moveTaskToBack(true);
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }

        String url = "file:///android_asset/index.html";
        String mode = null;
        Intent intent = getIntent();
        if (intent != null) {
            if (intent.hasExtra("startMode")) mode = intent.getStringExtra("startMode");
            Uri data = intent.getData();
            if (data != null && data.getQueryParameter("mode") != null) {
                mode = data.getQueryParameter("mode");
            }
        }
        if (mode != null && mode.matches("[a-z]+")) {
            url += "?mode=" + mode;
        }
        webView.loadUrl(url);
    }

    private void hideSystemBars() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = window.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) {
            try {
                getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
            } catch (Exception ignored) {
            }
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
