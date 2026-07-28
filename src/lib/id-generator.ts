// Helper to extract class code identifier (e.g. "Class One" -> "1", "Class 1" -> "1", "Grade 2" -> "2", "Playgroup" -> "PG")
export function formatClassCode(className?: string): string {
    if (!className) return "";
    const clean = className.trim();

    const wordMap: Record<string, string> = {
        "one": "1", "first": "1", "1st": "1",
        "two": "2", "second": "2", "2nd": "2",
        "three": "3", "third": "3", "3rd": "3",
        "four": "4", "fourth": "4", "4th": "4",
        "five": "5", "fifth": "5", "5th": "5",
        "six": "6", "sixth": "6", "6th": "6",
        "seven": "7", "seventh": "7", "7th": "7",
        "eight": "8", "eighth": "8", "8th": "8",
        "nine": "9", "ninth": "9", "9th": "9",
        "ten": "10", "tenth": "10", "10th": "10",
        "eleven": "11", "eleventh": "11", "11th": "11",
        "twelve": "12", "twelfth": "12", "12th": "12"
    };

    // Check if contains digits (e.g. "Class 1", "Grade 10", "1")
    const matchDigit = clean.match(/\d+/);
    if (matchDigit) {
        return matchDigit[0];
    }

    // Check for word match inside string (e.g. "Class One")
    const lower = clean.toLowerCase();
    for (const [word, val] of Object.entries(wordMap)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
            return val;
        }
    }

    // Fallback: strip "class", "grade", spaces
    const stripped = clean.replace(/class|grade/gi, "").replace(/[^a-zA-Z0-9]/gi, "");
    return stripped || clean;
}

// Helper to extract section code identifier (e.g. "Section A" -> "A", "A" -> "A")
export function formatSectionCode(sectionName?: string): string {
    if (!sectionName) return "";
    const clean = sectionName.trim();
    const match = clean.replace(/section/gi, "").replace(/[^a-zA-Z0-9]/gi, "");
    return match || clean;
}

// Main Identifier Generator function
export function formatAutoIdentifier(
    prefix: string = "",
    digits: number = 4,
    startFrom: number | string = 1,
    className?: string,
    sectionName?: string
): string {
    if (!prefix) return "";

    const classCode = formatClassCode(className);
    const sectionCode = formatSectionCode(sectionName);

    // Replace {class} and {section} (case insensitive)
    let formattedPrefix = prefix
        .replace(/\{class\}/gi, classCode)
        .replace(/\{section\}/gi, sectionCode);

    const startNum = typeof startFrom === "number" ? startFrom : (parseInt(String(startFrom)) || 1);
    const numStr = String(startNum).padStart(digits || 4, "0");

    return `${formattedPrefix}${numStr}`;
}

export interface AutoGenSettings {
    auto_admission_no?: boolean;
    admission_no_prefix?: string;
    admission_no_digit?: number;
    admission_start_from?: string | number;

    auto_roll_no?: boolean;
    roll_no_prefix?: string;
    roll_no_digit?: number;
    roll_no_start_from?: string | number;

    auto_username?: boolean;
    username_prefix?: string;
    username_digit?: number;
    username_start_from?: string | number;

    auto_parent_username?: boolean;
    parent_username_prefix?: string;
    parent_username_digit?: number;
    parent_username_start_from?: string | number;
}

export function generateAutoStudentIds(
    settings: AutoGenSettings = {},
    className?: string,
    sectionName?: string,
    offset: number = 0
) {
    const parseStart = (val: string | number | undefined, defaultVal: number) => {
        const num = typeof val === "number" ? val : parseInt(String(val || ""));
        return (isNaN(num) ? defaultVal : num) + offset;
    };

    const admissionNo = settings.auto_admission_no !== false
        ? formatAutoIdentifier(
            settings.admission_no_prefix || "ADM-{class}{section}",
            settings.admission_no_digit || 4,
            parseStart(settings.admission_start_from, 1),
            className,
            sectionName
        )
        : "";

    const rollNo = settings.auto_roll_no !== false
        ? formatAutoIdentifier(
            settings.roll_no_prefix || "RL-{class}{section}",
            settings.roll_no_digit || 4,
            parseStart(settings.roll_no_start_from, 100),
            className,
            sectionName
        )
        : "";

    const username = settings.auto_username !== false
        ? formatAutoIdentifier(
            settings.username_prefix || "STD-{class}{section}",
            settings.username_digit || 4,
            parseStart(settings.username_start_from, 100),
            className,
            sectionName
        )
        : "";

    const parentUsername = settings.auto_parent_username !== false
        ? formatAutoIdentifier(
            settings.parent_username_prefix || "PAR-{class}{section}",
            settings.parent_username_digit || 4,
            parseStart(settings.parent_username_start_from, 1),
            className,
            sectionName
        )
        : "";

    return { admissionNo, rollNo, username, parentUsername };
}

