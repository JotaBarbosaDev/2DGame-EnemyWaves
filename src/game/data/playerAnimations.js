export const PLAYER_ANIMATIONS = [
    {
        fileStem: 'Idle',
        folder: 'Idle',
        frames: 12,
        frameRate: 8,
        repeat: -1,
        state: 'idle'
    },
    {
        fileStem: 'Idle Blinking',
        folder: 'Idle Blink',
        frames: 12,
        frameRate: 12,
        repeat: 0,
        state: 'idle-blink'
    },
    {
        fileStem: 'Moving Forward',
        folder: 'Walking',
        frames: 12,
        frameRate: 14,
        repeat: -1,
        state: 'walk'
    },
    {
        fileStem: 'Attack',
        folder: 'Attacking',
        frames: 12,
        frameRate: 18,
        repeat: 0,
        state: 'attack'
    },
    {
        fileStem: 'Casting Spells',
        folder: 'Casting Spells',
        frames: 18,
        frameRate: 18,
        repeat: 0,
        state: 'cast'
    },
    {
        fileStem: 'Hurt',
        folder: 'Hurt',
        frames: 12,
        frameRate: 18,
        repeat: 0,
        state: 'hurt'
    },
    {
        fileStem: 'Dying',
        folder: 'Dying',
        frames: 15,
        frameRate: 14,
        repeat: 0,
        state: 'dead'
    },
    {
        fileStem: 'Taunt',
        folder: 'Taunt',
        frames: 18,
        frameRate: 14,
        repeat: 0,
        state: 'taunt'
    }
];

export function getPlayerAnimationConfig (state)
{
    const animation = PLAYER_ANIMATIONS.find((entry) => entry.state === state);

    if (!animation)
    {
        throw new Error(`Animacao de player desconhecida: ${state}`);
    }

    return animation;
}

export function getPlayerAnimationKey (assetId, state)
{
    return `player-${assetId.toLowerCase()}-${state}`;
}

export function getPlayerFrameKey (assetId, state, frame)
{
    return `${getPlayerAnimationKey(assetId, state)}-${frame}`;
}

export function getPlayerFramePath (assetId, state, frame)
{
    const animation = getPlayerAnimationConfig(state);
    const suffix = frame.toString().padStart(3, '0');

    return `player1/PNG/${assetId}/PNG Sequences/${animation.folder}/${assetId}_${animation.fileStem}_${suffix}.png`;
}
