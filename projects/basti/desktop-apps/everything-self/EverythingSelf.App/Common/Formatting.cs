using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace EverythingSelf.App.Common;

/// <summary>Gemeinsame Formatierungen für Größen und Datumsangaben.</summary>
public static class Formatting
{
    private static readonly string[] Units = { "B", "KB", "MB", "GB", "TB", "PB" };

    /// <summary>Formatiert eine Byte-Angabe kompakt, z. B. "1,18 GB".</summary>
    public static string Size(long? bytes)
    {
        if (bytes is null or < 0)
        {
            return string.Empty;
        }

        double value = bytes.Value;
        var unit = 0;

        while (value >= 1024 && unit < Units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        return unit == 0
            ? $"{bytes.Value} B"
            : value.ToString(value >= 100 ? "0" : "0.0", CultureInfo.CurrentCulture) + " " + Units[unit];
    }

    public static string Date(DateTime? value)
        => value?.ToString("dd.MM.yyyy HH:mm", CultureInfo.CurrentCulture) ?? string.Empty;

    /// <summary>Nur das Datum - Installationsdaten haben keine sinnvolle Uhrzeit.</summary>
    public static string DateOnly(DateTime? value)
        => value?.ToString("dd.MM.yyyy", CultureInfo.CurrentCulture) ?? string.Empty;
}

/// <summary>Wandelt Byte-Angaben für die Anzeige um.</summary>
public sealed class SizeConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value switch
        {
            long bytes => Formatting.Size(bytes),
            null => string.Empty,
            _ => value.ToString() ?? string.Empty,
        };

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Wandelt Datumsangaben für die Anzeige um.</summary>
public sealed class DateConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is DateTime date ? Formatting.Date(date) : string.Empty;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Wandelt Datumsangaben ohne Uhrzeit für die Anzeige um.</summary>
public sealed class DateOnlyConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is DateTime date ? Formatting.DateOnly(date) : string.Empty;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Blendet ein Element aus, wenn der gebundene Wert <c>false</c> ist.</summary>
public sealed class BoolToVisibilityConverter : IValueConverter
{
    /// <summary>Bei <c>true</c> wird die Logik umgedreht.</summary>
    public bool Invert { get; set; }

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var flag = value is true;
        if (Invert)
        {
            flag = !flag;
        }

        return flag ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Blendet ein Element aus, wenn der gebundene Text leer ist.</summary>
public sealed class EmptyStringToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => string.IsNullOrWhiteSpace(value as string) ? Visibility.Collapsed : Visibility.Visible;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
