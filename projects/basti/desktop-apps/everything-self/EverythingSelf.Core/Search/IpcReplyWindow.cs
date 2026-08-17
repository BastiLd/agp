using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Threading;
using EverythingSelf.Core.Interop;

namespace EverythingSelf.Core.Search;

/// <summary>
/// Unsichtbares "message-only" Fenster auf einem eigenen Thread mit eigener
/// Nachrichtenschleife. Everything schickt seine Suchergebnisse per WM_COPYDATA
/// genau an dieses Fenster zurück.
/// </summary>
internal sealed class IpcReplyWindow : IDisposable
{
    private readonly string _className = "EverythingSelf_Reply_" + Guid.NewGuid().ToString("N");
    private readonly ManualResetEventSlim _ready = new(false);
    private readonly Thread _thread;

    // Muss als Feld gehalten werden, sonst sammelt der GC das Delegate ein,
    // während Windows noch den Funktionszeiger benutzt.
    private NativeMethods.WndProc? _wndProc;

    private IntPtr _hwnd;
    private IntPtr _moduleHandle;
    private Exception? _startupError;
    private volatile bool _disposed;

    /// <summary>Wird auf dem Pump-Thread ausgelöst: (dwData, Rohdaten).</summary>
    internal event Action<IntPtr, byte[]>? CopyDataReceived;

    internal IpcReplyWindow()
    {
        _thread = new Thread(PumpThread)
        {
            IsBackground = true,
            Name = "EverythingSelf IPC Reply",
        };
        _thread.SetApartmentState(ApartmentState.STA);
        _thread.Start();

        _ready.Wait();
        if (_startupError is not null)
        {
            throw new InvalidOperationException(
                "Das interne Antwortfenster für die Everything-Kommunikation konnte nicht erstellt werden.",
                _startupError);
        }
    }

    internal IntPtr Handle => _hwnd;

    private void PumpThread()
    {
        try
        {
            _moduleHandle = NativeMethods.GetModuleHandleW(null);
            _wndProc = WindowProcedure;

            var wc = new NativeMethods.WNDCLASSEX
            {
                cbSize = (uint)Marshal.SizeOf<NativeMethods.WNDCLASSEX>(),
                lpfnWndProc = _wndProc,
                hInstance = _moduleHandle,
                lpszClassName = _className,
            };

            if (NativeMethods.RegisterClassExW(ref wc) == 0)
            {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }

            _hwnd = NativeMethods.CreateWindowExW(
                0, _className, null, 0, 0, 0, 0, 0,
                NativeMethods.HWND_MESSAGE, IntPtr.Zero, _moduleHandle, IntPtr.Zero);

            if (_hwnd == IntPtr.Zero)
            {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }
        }
        catch (Exception ex)
        {
            _startupError = ex;
            _ready.Set();
            return;
        }

        _ready.Set();

        while (NativeMethods.GetMessageW(out var msg, IntPtr.Zero, 0, 0) > 0)
        {
            NativeMethods.TranslateMessage(ref msg);
            NativeMethods.DispatchMessageW(ref msg);
        }

        if (_hwnd != IntPtr.Zero)
        {
            NativeMethods.DestroyWindow(_hwnd);
            _hwnd = IntPtr.Zero;
        }

        NativeMethods.UnregisterClassW(_className, _moduleHandle);
    }

    private IntPtr WindowProcedure(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam)
    {
        switch (msg)
        {
            case NativeMethods.WM_COPYDATA:
            {
                var cds = Marshal.PtrToStructure<NativeMethods.COPYDATASTRUCT>(lParam);
                var payload = Array.Empty<byte>();
                if (cds.cbData > 0 && cds.lpData != IntPtr.Zero)
                {
                    payload = new byte[cds.cbData];
                    Marshal.Copy(cds.lpData, payload, 0, cds.cbData);
                }

                try
                {
                    CopyDataReceived?.Invoke(cds.dwData, payload);
                }
                catch
                {
                    // Ein Fehler beim Verarbeiten darf die Nachrichtenschleife nie beenden.
                }

                return new IntPtr(1);
            }

            case NativeMethods.WM_CLOSE:
                NativeMethods.PostQuitMessage(0);
                return IntPtr.Zero;
        }

        return NativeMethods.DefWindowProcW(hWnd, msg, wParam, lParam);
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        if (_hwnd != IntPtr.Zero)
        {
            NativeMethods.PostMessageW(_hwnd, NativeMethods.WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        }

        _thread.Join(TimeSpan.FromSeconds(2));
        _ready.Dispose();
    }
}
