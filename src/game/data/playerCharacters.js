export const PLAYER_CHARACTERS = [
    {
        assetId: 'Wraith_01',
        attackCooldown: 420,
        attackDamage: 1,
        castCooldown: 900,
        castDamage: 2,
        castTint: 0x9bf6ff,
        evolveAtWave: 1,
        label: 'Wraith I',
        maxHealth: 5,
        projectileSpeed: 360,
        speed: 240
    },
    {
        assetId: 'Wraith_02',
        attackCooldown: 360,
        attackDamage: 2,
        castCooldown: 760,
        castDamage: 3,
        castTint: 0xb8f7a1,
        evolveAtWave: 3,
        label: 'Wraith II',
        maxHealth: 7,
        projectileSpeed: 400,
        speed: 258
    },
    {
        assetId: 'Wraith_03',
        attackCooldown: 320,
        attackDamage: 3,
        castCooldown: 620,
        castDamage: 4,
        castTint: 0xffd38a,
        evolveAtWave: 5,
        label: 'Wraith III',
        maxHealth: 9,
        projectileSpeed: 440,
        speed: 278
    }
];

export function getPlayerCharacterByAssetId (assetId)
{
    return PLAYER_CHARACTERS.find((character) => character.assetId === assetId) ?? PLAYER_CHARACTERS[0];
}

export function getPlayerCharacterForWave (waveNumber)
{
    return PLAYER_CHARACTERS.reduce((selected, character) => {

        if (character.evolveAtWave <= waveNumber)
        {
            return character;
        }

        return selected;

    }, PLAYER_CHARACTERS[0]);
}
