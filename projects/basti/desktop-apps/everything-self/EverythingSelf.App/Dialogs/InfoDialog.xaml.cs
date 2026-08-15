using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace EverythingSelf.App.Dialogs;

/// <summary>
/// Der Dialog hinter dem Info-Symbol. Zeigt in klar getrennten Abschnitten,
/// was eine Sache ist, was eine Aktion bewirkt und wie man sie rückgängig macht.
///
/// Alle Textkörper sind über schreibgeschützte TextBoxen realisiert, nicht über
/// TextBlock: Nur so lässt sich der Text markieren und kopieren - etwa um eine
/// Fehlermeldung oder ein Befehlsprotokoll weiterzugeben.
/// </summary>
public partial class InfoDialog : Window
{
    private readonly List<Section> _sections = new();

    private InfoDialog()
    {
        InitializeComponent();
    }

    /// <summary>Ein Abschnitt des Dialogs.</summary>
    public sealed class Section
    {
        public Section(string heading, string body, bool isMonospaced = false, bool isWarning = false)
        {
            Heading = heading;
            Body = body;
            IsMonospaced = isMonospaced;
            IsWarning = isWarning;
        }

        public string Heading { get; }

        public string Body { get; }

        /// <summary>Befehle und Pfade werden in fester Schriftbreite dargestellt.</summary>
        public bool IsMonospaced { get; }

        public bool IsWarning { get; }
    }

    /// <summary>Zeigt den Dialog modal an.</summary>
    public static void Show(Window? owner, string title, IEnumerable<Section> sections)
    {
        var dialog = new InfoDialog
        {
            Owner = owner,
            Title = title,
            HeadingBlock = { Text = title },
        };

        foreach (var section in sections)
        {
            dialog.AddSection(section);
        }

        dialog.ShowDialog();
    }

    /// <summary>Kurzform für eine einzelne Erklärung.</summary>
    public static void Show(Window? owner, string title, string body)
        => Show(owner, title, new[] { new Section(string.Empty, body) });

    private void AddSection(Section section)
    {
        _sections.Add(section);

        if (!string.IsNullOrWhiteSpace(section.Heading))
        {
            SectionHost.Children.Add(new TextBlock
            {
                Text = section.Heading,
                Margin = new Thickness(0, SectionHost.Children.Count == 0 ? 0 : 18, 0, 6),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Foreground = (Brush)FindResource(section.IsWarning ? "WarningBrush" : "AccentBrush"),
            });
        }

        var body = CreateSelectableText(section.Body);

        if (section.IsMonospaced)
        {
            body.FontFamily = new FontFamily("Consolas, Courier New");
            body.FontSize = 12.5;

            var frame = new Border
            {
                Background = (Brush)FindResource("SurfaceRaised"),
                BorderBrush = (Brush)FindResource("BorderBrushSubtle"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(5),
                Padding = new Thickness(12, 10, 12, 10),
                Child = body,
            };

            SectionHost.Children.Add(frame);
            return;
        }

        SectionHost.Children.Add(body);
    }

    /// <summary>
    /// Schreibgeschützte TextBox, optisch wie ein TextBlock, aber mit Markieren/Kopieren.
    /// </summary>
    private TextBox CreateSelectableText(string text)
    {
        return new TextBox
        {
            Text = text,
            TextWrapping = TextWrapping.Wrap,
            IsReadOnly = true,
            IsReadOnlyCaretVisible = true,
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            Foreground = (Brush)FindResource("TextPrimary"),
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 13,
            Padding = new Thickness(0),
            Margin = new Thickness(0),
            Cursor = System.Windows.Input.Cursors.IBeam,
            VerticalScrollBarVisibility = ScrollBarVisibility.Disabled,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            AcceptsReturn = true,
            SelectionBrush = (Brush)FindResource("AccentBrush"),
        };
    }

    private void OnCopyAllClick(object sender, RoutedEventArgs e)
    {
        var builder = new StringBuilder();
        builder.AppendLine(Title);
        builder.AppendLine();

        foreach (var section in _sections)
        {
            if (!string.IsNullOrWhiteSpace(section.Heading))
            {
                builder.AppendLine(section.Heading);
            }

            builder.AppendLine(section.Body);
            builder.AppendLine();
        }

        try
        {
            Clipboard.SetText(builder.ToString().TrimEnd());
        }
        catch (Exception)
        {
            // Zwischenablage kann von anderen Programmen kurzzeitig blockiert sein - kein Absturz wert.
        }
    }

    private void OnCloseClick(object sender, RoutedEventArgs e) => Close();
}
