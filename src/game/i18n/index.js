import en from './en.json';
import pt from './pt.json';

const DICTIONARIES = {
    en,
    pt
};

export const SUPPORTED_LANGUAGES = Object.freeze(['pt', 'en']);

export function normalizeLanguage (language)
{
    return SUPPORTED_LANGUAGES.includes(language) ? language : 'pt';
}

export function getLanguage (settings)
{
    return normalizeLanguage(settings?.language);
}

export function setLanguage (scene, language)
{
    const normalized = normalizeLanguage(language);

    if (!scene)
    {
        return normalized;
    }

    scene.language = normalized;
    applyDocumentLocalization(normalized);

    return normalized;
}

export function t (language, key, params = {})
{
    const normalized = normalizeLanguage(language);
    const template = lookupTranslation(DICTIONARIES[normalized], key) ?? lookupTranslation(DICTIONARIES.pt, key);

    if (typeof template !== 'string')
    {
        console.warn(`[i18n] Missing translation key "${key}" for "${normalized}".`);

        return key;
    }

    return template.replace(/\{(\w+)\}/g, (_, token) => {
        return Object.prototype.hasOwnProperty.call(params, token) ? `${params[token]}` : `{${token}}`;
    });
}

export function applyDocumentLocalization (language)
{
    if (typeof document === 'undefined')
    {
        return;
    }

    const normalized = normalizeLanguage(language);

    document.documentElement.lang = normalized;
    document.title = t(normalized, 'meta.title');
}

function lookupTranslation (dictionary, key)
{
    return key.split('.').reduce((value, part) => {
        return value && typeof value === 'object' ? value[part] : undefined;
    }, dictionary);
}
