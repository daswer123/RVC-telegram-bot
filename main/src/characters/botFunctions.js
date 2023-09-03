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
