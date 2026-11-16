<?php
/**
 * Obsługa formularza kontaktowego (PHP 7.2+).
 * Przed wdrożeniem ustaw adresy poniżej. Adres MAIL_FROM powinien należeć do Twojej domeny
 * (w przeciwnym razie wiele serwerów odrzuci wiadomość jako spam).
 */
declare(strict_types=1);

const MAIL_TO   = 'kontakt@example.pl';
const MAIL_FROM = 'formularz@example.pl';
const SITE_NAME = 'Groby Tarnobrzeg';
const THANKS_URL = 'dziekujemy.html';
const MIN_SECONDS_BETWEEN_SUBMISSIONS = 30;

const SERVICES = [
    'Sprzątanie grobu',
    'Mycie nagrobka',
    'Znicze i kwiaty',
    'Opieka cykliczna',
    'Przygotowanie na Wszystkich Świętych',
    'Inne / nie jestem pewien',
];

function wants_json(): bool
{
    return isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
}

function respond(bool $ok, string $message, int $status = 200): void
{
    if (wants_json()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($ok) {
        header('Location: ' . THANKS_URL, true, 303);
        exit;
    }
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Błąd formularza</title></head>'
        . '<body><h1>Nie udało się wysłać</h1><p>' . $safe . '</p><p><a href="index.html#kontakt">Wróć do formularza</a></p></body></html>';
    exit;
}

function clean_line(string $value): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $value) ?? '');
}

function field(string $key, int $max): string
{
    $value = isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : '';
    return mb_substr(trim($value), 0, $max, 'UTF-8');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Nieprawidłowe żądanie.', 405);
}

// Pole-pułapka dla botów: człowiek go nie widzi i nie wypełnia.
if (field('website', 100) !== '') {
    respond(true, 'Dziękuję! Wiadomość została wysłana.');
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lockFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'pip_form_' . md5($ip);
if (is_file($lockFile) && (time() - (int) filemtime($lockFile)) < MIN_SECONDS_BETWEEN_SUBMISSIONS) {
    respond(false, 'Wysłano zbyt wiele wiadomości. Spróbuj ponownie za chwilę.', 429);
}

$name    = clean_line(field('name', 100));
$phone   = clean_line(field('phone', 20));
$email   = clean_line(field('email', 120));
$service = clean_line(field('service', 80));
$place   = clean_line(field('cemetery', 150));
$message = field('message', 2000);
$consent = field('consent', 5);

$errors = [];
if (mb_strlen($name, 'UTF-8') < 2) {
    $errors[] = 'Podaj imię i nazwisko.';
}
if (!preg_match('/^[0-9 +()\-]{7,20}$/', $phone)) {
    $errors[] = 'Podaj poprawny numer telefonu.';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Podaj poprawny adres e-mail.';
}
if (!in_array($service, SERVICES, true)) {
    $errors[] = 'Wybierz rodzaj usługi.';
}
if (mb_strlen($message, 'UTF-8') < 10) {
    $errors[] = 'Wiadomość jest zbyt krótka.';
}
if ($consent !== '1') {
    $errors[] = 'Potwierdź zapoznanie się z Polityką prywatności i Regulaminem.';
}
if ($errors) {
    respond(false, implode(' ', $errors), 422);
}

function mime_header(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

$subject = mime_header('[' . SITE_NAME . '] Nowe zapytanie: ' . $service);
$body = "Nowe zapytanie ze strony www\r\n"
    . "----------------------------------------\r\n"
    . "Imię i nazwisko: $name\r\n"
    . "Telefon: $phone\r\n"
    . 'E-mail: ' . ($email !== '' ? $email : '(nie podano)') . "\r\n"
    . "Usługa: $service\r\n"
    . 'Lokalizacja grobu: ' . ($place !== '' ? $place : '(nie podano)') . "\r\n"
    . "----------------------------------------\r\n"
    . str_replace(["\r\n", "\r"], "\n", $message) . "\r\n"
    . "----------------------------------------\r\n"
    . 'Wysłano: ' . date('Y-m-d H:i:s') . "\r\n";

$headers = [
    'From: ' . mime_header(SITE_NAME) . ' <' . MAIL_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

if (!mail(MAIL_TO, $subject, $body, implode("\r\n", $headers))) {
    respond(false, 'Nie udało się wysłać wiadomości. Zadzwoń lub napisz bezpośrednio na adres ' . MAIL_TO . '.', 500);
}

@touch($lockFile);
respond(true, 'Dziękuję! Wiadomość została wysłana. Odezwę się najszybciej, jak to możliwe.');
