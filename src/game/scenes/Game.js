import { Scene } from 'phaser';
import {
    BLOCKED_EDGES,
    MAP_DECORATIONS,
    MAP_PROPS,
    MAP_TILES,
    PLAYER_SPAWN_CELL
} from '../data/mapLayout';
import { WALK_GRID } from '../data/walkGrid';

const TILE_WIDTH = 256;
const TILE_ROW_STEP = 112;
const PIECE_COLUMNS = 10;
const PIECE_ROWS = 8;
const GRID_ORIGIN_X = 100;
const GRID_ORIGIN_Y = 140;
const FLOOR_VISIBLE_TOP_OFFSET = 334;
const PLAYER_SPEED = 240;
const MAP_BACKGROUND_COLOR = 0xd0ab83;
const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WALK_SUBCOLUMNS_PER_CELL = 4;
const WALK_SUBROWS_PER_CELL = 2;

const WALK_COLUMNS = PIECE_COLUMNS * WALK_SUBCOLUMNS_PER_CELL;
const WALK_ROWS = PIECE_ROWS * WALK_SUBROWS_PER_CELL;
const PIECE_CELL_HEIGHT = TILE_ROW_STEP;
const WALK_CELL_WIDTH = TILE_WIDTH / WALK_SUBCOLUMNS_PER_CELL;
const WALK_CELL_HEIGHT = PIECE_CELL_HEIGHT / WALK_SUBROWS_PER_CELL;
const WALK_ORIGIN_X = GRID_ORIGIN_X;
const WALK_ORIGIN_Y = GRID_ORIGIN_Y + FLOOR_VISIBLE_TOP_OFFSET;
const EDGE_BARRIER_THICKNESS = 16;

const PLAY_AREA = {
    x: WALK_ORIGIN_X,
    y: WALK_ORIGIN_Y,
    width: WALK_COLUMNS * WALK_CELL_WIDTH,
    height: WALK_ROWS * WALK_CELL_HEIGHT
};

const CAMERA_BOUNDS = {
    x: GRID_ORIGIN_X - 120,
    y: GRID_ORIGIN_Y + 60,
    width: PLAY_AREA.width + 240,
    height: PLAY_AREA.height + 340
};

validateWalkGrid();

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(MAP_BACKGROUND_COLOR);
        this.physics.world.setBounds(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
        this.staticZones = [];
        this.playerBehindCellKeys = this.buildPlayerBehindCellKeys();

        this.createMap();
        this.buildBlockedZonesFromMatrix();
        this.buildBlockedEdgeZones();
        this.createGridOverlay();
        this.createPlayer();
        this.enableZoneCollisions();
        this.createHud();

        this.cameras.main.setBounds(CAMERA_BOUNDS.x, CAMERA_BOUNDS.y, CAMERA_BOUNDS.width, CAMERA_BOUNDS.height);
        this.cameras.main.startFollow(this.playerHitbox, true, 0.12, 0.12);
        this.cameras.main.setZoom(0.88);
    }

    update ()
    {
        if (!this.playerHitbox || !this.playerSprite)
        {
            return;
        }

        let moveX = 0;
        let moveY = 0;

        if (this.keys.left.isDown)
        {
            moveX -= 1;
        }

        if (this.keys.right.isDown)
        {
            moveX += 1;
        }

        if (this.keys.up.isDown)
        {
            moveY -= 1;
        }

        if (this.keys.down.isDown)
        {
            moveY += 1;
        }

        if (moveX !== 0 || moveY !== 0)
        {
            const length = Math.hypot(moveX, moveY);

            this.playerHitbox.body.setVelocity(
                (moveX / length) * PLAYER_SPEED,
                (moveY / length) * PLAYER_SPEED
            );
            this.playerSprite.anims.play('player-run', true);

            if (moveX !== 0)
            {
                this.playerSprite.setFlipX(moveX < 0);
            }
        }
        else
        {
            this.playerHitbox.body.setVelocity(0, 0);
            this.playerSprite.anims.play('player-idle', true);
        }

        this.syncPlayerVisual();
        this.updateGridCursor();
    }

    createMap ()
    {
        for (const tile of MAP_TILES)
        {
            for (const cell of this.expandCellRefs(tile.cells))
            {
                this.placeCellImage(
                    tile.key,
                    cell,
                    tile.depth,
                    tile.depthOffset ?? 0,
                    tile.offsetX ?? 0,
                    tile.offsetY ?? 0
                );
            }
        }

        for (const prop of MAP_PROPS)
        {
            const cell = this.cellToCoords(prop.cell);
            const x = this.gridX(cell.column) + (prop.offsetX ?? 0);
            const y = this.gridY(cell.row) + (prop.offsetY ?? 0);

            this.placeProp(
                prop.key,
                x,
                y,
                this.resolveDepth(prop.depth, cell.row, prop.depthOffset ?? 0)
            );
        }

        for (const decoration of MAP_DECORATIONS)
        {
            this.drawDecoration(decoration);
        }
    }

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
    }

    buildBlockedEdgeZones ()
    {
        for (const [fromId, toId] of BLOCKED_EDGES)
        {
            this.addBlockedEdge(this.cellToCoords(fromId), this.cellToCoords(toId));
        }
    }

    addBlockedEdge (fromCell, toCell)
    {
        const columnDelta = toCell.column - fromCell.column;
        const rowDelta = toCell.row - fromCell.row;

        if (Math.abs(columnDelta) + Math.abs(rowDelta) !== 1)
        {
            throw new Error(`BLOCKED_EDGES so aceita celulas vizinhas: ${this.pieceCellId(fromCell.column, fromCell.row)} <-> ${this.pieceCellId(toCell.column, toCell.row)}`);
        }

        if (columnDelta !== 0)
        {
            const boundaryColumn = Math.max(fromCell.column, toCell.column);
            const x = this.pieceCellLeft(boundaryColumn);
            const y = this.pieceCellCenterY(fromCell.row);

            this.addStaticZone(x, y, EDGE_BARRIER_THICKNESS, PIECE_CELL_HEIGHT);

            return;
        }

        const boundaryRow = Math.max(fromCell.row, toCell.row);
        const x = this.pieceCellCenterX(fromCell.column);
        const y = this.pieceCellTop(boundaryRow);

        this.addStaticZone(x, y, TILE_WIDTH, EDGE_BARRIER_THICKNESS);
    }

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
    }

    createPlayer ()
    {
        this.createPlayerAnimations();

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            left: 'A',
            down: 'S',
            right: 'D'
        });

        const spawnCell = this.cellToCoords(PLAYER_SPAWN_CELL);

        this.playerHitbox = this.add.zone(this.pieceCellCenterX(spawnCell.column), this.pieceCellCenterY(spawnCell.row) - 10, 48, 28);
        this.physics.add.existing(this.playerHitbox);
        this.playerHitbox.body.setCollideWorldBounds(true);

        this.playerShadow = this.add.ellipse(this.playerHitbox.x, this.playerHitbox.y + 12, 56, 24, 0x000000, 0.18);
        this.playerSprite = this.add.sprite(this.playerHitbox.x, this.playerHitbox.y - 48, 'player-idle-0').setScale(0.24);

        this.playerSprite.anims.play('player-idle');
        this.syncPlayerVisual();
    }

    createPlayerAnimations ()
    {
        if (!this.anims.exists('player-idle'))
        {
            this.anims.create({
                key: 'player-idle',
                frames: this.buildFrameList('player-idle'),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('player-run'))
        {
            this.anims.create({
                key: 'player-run',
                frames: this.buildFrameList('player-run'),
                frameRate: 14,
                repeat: -1
            });
        }
    }

    createHud ()
    {
        this.add.text(24, 24, 'WASD to move', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#4a2e18',
            strokeThickness: 6
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.add.text(24, 58, 'Mapa: mapLayout.js | Colisao: walkGrid.js', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.cellStatusText = this.add.text(24, 92, '', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);
    }

    syncPlayerVisual ()
    {
        const pieceCell = this.getPieceCellAtWorldPosition(this.playerHitbox.x, this.playerHitbox.y);
        const playerBehindForeground = pieceCell && this.isPlayerBehindCell(pieceCell);
        const playerDepth = playerBehindForeground ? this.playerHitbox.y - 180 : this.playerHitbox.y + 2;

        this.playerShadow.setPosition(this.playerHitbox.x, this.playerHitbox.y + 12);
        this.playerShadow.setDepth(playerDepth - 3);

        this.playerSprite.setPosition(this.playerHitbox.x, this.playerHitbox.y - 48);
        this.playerSprite.setDepth(playerDepth);
    }

    isPlayerBehindCell (pieceCell)
    {
        return this.playerBehindCellKeys.has(this.cellKey(pieceCell.column, pieceCell.row));
    }

    buildFrameList (prefix)
    {
        return Array.from({ length: 10 }, (_, index) => ({ key: `${prefix}-${index}` }));
    }

    placeFloorTile (key, column, row, depth)
    {
        this.add.image(this.gridX(column), this.gridY(row), key)
            .setOrigin(0, 0)
            .setDepth(depth);
    }

    placeCellImage (key, cell, depthType, depthOffset = 0, offsetX = 0, offsetY = 0)
    {
        this.add.image(
            this.gridX(cell.column) + offsetX,
            this.gridY(cell.row) + offsetY,
            key
        )
            .setOrigin(0, 0)
            .setDepth(this.resolveDepth(depthType, cell.row, depthOffset));
    }

    placeProp (key, x, y, depth)
    {
        this.add.image(x, y, key)
            .setOrigin(0, 0)
            .setDepth(depth);
    }

    drawDecoration (decoration)
    {
        if (decoration.type !== 'rect')
        {
            return;
        }

        const cell = this.cellToCoords(decoration.cell);

        this.add.rectangle(
            this.gridX(cell.column) + (decoration.offsetX ?? 0),
            this.gridY(cell.row) + (decoration.offsetY ?? 0),
            decoration.width,
            decoration.height,
            decoration.color,
            decoration.alpha
        )
            .setDepth(this.resolveDepth(decoration.depth, cell.row, decoration.depthOffset ?? 0));
    }

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
    }

    enableZoneCollisions ()
    {
        for (const zone of this.staticZones)
        {
            this.physics.add.collider(this.playerHitbox, zone);
        }
    }

    updateGridCursor ()
    {
        const pieceCell = this.getPieceCellAtWorldPosition(this.playerHitbox.x, this.playerHitbox.y);
        const walkCell = this.getWalkCellAtWorldPosition(this.playerHitbox.x, this.playerHitbox.y);

        if (!pieceCell || !walkCell)
        {
            this.currentPieceMarker.setVisible(false);
            this.currentWalkMarker.setVisible(false);
            this.cellStatusText.setText('Fora da matriz');

            return;
        }

        this.currentPieceMarker.setVisible(true);
        this.currentPieceMarker.setPosition(this.pieceCellLeft(pieceCell.column), this.pieceCellTop(pieceCell.row));

        this.currentWalkMarker.setVisible(true);
        this.currentWalkMarker.setPosition(this.walkCellLeft(walkCell.column), this.walkCellTop(walkCell.row));

        this.cellStatusText.setText(
            `Celula: ${pieceCell.id} | Sub: ${walkCell.id} | Matriz: ${walkCell.walkable ? '1' : '0'} | Camada: ${this.isPlayerBehindCell(pieceCell) ? 'tras' : 'frente'}`
        );
    }

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
    }

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
    }

    isWalkable (column, row)
    {
        return WALK_GRID[row][column] === '1';
    }

    pieceCellId (column, row)
    {
        return `${COLUMN_LABELS[column]}${row + 1}`;
    }

    walkCellId (column, row)
    {
        return `${this.indexToLetters(column).toLowerCase()}${row + 1}`;
    }

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
    }

    cellToCoords (cellId)
    {
        const match = /^([A-Z]+)(\d+)$/i.exec(cellId.trim());

        if (!match)
        {
            throw new Error(`Celula invalida: ${cellId}`);
        }

        const column = COLUMN_LABELS.indexOf(match[1].toUpperCase());
        const row = Number.parseInt(match[2], 10) - 1;

        if (column < 0 || column >= PIECE_COLUMNS || row < 0 || row >= PIECE_ROWS)
        {
            throw new Error(`Celula fora da grelha: ${cellId}`);
        }

        return { column, row };
    }

    expandCellRefs (cellRefs)
    {
        const cells = [];
        const refs = Array.isArray(cellRefs) ? cellRefs : [cellRefs];

        for (const ref of refs)
        {
            if (ref.includes(':'))
            {
                const [startId, endId] = ref.split(':');
                const start = this.cellToCoords(startId);
                const end = this.cellToCoords(endId);
                const startColumn = Math.min(start.column, end.column);
                const endColumn = Math.max(start.column, end.column);
                const startRow = Math.min(start.row, end.row);
                const endRow = Math.max(start.row, end.row);

                for (let row = startRow; row <= endRow; row++)
                {
                    for (let column = startColumn; column <= endColumn; column++)
                    {
                        cells.push({ column, row });
                    }
                }

                continue;
            }

            cells.push(this.cellToCoords(ref));
        }

        return cells;
    }

    buildPlayerBehindCellKeys ()
    {
        const keys = new Set();

        for (const entry of [...MAP_TILES, ...MAP_PROPS])
        {
            if (entry.behind !== true && entry.playerLayer !== 'behind')
            {
                continue;
            }

            const refs = entry.behindCells ?? entry.playerLayerCells ?? entry.cells ?? [entry.cell];

            for (const cell of this.expandCellRefs(refs))
            {
                keys.add(this.cellKey(cell.column, cell.row));
            }
        }

        return keys;
    }

    resolveDepth (depthType, row, depthOffset = 0)
    {
        if (depthType === 'wall')
        {
            return this.wallDepth(row) + depthOffset;
        }

        if (depthType === 'gridY')
        {
            return this.gridY(row) + depthOffset;
        }

        return this.floorDepth(row) + depthOffset;
    }

    cellKey (column, row)
    {
        return `${column}:${row}`;
    }

    pieceCellLeft (column)
    {
        return WALK_ORIGIN_X + (column * TILE_WIDTH);
    }

    pieceCellTop (row)
    {
        return WALK_ORIGIN_Y + (row * PIECE_CELL_HEIGHT);
    }

    pieceCellCenterX (column)
    {
        return this.pieceCellLeft(column) + (TILE_WIDTH / 2);
    }

    pieceCellCenterY (row)
    {
        return this.pieceCellTop(row) + (PIECE_CELL_HEIGHT / 2);
    }

    walkCellLeft (column)
    {
        return WALK_ORIGIN_X + (column * WALK_CELL_WIDTH);
    }

    walkCellTop (row)
    {
        return WALK_ORIGIN_Y + (row * WALK_CELL_HEIGHT);
    }

    floorDepth (row)
    {
        return this.gridY(row) + 20;
    }

    wallDepth (row)
    {
        return this.gridY(row) + 304;
    }

    gridX (column)
    {
        return GRID_ORIGIN_X + (column * TILE_WIDTH);
    }

    gridY (row)
    {
        return GRID_ORIGIN_Y + (row * TILE_ROW_STEP);
    }
}

function validateWalkGrid ()
{
    if (WALK_GRID.length !== WALK_ROWS)
    {
        throw new Error(`WALK_GRID precisa de ${WALK_ROWS} linhas, recebeu ${WALK_GRID.length}.`);
    }

    for (const row of WALK_GRID)
    {
        if (row.length !== WALK_COLUMNS)
        {
            throw new Error(`Cada linha de WALK_GRID precisa de ${WALK_COLUMNS} colunas, recebeu ${row.length}.`);
        }

        if (/[^01]/.test(row))
        {
            throw new Error('WALK_GRID só pode conter 0 e 1.');
        }
    }
}
