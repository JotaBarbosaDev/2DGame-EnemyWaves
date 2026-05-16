import { Input, Math as PhaserMath, Scene } from 'phaser';
import {
    BLOCKED_EDGES,
    MAP_DECORATIONS,
    MAP_PROPS,
    MAP_TILES,
    PLAYER_SPAWN_CELL
} from '../data/mapLayout';
import {
    ENEMY_ANIMATIONS,
    ENEMY_VARIANTS,
    getEnemyAnimationKey,
    getEnemyFrameKey
} from '../data/enemyAnimations';
import { PLAYER_ANIMATIONS } from '../data/playerAnimations';
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
const PLAYER_VISUAL_SCALE = 0.24;
const PLAYER_HITBOX_WIDTH = 42;
const PLAYER_HITBOX_HEIGHT = 24;
const PLAYER_FOOT_Y_OFFSET = 6;
const PLAYER_SHADOW_OFFSET_Y = 10;
const PLAYER_MAX_HEALTH = 5;
const PLAYER_ATTACK_COOLDOWN = 420;
const PLAYER_CAST_COOLDOWN = 900;
const PLAYER_INVULNERABILITY_MS = 900;
const PLAYER_IDLE_BLINK_MIN_DELAY = 2400;
const PLAYER_IDLE_BLINK_MAX_DELAY = 4400;
const PLAYER_ATTACK_EFFECT_DISTANCE = 44;
const PLAYER_PROJECTILE_SPEED = 360;
const PLAYER_PROJECTILE_LIFETIME = 1000;
const PLAYER_PROJECTILE_OFFSET_X = 28;
const PLAYER_PROJECTILE_OFFSET_Y = 46;
const PLAYER_DEPTH_BEHIND_OFFSET = 180;
const PLAYER_DEPTH_FRONT_OFFSET = 2;
const PLAYER_ATTACK_DAMAGE = 1;
const PLAYER_PROJECTILE_DAMAGE = 2;
const PLAYER_AIM_MIN_DISTANCE = 12;
const PLAYER_HEALTH_BAR_WIDTH = 240;
const PLAYER_HEALTH_BAR_HEIGHT = 20;
const PLAYER_HEALTH_BAR_Y = 26;

const ENEMY_VISUAL_SCALE = 0.28;
const ENEMY_HITBOX_WIDTH = 34;
const ENEMY_HITBOX_HEIGHT = 20;
const ENEMY_SHADOW_OFFSET_Y = 10;
const ENEMY_MAX_COUNT = 6;
const ENEMY_SPAWN_DELAY = 1500;
const ENEMY_SPAWN_INTERVAL = 2600;
const ENEMY_SPAWN_VARIANCE = 700;
const ENEMY_SPAWN_VIEW_MARGIN = 220;
const ENEMY_MIN_PLAYER_DISTANCE = 240;
const ENEMY_WALK_SPEED = 74;
const ENEMY_RUN_SPEED = 126;
const ENEMY_RUN_DISTANCE = 230;
const ENEMY_ATTACK_RANGE = 56;
const ENEMY_ATTACK_COOLDOWN = 1100;
const ENEMY_ATTACK_DAMAGE = 1;
const ENEMY_IDLE_MIN_MS = 180;
const ENEMY_IDLE_MAX_MS = 480;
const ENEMY_CORPSE_DURATION = 2200;
const ENEMY_HIT_INVULNERABILITY_MS = 150;
const ENEMY_HEALTH_BAR_WIDTH = 42;
const ENEMY_HEALTH_BAR_HEIGHT = 5;
const ENEMY_HEALTH_BAR_OFFSET_Y = 74;

const PLAYER_ACTION_STATES = new Set(['attack', 'cast', 'hurt', 'taunt', 'dead']);
const PLAYER_STATE_TO_ANIMATION = Object.freeze(
    Object.fromEntries(PLAYER_ANIMATIONS.map((animation) => [animation.state, animation.key]))
);

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
        this.playerProjectiles = [];
        this.playerBehindCellKeys = this.buildPlayerBehindCellKeys();

        this.createMap();
        this.buildBlockedZonesFromMatrix();
        this.buildBlockedEdgeZones();
        this.createGridOverlay();
        this.createPlayer();
        this.createEnemySystems();
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

        const now = this.time.now;

        this.updatePlayerAim();
        this.handlePlayerActionInputs(now);
        this.updatePlayerMovement(now);
        this.updatePlayerProjectiles(now);
        this.updateEnemySpawning(now);
        this.updateEnemies(now);
        this.syncPlayerVisual();
        this.updateGridCursor();
        this.updateHud(now);
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
            right: 'D',
            attack: 'J',
            attackAlt: 'SPACE',
            cast: 'K',
            taunt: 'T',
            hurt: 'H',
            die: 'L',
            restart: 'R'
        });

        const spawnCell = this.cellToCoords(PLAYER_SPAWN_CELL);
        const footX = this.pieceCellCenterX(spawnCell.column);
        const footY = this.pieceCellCenterY(spawnCell.row) + PLAYER_FOOT_Y_OFFSET;

        this.playerHitbox = this.add.zone(
            footX,
            footY - (PLAYER_HITBOX_HEIGHT / 2),
            PLAYER_HITBOX_WIDTH,
            PLAYER_HITBOX_HEIGHT
        );
        this.physics.add.existing(this.playerHitbox);
        this.playerHitbox.body.setAllowGravity(false);
        this.playerHitbox.body.setCollideWorldBounds(true);

        this.playerShadow = this.add.ellipse(footX, footY + PLAYER_SHADOW_OFFSET_Y, 58, 22, 0x000000, 0.18);
        this.playerSprite = this.add.sprite(footX, footY, 'player-idle-0')
            .setOrigin(0.5, 1)
            .setScale(PLAYER_VISUAL_SCALE);

        this.player = {
            actionToken: 0,
            aim: { x: 1, y: 0 },
            facing: 1,
            health: PLAYER_MAX_HEALTH,
            idleBlinkAt: this.time.now + this.randomIdleBlinkDelay(),
            invulnerableUntil: 0,
            maxHealth: PLAYER_MAX_HEALTH,
            nextAttackAt: 0,
            nextCastAt: 0,
            state: 'idle'
        };

        this.playerSprite.on('animationcomplete', this.handlePlayerAnimationComplete, this);
        this.playPlayerAnimationForState('idle');
        this.syncPlayerVisual();
    }

    createPlayerAnimations ()
    {
        for (const animation of PLAYER_ANIMATIONS)
        {
            if (this.anims.exists(animation.key))
            {
                continue;
            }

            this.anims.create({
                key: animation.key,
                frames: this.buildFrameList(animation.key, animation.frames),
                frameRate: animation.frameRate,
                repeat: animation.repeat
            });
        }
    }

    createEnemySystems ()
    {
        this.createEnemyAnimations();
        this.enemies = [];
        this.enemyIdCounter = 0;
        this.nextEnemySpawnAt = this.time.now + ENEMY_SPAWN_DELAY;
    }

    createEnemyAnimations ()
    {
        for (const variant of ENEMY_VARIANTS)
        {
            for (const animation of ENEMY_ANIMATIONS)
            {
                const animationKey = getEnemyAnimationKey(variant, animation.state);

                if (this.anims.exists(animationKey))
                {
                    continue;
                }

                this.anims.create({
                    key: animationKey,
                    frames: this.buildEnemyFrameList(variant, animation.state, animation.frames),
                    frameRate: animation.frameRate,
                    repeat: animation.repeat
                });
            }
        }
    }

    createHud ()
    {
        this.add.text(24, 58, 'WASD mover | Space/J atacar | K cast | Mira com o rato | T taunt | H hurt | L morrer | R restart', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#4a2e18',
            strokeThickness: 6
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.add.text(24, 90, 'Wraith_01 com depth pelos pes + zombies spawnam fora da camera', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.playerStatusText = this.add.text(24, 124, '', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);

        this.cellStatusText = this.add.text(24, 158, '', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#fff3d1',
            stroke: '#4a2e18',
            strokeThickness: 5
        })
            .setScrollFactor(0)
            .setDepth(5000);

        const barX = this.scale.width / 2;

        this.playerHealthBarBg = this.add.rectangle(
            barX,
            PLAYER_HEALTH_BAR_Y,
            PLAYER_HEALTH_BAR_WIDTH,
            PLAYER_HEALTH_BAR_HEIGHT,
            0x7f1d1d,
            0.9
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(5000);

        this.playerHealthBarFill = this.add.rectangle(
            barX - (PLAYER_HEALTH_BAR_WIDTH / 2),
            PLAYER_HEALTH_BAR_Y,
            PLAYER_HEALTH_BAR_WIDTH,
            PLAYER_HEALTH_BAR_HEIGHT,
            0x2ecc71,
            0.95
        )
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(5001);

        this.playerHealthBarLabel = this.add.text(barX, PLAYER_HEALTH_BAR_Y, 'PLAYER HP', {
            fontFamily: 'Arial Black',
            fontSize: 12,
            color: '#fff7ed',
            stroke: '#3f1d0d',
            strokeThickness: 3
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(5002);
    }

    syncPlayerVisual ()
    {
        const feet = this.getPlayerFeetPosition();
        const pieceCell = this.getPieceCellAtWorldPosition(feet.x, feet.y);
        const playerBehindForeground = pieceCell && this.isPlayerBehindCell(pieceCell);
        const playerDepth = playerBehindForeground ? feet.y - PLAYER_DEPTH_BEHIND_OFFSET : feet.y + PLAYER_DEPTH_FRONT_OFFSET;

        this.playerShadow.setPosition(feet.x, feet.y + PLAYER_SHADOW_OFFSET_Y);
        this.playerShadow.setDepth(playerDepth - 3);
        this.playerShadow.setAlpha(this.player.state === 'dead' ? 0.1 : 0.18);

        this.playerSprite.setPosition(feet.x, feet.y);
        this.playerSprite.setFlipX(this.player.facing < 0);
        this.playerSprite.setDepth(playerDepth);
    }

    isPlayerBehindCell (pieceCell)
    {
        return this.playerBehindCellKeys.has(this.cellKey(pieceCell.column, pieceCell.row));
    }

    buildFrameList (prefix, frameCount)
    {
        return Array.from({ length: frameCount }, (_, index) => ({ key: `${prefix}-${index}` }));
    }

    buildEnemyFrameList (variant, state, frameCount)
    {
        return Array.from({ length: frameCount }, (_, index) => ({ key: getEnemyFrameKey(variant, state, index + 1) }));
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

    enableZoneCollisionsFor (target)
    {
        for (const zone of this.staticZones)
        {
            this.physics.add.collider(target, zone);
        }
    }

    updateGridCursor ()
    {
        const feet = this.getPlayerFeetPosition();
        const pieceCell = this.getPieceCellAtWorldPosition(feet.x, feet.y);
        const walkCell = this.getWalkCellAtWorldPosition(feet.x, feet.y);

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

    updateHud (now)
    {
        const attackCooldown = this.formatCooldown(this.player.nextAttackAt - now);
        const castCooldown = this.formatCooldown(this.player.nextCastAt - now);
        const restartHint = this.player.state === 'dead' ? ' | R para reiniciar' : '';
        const enemies = this.getLivingEnemyCount();
        const healthRatio = this.player.health / this.player.maxHealth;

        this.playerStatusText.setText(
            `Estado: ${this.player.state} | HP: ${this.player.health}/${this.player.maxHealth} | Inimigos: ${enemies} | Atk: ${attackCooldown} | Cast: ${castCooldown}${restartHint}`
        );

        this.playerHealthBarFill.width = Math.max(0, PLAYER_HEALTH_BAR_WIDTH * healthRatio);
    }

    updatePlayerAim ()
    {
        const feet = this.getPlayerFeetPosition();
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const deltaX = worldPoint.x - feet.x;
        const deltaY = worldPoint.y - (feet.y - 30);
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < PLAYER_AIM_MIN_DISTANCE)
        {
            return;
        }

        this.player.aim.x = deltaX / distance;
        this.player.aim.y = deltaY / distance;

        if (Math.abs(this.player.aim.x) > 0.08)
        {
            this.player.facing = this.player.aim.x < 0 ? -1 : 1;
        }
    }

    updateEnemySpawning (now)
    {
        if (this.player.state === 'dead' || now < this.nextEnemySpawnAt)
        {
            return;
        }

        if (this.getLivingEnemyCount() >= ENEMY_MAX_COUNT)
        {
            this.nextEnemySpawnAt = now + ENEMY_SPAWN_INTERVAL;
            return;
        }

        const spawnPoint = this.findEnemySpawnPoint();

        this.nextEnemySpawnAt = now + ENEMY_SPAWN_INTERVAL + PhaserMath.Between(-ENEMY_SPAWN_VARIANCE, ENEMY_SPAWN_VARIANCE);

        if (!spawnPoint)
        {
            return;
        }

        this.spawnEnemy(spawnPoint.x, spawnPoint.y);
    }

    updateEnemies (now)
    {
        for (let index = this.enemies.length - 1; index >= 0; index--)
        {
            const enemy = this.enemies[index];

            if (!enemy.hitbox.active || !enemy.sprite.active)
            {
                this.enemies.splice(index, 1);
                continue;
            }

            if (enemy.state === 'dead')
            {
                if (enemy.hitbox.body.enable)
                {
                    enemy.hitbox.body.setVelocity(0, 0);
                }

                if (now >= enemy.removeAt)
                {
                    this.destroyEnemy(enemy);
                    this.enemies.splice(index, 1);
                    continue;
                }

                this.syncEnemyVisual(enemy);
                continue;
            }

            if (enemy.state === 'jump' || enemy.state === 'hurt' || enemy.state === 'attack')
            {
                enemy.hitbox.body.setVelocity(0, 0);
                this.syncEnemyVisual(enemy);
                continue;
            }

            if (this.player.state === 'dead')
            {
                enemy.hitbox.body.setVelocity(0, 0);

                if (enemy.state !== 'idle')
                {
                    enemy.idleUntil = now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS);
                    this.setEnemyState(enemy, 'idle');
                }

                this.syncEnemyVisual(enemy);
                continue;
            }

            if (enemy.state === 'idle' && now < enemy.idleUntil)
            {
                enemy.hitbox.body.setVelocity(0, 0);
                this.syncEnemyVisual(enemy);
                continue;
            }

            const enemyFeet = this.getEnemyFeetPosition(enemy);
            const playerFeet = this.getPlayerFeetPosition();
            const deltaX = playerFeet.x - enemyFeet.x;
            const deltaY = playerFeet.y - enemyFeet.y;
            const distance = Math.hypot(deltaX, deltaY);

            if (deltaX !== 0)
            {
                enemy.facing = deltaX < 0 ? -1 : 1;
            }

            if (distance <= ENEMY_ATTACK_RANGE)
            {
                enemy.hitbox.body.setVelocity(0, 0);

                if (now >= enemy.nextAttackAt)
                {
                    this.startEnemyAttack(enemy, now);
                }
                else
                {
                    enemy.idleUntil = now + 90;
                    this.setEnemyState(enemy, 'idle');
                }

                this.syncEnemyVisual(enemy);
                continue;
            }

            const speed = distance > ENEMY_RUN_DISTANCE ? ENEMY_WALK_SPEED : ENEMY_RUN_SPEED;
            const state = distance > ENEMY_RUN_DISTANCE ? 'walk' : 'run';
            const length = distance || 1;

            enemy.hitbox.body.setVelocity(
                (deltaX / length) * speed,
                (deltaY / length) * speed
            );
            this.setEnemyState(enemy, state);
            this.syncEnemyVisual(enemy);
        }
    }

    spawnEnemy (feetX, feetY)
    {
        const variant = ENEMY_VARIANTS[PhaserMath.Between(0, ENEMY_VARIANTS.length - 1)];
        const health = variant === 'Zombie3' ? 4 : 3;
        const enemy = {
            actionToken: 0,
            attackToken: 0,
            facing: feetX >= this.getPlayerFeetPosition().x ? -1 : 1,
            health,
            healthBarBg: this.add.rectangle(feetX, feetY - ENEMY_HEALTH_BAR_OFFSET_Y, ENEMY_HEALTH_BAR_WIDTH, ENEMY_HEALTH_BAR_HEIGHT, 0x7f1d1d, 0.92)
                .setVisible(false),
            healthBarFill: this.add.rectangle(feetX - (ENEMY_HEALTH_BAR_WIDTH / 2), feetY - ENEMY_HEALTH_BAR_OFFSET_Y, ENEMY_HEALTH_BAR_WIDTH, ENEMY_HEALTH_BAR_HEIGHT, 0x2ecc71, 0.98)
                .setOrigin(0, 0.5)
                .setVisible(false),
            hitbox: this.add.zone(feetX, feetY - (ENEMY_HITBOX_HEIGHT / 2), ENEMY_HITBOX_WIDTH, ENEMY_HITBOX_HEIGHT),
            id: ++this.enemyIdCounter,
            idleUntil: this.time.now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS),
            invulnerableUntil: 0,
            maxHealth: health,
            nextAttackAt: this.time.now + 320,
            removeAt: 0,
            shadow: this.add.ellipse(feetX, feetY + ENEMY_SHADOW_OFFSET_Y, 46, 18, 0x000000, 0.16),
            sprite: this.add.sprite(feetX, feetY, getEnemyFrameKey(variant, 'idle', 1))
                .setOrigin(0.5, 1)
                .setScale(ENEMY_VISUAL_SCALE),
            state: 'jump',
            variant
        };

        this.physics.add.existing(enemy.hitbox);
        enemy.hitbox.body.setAllowGravity(false);
        enemy.hitbox.body.setCollideWorldBounds(true);
        this.enableZoneCollisionsFor(enemy.hitbox);

        enemy.sprite.on('animationcomplete', (animation) => {

            this.handleEnemyAnimationComplete(enemy, animation);

        });

        this.enemies.push(enemy);
        this.playEnemyAnimationForState(enemy, 'jump');
        this.syncEnemyVisual(enemy);
    }

    startEnemyAttack (enemy, now)
    {
        const token = ++enemy.attackToken;

        enemy.nextAttackAt = now + ENEMY_ATTACK_COOLDOWN;
        enemy.hitbox.body.setVelocity(0, 0);
        this.setEnemyState(enemy, 'attack');

        this.time.delayedCall(320, () => {

            if (!enemy.hitbox.active || enemy.state !== 'attack' || enemy.attackToken !== token)
            {
                return;
            }

            const enemyFeet = this.getEnemyFeetPosition(enemy);
            const playerFeet = this.getPlayerFeetPosition();

            if (Math.hypot(playerFeet.x - enemyFeet.x, playerFeet.y - enemyFeet.y) <= ENEMY_ATTACK_RANGE + 10)
            {
                this.applyPlayerDamage(ENEMY_ATTACK_DAMAGE);
            }

        });
    }

    setEnemyState (enemy, state)
    {
        if (enemy.state === state)
        {
            if (state === 'idle' || state === 'walk' || state === 'run')
            {
                this.playEnemyAnimationForState(enemy, state);
            }

            return;
        }

        enemy.state = state;
        this.playEnemyAnimationForState(enemy, state);
    }

    playEnemyAnimationForState (enemy, state)
    {
        const animationKey = getEnemyAnimationKey(enemy.variant, state);

        if (!this.anims.exists(animationKey))
        {
            return;
        }

        if (enemy.sprite.anims.currentAnim?.key === animationKey)
        {
            return;
        }

        enemy.sprite.anims.play(animationKey, true);
    }

    handleEnemyAnimationComplete (enemy, animation)
    {
        if (!enemy.sprite.active || enemy.state === 'dead')
        {
            return;
        }

        if (animation.key === getEnemyAnimationKey(enemy.variant, 'jump'))
        {
            enemy.idleUntil = this.time.now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS);
            this.setEnemyState(enemy, 'idle');
            return;
        }

        if (
            animation.key === getEnemyAnimationKey(enemy.variant, 'attack') ||
            animation.key === getEnemyAnimationKey(enemy.variant, 'hurt')
        )
        {
            enemy.idleUntil = this.time.now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS);
            this.setEnemyState(enemy, 'idle');
        }
    }

    syncEnemyVisual (enemy)
    {
        const feet = this.getEnemyFeetPosition(enemy);
        const pieceCell = this.getPieceCellAtWorldPosition(feet.x, feet.y);
        const behindForeground = pieceCell && this.isPlayerBehindCell(pieceCell);
        const depth = behindForeground ? feet.y - PLAYER_DEPTH_BEHIND_OFFSET : feet.y + 1;

        enemy.shadow.setPosition(feet.x, feet.y + ENEMY_SHADOW_OFFSET_Y);
        enemy.shadow.setDepth(depth - 3);
        enemy.shadow.setAlpha(enemy.state === 'dead' ? 0.08 : 0.16);

        enemy.sprite.setPosition(feet.x, feet.y);
        enemy.sprite.setFlipX(enemy.facing < 0);
        enemy.sprite.setDepth(depth);

        this.updateEnemyHealthBar(enemy, depth);
    }

    getEnemyFeetPosition (enemy)
    {
        return {
            x: enemy.hitbox.x,
            y: enemy.hitbox.y + (ENEMY_HITBOX_HEIGHT / 2)
        };
    }

    findEnemySpawnPoint ()
    {
        const cameraView = this.cameras.main.worldView;

        for (let attempts = 0; attempts < 90; attempts++)
        {
            const column = PhaserMath.Between(0, WALK_COLUMNS - 1);
            const row = PhaserMath.Between(0, WALK_ROWS - 1);

            if (!this.isWalkable(column, row))
            {
                continue;
            }

            const x = this.walkCellLeft(column) + (WALK_CELL_WIDTH / 2);
            const y = this.walkCellTop(row) + (WALK_CELL_HEIGHT / 2);

            if (this.isInsideExpandedCameraView(cameraView, x, y, ENEMY_SPAWN_VIEW_MARGIN))
            {
                continue;
            }

            const playerFeet = this.getPlayerFeetPosition();

            if (Math.hypot(playerFeet.x - x, playerFeet.y - y) < ENEMY_MIN_PLAYER_DISTANCE)
            {
                continue;
            }

            return { x, y };
        }

        return null;
    }

    isInsideExpandedCameraView (view, x, y, margin)
    {
        return (
            x >= view.x - margin &&
            x <= view.x + view.width + margin &&
            y >= view.y - margin &&
            y <= view.y + view.height + margin
        );
    }

    getLivingEnemyCount ()
    {
        return this.enemies.filter((enemy) => enemy.state !== 'dead').length;
    }

    updateEnemyHealthBar (enemy, depth)
    {
        const visible = enemy.state !== 'dead' && enemy.health < enemy.maxHealth;
        const ratio = enemy.health / enemy.maxHealth;
        const feet = this.getEnemyFeetPosition(enemy);
        const barY = feet.y - ENEMY_HEALTH_BAR_OFFSET_Y;

        enemy.healthBarBg.setVisible(visible);
        enemy.healthBarFill.setVisible(visible);

        if (!visible)
        {
            return;
        }

        enemy.healthBarBg.setPosition(feet.x, barY);
        enemy.healthBarBg.setDepth(depth + 2);

        enemy.healthBarFill.setPosition(feet.x - (ENEMY_HEALTH_BAR_WIDTH / 2), barY);
        enemy.healthBarFill.width = Math.max(0, ENEMY_HEALTH_BAR_WIDTH * ratio);
        enemy.healthBarFill.setDepth(depth + 3);
    }

    handlePlayerActionInputs (now)
    {
        if (this.player.state === 'dead')
        {
            if (Input.Keyboard.JustDown(this.keys.restart))
            {
                this.scene.restart();
            }

            return;
        }

        if (Input.Keyboard.JustDown(this.keys.die))
        {
            this.killPlayer();
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.hurt))
        {
            this.applyPlayerDamage(1);
            return;
        }

        if (
            (Input.Keyboard.JustDown(this.keys.attack) || Input.Keyboard.JustDown(this.keys.attackAlt)) &&
            this.canStartPlayerAction(now, 'attack')
        )
        {
            this.startPlayerAction('attack', now);
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.cast) && this.canStartPlayerAction(now, 'cast'))
        {
            this.startPlayerAction('cast', now);
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.taunt) && this.canStartPlayerAction(now, 'taunt'))
        {
            this.startPlayerAction('taunt', now);
        }
    }

    updatePlayerMovement (now)
    {
        if (this.player.state === 'dead' || PLAYER_ACTION_STATES.has(this.player.state))
        {
            this.playerHitbox.body.setVelocity(0, 0);
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

            this.player.idleBlinkAt = now + this.randomIdleBlinkDelay();
            this.setPlayerState('walk');

            return;
        }

        this.playerHitbox.body.setVelocity(0, 0);

        if (this.player.state === 'walk')
        {
            this.setPlayerState('idle');
        }

        if (this.player.state === 'idle' && now >= this.player.idleBlinkAt)
        {
            this.setPlayerState('idle-blink');
            this.player.idleBlinkAt = now + this.randomIdleBlinkDelay();
        }
    }

    updatePlayerProjectiles (now)
    {
        for (let index = this.playerProjectiles.length - 1; index >= 0; index--)
        {
            const projectile = this.playerProjectiles[index];

            if (!projectile.active)
            {
                this.playerProjectiles.splice(index, 1);
                continue;
            }

            projectile.setDepth(projectile.y + 6);

            const hitEnemy = this.findEnemyHitByProjectile(projectile);

            if (hitEnemy)
            {
                this.applyDamageToEnemy(hitEnemy, PLAYER_PROJECTILE_DAMAGE);
                projectile.destroy();
                this.playerProjectiles.splice(index, 1);
                continue;
            }

            if (
                now >= projectile.expireAt ||
                projectile.x < CAMERA_BOUNDS.x - 80 ||
                projectile.x > CAMERA_BOUNDS.x + CAMERA_BOUNDS.width + 80
            )
            {
                projectile.destroy();
                this.playerProjectiles.splice(index, 1);
            }
        }
    }

    canStartPlayerAction (now, state)
    {
        if (PLAYER_ACTION_STATES.has(this.player.state))
        {
            return false;
        }

        if (state === 'attack' && now < this.player.nextAttackAt)
        {
            return false;
        }

        if (state === 'cast' && now < this.player.nextCastAt)
        {
            return false;
        }

        return true;
    }

    startPlayerAction (state, now)
    {
        const token = ++this.player.actionToken;

        this.playerHitbox.body.setVelocity(0, 0);
        this.setPlayerState(state);

        if (state === 'attack')
        {
            this.player.nextAttackAt = now + PLAYER_ATTACK_COOLDOWN;
            this.time.delayedCall(160, () => {

                if (this.isPlayerActionTokenActive(token, 'attack'))
                {
                    this.spawnAttackEffect();
                }

            });

            return;
        }

        if (state === 'cast')
        {
            this.player.nextCastAt = now + PLAYER_CAST_COOLDOWN;
            this.spawnCastChargeEffect();

            this.time.delayedCall(320, () => {

                if (this.isPlayerActionTokenActive(token, 'cast'))
                {
                    this.spawnCastProjectile(now);
                }

            });

            return;
        }

        if (state === 'hurt')
        {
            this.flashPlayerDamage();
        }
    }

    setPlayerState (state)
    {
        if (this.player.state === state)
        {
            if (state === 'idle' || state === 'walk')
            {
                this.playPlayerAnimationForState(state);
            }

            return;
        }

        this.player.state = state;
        this.playPlayerAnimationForState(state);
    }

    playPlayerAnimationForState (state)
    {
        const animationKey = PLAYER_STATE_TO_ANIMATION[state];

        if (!animationKey)
        {
            return;
        }

        if (this.playerSprite.anims.currentAnim?.key === animationKey)
        {
            return;
        }

        this.playerSprite.anims.play(animationKey, true);
    }

    handlePlayerAnimationComplete (animation)
    {
        if (animation.key === PLAYER_STATE_TO_ANIMATION.dead)
        {
            return;
        }

        if (animation.key === PLAYER_STATE_TO_ANIMATION['idle-blink'])
        {
            this.setPlayerState('idle');
            return;
        }

        if (
            animation.key === PLAYER_STATE_TO_ANIMATION.attack ||
            animation.key === PLAYER_STATE_TO_ANIMATION.cast ||
            animation.key === PLAYER_STATE_TO_ANIMATION.hurt ||
            animation.key === PLAYER_STATE_TO_ANIMATION.taunt
        )
        {
            this.setPlayerState('idle');
            this.player.idleBlinkAt = this.time.now + this.randomIdleBlinkDelay();
        }
    }

    applyPlayerDamage (damage)
    {
        if (this.player.state === 'dead' || this.time.now < this.player.invulnerableUntil)
        {
            return;
        }

        this.player.health = Math.max(0, this.player.health - damage);
        this.player.invulnerableUntil = this.time.now + PLAYER_INVULNERABILITY_MS;

        if (this.player.health <= 0)
        {
            this.killPlayer();
            return;
        }

        this.startPlayerAction('hurt', this.time.now);
    }

    killPlayer ()
    {
        if (this.player.state === 'dead')
        {
            return;
        }

        this.player.health = 0;
        this.playerHitbox.body.setVelocity(0, 0);
        this.setPlayerState('dead');
        this.cameras.main.shake(180, 0.0025);
    }

    flashPlayerDamage ()
    {
        this.playerSprite.setTint(0xffb4a2);

        this.tweens.add({
            targets: this.playerSprite,
            alpha: 0.35,
            duration: 70,
            yoyo: true,
            repeat: 5,
            onComplete: () => {

                if (!this.playerSprite.active)
                {
                    return;
                }

                this.playerSprite.clearTint();
                this.playerSprite.setAlpha(1);

            }
        });
    }

    spawnAttackEffect ()
    {
        const feet = this.getPlayerFeetPosition();
        const aim = this.getPlayerAimVector();
        const attackX = feet.x + (aim.x * PLAYER_ATTACK_EFFECT_DISTANCE);
        const attackY = feet.y - 30 + (aim.y * 26);
        const slash = this.add.rectangle(
            attackX,
            attackY,
            74,
            28,
            0xffd37a,
            0.5
        )
            .setDepth(this.playerSprite.depth + 1)
            .setRotation(Math.atan2(aim.y, aim.x));

        this.applyDamageToEnemiesInRadius(attackX, attackY, 48, PLAYER_ATTACK_DAMAGE);

        this.tweens.add({
            targets: slash,
            alpha: 0,
            scaleX: 1.45,
            scaleY: 0.8,
            duration: 180,
            onComplete: () => {

                slash.destroy();

            }
        });
    }

    spawnCastChargeEffect ()
    {
        const feet = this.getPlayerFeetPosition();
        const ring = this.add.circle(feet.x, feet.y - 34, 16, 0x93f7ff, 0.25)
            .setDepth(this.playerSprite.depth + 1)
            .setScale(0.35);

        this.tweens.add({
            targets: ring,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 280,
            onComplete: () => {

                ring.destroy();

            }
        });
    }

    spawnCastProjectile ()
    {
        const feet = this.getPlayerFeetPosition();
        const aim = this.getPlayerAimVector();
        const projectile = this.add.circle(
            feet.x + (aim.x * PLAYER_PROJECTILE_OFFSET_X),
            feet.y - PLAYER_PROJECTILE_OFFSET_Y + (aim.y * 18),
            10,
            0x9bf6ff,
            0.95
        );

        this.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocity(aim.x * PLAYER_PROJECTILE_SPEED, aim.y * PLAYER_PROJECTILE_SPEED);
        projectile.expireAt = this.time.now + PLAYER_PROJECTILE_LIFETIME;
        projectile.setDepth(projectile.y + 6);

        this.playerProjectiles.push(projectile);
    }

    findEnemyHitByProjectile (projectile)
    {
        for (const enemy of this.enemies)
        {
            if (enemy.state === 'dead')
            {
                continue;
            }

            if (
                Math.abs(projectile.x - enemy.hitbox.x) <= (ENEMY_HITBOX_WIDTH / 2) + projectile.radius &&
                Math.abs(projectile.y - enemy.hitbox.y) <= (ENEMY_HITBOX_HEIGHT / 2) + projectile.radius + 10
            )
            {
                return enemy;
            }
        }

        return null;
    }

    applyDamageToEnemiesInRadius (centerX, centerY, radius, damage)
    {
        for (const enemy of this.enemies)
        {
            if (enemy.state === 'dead')
            {
                continue;
            }

            const feet = this.getEnemyFeetPosition(enemy);

            if (Math.hypot(feet.x - centerX, feet.y - centerY) <= radius)
            {
                this.applyDamageToEnemy(enemy, damage);
            }
        }
    }

    applyDamageToEnemy (enemy, damage)
    {
        if (enemy.state === 'dead' || this.time.now < enemy.invulnerableUntil)
        {
            return;
        }

        enemy.health = Math.max(0, enemy.health - damage);
        enemy.invulnerableUntil = this.time.now + ENEMY_HIT_INVULNERABILITY_MS;

        if (enemy.health <= 0)
        {
            this.killEnemy(enemy);
            return;
        }

        ++enemy.actionToken;
        enemy.hitbox.body.setVelocity(0, 0);
        enemy.idleUntil = this.time.now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS);
        this.setEnemyState(enemy, 'hurt');
        this.flashEnemyDamage(enemy);
    }

    killEnemy (enemy)
    {
        if (enemy.state === 'dead')
        {
            return;
        }

        enemy.health = 0;
        enemy.removeAt = this.time.now + ENEMY_CORPSE_DURATION;
        enemy.hitbox.body.setVelocity(0, 0);
        enemy.hitbox.body.enable = false;
        enemy.shadow.setAlpha(0.08);
        ++enemy.actionToken;
        this.setEnemyState(enemy, 'dead');
    }

    flashEnemyDamage (enemy)
    {
        enemy.sprite.setTint(0xffa07a);

        this.tweens.add({
            targets: enemy.sprite,
            alpha: 0.45,
            duration: 55,
            yoyo: true,
            repeat: 3,
            onComplete: () => {

                if (!enemy.sprite.active)
                {
                    return;
                }

                enemy.sprite.clearTint();
                enemy.sprite.setAlpha(1);

            }
        });
    }

    destroyEnemy (enemy)
    {
        enemy.healthBarBg.destroy();
        enemy.healthBarFill.destroy();
        enemy.sprite.destroy();
        enemy.shadow.destroy();
        enemy.hitbox.destroy();
    }

    isPlayerActionTokenActive (token, state)
    {
        return this.player.state === state && this.player.actionToken === token;
    }

    getPlayerFeetPosition ()
    {
        return {
            x: this.playerHitbox.x,
            y: this.playerHitbox.y + (PLAYER_HITBOX_HEIGHT / 2)
        };
    }

    getPlayerAimVector ()
    {
        return this.player.aim ?? { x: this.player.facing, y: 0 };
    }

    randomIdleBlinkDelay ()
    {
        return PhaserMath.Between(PLAYER_IDLE_BLINK_MIN_DELAY, PLAYER_IDLE_BLINK_MAX_DELAY);
    }

    formatCooldown (remainingMs)
    {
        if (remainingMs <= 0)
        {
            return 'pronto';
        }

        return `${(remainingMs / 1000).toFixed(1)}s`;
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
