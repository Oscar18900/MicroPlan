package mx.buap.microplan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Foreground service that monitors foreground app switches during an active Pomodoro block
 * and renders a calm, non-punitive overlay reminder on top of distracting apps.
 */
public class ShieldMonitorService extends Service {

    public static final String EXTRA_ENDS_AT_MS = "endsAtMs";
    public static final String EXTRA_TASK_TITLE = "taskTitle";

    private static final String CHANNEL_ID = "microplan_focus_shield";
    private static final int NOTIFICATION_ID = 4104;
    private static final long POLL_INTERVAL_MS = 1200L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<String> ignoredPackages = new HashSet<>();

    private WindowManager windowManager;
    private View overlayView;
    private TextView bodyTextView;

    private long endsAtMs = 0L;
    private String taskTitle = "";
    private String lastDetectedPackage = null;
    private String snoozedPackage = null;
    private String activeOverlayPackage = null;

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (endsAtMs > 0L && System.currentTimeMillis() >= endsAtMs) {
                hideOverlay();
                stopSelf();
                return;
            }

            checkForegroundApp();
            handler.postDelayed(this, POLL_INTERVAL_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        refreshIgnoredPackages();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            endsAtMs = intent.getLongExtra(EXTRA_ENDS_AT_MS, 0L);
            String title = intent.getStringExtra(EXTRA_TASK_TITLE);
            taskTitle = title != null ? title.trim() : "";
        }

        lastDetectedPackage = getPackageName();
        snoozedPackage = null;
        activeOverlayPackage = null;

        createNotificationChannel();
        Notification notification = buildNotification();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception ignored) {
            // Fallback gracefully if foreground promotion fails
        }

        handler.removeCallbacks(pollRunnable);
        handler.post(pollRunnable);
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(pollRunnable);
        hideOverlay();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void refreshIgnoredPackages() {
        ignoredPackages.clear();
        ignoredPackages.add(getPackageName());
        ignoredPackages.add("android");
        ignoredPackages.add("com.android.systemui");
        ignoredPackages.add("com.android.settings");
        ignoredPackages.add("com.android.permissioncontroller");
        ignoredPackages.add("com.google.android.permissioncontroller");
        ignoredPackages.add("com.android.packageinstaller");
        ignoredPackages.add("com.google.android.packageinstaller");
        ignoredPackages.add("com.android.dialer");
        ignoredPackages.add("com.google.android.dialer");
        ignoredPackages.add("com.android.incallui");
        ignoredPackages.add("com.samsung.android.incallui");
        ignoredPackages.add("com.android.server.telecom");

        try {
            PackageManager pm = getPackageManager();
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            List<ResolveInfo> launchers = pm.queryIntentActivities(homeIntent, 0);
            for (ResolveInfo info : launchers) {
                if (info.activityInfo != null && info.activityInfo.packageName != null) {
                    ignoredPackages.add(info.activityInfo.packageName);
                }
            }
        } catch (Exception ignored) {
            // Keep default set
        }

        try {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                List<InputMethodInfo> imes = imm.getEnabledInputMethodList();
                for (InputMethodInfo imi : imes) {
                    if (imi.getPackageName() != null) {
                        ignoredPackages.add(imi.getPackageName());
                    }
                }
            }
        } catch (Exception ignored) {
            // Keep default set
        }
    }

    private void checkForegroundApp() {
        String pkg = queryLatestForegroundPackage();
        if (pkg == null || pkg.isEmpty()) {
            pkg = lastDetectedPackage;
        } else {
            lastDetectedPackage = pkg;
        }

        if (pkg == null || pkg.isEmpty()) {
            return;
        }

        if (pkg.equals(getPackageName())) {
            snoozedPackage = null;
            activeOverlayPackage = null;
            hideOverlay();
            return;
        }

        if (ignoredPackages.contains(pkg)) {
            return;
        }

        if (pkg.equals(snoozedPackage)) {
            return;
        }

        if (!Settings.canDrawOverlays(this)) {
            return;
        }

        if (overlayView == null || !pkg.equals(activeOverlayPackage)) {
            activeOverlayPackage = pkg;
            showOverlay(pkg);
        } else {
            updateOverlayBodyText();
        }
    }

    @Nullable
    private String queryLatestForegroundPackage() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            return null;
        }

        long now = System.currentTimeMillis();
        UsageEvents events = usm.queryEvents(now - 10_000L, now);
        if (events == null) {
            return null;
        }

        UsageEvents.Event event = new UsageEvents.Event();
        String latestPkg = null;
        long latestTs = 0L;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            int type = event.getEventType();
            boolean isForeground = type == UsageEvents.Event.MOVE_TO_FOREGROUND;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                isForeground = isForeground || type == UsageEvents.Event.ACTIVITY_RESUMED;
            }
            if (isForeground && event.getTimeStamp() >= latestTs) {
                latestTs = event.getTimeStamp();
                latestPkg = event.getPackageName();
            }
        }

        return latestPkg;
    }

    private void showOverlay(String externalPkg) {
        if (overlayView != null) {
            updateOverlayBodyText();
            return;
        }
        if (windowManager == null) {
            return;
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#CC131B2E"));
        int outerPad = dp(20);
        root.setPadding(outerPad, outerPad, outerPad, outerPad);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(22), dp(22), dp(22), dp(20));

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.WHITE);
        cardBg.setCornerRadius(dp(24));
        cardBg.setStroke(dp(1), Color.parseColor("#E5E7F3"));
        card.setBackground(cardBg);

        // Amber shield pill
        TextView badge = new TextView(this);
        badge.setText("Escudo de Enfoque Activo");
        badge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setTextColor(Color.parseColor("#B15106"));
        badge.setPadding(dp(12), dp(5), dp(12), dp(5));
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor("#FFFBEB"));
        badgeBg.setCornerRadius(dp(999));
        badge.setBackground(badgeBg);
        LinearLayout.LayoutParams badgeLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        badge.setLayoutParams(badgeLp);
        card.addView(badge);

        // Title
        TextView titleView = new TextView(this);
        titleView.setText("¿Seguro que quieres salir?");
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setTextColor(Color.parseColor("#131B2E"));
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = dp(10);
        titleView.setLayoutParams(titleLp);
        card.addView(titleView);

        // Body text
        bodyTextView = new TextView(this);
        bodyTextView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        bodyTextView.setTextColor(Color.parseColor("#434655"));
        bodyTextView.setLineSpacing(0f, 1.3f);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bodyLp.topMargin = dp(8);
        bodyTextView.setLayoutParams(bodyLp);
        updateOverlayBodyText();
        card.addView(bodyTextView);

        // Calm non-punitive banner
        TextView banner = new TextView(this);
        banner.setText("Salir pausa tu concentración, pero NO rompe tu racha.");
        banner.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        banner.setTypeface(Typeface.DEFAULT_BOLD);
        banner.setTextColor(Color.parseColor("#006A63"));
        banner.setPadding(dp(14), dp(12), dp(14), dp(12));
        GradientDrawable bannerBg = new GradientDrawable();
        bannerBg.setColor(Color.parseColor("#E2F7F5"));
        bannerBg.setCornerRadius(dp(14));
        banner.setBackground(bannerBg);
        LinearLayout.LayoutParams bannerLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bannerLp.topMargin = dp(14);
        banner.setLayoutParams(bannerLp);
        card.addView(banner);

        // Primary CTA: Return to MicroPlan
        Button returnBtn = new Button(this);
        returnBtn.setAllCaps(false);
        returnBtn.setText("← Volver a MicroPlan");
        returnBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        returnBtn.setTypeface(Typeface.DEFAULT_BOLD);
        returnBtn.setTextColor(Color.WHITE);
        GradientDrawable returnBg = new GradientDrawable();
        returnBg.setColor(Color.parseColor("#2563EB"));
        returnBg.setCornerRadius(dp(16));
        returnBtn.setBackground(returnBg);
        returnBtn.setPadding(dp(16), dp(14), dp(16), dp(14));
        LinearLayout.LayoutParams returnLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        returnLp.topMargin = dp(16);
        returnBtn.setLayoutParams(returnLp);
        returnBtn.setOnClickListener(v -> {
            hideOverlay();
            activeOverlayPackage = null;
            Intent launch = new Intent(ShieldMonitorService.this, MainActivity.class);
            launch.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            );
            startActivity(launch);
        });
        card.addView(returnBtn);

        // Secondary CTA: Exit anyway (snoozes this external app)
        Button exitBtn = new Button(this);
        exitBtn.setAllCaps(false);
        exitBtn.setText("Salir igualmente");
        exitBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        exitBtn.setTypeface(Typeface.DEFAULT_BOLD);
        exitBtn.setTextColor(Color.parseColor("#131B2E"));
        GradientDrawable exitBg = new GradientDrawable();
        exitBg.setColor(Color.parseColor("#F2F3FF"));
        exitBg.setCornerRadius(dp(16));
        exitBg.setStroke(dp(1), Color.parseColor("#E5E7F3"));
        exitBtn.setBackground(exitBg);
        exitBtn.setPadding(dp(16), dp(12), dp(16), dp(12));
        LinearLayout.LayoutParams exitLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        exitLp.topMargin = dp(10);
        exitBtn.setLayoutParams(exitLp);
        exitBtn.setOnClickListener(v -> {
            snoozedPackage = externalPkg;
            activeOverlayPackage = null;
            hideOverlay();
        });
        card.addView(exitBtn);

        FrameLayout.LayoutParams cardLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        );
        card.setLayoutParams(cardLp);
        root.addView(card);

        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.CENTER;

        try {
            windowManager.addView(root, params);
            overlayView = root;
        } catch (Exception ignored) {
            overlayView = null;
        }
    }

    private void updateOverlayBodyText() {
        if (bodyTextView == null) {
            return;
        }
        StringBuilder sb = new StringBuilder();
        if (endsAtMs > 0L) {
            long remMs = Math.max(0L, endsAtMs - System.currentTimeMillis());
            long remMin = Math.max(1L, (long) Math.ceil(remMs / 60000.0));
            sb.append("Te quedan aprox. ").append(remMin).append(" min en tu bloque Pomodoro. ");
        } else {
            sb.append("Tienes un bloque Pomodoro activo en curso. ");
        }
        if (!taskTitle.isEmpty()) {
            sb.append("\nMicro-meta: ").append(taskTitle).append(". ");
        }
        sb.append("\nCambiar a otra app ahora interrumpe tu concentración (~15 min en retomarla).");
        bodyTextView.setText(sb.toString());
    }

    private void hideOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception ignored) {
                // Already detached
            }
        }
        overlayView = null;
        bodyTextView = null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Escudo de Enfoque MicroPlan",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Mantiene activo el escudo anti-distracciones durante tu Pomodoro.");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent returnIntent = new Intent(this, MainActivity.class);
        returnIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            returnIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Escudo de Enfoque activo")
            .setContentText("Te avisaremos si sales durante tu bloque Pomodoro.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build();
    }

    private int dp(int value) {
        return Math.round(
            TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
            )
        );
    }
}
