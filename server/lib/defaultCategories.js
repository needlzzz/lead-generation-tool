const { v4: uuidv4 } = require('uuid');

const DEFAULT_CATEGORIES = [
  {
    id: uuidv4(),
    name: 'Gyms',
    searchTerm: 'Fitnessstudio Zürich',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin gerade auf euer Studio gestossen und habe mir eure Online-Präsenz angeschaut. Dabei sind mir ein paar Punkte aufgefallen:

[Website-Probleme]

Das bedeutet konkret: Potenzielle Mitglieder, die euch googeln, sehen entweder eine langsame, schlecht dargestellte Seite – oder finden euch gar nicht erst.

Um zu zeigen, wie das besser aussehen könnte, habe ich kurz eine Vorschau-Website für euch erstellt:
👉 [Preview-Link]

Ich helfe lokalen Studios in Zürich dabei, genau solche Websites umzusetzen – modern, schnell und auf den Punkt.

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

ich wollte kurz nachhaken – meine letzte Nachricht ist vielleicht untergegangen.

Falls ihr gerade wenig Zeit habt, kein Problem. Ich frage nur, weil ich gesehen habe, dass eure Website noch Luft nach oben hat – und das relativ schnell änderbar wäre.

Wenn ihr Interesse habt, beantworte ich gerne alle Fragen in einem kurzen Gespräch.

Viele Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

das ist meine letzte Nachricht – ich möchte euren Posteingang nicht weiter belasten.

Falls ihr irgendwann Interesse habt, eure Online-Präsenz zu verbessern, könnt ihr hier direkt einen kostenlosen 20-Minuten-Call buchen:
👉 [CALENDLY-LINK]

Ich wünsche euch weiterhin viel Erfolg mit dem Studio.

Viele Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Physiotherapeuten',
    searchTerm: 'Physiotherapie Zürich',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung',
        body: `Sehr geehrte Damen und Herren,

ich bin durch eine Suche auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Das bedeutet für Sie: Patientinnen und Patienten, die online nach einer Praxis suchen, finden Sie schwerer oder werden von der Darstellung abgeschreckt – bevor sie überhaupt Kontakt aufnehmen.

Um zu zeigen, wie eine moderne Praxis-Website aussehen kann, habe ich eine kurze Vorschau für Sie erstellt:
👉 [Preview-Link]

Ich unterstütze Praxen in Zürich dabei, ihre digitale Präsenz professionell und unkompliziert zu modernisieren.

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Praxis',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir, kurz nachzufragen, ob meine letzte Nachricht angekommen ist.

Falls Sie gerade in einer ruhigeren Phase sind, stehe ich sehr gerne für ein kurzes Gespräch zur Verfügung – ganz ohne Verpflichtung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht',
        body: `Sehr geehrte Damen und Herren,

ich möchte Ihnen versichern, dass dies meine letzte Kontaktaufnahme zu diesem Thema ist.

Sollten Sie zu einem späteren Zeitpunkt Interesse an einer modernen Website für Ihre Praxis haben, können Sie hier gerne direkt einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Ich wünsche Ihrer Praxis weiterhin viel Erfolg.

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Barbershops',
    searchTerm: 'Barbershop Zürich',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurem Auftritt online – [Business Name]',
        body: `Hey [Name],

ich hab euren Shop gefunden und mir eure Website angeschaut. Ein paar Dinge sind mir aufgefallen:

[Website-Probleme]

Das heisst konkret: Neue Kunden, die nach einem Barbershop suchen, landen woanders – weil eure Website sie nicht abholt.

Damit ihr seht, wie das besser aussehen könnte, hab ich eine Vorschau für euch gebaut:
👉 [Preview-Link]

Ich mach genau sowas für lokale Shops in Zürich – simpel, schnell, und auf den Punkt.

Hätte ich kurz euer Ohr dafür?

Gruss,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz – [Business Name]',
        body: `Hey [Name],

kurzes Follow-up – wollte nur sichergehen, dass meine letzte Nachricht nicht im Spam gelandet ist.

Falls ihr gerade voll ausgelastet seid, absolut kein Stress. Ich frag nur, weil ich denke, dass sich mit wenig Aufwand einiges verbessern liesse.

Gruss,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht – [Business Name]',
        body: `Hey [Name],

letzte Nachricht von mir, versprochen.

Falls ihr irgendwann Lust habt, euren Online-Auftritt aufzufrischen, bucht einfach hier einen kurzen Call – komplett unverbindlich:
👉 [CALENDLY-LINK]

Alles Gute für den Shop!

Gruss,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Solo-Unternehmer',
    searchTerm: 'Freelancer Zürich',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu deiner Website – [Name]',
        body: `Hey [Name],

ich bin auf dein Business gestossen und hab mir deine Website angeschaut. Dabei ist mir aufgefallen:

[Website-Probleme]

Das heisst konkret: Potenzielle Kunden, die dich googeln, bekommen einen ersten Eindruck, der nicht zu deiner Arbeit passt – und fragen erst gar nicht an.

Damit du siehst, wie eine moderne Website für dich aussehen könnte, hab ich eine kurze Vorschau erstellt:
👉 [Preview-Link]

Ich helfe Selbstständigen in Zürich dabei, genau das umzusetzen – ohne grossen Aufwand deinerseits.

Wäre das relevant für dich?

Gruss,
[Dein Name]`
      },
      email2: {
        subject: 'Kurz nachgefragt – [Name]',
        body: `Hey [Name],

ich wollte kurz nachhaken, falls meine letzte Nachricht untergegangen ist.

Kein Druck – ich frag nur, weil ich denke, dass ich dir konkret weiterhelfen könnte.

Gruss,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Name]',
        body: `Hey [Name],

das ist meine letzte Nachricht zu diesem Thema.

Falls du irgendwann das Gefühl hast, dass deine Website nicht das widerspiegelt, was du leistest – hier kannst du dir direkt einen kurzen Call buchen:
👉 [CALENDLY-LINK]

Alles Gute für dein Business!

Gruss,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Tattoo Studios',
    searchTerm: 'Tattoo Studio',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Euer Online-Auftritt – kurze Frage – [Business Name]',
        body: `Hey [Name],

ich bin auf euer Studio gestossen und hab mir eure Website angeschaut. Dabei ist mir aufgefallen:

[Website-Probleme]

Das bedeutet: Leute, die nach einem Tattoo-Studio suchen, sehen eine Website, die eure Arbeit nicht so zeigt, wie sie es verdient. Viele entscheiden sich allein aufgrund der Website, ob sie anfragen oder weiterscrollen.

Damit ihr seht, wie euer Portfolio online viel besser wirken kann, hab ich eine Vorschau gebaut:
👉 [Preview-Link]

Ich baue für Studios wie eures moderne Websites – clean, schnell, und mobilfreundlich.

Hätte ich kurz euer Ohr dafür?

Gruss,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz – [Business Name]',
        body: `Hey [Name],

kurzes Follow-up – wollte nur sichergehen, dass meine letzte Nachricht nicht untergegangen ist.

Falls ihr gerade voll im Tagesgeschäft steckt, kein Stress. Ich frag nur, weil ich denke, dass eure Arbeit online besser präsentiert werden könnte.

Gruss,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht – [Business Name]',
        body: `Hey [Name],

letzte Nachricht von mir, versprochen.

Falls ihr irgendwann Lust habt, euren Online-Auftritt aufzufrischen – hier könnt ihr direkt einen kurzen Call buchen, komplett unverbindlich:
👉 [CALENDLY-LINK]

Weiterhin viel Erfolg mit dem Studio!

Gruss,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Restaurants',
    searchTerm: 'Restaurant',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euer Restaurant gestossen und habe mir euren Online-Auftritt angeschaut. Dabei sind mir ein paar Punkte aufgefallen:

[Website-Probleme]

Das bedeutet konkret: Gäste, die online nach einem Restaurant suchen, finden Speisekarte, Öffnungszeiten und Atmosphäre nicht auf den ersten Blick – und gehen woanders hin.

Damit ihr seht, wie das besser aussehen könnte, habe ich eine Vorschau-Website erstellt:
👉 [Preview-Link]

Ich helfe lokalen Restaurants dabei, eine Website zu haben, die Gäste anspricht und Reservierungen bringt.

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

ich wollte kurz nachhaken – meine letzte Nachricht ist vielleicht im Alltag untergegangen.

Falls ihr gerade in der Hochsaison steckt, absolut verständlich. Ich frage nur, weil ich gesehen habe, dass eure Online-Präsenz noch Potenzial hat.

Viele Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

das ist meine letzte Nachricht – ich möchte euch nicht weiter stören.

Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen 20-Minuten-Call buchen:
👉 [CALENDLY-LINK]

Ich wünsche euch weiterhin volle Tische!

Viele Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Sportclubs',
    searchTerm: 'Sportclub',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Euer Online-Auftritt – kurze Anmerkung – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Club gestossen und habe mir eure Website angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Das heisst konkret: Neue Mitglieder, Eltern oder Sponsoren, die euch online suchen, bekommen keinen guten ersten Eindruck – und fragen woanders an.

Damit ihr seht, wie eine moderne Club-Website aussehen kann, habe ich eine Vorschau erstellt:
👉 [Preview-Link]

Ich helfe lokalen Vereinen und Clubs dabei, ihre Website aufzufrischen – unkompliziert und zu fairen Konditionen.

Wäre das relevant für euch?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – [Business Name]',
        body: `Hallo [Name],

ich wollte kurz nachhaken, ob meine letzte Nachricht angekommen ist.

Falls ihr gerade mitten in der Saison steckt, kein Problem. Ich frage nur, weil ich denke, dass sich mit wenig Aufwand einiges verbessern liesse.

Viele Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht – [Business Name]',
        body: `Hallo [Name],

letzte Nachricht von mir zu diesem Thema.

Falls ihr irgendwann eure Online-Präsenz auffrischen wollt, könnt ihr hier direkt einen kurzen Call buchen – komplett unverbindlich:
👉 [CALENDLY-LINK]

Weiterhin viel Erfolg mit dem Club!

Viele Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Handwerker',
    searchTerm: 'Handwerker',
    tone: 'casual',
    templates: {
      email1: {
        subject: 'Kurze Frage zu eurer Website – [Business Name]',
        body: `Hallo [Name],

ich bin auf euren Betrieb gestossen und habe mir eure Online-Präsenz angeschaut. Dabei sind mir ein paar Dinge aufgefallen:

[Website-Probleme]

Das bedeutet konkret: Kunden, die online nach einem Handwerker suchen, finden euch schwerer – und entscheiden sich innert Sekunden, ob sie anfragen oder weiterscrollen.

Damit ihr seht, wie eine moderne Handwerker-Website aussehen kann, habe ich eine kurze Vorschau für euch erstellt:
👉 [Preview-Link]

Ich helfe lokalen Handwerksbetrieben dabei, eine professionelle Website zu haben, die Vertrauen aufbaut und neue Aufträge bringt.

Wäre das etwas, worüber es sich lohnt, kurz zu sprechen?

Viele Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Nochmals kurz gemeldet – [Business Name]',
        body: `Hallo [Name],

ich wollte kurz nachhaken – meine letzte Nachricht ist vielleicht untergegangen.

Falls ihr gerade auf der Baustelle voll eingespannt seid, absolut verständlich. Ich frage nur, weil ich denke, dass eure Website noch Potenzial hat.

Viele Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Letzte Nachricht von mir – [Business Name]',
        body: `Hallo [Name],

das ist meine letzte Nachricht zu diesem Thema.

Falls ihr irgendwann eure Website modernisieren wollt, könnt ihr hier direkt einen kostenlosen 20-Minuten-Call buchen:
👉 [CALENDLY-LINK]

Weiterhin viel Erfolg mit dem Betrieb!

Viele Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Vereine',
    searchTerm: 'Verein',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihren Verein aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir einige Punkte aufgefallen:

[Website-Probleme]

Das bedeutet für Sie: Neue Mitglieder, Sponsoren und Interessierte finden Ihren Verein online schwerer – oder bekommen keinen überzeugenden ersten Eindruck.

Um zu zeigen, wie eine moderne Vereins-Website aussehen kann, habe ich eine kurze Vorschau für Sie erstellt:
👉 [Preview-Link]

Ich unterstütze lokale Vereine dabei, ihre digitale Präsenz professionell und unkompliziert zu modernisieren – zu fairen Konditionen.

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihres Vereins',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir, kurz nachzufragen, ob meine letzte Nachricht angekommen ist.

Falls Sie gerade in einer intensiven Phase sind, stehe ich sehr gerne zu einem späteren Zeitpunkt für ein kurzes Gespräch zur Verfügung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema.

Sollten Sie zu einem späteren Zeitpunkt Interesse an einer modernen Website für Ihren Verein haben, können Sie hier gerne direkt einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Ich wünsche Ihrem Verein weiterhin viel Erfolg.

Freundliche Grüsse,
[Dein Name]`
      }
    }
  },
  {
    id: uuidv4(),
    name: 'Kitas',
    searchTerm: 'Kita',
    tone: 'formal',
    templates: {
      email1: {
        subject: 'Ihre Online-Präsenz – kurze Anmerkung – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

ich bin auf Ihre Kita aufmerksam geworden und habe mir Ihre Website angeschaut. Dabei sind mir einige Punkte aufgefallen:

[Website-Probleme]

Das bedeutet für Sie: Eltern, die online nach einer Kita suchen, finden Informationen zu Konzept, Team und Anmeldung nicht auf den ersten Blick – und schauen sich woanders um.

Um zu zeigen, wie eine moderne Kita-Website aussehen kann, habe ich eine kurze Vorschau für Sie erstellt:
👉 [Preview-Link]

Ich unterstütze Kitas und Betreuungseinrichtungen dabei, ihre digitale Präsenz professionell und unkompliziert zu modernisieren.

Darf ich kurz erläutern, was ich konkret anbiete?

Freundliche Grüsse,
[Dein Name]`
      },
      email2: {
        subject: 'Kurze Nachfrage – Website Ihrer Kita',
        body: `Sehr geehrte Damen und Herren,

ich erlaube mir, kurz nachzufragen, ob meine letzte Nachricht angekommen ist.

Ich verstehe, dass der Alltag in einer Kita wenig Raum für solche Themen lässt. Falls Sie Interesse haben, stehe ich gerne für ein kurzes Gespräch zur Verfügung – ganz ohne Verpflichtung.

Freundliche Grüsse,
[Dein Name]`
      },
      email3: {
        subject: 'Abschliessende Nachricht – [Business Name]',
        body: `Sehr geehrte Damen und Herren,

dies ist meine letzte Kontaktaufnahme zu diesem Thema.

Sollten Sie zu einem späteren Zeitpunkt Interesse an einer modernen Website für Ihre Kita haben, können Sie hier gerne direkt einen unverbindlichen Termin vereinbaren:
👉 [CALENDLY-LINK]

Ich wünsche Ihrer Einrichtung weiterhin viel Erfolg.

Freundliche Grüsse,
[Dein Name]`
      }
    }
  }
];

module.exports = { DEFAULT_CATEGORIES };
