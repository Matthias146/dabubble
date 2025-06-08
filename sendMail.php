<?php
// Setze den Content-Type-Header auf JSON
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email']; // E-Mail-Adresse des Benutzers
    $userId = $_POST['userId']; // Benutzer-ID oder generierter Token

    // Setze den richtigen Server-Link für das Passwort-Reset
    $resetLink = "https://dabubble-364.developerakademie.net/reset?userId=" . urlencode($userId);

    $subject = "Passwort zurücksetzen";
    $message = "Hallo,\n\nKlicke auf den folgenden Link, um dein Passwort zurückzusetzen:\n\n" . $resetLink;

    // Setze die E-Mail-Header
    $headers = "From: noreply@deineapp.com\r\n" .
               "Reply-To: noreply@deineapp.com\r\n" .
               "X-Mailer: PHP/" . phpversion();

    // Sende die E-Mail und gebe ein JSON zurück
    if (mail($email, $subject, $message, $headers)) {
        // Erfolg: Gebe eine JSON-Antwort zurück
        echo json_encode(['status' => 'success', 'message' => 'Die E-Mail wurde erfolgreich gesendet.']);
    } else {
        // Fehler: Gebe eine Fehlerantwort als JSON zurück
        echo json_encode(['status' => 'error', 'message' => 'Fehler beim Senden der E-Mail.']);
    }
}
?>



