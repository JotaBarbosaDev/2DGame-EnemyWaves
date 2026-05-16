import { Scene } from 'phaser';
import {
    MAP_DECORATIONS,
    MAP_PROPS,
    MAP_TILES
} from '../data/mapLayout';

const TILE_WIDTH = 256;
const TILE_ROW_STEP = 112;
const PIECE_COLUMNS = 10;
const PIECE_ROWS = 8;
const GRID_ORIGIN_X = 100;
const GRID_ORIGIN_Y = 140;
const MAP_BACKGROUND_COLOR = 0xd0ab83;
const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const CAMERA_BOUNDS = {
    x: GRID_ORIGIN_X - 120,
    y: GRID_ORIGIN_Y + 60,
    width: (PIECE_COLUMNS * TILE_WIDTH) + 240,
    height: (PIECE_ROWS * TILE_ROW_STEP) + 340
};

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(MAP_BACKGROUND_COLOR);

        this.createMap();
        this.createGridOverlay();
        this.createHud();

        this.cameras.main.setBounds(CAMERA_BOUNDS.x, CAMERA_BOUNDS.y, CAMERA_BOUNDS.width, CAMERA_BOUNDS.height);
        this.cameras.main.setZoom(0.88);
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

    createGridOverlay ()
    {
        this.gridOverlay = this.add.graphics().setDepth(2400);
        this.gridOverlay.lineStyle(2, 0x2868bb, 0.45);

        for (let row = 0; row < PIECE_ROWS; row++)
        {
            for (let column = 0; column < PIECE_COLUMNS; column++)
            {
                this.gridOverlay.strokeRect(
                    this.pieceCellLeft(column),
                    this.pieceCellTop(row),
                    TILE_WIDTH,
                    TILE_ROW_STEP
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
    }

    createHud ()
    {
        this.add.text(24, 24, 'Mapa isometrico carregado', {
            fontFamily: 'Arial Black',
            fontSize: 22,
            color: '#ffffff',
            stroke: '#4a2e18',
            strokeThickness: 6
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.add.text(24, 58, 'Layout: mapLayout.js | Assets: mapAssets.js', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);
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

    cellToCoords (cellId)
    {
        const match = /^([A-Z]+)(d+)$/i.exec(cellId.trim());

        if (!match)
        {
            throw new Error('Celula invalida: ' + cellId);
        }

        const column = COLUMN_LABELS.indexOf(match[1].toUpperCase());
        const row = Number.parseInt(match[2], 10) - 1;

        if (column < 0 || column >= PIECE_COLUMNS || row < 0 || row >= PIECE_ROWS)
        {
            throw new Error('Celula fora da grelha: ' + cellId);
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

    pieceCellId (column, row)
    {
        return COLUMN_LABELS[column] + (row + 1);
    }

    pieceCellLeft (column)
    {
        return GRID_ORIGIN_X + (column * TILE_WIDTH);
    }

    pieceCellTop (row)
    {
        return GRID_ORIGIN_Y + (row * TILE_ROW_STEP);
    }

    pieceCellCenterX (column)
    {
        return this.pieceCellLeft(column) + (TILE_WIDTH / 2);
    }

    pieceCellCenterY (row)
    {
        return this.pieceCellTop(row) + (TILE_ROW_STEP / 2);
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
