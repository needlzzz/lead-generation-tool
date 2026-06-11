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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
        subject: 'Website [Business Name] – Potenzial entdeckt',
        body: `Guten Tag

Ich habe mir Ihre Website angeschaut und möchte mit Ihnen ein paar meiner Beobachtungen teilen — nicht um zu kritisieren, sondern weil ich glaube, dass da noch echtes Potenzial schlummert!

Mir sind [Website-Probleme-Anzahl] Punkte aufgefallen, bei denen sich mit kleinen Anpassungen einiges bewegen lässt:

[Website-Probleme]

Diese Punkte klingen klein, können aber einen grossen Unterschied machen: Besucher, die sich gut abgeholt fühlen, werden viel eher zu echten Anfragen.

Damit Sie sich das besser vorstellen können, habe ich eine kleine Vorschau zusammengestellt, wie Ihre Website aussehen könnte:

👉 [Preview-Link]

[Preview-Disclaimer]

Ich freue mich, wenn Sie einen Blick darauf werfen, und stehe gerne für Fragen zur Verfügung.

Freundliche Grüsse
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
