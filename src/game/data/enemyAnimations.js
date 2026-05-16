export const ENEMY_VARIANTS = ['Zombie1', 'Zombie2', 'Zombie3'];

export const ENEMY_ANIMATIONS = [
    {
        state: 'idle',
        filePrefix: 'Idle',
        frames: 4,
        frameRate: 6,
        repeat: -1
    },
    {
        state: 'walk',
        filePrefix: 'Walk',
        frames: 6,
        frameRate: 8,
        repeat: -1
    },
    {
        state: 'run',
        filePrefix: 'Run',
        frames: 10,
        frameRate: 12,
        repeat: -1
    },
    {
        state: 'attack',
        filePrefix: 'Attack',
        frames: 6,
        frameRate: 12,
        repeat: 0
    },
    {
        state: 'hurt',
        filePrefix: 'Hurt',
        frames: 5,
        frameRate: 12,
        repeat: 0
    },
    {
        state: 'dead',
        filePrefix: 'Dead',
        frames: 8,
        frameRate: 10,
        repeat: 0
    },
    {
        state: 'jump',
        filePrefix: 'Jump',
        frames: 7,
        frameRate: 12,
        repeat: 0
    }
];

export function getEnemyAnimationKey (variant, state)
{
    return `enemy-${variant.toLowerCase()}-${state}`;
}

export function getEnemyFrameKey (variant, state, frame)
{
    return `${getEnemyAnimationKey(variant, state)}-${frame}`;
}

export function getEnemyFramePath (variant, state, frame)
{
    if (variant === 'Zombie3' && state === 'attack' && frame === 6)
    {
        return `enemy/PNG/${variant}/animation/Attaxk6.png`;
    }

    const animation = ENEMY_ANIMATIONS.find((entry) => entry.state === state);

    if (!animation)
    {
        throw new Error(`Animacao de inimigo desconhecida: ${state}`);
    }

    return `enemy/PNG/${variant}/animation/${animation.filePrefix}${frame}.png`;
}
