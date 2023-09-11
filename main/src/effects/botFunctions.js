export function isValidNote(note) {
    // Паттерн для проверки соответствия ноты
    const notePattern = /^[A-G](#|b)?$/;

    // Проверка на соответствие паттерну
    return notePattern.test(note.toUpperCase());
}
