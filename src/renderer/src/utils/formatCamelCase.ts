const NON_SPECIAL_CHARS_REGEX = /\W+|[_]+/;
const WHITE_SPACE_REGEX = /\s+/;
const formatCamelCase = (text: string) => {
    const formatCase = (word: string, index: number) => {
        const formattedNonFirstWord = word.charAt(0).toUpperCase() + word.slice(1);
        return index === 0 ? word.toLowerCase() : formattedNonFirstWord
    };

    return text
        .replace(NON_SPECIAL_CHARS_REGEX, ' ')
        .split(WHITE_SPACE_REGEX)
        .map((word, index) => formatCase(word, index))
        .join('')
};