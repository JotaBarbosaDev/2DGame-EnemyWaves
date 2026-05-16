export const DEFAULT_GAME_SETTINGS = Object.freeze({
    devMode: false
});

const GAME_SETTINGS_STORAGE_KEY = 'enemy-waves-settings';

export function normalizeGameSettings (settings)
{
    return {
        devMode: Boolean(settings?.devMode)
    };
}

export function loadGameSettings ()
{
    if (typeof window === 'undefined')
    {
        return { ...DEFAULT_GAME_SETTINGS };
    }

    try
    {
        const rawSettings = window.localStorage.getItem(GAME_SETTINGS_STORAGE_KEY);

        if (!rawSettings)
        {
            return { ...DEFAULT_GAME_SETTINGS };
        }

        return normalizeGameSettings(JSON.parse(rawSettings));
    }
    catch
    {
        return { ...DEFAULT_GAME_SETTINGS };
    }
}

export function saveGameSettings (settings)
{
    const normalized = normalizeGameSettings(settings);

    if (typeof window !== 'undefined')
    {
        window.localStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
}
