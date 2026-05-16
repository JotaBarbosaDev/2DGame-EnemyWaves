export const PLAYER_TOTAL_UPGRADE_POINTS = 30;

export const PLAYER_UPGRADES = [
    {
        description: '+ velocidade de movimento e recolha de essencia',
        id: 'mobility',
        key: '1',
        label: 'Mobilidade',
        maxLevel: 10
    },
    {
        description: '+ dano melee e alcance do golpe',
        id: 'assault',
        key: '2',
        label: 'Ferocidade',
        maxLevel: 10
    },
    {
        description: '+ velocidade de ataque e de cast',
        id: 'haste',
        key: '3',
        label: 'Cadencia',
        maxLevel: 10
    },
    {
        description: '+ dano do cast, raio e velocidade do projetil',
        id: 'arcana',
        key: '4',
        label: 'Arcana',
        maxLevel: 10
    },
    {
        description: '+ vida maxima',
        id: 'vitality',
        key: '5',
        label: 'Vitalidade',
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
