using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using EverythingSelf.App.Dialogs;
using EverythingSelf.App.ViewModels;
using EverythingSelf.Core.Edge;

namespace EverythingSelf.App.Views;

public partial class EdgeView : UserControl
{
    public EdgeView()
    {
        InitializeComponent();
    }

    private EdgeViewModel? ViewModel => DataContext as EdgeViewModel;

    private void OnFaviconInfoClick(object sender, RoutedEventArgs e)
    {
        InfoDialog.Show(Window.GetWindow(this), "Favicon-Downloads im Hintergrund", new[]
        {
            new InfoDialog.Section(string.Empty, EdgeRemovalService.FaviconExplanation),

            new InfoDialog.Section(
                "Was hilft wirklich?",
                "Am wirksamsten ist es, die Windows-Widgets und die Nachrichtenleiste abzuschalten " +
                "(Rechtsklick auf die Taskleiste > Taskleisteneinstellungen) und in Edge unter " +
                "edge://settings/downloads die Option zum Speichern des Verlaufs zu prüfen. " +
                "Das Deinstallieren von Edge alleine beendet die Hintergrundzugriffe nicht, " +
                "solange WebView2 von Windows-Komponenten benutzt wird."),
        });
    }

    private void OnComponentInfoClick(object sender, RoutedEventArgs e)
    {
        if ((sender as FrameworkElement)?.Tag is not EdgeComponentViewModel component)
        {
            return;
        }

        var sections = new List<InfoDialog.Section>
        {
            new("Was ist das?", component.Component.WhatItIs),
            new("Aktueller Zustand", component.StatusText),
        };

        if (!string.IsNullOrWhiteSpace(component.Component.ActionExplanation))
        {
            sections.Add(new InfoDialog.Section(
                component.HasAction ? "Was macht die Schaltfläche?" : "Hinweis",
                component.Component.ActionExplanation,
                isWarning: component.IsDestructive));
        }

        if (component.HasAction)
        {
            sections.Add(new InfoDialog.Section(
                "Diese Befehle werden ausgeführt",
                component.CommandPreview,
                isMonospaced: true));
        }

        if (!string.IsNullOrWhiteSpace(component.Component.HowToUndo))
        {
            sections.Add(new InfoDialog.Section("Rückgängig machen", component.Component.HowToUndo));
        }

        InfoDialog.Show(Window.GetWindow(this), component.Title, sections);
    }

    private async void OnActionClick(object sender, RoutedEventArgs e)
    {
        if ((sender as FrameworkElement)?.Tag is not EdgeComponentViewModel component ||
            ViewModel is not { } viewModel)
        {
            return;
        }

        var question =
            $"{component.ActionTitle}\n\n" +
            "Folgende Befehle werden mit Administratorrechten ausgeführt:\n\n" +
            component.CommandPreview +
            "\n\nWindows fragt gleich nach der Berechtigung. Fortfahren?";

        var answer = MessageBox.Show(
            question,
            component.Title,
            MessageBoxButton.OKCancel,
            component.IsDestructive ? MessageBoxImage.Warning : MessageBoxImage.Question,
            MessageBoxResult.Cancel);

        if (answer != MessageBoxResult.OK)
        {
            return;
        }

        var result = await viewModel.ExecuteAsync(component);

        InfoDialog.Show(Window.GetWindow(this), component.ActionTitle, new[]
        {
            new InfoDialog.Section(result.Success ? "Ergebnis" : "Ergebnis (mit Problemen)", result.Message,
                isWarning: !result.Success),
            new InfoDialog.Section("Protokoll", string.Join("\n", result.Steps), isMonospaced: true),
        });
    }
}
