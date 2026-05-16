export const PLAYER_CHARACTERS = [
    {
        assetId: 'Wraith_01',
        attackCooldown: 420,
        attackDamage: 1,
        castCooldown: 900,
        castDamage: 2,
        castTint: 0x9bf6ff,
        label: 'Wraith I',
        maxHealth: 5,
        projectileSpeed: 360,
        speed: 240,
        traits: [
            'Soul Scavenger: mais chance de cair essencia e maior raio de recolha.',
            'Light Veil: mais velocidade base e +1 vida base.'
        ],
        unlockSpent: 0,
        modifiers: {
            dropChanceBonus: 0.12,
            maxHealthFlat: 1,
            pickupRadiusBonus: 28,
            speedMultiplier: 1.08
        }
    },
    {
        assetId: 'Wraith_02',
        attackCooldown: 360,
        attackDamage: 2,
        castCooldown: 760,
        castDamage: 3,
        castTint: 0xb8f7a1,
        label: 'Wraith II',
        maxHealth: 7,
        projectileSpeed: 400,
        speed: 258,
        traits: [
            'Rending Claws: melee bate mais forte e com mais alcance.',
            'Battle Tempo: a cadencia rende mais e o ataque sai mais rapido.'
        ],
        unlockSpent: 10,
        modifiers: {
            attackCooldownMultiplier: 0.9,
            hasteBonusPerLevel: 0.006,
            meleeDamageFlat: 1,
            meleeRangeFlat: 16
        }
    },
    {
        assetId: 'Wraith_03',
        attackCooldown: 320,
        attackDamage: 3,
        castCooldown: 620,
        castDamage: 4,
        castTint: 0xffd38a,
        label: 'Wraith III',
        maxHealth: 9,
        projectileSpeed: 440,
        speed: 278,
        traits: [
            'Void Channel: cast mais forte, mais rapido e com projeteis maiores.',
            'Soul Dominion: a essencia rende mais e o score escala melhor.'
        ],
        unlockSpent: 20,
        modifiers: {
            castDamageFlat: 1,
            extraEssenceChance: 0.25,
            projectileRadiusBonus: 3,
            projectileSpeedMultiplier: 1.12,
            scoreMultiplier: 1.1
        }
    }
];

export function getPlayerCharacterByAssetId (assetId)
{
    return PLAYER_CHARACTERS.find((character) => character.assetId === assetId) ?? PLAYER_CHARACTERS[0];
}

export function getPlayerCharacterIndex (assetId)
{
    return Math.max(0, PLAYER_CHARACTERS.findIndex((character) => character.assetId === assetId));
}

export function getNextPlayerCharacter (assetId)
{
    const currentIndex = getPlayerCharacterIndex(assetId);

    return PLAYER_CHARACTERS[currentIndex + 1] ?? null;
}
