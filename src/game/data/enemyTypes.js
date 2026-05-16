export const ENEMY_TYPES = Object.freeze({
    Zombie1: {
        attackCooldown: 1120,
        attackDamage: 1,
        health: 3,
        healthGrowth: 1,
        runSpeed: 128,
        runSpeedGrowth: 7,
        scoreValue: 100,
        scoreGrowth: 10,
        unlockWave: 1,
        walkSpeed: 74,
        walkSpeedGrowth: 4,
        weight: 6
    },
    Zombie2: {
        attackCooldown: 980,
        attackDamage: 1,
        health: 4,
        healthGrowth: 1,
        runSpeed: 142,
        runSpeedGrowth: 8,
        scoreValue: 140,
        scoreGrowth: 12,
        unlockWave: 2,
        walkSpeed: 82,
        walkSpeedGrowth: 4,
        weight: 4
    },
    Zombie3: {
        attackCooldown: 1040,
        attackDamage: 2,
        health: 5,
        healthGrowth: 2,
        runSpeed: 120,
        runSpeedGrowth: 6,
        scoreValue: 180,
        scoreGrowth: 15,
        unlockWave: 3,
        walkSpeed: 68,
        walkSpeedGrowth: 3,
        weight: 3
    }
});

export function getEnemyTypeConfig (variant)
{
    const config = ENEMY_TYPES[variant];

    if (!config)
    {
        throw new Error(`Tipo de inimigo desconhecido: ${variant}`);
    }

    return config;
}
