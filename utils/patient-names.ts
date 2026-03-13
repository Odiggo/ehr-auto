import * as fs from 'fs';
import * as path from 'path';

function readNameList(fileName: string): string[] {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('#'));
}

const FIRST_NAMES = readNameList('first_names.txt');
const LAST_NAMES = readNameList('last_names.txt');

const SYNTHETIC_FIRST = [
    'Olivia','Liam','Emma','Noah','Ava','Oliver','Sophia','Elijah','Isabella','James',
    'Mia','William','Amelia','Benjamin','Harper','Lucas','Evelyn','Henry','Abigail','Theodore',
];

const SYNTHETIC_LAST = [
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
];

function getFirstNames(): string[] {
    return FIRST_NAMES.length > 0 ? FIRST_NAMES : SYNTHETIC_FIRST;
}

function getLastNames(): string[] {
    return LAST_NAMES.length > 0 ? LAST_NAMES : SYNTHETIC_LAST;
}

export function getRandomPatientName(): string {
    const firsts = getFirstNames();
    const lasts = getLastNames();
    const first = firsts[Math.floor(Math.random() * firsts.length)];
    const last = lasts[Math.floor(Math.random() * lasts.length)];
    return `${first} ${last}`;
}

export function getRandomPatientNames(count: number): string[] {
    const firsts = getFirstNames();
    const lasts = getLastNames();
    const seen = new Set<string>();
    const names: string[] = [];

    const allCombos: string[] = [];
    for (const f of firsts) {
        for (const l of lasts) {
            allCombos.push(`${f} ${l}`);
        }
    }

    // Shuffle
    for (let i = allCombos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
    }

    for (const name of allCombos) {
        if (names.length >= count) break;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            names.push(name);
        }
    }

    // If more requested than unique combos, cycle
    while (names.length < count) {
        names.push(allCombos[names.length % allCombos.length]);
    }

    return names;
}

export function estimateTokens(text: string | null): number {
    if (!text || text.length === 0) return 0;
    return Math.max(1, Math.floor(text.length / 4));
}
