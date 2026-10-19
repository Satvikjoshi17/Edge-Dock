param(
    [string]$action,
    [string]$edgeHwnd = "0"
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowManager {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern IntPtr GetTopWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

    [DllImport("user32.dll")]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, out RECT pvParam, uint fWinIni);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("dwmapi.dll")]
    public static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    public const uint GW_HWNDNEXT = 2;
    public const uint SPI_GETWORKAREA = 0x0030;
    public const int DWMWA_CLOAKED = 14;

    public const int KEYEVENTF_KEYUP = 0x0002;
    public const byte VK_LWIN = 0x5B;
    public const byte VK_D = 0x44;

    public static IntPtr FindTargetWindow(long excludeHwndVal) {
        IntPtr hwnd = GetTopWindow(IntPtr.Zero);
        while (hwnd != IntPtr.Zero) {
            if ((long)hwnd != excludeHwndVal && IsWindowVisible(hwnd)) {
                int cloaked = 0;
                try {
                    DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, out cloaked, sizeof(int));
                } catch {}

                if (cloaked == 0) {
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hwnd, sb, 256);
                    string title = sb.ToString().Trim();
                    if (!string.IsNullOrEmpty(title) &&
                        title != "Program Manager" &&
                        title != "Windows Input Experience" &&
                        title != "Settings" &&
                        !title.Contains("EdgeDock")) {
                        return hwnd;
                    }
                }
            }
            hwnd = GetWindow(hwnd, GW_HWNDNEXT);
        }
        return IntPtr.Zero;
    }

    public static void FocusAndSnap(IntPtr targetHwnd, string action) {
        if (action == "desktop") {
            keybd_event(VK_LWIN, 0, 0, 0);
            keybd_event(VK_D, 0, 0, 0);
            keybd_event(VK_D, 0, KEYEVENTF_KEYUP, 0);
            keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
            return;
        }

        if (targetHwnd == IntPtr.Zero) return;

        // Ensure target window is focused
        try {
            uint dummyPid;
            uint targetThread = GetWindowThreadProcessId(targetHwnd, out dummyPid);
            uint currentThread = GetCurrentThreadId();
            AttachThreadInput(currentThread, targetThread, true);
            SetForegroundWindow(targetHwnd);
            AttachThreadInput(currentThread, targetThread, false);
        } catch {}

        RECT workArea;
        SystemParametersInfo(SPI_GETWORKAREA, 0, out workArea, 0);
        int fullWidth = workArea.Right - workArea.Left;
        int fullHeight = workArea.Bottom - workArea.Top;
        int halfWidth = fullWidth / 2;

        switch (action) {
            case "left":
                ShowWindow(targetHwnd, 9); // SW_RESTORE
                MoveWindow(targetHwnd, workArea.Left, workArea.Top, halfWidth, fullHeight, true);
                break;
            case "right":
                ShowWindow(targetHwnd, 9); // SW_RESTORE
                MoveWindow(targetHwnd, workArea.Left + halfWidth, workArea.Top, halfWidth, fullHeight, true);
                break;
            case "maximize":
                ShowWindow(targetHwnd, 3); // SW_MAXIMIZE
                break;
            case "minimize":
                ShowWindow(targetHwnd, 6); // SW_MINIMIZE
                break;
            case "restore":
                ShowWindow(targetHwnd, 9); // SW_RESTORE
                break;
        }
    }
}
"@

$exclude = 0
try {
    $exclude = [System.Convert]::ToInt64($edgeHwnd)
} catch {
    $exclude = 0
}

$target = [WindowManager]::FindTargetWindow($exclude)
[WindowManager]::FocusAndSnap($target, $action)
Write-Output "SUCCESS"
