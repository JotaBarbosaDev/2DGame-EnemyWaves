import {
    COLLISION_LAYER_NAMES,
    GRID_ORIGIN_X,
    GRID_ORIGIN_Y,
    MAP_RENDER_SCALE,
    PIECE_CELL_HEIGHT,
    PIECE_COLUMNS,
    PIECE_ROWS,
    TILE_WIDTH,
    WALK_CELL_HEIGHT,
    WALK_CELL_WIDTH,
    WALK_COLUMNS,
    WALK_ORIGIN_X,
    WALK_ORIGIN_Y,
    WALK_ROWS
} from '../data/gameConstants';

export const MapSystem = {
createMap ()
{
    this.map = this.make.tilemap({ key: 'test-map' });

    const tilesets = [
        this.map.addTilesetImage('Grass', 'Grass'),
        this.map.addTilesetImage('wall', 'wall'),
        this.map.addTilesetImage('Props', 'Props'),
        this.map.addTilesetImage('Plant', 'Plant'),
        this.map.addTilesetImage('props', 'props')
    ].filter(Boolean);

    const layerDepths = {
        Ground: 0,
        Ground_plants: 1,
        plant_bottom: 5,
        walls: 10,
        Objects: 15,
        'walls vert': 18,
        plant_top: 30
    };

    for (const layerData of this.map.layers)
    {
        const layer = this.map.createLayer(layerData.name, tilesets, GRID_ORIGIN_X, GRID_ORIGIN_Y);

        if (!layer)
        {
            continue;
        }

        layer.setScale(MAP_RENDER_SCALE);
        layer.setDepth(layerDepths[layerData.name] ?? 0);

        if (COLLISION_LAYER_NAMES.has(layerData.name.toLowerCase()))
        {
            layer.setVisible(false);
        }
    }

    this.tiledWalkGrid = this.buildWalkGridFromTilemap();
},

buildWalkGridFromTilemap ()
{
    const rows = Array.from({ length: PIECE_ROWS }, () => Array.from({ length: PIECE_COLUMNS }, () => '1'));

    for (const layerData of this.map.layers)
    {
        if (!COLLISION_LAYER_NAMES.has(layerData.name.toLowerCase()))
        {
            continue;
        }

        for (let row = 0; row < Math.min(layerData.height, PIECE_ROWS); row++)
        {
            for (let column = 0; column < Math.min(layerData.width, PIECE_COLUMNS); column++)
            {
                const tile = layerData.data[row][column];

                if (tile?.index >= 0)
                {
                    rows[row][column] = '0';
                }
            }
        }
    }

    return rows.map((row) => row.join(''));
},

buildBlockedZonesFromMatrix ()
{
    for (let row = 0; row < WALK_ROWS; row++)
    {
        let column = 0;

        while (column < WALK_COLUMNS)
        {
            if (this.isWalkable(column, row))
            {
                column += 1;
                continue;
            }

            const startColumn = column;

            while (column < WALK_COLUMNS && !this.isWalkable(column, row))
            {
                column += 1;
            }

            const width = (column - startColumn) * WALK_CELL_WIDTH;
            const x = this.walkCellLeft(startColumn) + (width / 2);
            const y = this.walkCellTop(row) + (WALK_CELL_HEIGHT / 2);

            this.addStaticZone(x, y, width, WALK_CELL_HEIGHT);
        }
    }
},

createGridOverlay ()
{
    this.gridOverlay = this.add.graphics().setDepth(2400);

    for (let row = 0; row < WALK_ROWS; row++)
    {
        for (let column = 0; column < WALK_COLUMNS; column++)
        {
            this.gridOverlay.fillStyle(this.isWalkable(column, row) ? 0x2ebf6f : 0xbf3b2e, this.isWalkable(column, row) ? 0.05 : 0.16);
            this.gridOverlay.fillRect(
                this.walkCellLeft(column),
                this.walkCellTop(row),
                WALK_CELL_WIDTH,
                WALK_CELL_HEIGHT
            );
        }
    }

    this.gridOverlay.lineStyle(1, 0x204c2f, 0.22);

    for (let row = 0; row < WALK_ROWS; row++)
    {
        for (let column = 0; column < WALK_COLUMNS; column++)
        {
            this.gridOverlay.strokeRect(
                this.walkCellLeft(column),
                this.walkCellTop(row),
                WALK_CELL_WIDTH,
                WALK_CELL_HEIGHT
            );
        }
    }

    this.gridOverlay.lineStyle(2, 0x2868bb, 0.45);

    for (let row = 0; row < PIECE_ROWS; row++)
    {
        for (let column = 0; column < PIECE_COLUMNS; column++)
        {
            this.gridOverlay.strokeRect(
                this.pieceCellLeft(column),
                this.pieceCellTop(row),
                TILE_WIDTH,
                PIECE_CELL_HEIGHT
            );

            this.add.text(
                this.pieceCellCenterX(column),
                this.pieceCellCenterY(row),
                this.pieceCellId(column, row),
                {
                    fontFamily: 'Courier New',
                    fontSize: 16,
                    color: '#224b81',
                    stroke: '#f4ead5',
                    strokeThickness: 4
                }
            )
                .setOrigin(0.5)
                .setAlpha(0.9)
                .setDepth(2401);
        }
    }

    this.currentPieceMarker = this.add.rectangle(0, 0, TILE_WIDTH, PIECE_CELL_HEIGHT)
        .setOrigin(0)
        .setFillStyle(0x2d8cff, 0.08)
        .setStrokeStyle(3, 0x2d8cff, 0.95)
        .setDepth(2402);

    this.currentWalkMarker = this.add.rectangle(0, 0, WALK_CELL_WIDTH, WALK_CELL_HEIGHT)
        .setOrigin(0)
        .setFillStyle(0xfff27a, 0.12)
        .setStrokeStyle(2, 0xfff27a, 0.95)
        .setDepth(2403);
},

addStaticZone (x, y, width, height)
{
    const zone = this.add.zone(x, y, width, height);

    this.physics.add.existing(zone, true);
    this.staticZones.push(zone);

    if (this.playerHitbox)
    {
        this.physics.add.collider(this.playerHitbox, zone);
    }

    return zone;
},

enableZoneCollisions ()
{
    for (const zone of this.staticZones)
    {
        this.physics.add.collider(this.playerHitbox, zone);
    }
},

enableZoneCollisionsFor (target)
{
    for (const zone of this.staticZones)
    {
        this.physics.add.collider(target, zone);
    }
},

getPieceCellAtWorldPosition (x, y)
{
    const column = Math.floor((x - WALK_ORIGIN_X) / TILE_WIDTH);
    const row = Math.floor((y - WALK_ORIGIN_Y) / PIECE_CELL_HEIGHT);

    if (column < 0 || column >= PIECE_COLUMNS || row < 0 || row >= PIECE_ROWS)
    {
        return null;
    }

    return {
        column,
        row,
        id: this.pieceCellId(column, row)
    };
},

getWalkCellAtWorldPosition (x, y)
{
    const column = Math.floor((x - WALK_ORIGIN_X) / WALK_CELL_WIDTH);
    const row = Math.floor((y - WALK_ORIGIN_Y) / WALK_CELL_HEIGHT);

    if (column < 0 || column >= WALK_COLUMNS || row < 0 || row >= WALK_ROWS)
    {
        return null;
    }

    return {
        column,
        row,
        id: this.walkCellId(column, row),
        walkable: this.isWalkable(column, row)
    };
},

isWalkable (column, row)
{
    const grid = this.tiledWalkGrid;

    return !grid || grid[row]?.[column] === '1';
},

pieceCellId (column, row)
{
    return `${COLUMN_LABELS[column]}${row + 1}`;
},

walkCellId (column, row)
{
    return `${this.indexToLetters(column).toLowerCase()}${row + 1}`;
},

indexToLetters (index)
{
    let value = index;
    let label = '';

    do
    {
        label = COLUMN_LABELS[value % COLUMN_LABELS.length] + label;
        value = Math.floor(value / COLUMN_LABELS.length) - 1;
    }
    while (value >= 0);

    return label;
},

cellKey (column, row)
{
    return `${column}:${row}`;
},

pieceCellLeft (column)
{
    return WALK_ORIGIN_X + (column * TILE_WIDTH);
},

pieceCellTop (row)
{
    return WALK_ORIGIN_Y + (row * PIECE_CELL_HEIGHT);
},

pieceCellCenterX (column)
{
    return this.pieceCellLeft(column) + (TILE_WIDTH / 2);
},

pieceCellCenterY (row)
{
    return this.pieceCellTop(row) + (PIECE_CELL_HEIGHT / 2);
},

walkCellLeft (column)
{
    return WALK_ORIGIN_X + (column * WALK_CELL_WIDTH);
},

walkCellTop (row)
{
    return WALK_ORIGIN_Y + (row * WALK_CELL_HEIGHT);
}
};
