const { v4: uuidv4 } = require('uuid');

const DEFAULT_CATEGORIES = [
  // ═══════════════════════════════════════════════════════════════
  // HANDWERK / BAU (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Maler / Gipser',
    searchTerm: 'Maler',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden, die online einen Maler suchen, entscheiden innert Sekunden – und eure Website macht es ihnen gerade nicht leicht.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade auf der Baustelle voll eingespannt seid, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Elektriker',
    searchTerm: 'Elektriker',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden, die einen Elektriker suchen, entscheiden sich für den Betrieb, der online am professionellsten wirkt – da hat eure Seite noch Luft nach oben.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade voll ausgelastet seid, kein Problem.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Sanitär / Heizung',
    searchTerm: 'Sanitär Heizung',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Hauseigentümer, die einen Sanitär- oder Heizungsbetrieb suchen, vergleichen online – eine veraltete Website kann den Unterschied zwischen Auftrag und keinem Auftrag machen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade im Notfalleinsatz seid, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Schreiner',
    searchTerm: 'Schreinerei',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Schreinerei gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden, die eine Schreinerei suchen, wollen eure Referenzen und Handwerkskunst sehen – eine veraltete Website zeigt das nicht optimal.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade in der Werkstatt voll beschäftigt seid, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Reinigungsfirma',
    searchTerm: 'Reinigungsfirma',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Firma gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden, die online eine Reinigungsfirma suchen, vergleichen in Sekunden – eine professionelle Website schafft das Vertrauen, das zur Anfrage führt.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade voll ausgelastet seid, kein Problem.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Umzugsfirma',
    searchTerm: 'Umzugsfirma',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Firma gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Leute, die einen Umzug planen, vergleichen Firmen online – eine klare, vertrauenswürdige Website macht oft den Unterschied bei der Anfrage.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade mitten in der Umzugssaison seid, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Gartenbau',
    searchTerm: 'Gartenbau Landschaftspflege',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden, die einen Gartenbauer suchen, möchten eure Projekte sehen – Vorher/Nachher, Referenzen. Eure aktuelle Website macht es ihnen schwer, das zu finden.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade in der Hochsaison seid, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DIENSTLEISTUNGEN (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Fahrschule',
    searchTerm: 'Fahrschule',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Fahrschule gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Fahrschüler vergleichen Angebote fast ausschliesslich online – eine moderne Website mit klaren Preisen und einfacher Buchung bringt euch mehr Anmeldungen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gerade bei Fahrschulen macht eine gute Website den Unterschied bei der Anmeldung.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BEAUTY / WELLNESS (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Kosmetikstudio',
    searchTerm: 'Kosmetikstudio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Studio gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kundinnen, die online nach einem Kosmetikstudio suchen, achten besonders auf eine ansprechende Website – eure aktuelle Seite zeigt nicht, was ihr wirklich bietet.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gerade in der Beauty-Branche ist der erste visuelle Eindruck online entscheidend.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann euren Online-Auftritt auffrischen wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Nagelstudio',
    searchTerm: 'Nagelstudio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Studio gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kundinnen wollen online eure Arbeiten sehen und direkt einen Termin buchen – eine moderne Website macht das möglich und bringt euch mehr Buchungen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Eine schöne Online-Galerie eurer Arbeiten kann Wunder wirken.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann euren Online-Auftritt auffrischen wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Coiffeur',
    searchTerm: 'Coiffeur Friseur',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurem Online-Auftritt – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Salon gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Kunden entscheiden anhand der Website, ob sie vorbeikommen oder weiterscrollen – eure aktuelle Seite macht es ihnen nicht leicht.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gerade für Salons ist der visuelle Online-Auftritt das A und O.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann euren Online-Auftritt auffrischen wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Barbershop',
    searchTerm: 'Barbershop',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurem Online-Auftritt – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Barbershop gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Kunden checken euren Online-Auftritt, bevor sie vorbeikommen – eine moderne Website mit Galerie und Online-Buchung bringt euch mehr Walk-ins.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Ein starker Online-Auftritt bringt neue Kunden direkt in den Stuhl.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann euren Online-Auftritt auffrischen wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Tattoo Studio',
    searchTerm: 'Tattoo Studio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Studio gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden wollen eure Arbeiten sehen, bevor sie einen Termin anfragen – eine starke Online-Galerie ist für Tattoo-Studios praktisch Pflicht.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Eure Arbeiten verdienen eine Website, die sie richtig zeigt.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann euren Online-Auftritt auffrischen wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SPORT / FREIZEIT (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Yoga Studio',
    searchTerm: 'Yoga Studio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Studio gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Teilnehmer wollen online euer Angebot sehen und sich direkt anmelden – eine klare Website mit Kursplan macht den Unterschied.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gerade für Studios ist eine einladende Online-Präsenz wichtig für neue Mitglieder.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Tanzschule',
    searchTerm: 'Tanzschule',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Tanzschule gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Schüler wollen online euer Kursangebot sehen und sich unkompliziert anmelden – eine moderne Website macht das möglich.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Ein frischer Online-Auftritt kann für mehr Kursanmeldungen sorgen.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Musikschule',
    searchTerm: 'Musikschule',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Musikschule gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Eltern und Schüler vergleichen Musikschulen online – eine klare Übersicht der Instrumente, Lehrer und Preise bringt euch mehr Anmeldungen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Eine gute Website ist gerade für Musikschulen ein wichtiger Kanal für neue Schüler.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Hundeschule',
    searchTerm: 'Hundeschule',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Hundeschule gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Hundebesitzer suchen online nach Kursangeboten und entscheiden schnell, wo sie sich anmelden – eine klare Website mit Kursübersicht macht den Unterschied.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Hundebesitzer sind sehr online-affin – da lohnt sich ein guter Auftritt.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Fitnessstudio',
    searchTerm: 'Fitnessstudio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Studio gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Mitglieder vergleichen Studios online – Kursplan, Preise und Bilder entscheiden, ob sie ein Probetraining buchen oder nicht.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Mehr Sichtbarkeit online = mehr Probetrainings.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Sportclub',
    searchTerm: 'Sportclub Sportverein',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Verein gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Neue Mitglieder informieren sich online über Trainingszeiten und Angebot – eine moderne Website macht es ihnen leicht, sich anzumelden.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Ein frischer Online-Auftritt kann für mehr Mitglieder sorgen.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GASTRONOMIE / FOOD (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Restaurant',
    searchTerm: 'Restaurant',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Restaurant gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Gäste schauen zuerst die Speisekarte online an, bevor sie reservieren – eine moderne Website mit Karte und Reservierungsmöglichkeit bringt euch mehr Gäste.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gäste googeln euch, bevor sie kommen – der erste Eindruck zählt.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Bäckerei',
    searchTerm: 'Bäckerei Konditorei',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Bäckerei gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden suchen online nach Öffnungszeiten, Sortiment und Bestellmöglichkeiten – eine moderne Website macht es ihnen leicht und bringt euch mehr Laufkundschaft.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Wer eure Spezialitäten online entdeckt, kommt auch vorbei.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Catering',
    searchTerm: 'Catering',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Catering gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Eventplaner und Firmen vergleichen Catering-Anbieter online – Bilder eurer Kreationen und klare Angebote machen den Unterschied bei der Anfrage.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Eure Gerichte verdienen eine Website, die sie ins beste Licht rückt.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GEWERBE / LADEN (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Blumenladen',
    searchTerm: 'Blumenladen',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Laden gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden bestellen Blumen zunehmend online – eine ansprechende Website mit Sortiment und Bestellmöglichkeit bringt euch mehr Aufträge.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Schöne Blumen verdienen eine schöne Website.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Veloladen',
    searchTerm: 'Veloladen Fahrrad',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Laden gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Velofahrer recherchieren online, bevor sie in den Laden kommen – Sortiment, Werkstatt-Services und Öffnungszeiten müssen auf den ersten Blick klar sein.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Gerade in der Velosaison suchen viele online nach Werkstatt und Zubehör.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Autowerkstatt',
    searchTerm: 'Autowerkstatt Garage',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Garage gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Autobesitzer suchen online nach einer vertrauenswürdigen Werkstatt – eine professionelle Website mit klaren Leistungen und Bewertungen macht den Unterschied.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade voll unter den Autos steckt, absolut verständlich.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Druckerei',
    searchTerm: 'Druckerei',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf eure Druckerei gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Firmen und Vereine, die Drucksachen brauchen, vergleichen Anbieter online – ein klarer Überblick über Leistungen und Referenzen bringt euch mehr Anfragen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Eine gute Website ist für Druckereien quasi eine digitale Visitenkarte.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Schlüsseldienst',
    searchTerm: 'Schlüsseldienst',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Leute in einer Notsituation suchen den schnellsten, vertrauenswürdigsten Schlüsseldienst online – eure Website entscheidet, ob sie bei euch anrufen.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Falls ihr gerade voll im Einsatz seid, kein Problem.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // KREATIV / EVENTS (Casual)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Fotografen',
    searchTerm: 'Fotograf',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf dein Portfolio gestossen und habe mir deine Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Kunden buchen den Fotografen, dessen Portfolio sie online am meisten überzeugt – eine moderne Website ist dein wichtigstes Verkaufstool.

Damit du siehst, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Deine Bilder verdienen eine Website, die sie perfekt in Szene setzt.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls du irgendwann deine Website modernisieren willst, kannst du hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Hochzeitsplaner',
    searchTerm: 'Hochzeitsplaner',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Angebot gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Brautpaare recherchieren monatelang online – eine emotionale, professionelle Website mit Referenzen und Bildern ist entscheidend für die Buchung.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

kurzes Follow-up — wollte sichergehen, dass meine letzte Nachricht nicht untergegangen ist. Brautpaare entscheiden emotional – der erste Online-Eindruck zählt enorm.

Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema. Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen Call buchen:
👉 [CALENDLY-LINK]

Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GESUNDHEIT / MEDIZIN (Formal)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Zahnarzt',
    searchTerm: 'Zahnarztpraxis',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Patientinnen und Patienten, die online nach einem Zahnarzt suchen, vergleichen Praxen anhand der Website – eine veraltete Seite kann Vertrauen kosten.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Tierarzt',
    searchTerm: 'Tierarztpraxis',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Tierhalter, die online nach einer Tierarztpraxis suchen, möchten sofort sehen, dass ihr Tier bei Ihnen in guten Händen ist – eine veraltete Website vermittelt das nicht.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer arbeitsintensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Optiker',
    searchTerm: 'Optiker',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Geschäft aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Kundinnen und Kunden erwarten bei einem Optiker eine professionelle und moderne Präsentation – Design und Ästhetik spielen in Ihrer Branche eine zentrale Rolle.

Um zu zeigen, wie eine moderne Optiker-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Podologe',
    searchTerm: 'Podologie Fusspflege',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Patientinnen und Patienten, die online nach Podologie suchen, möchten sofort Vertrauen fassen – eine veraltete Website erschwert das.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade viele Termine haben, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Physiotherapie',
    searchTerm: 'Physiotherapie',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Patientinnen und Patienten vergleichen Physiotherapie-Praxen online – eine veraltete Seite kann dazu führen, dass sie sich für eine andere Praxis entscheiden.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Ergotherapie',
    searchTerm: 'Ergotherapie',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Patientinnen und Patienten – oder deren Angehörige – suchen online nach Ergotherapie und entscheiden oft anhand des ersten Eindrucks, ob sie Kontakt aufnehmen.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer arbeitsintensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Logopädie',
    searchTerm: 'Logopädie',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Eltern und zuweisende Fachpersonen suchen online nach Logopädie – eine veraltete Website kann dazu führen, dass Anfragen ausbleiben.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Akupunktur / TCM',
    searchTerm: 'Akupunktur TCM',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Patientinnen und Patienten, die nach Akupunktur oder TCM suchen, wünschen sich eine Seite, die Kompetenz und Vertrauen ausstrahlt – eine veraltete Website kann hier hinderlich sein.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer arbeitsintensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Hebamme',
    searchTerm: 'Hebamme Geburtsvorbereitung',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Angebot aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Werdende Eltern suchen online nach einer Hebamme und entscheiden oft innert Sekunden, ob sie Kontakt aufnehmen – eine professionelle Website schafft das nötige Vertrauen.

Um zu zeigen, wie eine moderne Hebammen-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Ich verstehe, dass Ihr Alltag wenig Raum für solche Themen lässt – stehe gerne später zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Hypnose / Coaching',
    searchTerm: 'Hypnose Coaching',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Angebot aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Klientinnen und Klienten, die nach Hypnose oder Coaching suchen, brauchen eine Website, die Seriosität und Vertrauen vermittelt – der erste Eindruck ist entscheidend.

Um zu zeigen, wie eine moderne Coaching-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // RECHT / FINANZEN / INSTITUTIONELL (Formal)
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(),
    name: 'Rechtsanwalt',
    searchTerm: 'Rechtsanwalt Anwalt',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Kanzlei aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Mandanten, die online nach einem Rechtsanwalt suchen, bewerten Kompetenz oft anhand der Website – ein professioneller Auftritt schafft Vertrauen vor dem ersten Gespräch.

Um zu zeigen, wie eine moderne Kanzlei-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Kanzlei',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Treuhand',
    searchTerm: 'Treuhand Buchhaltung',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Treuhandbüro aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Unternehmer, die online nach einem Treuhänder suchen, bewerten Seriosität oft anhand der Website – ein moderner Auftritt signalisiert Kompetenz.

Um zu zeigen, wie eine moderne Treuhand-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in der Abschlussphase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Architekturbüro',
    searchTerm: 'Architekturbüro',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Büro aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Bauherren und Auftraggeber möchten Ihre Projekte und Referenzen online sehen – eine moderne Website ist für ein Architekturbüro quasi eine digitale Visitenkarte.

Um zu zeigen, wie eine moderne Architektur-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer Projektphase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Immobilienverwaltung',
    searchTerm: 'Immobilienverwaltung',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Verwaltung aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Eigentümer und Mieter informieren sich online – eine professionelle Website stärkt das Vertrauen und erleichtert die Kommunikation.

Um zu zeigen, wie eine moderne Website für Immobilienverwaltungen aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade in einer intensiven Phase sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Bestattungsinstitut',
    searchTerm: 'Bestattungsinstitut',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihr Institut aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Angehörige in einer schwierigen Situation suchen online nach einem vertrauenswürdigen Bestattungsinstitut – eine würdevolle, klare Website gibt Halt und Orientierung.

Um zu zeigen, wie eine moderne Website für Ihr Institut aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Ihre Website',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade stark eingebunden sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Kita',
    searchTerm: 'Kita Kindertagesstätte',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Einrichtung aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Eltern, die online nach einer Kita suchen, möchten sofort ein gutes Gefühl bekommen – eine einladende, informative Website kann den Unterschied bei der Anmeldung machen.

Um zu zeigen, wie eine moderne Kita-Website aussehen kann, habe ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Einrichtung',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir nachzufragen, ob meine letzte Nachricht angekommen ist. Falls Sie gerade im Kita-Alltag voll eingebunden sind, stehe ich gerne zu einem späteren Zeitpunkt zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema. Sollten Sie zu einem späteren Zeitpunkt Interesse haben, können Sie hier einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Freundliche Grüsse,
[Dein Name]`
      }
    }
  }
];

module.exports = { DEFAULT_CATEGORIES };
