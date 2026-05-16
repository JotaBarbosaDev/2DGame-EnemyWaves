// Sintaxe simples:
// - 'A4' coloca numa celula
// - 'A4:J8' preenche um retangulo inteiro
// - key tem de existir em src/game/data/mapAssets.js
//
// Depth:
// - 'floor' usa a profundidade do chao
// - 'wall' usa a profundidade do muro
// - 'gridY' usa a posicao Y da linha, bom para props soltos
//
// Alinhamento:
// - MAP_TILES ja encaixam na grelha por defeito
// - se uma peca precisar de ajuste, usa offsetX / offsetY
//
// Player a frente / atras:
// - behind: true faz o player ficar por tras nessas celulas
// - se quiseres outra zona diferente da propria peca, usa behindCells
//
// Desniveis / bloqueios entre celulas:
// - BLOCKED_EDGES bloqueia a passagem entre duas celulas vizinhas
// - bom para casos onde as duas celulas sao andaveis, mas estao a alturas diferentes

export const PLAYER_SPAWN_CELL = 'F5';

export const BLOCKED_EDGES = [
    ['H1', 'I1'],
    ['H2', 'I2'],
    ['F2', 'F3'],

];

export const MAP_TILES = [
    { key: 'map-floor', cells: ['A1:J8'], depth: 'floor' },
    { key: 'map-floor', cells: ['F2'], depth: 'floor' },
    { key: 'map-floor', cells: ['C1:H2', 'E3', 'F3'], depth: 'floor', behind: false },
    { key: 'map-slab', cells: ['C1:H2'], depth: 'floor', depthOffset: 12},
    { key: 'map-wall', cells: ['C3', 'D3','E3', 'G3', 'H3'], depth: 'wall' },
    { key: 'map-stairs-W', cells: ['B2'], depth: 'wall', depthOffset: 0, offsetY: -10 },
    { key: 'map-doorway', cells: ['F3'], depth: 'wall', depthOffset: 4 },
    { key: 'map-low-wall', cells: ['E6', 'F6'], depth: 'wall', depthOffset: 0, offsetX: 0, offsetY: -10, behind: true }
];

export const MAP_PROPS = [
    {
        key: 'map-crate',
        cell: 'D6',
        offsetX:0,
        offsetY: -20,
        depth: 'gridY',
        depthOffset: 376
    },
    {
        key: 'map-crate',
        cell: 'H5',
        offsetX: 65,
        offsetY: 90,
        depth: 'gridY',
        depthOffset: 394,
        behind: true
    },
    {
        key: 'map-fence',
        cell: 'B8',
        offsetY: 118,
        depth: 'gridY',
        depthOffset: 530
    },
    {
        key: 'map-fence',
        cell: 'G8',
        offsetY: 118,
        depth: 'gridY',
        depthOffset: 530
    }
];

export const MAP_DECORATIONS = [
    {
        type: 'rect',
        cell: 'F3',
        offsetX: 128,
        offsetY: 346,
        width: 132,
        height: 84,
        color: 0x000000,
        alpha: 0.12,
        depth: 'wall',
        depthOffset: 1
    }
];
