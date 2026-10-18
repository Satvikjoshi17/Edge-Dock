param([string]$action)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class KeyboardUtil {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    public const int KEYEVENTF_KEYUP = 0x0002;
    public const byte VK_LWIN = 0x5B;
    public const byte VK_LEFT = 0x25;
    public const byte VK_UP = 0x26;
    public const byte VK_RIGHT = 0x27;
    public const byte VK_DOWN = 0x28;
    public const byte VK_D = 0x44;
    
    public static void SnapLeft() {
        keybd_event(VK_LWIN, 0, 0, 0);
        keybd_event(VK_LEFT, 0, 0, 0);
        keybd_event(VK_LEFT, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
    }
    
    public static void SnapRight() {
        keybd_event(VK_LWIN, 0, 0, 0);
        keybd_event(VK_RIGHT, 0, 0, 0);
        keybd_event(VK_RIGHT, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
    }
    
    public static void Maximize() {
        keybd_event(VK_LWIN, 0, 0, 0);
        keybd_event(VK_UP, 0, 0, 0);
        keybd_event(VK_UP, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
    }
    
    public static void Minimize() {
        keybd_event(VK_LWIN, 0, 0, 0);
        keybd_event(VK_DOWN, 0, 0, 0);
        keybd_event(VK_DOWN, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
    }
    
    public static void ToggleDesktop() {
        keybd_event(VK_LWIN, 0, 0, 0);
        keybd_event(VK_D, 0, 0, 0);
        keybd_event(VK_D, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
    }
}
"@

switch ($action) {
    "left" { [KeyboardUtil]::SnapLeft() }
    "right" { [KeyboardUtil]::SnapRight() }
    "maximize" { [KeyboardUtil]::Maximize() }
    "minimize" { [KeyboardUtil]::Minimize() }
    "desktop" { [KeyboardUtil]::ToggleDesktop() }
}
Write-Output "SUCCESS"
