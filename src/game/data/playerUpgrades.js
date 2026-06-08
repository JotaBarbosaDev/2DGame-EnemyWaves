export const PLAYER_TOTAL_UPGRADE_POINTS = 30;

export const PLAYER_UPGRADES = [
    {
        color: 0x38bdf8,
        descriptionKey: 'upgrades.mobility.description',
        id: 'mobility',
        key: '1',
        labelKey: 'upgrades.mobility.label',
        maxLevel: 10
    },
    {
        color: 0xfb7185,
        descriptionKey: 'upgrades.assault.description',
        id: 'assault',
        key: '2',
        labelKey: 'upgrades.assault.label',
        maxLevel: 10
    },
    {
        color: 0xf59e0b,
        descriptionKey: 'upgrades.haste.description',
        id: 'haste',
        key: '3',
        labelKey: 'upgrades.haste.label',
        maxLevel: 10
    },
    {
        color: 0xa78bfa,
        descriptionKey: 'upgrades.arcana.description',
        id: 'arcana',
        key: '4',
        labelKey: 'upgrades.arcana.label',
        maxLevel: 10
    },
    {
        color: 0x4ade80,
        descriptionKey: 'upgrades.fortitude.description',
        id: 'fortitude',
        key: '5',
        labelKey: 'upgrades.fortitude.label',
        maxLevel: 10
    },
    {
        color: 0x22c55e,
        descriptionKey: 'upgrades.regeneration.description',
        id: 'regeneration',
        key: '6',
        labelKey: 'upgrades.regeneration.label',
        maxLevel: 10
    }
];

export function buildInitialUpgradeState ()
{
    return Object.fromEntries(PLAYER_UPGRADES.map((upgrade) => [upgrade.id, 0]));
}

export function getPlayerUpgradeById (id)
{
    return PLAYER_UPGRADES.find((upgrade) => upgrade.id === id) ?? null;
}
