package mx.buap.microplan;

import android.Manifest;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MicroPlanShield")
public class MicroPlanShieldPlugin extends Plugin {

    private static final int REQ_NOTIF_PERMISSION = 4105;

    @PluginMethod
    public void getPermissionStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("usageAccess", hasUsageStatsPermission());
        ret.put("overlay", hasOverlayPermission());
        ret.put("notifications", hasNotificationPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestUsageAccess(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent(
                Settings.ACTION_USAGE_ACCESS_SETTINGS,
                Uri.parse("package:" + ctx.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(fallback);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(fallback);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getActivity() != null) {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQ_NOTIF_PERMISSION
            );
        }
        call.resolve();
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        if (!hasUsageStatsPermission() || !hasOverlayPermission()) {
            JSObject res = new JSObject();
            res.put("active", false);
            res.put("missingPermissions", true);
            call.resolve(res);
            return;
        }

        long endsAtMs = call.getData().optLong("endsAtMs", 0L);
        String taskTitle = call.getString("taskTitle", "");

        Context ctx = getContext();
        Intent serviceIntent = new Intent(ctx, ShieldMonitorService.class);
        serviceIntent.putExtra(ShieldMonitorService.EXTRA_ENDS_AT_MS, endsAtMs);
        serviceIntent.putExtra(ShieldMonitorService.EXTRA_TASK_TITLE, taskTitle);

        ContextCompat.startForegroundService(ctx, serviceIntent);

        JSObject res = new JSObject();
        res.put("active", true);
        call.resolve(res);
    }

    @PluginMethod
    public void stopShield(PluginCall call) {
        Context ctx = getContext();
        ctx.stopService(new Intent(ctx, ShieldMonitorService.class));
        JSObject res = new JSObject();
        res.put("active", false);
        call.resolve(res);
    }

    private boolean hasUsageStatsPermission() {
        Context ctx = getContext();
        AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) {
            return false;
        }
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                ctx.getPackageName()
            );
        } else {
            mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                ctx.getPackageName()
            );
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private boolean hasOverlayPermission() {
        return Settings.canDrawOverlays(getContext());
    }

    private boolean hasNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED;
    }
}
