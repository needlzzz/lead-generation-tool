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

ich bin gerade auf euer Studio gestossen und habe mir kurz eure Online-Präsenz angeschaut.

Ihr macht offensichtlich gute Arbeit – aber eure Website spiegelt das noch nicht so wider, wie sie könnte. Viele potenzielle Mitglieder entscheiden sich schon auf den ersten Blick, ob sie anfragen oder weiterscrollen.

Ich helfe lokalen Studios in Zürich dabei, das zu ändern – mit klaren, modernen Websites, die neue Mitglieder ansprechen und Vertrauen aufbauen.

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

ich bin durch eine Suche auf Ihre Praxis aufmerksam geworden und habe mir Ihre Website kurz angeschaut.

Viele Patientinnen und Patienten informieren sich heute zuerst online, bevor sie einen Termin buchen. Eine klare, vertrauenswürdige Website kann dabei den entscheidenden Unterschied machen.

Ich unterstütze Praxen in Zürich dabei, ihre digitale Präsenz professionell und unkompliziert aufzubauen oder zu modernisieren.

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

ich hab euren Shop gefunden und direkt mal eure Website angeschaut.

Ihr habt offensichtlich einen guten Ruf – aber online macht ihr euch noch nicht so sichtbar, wie ihr es verdient hättet. Neue Kunden, die nach einem Barbershop in Zürich suchen, landen gerade eher woanders.

Ich bau für lokale Shops in Zürich Websites, die genau das ändern – simpel, schnell, und auf den Punkt.

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

ich bin auf dein Business gestossen und hab mir kurz deine Online-Präsenz angeschaut.

Du machst interessante Arbeit – aber deine Website kommuniziert das noch nicht so, wie sie sollte. Gerade als Solo-Unternehmer ist deine Website oft der erste Eindruck, den potenzielle Kunden von dir bekommen.

Ich helfe Selbstständigen in Zürich dabei, das zu ändern – ohne grossen Aufwand deinerseits.

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

ich bin auf euer Studio gestossen und hab mir eure Online-Präsenz angeschaut.

Eure Arbeit sieht stark aus – aber eure Website zeigt das noch nicht so, wie sie könnte. Gerade bei Tattoos entscheiden sich Leute oft anhand der Website, ob sie anfragen oder weitersuchen. Ein gutes Portfolio online kann den Unterschied machen.

Ich baue für Studios wie eures moderne Websites, die eure Kunst ins richtige Licht rücken – clean, schnell, und mobilfreundlich.

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

ich bin auf euer Restaurant gestossen und habe mir kurz euren Online-Auftritt angeschaut.

Viele Gäste schauen heute zuerst auf die Website, bevor sie reservieren – Speisekarte, Öffnungszeiten, Atmosphäre. Wenn das online nicht stimmt, gehen sie woanders hin.

Ich helfe lokalen Restaurants dabei, eine Website zu haben, die Gäste anspricht und Reservierungen bringt – unkompliziert und ohne grossen Aufwand euerseits.

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

ich bin auf euren Club gestossen und habe mir eure Website angeschaut.

Ihr leistet offensichtlich gute Arbeit – aber online ist das noch nicht so sichtbar, wie es sein könnte. Neue Mitglieder, Eltern, Sponsoren – alle schauen zuerst auf die Website. Wenn die nicht überzeugt, geht ihr unter.

Ich helfe lokalen Vereinen und Clubs dabei, eine moderne Website aufzubauen, die neue Mitglieder anzieht und euren Club professionell präsentiert.

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

ich bin auf euren Betrieb gestossen und habe mir kurz eure Online-Präsenz angeschaut.

Ihr macht offensichtlich solide Arbeit – aber eure Website spiegelt das noch nicht wider. Viele Kunden suchen heute online nach Handwerkern und entscheiden sich innert Sekunden, ob sie anfragen oder weiterscrollen.

Ich helfe lokalen Handwerksbetrieben dabei, eine professionelle Website zu haben, die Vertrauen aufbaut und neue Aufträge bringt – ohne grossen Aufwand euerseits.

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

ich bin auf Ihren Verein aufmerksam geworden und habe mir Ihre Website kurz angeschaut.

Viele Vereine haben eine veraltete oder unübersichtliche Website – dabei ist sie oft der erste Kontaktpunkt für neue Mitglieder, Sponsoren und Interessierte. Eine klare, moderne Präsenz kann hier viel bewirken.

Ich unterstütze lokale Vereine dabei, ihre digitale Präsenz professionell und unkompliziert aufzubauen oder zu modernisieren – zu fairen Konditionen.

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

ich bin auf Ihre Kita aufmerksam geworden und habe mir Ihre Website kurz angeschaut.

Eltern informieren sich heute fast ausschliesslich online, bevor sie eine Kita kontaktieren. Eine klare, vertrauenswürdige Website mit Informationen zu Konzept, Team und Anmeldung kann den entscheidenden Unterschied machen.

Ich unterstütze Kitas und Betreuungseinrichtungen dabei, ihre digitale Präsenz professionell und unkompliziert aufzubauen oder zu modernisieren.

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
