import { BulkyWasteReport } from "../components/ReportForm";

// Almere straten en locaties
const ALMERE_LOCATIONS = [
  { street: "Lastdragerstraat", lat: 52.3706, lng: 5.2144 },
  { street: "De Diagonaal", lat: 52.3689, lng: 5.2178 },
  { street: "Botter", lat: 52.3845, lng: 5.2011 },
  { street: "Tjalk", lat: 52.3876, lng: 5.1978 },
  { street: "Kotter", lat: 52.3912, lng: 5.1945 },
  { street: "Stadhuisplein", lat: 52.3708, lng: 5.2198 },
  { street: "Grote Markt", lat: 52.3745, lng: 5.2234 },
  { street: "Muziekwijk", lat: 52.3567, lng: 5.2089 },
  { street: "Baken", lat: 52.3934, lng: 5.1923 },
  { street: "Esplanade", lat: 52.3698, lng: 5.2167 },
  { street: "Promenade", lat: 52.3678, lng: 5.2156 },
  { street: "Waterwijk", lat: 52.3812, lng: 5.1889 },
  { street: "Seizoenenbuurt", lat: 52.3445, lng: 5.2345 },
  { street: "Vogelbuurt", lat: 52.3534, lng: 5.2267 },
  { street: "Stripheldenbuurt", lat: 52.3623, lng: 5.2456 },
  { street: "De Nieuwe Bibliotheek", lat: 52.3715, lng: 5.2201 },
  { street: "Kemphaan", lat: 52.3567, lng: 5.2134 },
  { street: "Scholekster", lat: 52.3589, lng: 5.2178 },
  { street: "Sperwer", lat: 52.3601, lng: 5.2201 },
  { street: "Valk", lat: 52.3645, lng: 5.2267 },
  { street: "Arend", lat: 52.3678, lng: 5.2289 },
  { street: "Buizerd", lat: 52.3712, lng: 5.2312 },
  { street: "Regenboogbuurt", lat: 52.3445, lng: 5.2078 },
  { street: "Danseres", lat: 52.3512, lng: 5.2156 },
  { street: "Literatorenbuurt", lat: 52.3634, lng: 5.2412 },
  { street: "Componistenbuurt", lat: 52.3567, lng: 5.2089 },
  { street: "Zilverparkkade", lat: 52.3734, lng: 5.2234 },
  { street: "Gooiseweg", lat: 52.3456, lng: 5.1934 },
  { street: "Veluwedreef", lat: 52.3512, lng: 5.1978 },
  { street: "Randstad", lat: 52.3689, lng: 5.2089 },
];

const WASTE_TYPES = [
  { name: "Bank", descriptions: [
    "Oude leren bank, nog in redelijke staat",
    "Tweedehands stof bank, beschadigd aan de zijkant",
    "Grote hoekbank die niet meer past",
    "Kleine bankje met vlekken",
  ]},
  { name: "Matras", descriptions: [
    "Eenpersoonsmatras, gebruikt",
    "Tweepersoonsmatras met vlekken",
    "Kindermatras, te klein geworden",
    "Boxspring matras, beschadigd",
  ]},
  { name: "Koelkast", descriptions: [
    "Oude koelkast, werkt niet meer",
    "Grote koelvriescombinatie, defect",
    "Kleine tafelkoelkast",
    "Amerikaanse koelkast, doet het niet meer",
  ]},
  { name: "Wasmachine", descriptions: [
    "Wasmachine, centrifugeren werkt niet meer",
    "Oude wasmachine, lekt water",
    "Wasmachine die niet meer aangaat",
    "Defecte wasmachine",
  ]},
  { name: "Fiets", descriptions: [
    "Oude roestige fiets zonder banden",
    "Kinderfiets die te klein is geworden",
    "Beschadigde racefiets",
    "Kapotte elektrische fiets",
  ]},
  { name: "Tafel", descriptions: [
    "Grote eettafel met krassen",
    "Kleine bijzettafel, wiebelend",
    "Tuintafel, gebroken poot",
    "Bureau met laden, beschadigd",
  ]},
  { name: "Kast", descriptions: [
    "Grote kledingkast, deuren hangen scheef",
    "Boekenkast met gebroken planken",
    "Oude garderobekast",
    "Kleine badkamerkast met waterschade",
  ]},
  { name: "Tv", descriptions: [
    "Oude tube televisie",
    "Flatscreen TV met kapot scherm",
    "Kleine TV die niet meer werkt",
    "Grote plasma TV, defect",
  ]},
  { name: "Tapijt", descriptions: [
    "Groot woonkamertapijt met vlekken",
    "Oud karpet uit de slaapkamer",
    "Lopers van de gang",
    "Vloerkleed met brandgaten",
  ]},
  { name: "Stoel", descriptions: [
    "4 eetkamerstoelen, bekleding versleten",
    "Bureaustoel met kapotte wieltjes",
    "Oude fauteuil",
    "Set van 6 stoelen, verschillende staat",
  ]},
  { name: "Bed", descriptions: [
    "Eenpersoonsbed met lattenbodem",
    "Tweepersoonsbed, hout beschadigd",
    "Kinderbed dat niet meer nodig is",
    "Stapelbed zonder matrassen",
  ]},
  { name: "Magnetron", descriptions: [
    "Oude magnetron, werkt niet meer",
    "Grote magnetron met grill, defect",
    "Kleine magnetron",
    "Magnetron met draaiplateau kapot",
  ]},
  { name: "Karton dozen", descriptions: [
    "Stapel verhuisdozen",
    "Grote hoeveelheid karton na verhuizing",
    "Dozen van nieuwe meubels",
    "Veel plat karton bij elkaar",
  ]},
  { name: "Spiegel", descriptions: [
    "Grote staande spiegel met gebroken lijst",
    "Oude badkamerspiegel",
    "Wandspiegel met barst",
    "Set kleine spiegels",
  ]},
  { name: "Lamp", descriptions: [
    "Grote staande lamp",
    "Kroonluchter die niet meer past",
    "Beschadigde hanglamp",
    "Set oude tafellampjes",
  ]},
];

// Genereer een willekeurige datum tussen min en max
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Genereer een willekeurig adres
function getRandomLocation() {
  const location = ALMERE_LOCATIONS[Math.floor(Math.random() * ALMERE_LOCATIONS.length)];
  const houseNumber = Math.floor(Math.random() * 200) + 1;
  const hasLetter = Math.random() > 0.7;
  const letter = hasLetter ? String.fromCharCode(97 + Math.floor(Math.random() * 4)) : '';
  
  return {
    address: `${houseNumber}${letter}, ${location.street}`,
    lat: location.lat + (Math.random() - 0.5) * 0.01,
    lng: location.lng + (Math.random() - 0.5) * 0.01,
  };
}

// Genereer een willekeurig afval type
function getRandomWasteType() {
  const type = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
  const description = type.descriptions[Math.floor(Math.random() * type.descriptions.length)];
  return { type: type.name, description };
}

export function generateSampleReports(count: number = 150): BulkyWasteReport[] {
  const reports: BulkyWasteReport[] = [];
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 dagen geleden

  for (let i = 0; i < count; i++) {
    const { type, description } = getRandomWasteType();
    const { address, lat, lng } = getRandomLocation();
    const createdAt = randomDate(twoMonthsAgo, now);
    
    // Bepaal status (40% gemeld, 30% in_behandeling, 30% opgehaald)
    let status: "gemeld" | "in_behandeling" | "opgehaald";
    const statusRandom = Math.random();
    if (statusRandom < 0.4) {
      status = "gemeld";
    } else if (statusRandom < 0.7) {
      status = "in_behandeling";
    } else {
      status = "opgehaald";
    }

    let updatedAt: string | undefined;
    if (status === "in_behandeling" || status === "opgehaald") {
      // Voeg 1-7 dagen toe voor in_behandeling
      const hoursToAdd = status === "in_behandeling" 
        ? Math.random() * 7 * 24  // 0-7 dagen
        : Math.random() * 14 * 24; // 0-14 dagen voor opgehaald
      updatedAt = new Date(createdAt.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString();
    }

    const report: BulkyWasteReport = {
      id: `report:${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      location: { lat, lng },
      address,
      userId: `anon-${Math.random().toString(36).substr(2, 9)}`,
      userName: "Anonieme Gebruiker",
      status,
      createdAt: createdAt.toISOString(),
      updatedAt,
      updatedBy: status !== "gemeld" ? "Werknemer Jan" : undefined,
    };

    reports.push(report);
  }

  // Sorteer op datum (nieuwste eerst)
  return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Laad sample data in localStorage
export function loadSampleData() {
  const sampleReports = generateSampleReports(150);
  localStorage.setItem("reports", JSON.stringify(sampleReports));
  console.log(`✅ ${sampleReports.length} sample meldingen geladen in localStorage`);
  return sampleReports;
}

// Check of er al data is, anders laad sample data
export function ensureSampleData(): BulkyWasteReport[] {
  const existingReports = localStorage.getItem("reports");
  
  if (existingReports) {
    const parsed = JSON.parse(existingReports);
    console.log(`📊 ${parsed.length} bestaande meldingen gevonden`);
    return parsed;
  }
  
  console.log("🔄 Geen bestaande data, genereren van sample data...");
  return loadSampleData();
}