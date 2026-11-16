# Groby Tarnobrzeg – strona wizytówka (sprzątanie grobów)

Statyczna strona HTML/CSS/JS bez bibliotek i bez budowania. Formularz kontaktowy obsługuje `contact.php` (hosting z PHP 7.2+ i funkcją `mail()`).

## Co zmienić przed wdrożeniem

Użyj wyszukiwania w całym projekcie (Ctrl+Shift+F) i podmień:

| Wyszukaj | Zamień na |
|---|---|
| `https://grobytarnobrzeg.pl` / `grobytarnobrzeg.pl` | adres Twojej domeny (HTML, `sitemap.xml`, `robots.txt`, JSON-LD w `index.html`) |
| `+48 600 000 000`, `+48600000000`, `600 000 000` | Twój numer telefonu |
| `kontakt@example.pl` | Twój adres e-mail (także w `contact.php`) |
| `formularz@example.pl` | adres nadawcy w Twojej domenie (`contact.php`, stała `MAIL_FROM`) |
| `Imię Nazwisko`, `ul. Przykładowa 1`, `39-400 Tarnobrzeg` | Twoje dane i adres do korespondencji (działalność nierejestrowana – bez NIP, REGON i CEIDG) |
| `Groby Tarnobrzeg` | nazwa Twojej marki (działalność nierejestrowana) |
| żółte pola `.placeholder` w stronach prawnych | nazwy dostawcy hostingu i biura księgowego |

Dodatkowo:

- Ceny w sekcji „Cennik” oraz godziny pracy i lista miejscowości w `index.html` są przykładowe.
- Teksty prawne (regulamin, polityki) to rzetelny wzór, ale po uzupełnieniu danych warto, aby sprawdził je prawnik.
- W `index.html` JSON-LD (`LocalBusiness`, `FAQPage`) musi odpowiadać treści widocznej na stronie.
- Zmieniając `css/style.css` lub `js/site.js`, podbij numer w `?v=1`, aby ominąć cache przeglądarek.

## Zdjęcia

Zdjęcia są podlinkowane z Unsplash (licencja Unsplash, bez obowiązku podania autora). Dla najlepszej szybkości i prywatności warto je pobrać, zapisać w `img/` (WebP/AVIF), zmienić adresy w `index.html`, usunąć `https://images.unsplash.com` z `Content-Security-Policy` w `.htaccess` oraz usunąć pkt 5 z polityki prywatności i pkt 4 z polityki cookies.

## Statystyka (opcjonalnie)

Domyślnie strona nie używa żadnych narzędzi analitycznych, więc baner cookies zapisuje tylko wybór użytkownika. Aby włączyć GA4, wpisz identyfikator w `GA_ID` w `js/site.js`, rozszerz CSP w `.htaccess` i uzupełnij politykę prywatności oraz cookies. Skrypt ładuje się dopiero po zgodzie.

## Wdrożenie

1. Wgraj wszystkie pliki (łącznie z `.htaccess`) do katalogu głównego domeny.
2. Włącz certyfikat SSL. Po sprawdzeniu, że HTTPS działa, odkomentuj nagłówek HSTS w `.htaccess`.
3. Wyślij testowy formularz. Jeśli maile nie dochodzą, ustaw `MAIL_FROM` na skrzynkę w swojej domenie.
4. Zgłoś `sitemap.xml` w Google Search Console i dodaj wizytówkę w Profilu Firmy w Google.
