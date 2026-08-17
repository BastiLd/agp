using System;
using System.IO;
using System.Windows;
using System.Windows.Threading;

namespace EverythingSelf.App;

public partial class App : Application
{
    /// <summary>Ablageort des Fehlerprotokolls.</summary>
    public static string LogPath { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "EverythingSelf",
        "fehler.log");

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Ein unerwarteter Fehler soll das Programm nicht wortlos beenden.
        DispatcherUnhandledException += OnUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
            WriteLog(args.ExceptionObject as Exception);
    }

    private void OnUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        WriteLog(e.Exception);

        MessageBox.Show(
            "Es ist ein unerwarteter Fehler aufgetreten:\n\n" + e.Exception.Message +
            "\n\nEinzelheiten stehen in:\n" + LogPath,
            "Everything Self",
            MessageBoxButton.OK,
            MessageBoxImage.Error);

        e.Handled = true;
    }

    /// <summary>Schreibt einen Fehler ans Ende des Protokolls. Schlägt das fehl, wird es ignoriert.</summary>
    public static void WriteLog(Exception? exception)
    {
        if (exception is null)
        {
            return;
        }

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(LogPath)!);
            File.AppendAllText(LogPath,
                $"--- {DateTime.Now:yyyy-MM-dd HH:mm:ss} ---{Environment.NewLine}{exception}{Environment.NewLine}{Environment.NewLine}");
        }
        catch
        {
            // Protokollieren darf niemals selbst zum Problem werden.
        }
    }
}
