export function groupCharactersByCategory(characters) {
    const categories = {};
    characters.forEach((character) => {
        const category = character.category;
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(character);
    });
    return categories;
}


export function getRandomVoice(voices) {
    const index = Math.floor(Math.random() * voices.length);
    return voices[index].id;
}


export function getRandomMaleVoice(voices) {
    const index = Math.floor(Math.random() * MALE_VOICES.length);
    return MALE_VOICES[index].id;
}

export function getRandomFemaleVoice(voices) {
    const index = Math.floor(Math.random() * FEMALE_VOICES.length);
    return FEMALE_VOICES[index].id;
}