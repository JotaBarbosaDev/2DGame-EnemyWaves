import { Input, Math as PhaserMath, Scene } from 'phaser';
import {
    ENEMY_ANIMATIONS,
    ENEMY_VARIANTS,
    getEnemyAnimationKey,
    getEnemyFrameKey
} from '../data/enemyAnimations';
import { getEnemyTypeConfig } from '../data/enemyTypes';
import {
    PLAYER_CHARACTERS,
    getPlayerCharacterByAssetId,
    getNextPlayerCharacter
} from '../data/playerCharacters';
import {
    PLAYER_ANIMATIONS,
    getPlayerAnimationKey,
    getPlayerFrameKey
} from '../data/playerAnimations';
import {
    PLAYER_TOTAL_UPGRADE_POINTS,
    PLAYER_UPGRADES,
    buildInitialUpgradeState,
    getPlayerUpgradeById
} from '../data/playerUpgrades';
import { DEFAULT_GAME_SETTINGS } from '../data/settings';
import { HudSystem } from '../systems/HudSystem';
import { MapSystem } from '../systems/MapSystem';
import {
    applyDocumentLocalization,
    getLanguage,
    t
} from '../i18n';

import {
    MAP_RENDER_SCALE,
    TILE_WIDTH,
    TILE_ROW_STEP,
    PIECE_COLUMNS,
    PIECE_ROWS,
    GRID_ORIGIN_X,
    GRID_ORIGIN_Y,
    MAP_BACKGROUND_COLOR,
    COLUMN_LABELS,
    WALK_COLUMNS,
    WALK_ROWS,
    PIECE_CELL_HEIGHT,
    WALK_CELL_WIDTH,
    WALK_CELL_HEIGHT,
    WALK_ORIGIN_X,
    WALK_ORIGIN_Y,
    PLAYER_SPAWN,
    PLAYER_VISUAL_SCALE,
    PLAYER_HITBOX_WIDTH,
    PLAYER_HITBOX_HEIGHT,
    PLAYER_FOOT_Y_OFFSET,
    PLAYER_SHADOW_OFFSET_Y,
    PLAYER_INVULNERABILITY_MS,
    PLAYER_IDLE_BLINK_MIN_DELAY,
    PLAYER_IDLE_BLINK_MAX_DELAY,
    PLAYER_ATTACK_EFFECT_DISTANCE,
    PLAYER_PROJECTILE_LIFETIME,
    PLAYER_PROJECTILE_OFFSET_X,
    PLAYER_PROJECTILE_OFFSET_Y,
    PLAYER_DEPTH_FRONT_OFFSET,
    PLAYER_AIM_MIN_DISTANCE,
    PLAYER_HEALTH_BAR_WIDTH,
    PLAYER_HEALTH_BAR_HEIGHT,
    PLAYER_SCORE_PER_WAVE_CLEAR,
    PLAYER_BASE_PICKUP_RADIUS,
    PLAYER_BASE_REGEN_DELAY,
    ENEMY_VISUAL_SCALE,
    ENEMY_HITBOX_WIDTH,
    ENEMY_HITBOX_HEIGHT,
    ENEMY_SHADOW_OFFSET_Y,
    ENEMY_SPAWN_DELAY,
    ENEMY_SPAWN_INTERVAL,
    ENEMY_SPAWN_VARIANCE,
    ENEMY_SPAWN_VIEW_MARGIN,
    ENEMY_MIN_PLAYER_DISTANCE,
    ENEMY_RUN_DISTANCE,
    ENEMY_ATTACK_RANGE,
    ENEMY_IDLE_MIN_MS,
    ENEMY_IDLE_MAX_MS,
    ENEMY_CORPSE_DURATION,
    ENEMY_HIT_INVULNERABILITY_MS,
    ENEMY_HEALTH_BAR_WIDTH,
    ENEMY_HEALTH_BAR_HEIGHT,
    ENEMY_HEALTH_BAR_OFFSET_Y,
    WAVE_BREAK_DURATION,
    WAVE_BASE_ENEMY_COUNT,
    WAVE_ENEMY_GROWTH,
    WAVE_CONCURRENT_BASE,
    WAVE_CONCURRENT_MAX,
    FINAL_WAVE,
    ESSENCE_DROP_BASE_CHANCE,
    ESSENCE_DROP_WAVE_BONUS,
    ESSENCE_DROP_MAGNET_SPEED,
    ESSENCE_DROP_PICKUP_DISTANCE,
    PLAYER_ACTION_STATES,
    COLLISION_LAYER_NAMES
} from '../data/gameConstants';
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


export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.settings = this.registry.get('settings') ?? { ...DEFAULT_GAME_SETTINGS };
        this.language = getLanguage(this.settings);
        this.devMode = Boolean(this.settings.devMode);

        applyDocumentLocalization(this.language);

        this.cameras.main.setBackgroundColor(MAP_BACKGROUND_COLOR);
        this.physics.world.setBounds(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
        this.staticZones = [];
        this.playerProjectiles = [];
        this.createMap();
        this.buildBlockedZonesFromMatrix();
        if (this.devMode)
        {
            this.createGridOverlay();
        }
        this.createPlayer();
        this.createEnemySystems();
        this.createProgressionSystems();
        this.enableZoneCollisions();
        this.createHud();

        this.cameras.main.setBounds(CAMERA_BOUNDS.x, CAMERA_BOUNDS.y, CAMERA_BOUNDS.width, CAMERA_BOUNDS.height);
        this.cameras.main.startFollow(this.playerHitbox, true, 0.12, 0.12);
        this.cameras.main.setZoom(0.88);
    }

    translate (key, params)
    {
        return t(this.language, key, params);
    }

    getPresentedCharacter (character)
    {
        if (!character)
        {
            return null;
        }

        return {
            ...character,
            label: this.translate(character.labelKey),
            traits: character.traitKeys.map((traitKey) => this.translate(traitKey))
        };
    }

    getCharacterLabelByAssetId (assetId)
    {
        const character = getPlayerCharacterByAssetId(assetId);

        return this.translate(character.labelKey);
    }

    getUpgradeLabel (upgrade)
    {
        return this.translate(upgrade.labelKey);
    }

    playSfx (key, config = {})
    {
        if (!this.sound?.play || !this.cache.audio.exists(key))
        {
            return;
        }

        try
        {
            this.sound.play(key, config);
        }
        catch
        {
            // Ignore transient browser audio lock failures.
        }
    }

    restartRun ()
    {
        this.scene.restart();
    }

    update ()
    {
        if (!this.playerHitbox || !this.playerSprite)
        {
            return;
        }

        const now = this.time.now;

        if (Input.Keyboard.JustDown(this.keys.restart))
        {
            this.restartRun();
            return;
        }

        if (this.player.gameOverQueued)
        {
            this.syncPlayerVisual();
            if (this.devMode)
            {
                this.updateGridCursor();
            }
            this.updateHud(now);
            this.refreshEvolutionPanel();
            return;
        }

        this.updatePlayerAim();
        this.handleProgressionInputs();
        this.updatePlayerRegeneration(now);

        if (this.progression.menuOpen)
        {
            this.syncPlayerVisual();
            if (this.devMode)
            {
                this.updateGridCursor();
            }
            this.updateHud(now);
            this.refreshEvolutionPanel();
            return;
        }

        this.handlePlayerActionInputs(now);
        this.updatePlayerMovement(now);
        this.updatePlayerProjectiles(now);
        this.updateEssenceDrops();
        this.updateEnemySpawning(now);
        this.updateEnemies(now);
        this.syncPlayerVisual();
        if (this.devMode)
        {
            this.updateGridCursor();
        }
        this.updateHud(now);
        this.refreshEvolutionPanel();
    }

    createPlayer ()
    {
        this.createPlayerAnimations();
        const character = this.getPresentedCharacter(PLAYER_CHARACTERS[0]);

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            left: 'A',
            down: 'S',
            right: 'D',
            attack: 'J',
            attackAlt: 'SPACE',
            attackThird: 'K',
            cast: 'E',
            taunt: 'T',
            hurt: 'H',
            die: 'L',
            restart: 'R',
            buildMenu: 'U',
            buildClose: 'ESC',
            evolve: 'N',
            upgrade1: 'ONE',
            upgrade2: 'TWO',
            upgrade3: 'THREE',
            upgrade4: 'FOUR',
            upgrade5: 'FIVE',
            upgrade6: 'SIX'
        });
        this.pointerQueuedAttack = false;
        this.pointerQueuedCast = false;
        this.input.mouse.disableContextMenu();
        this.input.on('pointerdown', (pointer) => {

            if (pointer.leftButtonDown())
            {
                this.pointerQueuedAttack = true;
            }

            if (pointer.rightButtonDown())
            {
                this.pointerQueuedCast = true;
            }

        });

        const footX = this.pieceCellCenterX(PLAYER_SPAWN.column);
        const footY = this.pieceCellCenterY(PLAYER_SPAWN.row) + PLAYER_FOOT_Y_OFFSET;

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
        this.playerSprite = this.add.sprite(footX, footY, getPlayerFrameKey(character.assetId, 'idle', 0))
            .setOrigin(0.5, 1)
            .setScale(PLAYER_VISUAL_SCALE);

        this.player = {
            actionToken: 0,
            aim: { x: 1, y: 0 },
            character,
            facing: 1,
            gameOverQueued: false,
            health: character.maxHealth,
            idleBlinkAt: this.time.now + this.randomIdleBlinkDelay(),
            invulnerableUntil: 0,
            lastDamageAt: -PLAYER_BASE_REGEN_DELAY,
            maxHealth: character.maxHealth,
            nextAttackAt: 0,
            nextCastAt: 0,
            state: 'idle',
            stats: null
        };

        this.playerSprite.on('animationcomplete', this.handlePlayerAnimationComplete, this);
        this.playPlayerAnimationForState('idle');
        this.syncPlayerVisual();
    }

    createPlayerAnimations ()
    {
        for (const character of PLAYER_CHARACTERS)
        {
            for (const animation of PLAYER_ANIMATIONS)
            {
                const animationKey = getPlayerAnimationKey(character.assetId, animation.state);

                if (this.anims.exists(animationKey))
                {
                    continue;
                }

                this.anims.create({
                    key: animationKey,
                    frames: this.buildPlayerFrameList(character.assetId, animation.state, animation.frames),
                    frameRate: animation.frameRate,
                    repeat: animation.repeat
                });
            }
        }
    }

    createEnemySystems ()
    {
        this.createEnemyAnimations();
        this.enemies = [];
        this.enemyIdCounter = 0;
        this.score = 0;
        this.wave = {
            active: false,
            clearedAt: 0,
            current: 0,
            enemiesToSpawn: 0,
            spawned: 0,
            upcomingAt: this.time.now + ENEMY_SPAWN_DELAY
        };
        this.nextEnemySpawnAt = this.time.now + ENEMY_SPAWN_DELAY;
    }

    createProgressionSystems ()
    {
        this.essenceDrops = [];
        this.progression = {
            essence: 0,
            menuOpen: false,
            totalSpent: 0,
            upgrades: buildInitialUpgradeState()
        };

        this.recalculatePlayerStats({ fullHeal: true });
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

    handleProgressionInputs ()
    {
        if (!this.progression)
        {
            return;
        }

        if (this.player.state === 'dead')
        {
            this.progression.menuOpen = false;
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.buildMenu))
        {
            this.progression.menuOpen = !this.progression.menuOpen;
            return;
        }

        if (!this.progression.menuOpen)
        {
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.buildClose))
        {
            this.progression.menuOpen = false;
            return;
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade1))
        {
            this.spendUpgradePoint('mobility');
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade2))
        {
            this.spendUpgradePoint('assault');
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade3))
        {
            this.spendUpgradePoint('haste');
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade4))
        {
            this.spendUpgradePoint('arcana');
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade5))
        {
            this.spendUpgradePoint('fortitude');
        }

        if (Input.Keyboard.JustDown(this.keys.upgrade6))
        {
            this.spendUpgradePoint('regeneration');
        }

        if (Input.Keyboard.JustDown(this.keys.evolve))
        {
            this.evolvePlayer();
        }
    }

    updateEssenceDrops ()
    {
        const deltaSeconds = this.game.loop.delta / 1000;
        const pickupRadius = this.getPlayerPickupRadius();
        const playerFeet = this.getPlayerFeetPosition();

        for (let index = this.essenceDrops.length - 1; index >= 0; index--)
        {
            const drop = this.essenceDrops[index];

            if (!drop.orb.active)
            {
                this.essenceDrops.splice(index, 1);
                continue;
            }

            const deltaX = playerFeet.x - drop.orb.x;
            const deltaY = playerFeet.y - 24 - drop.orb.y;
            const distance = Math.hypot(deltaX, deltaY);
            const pulse = 1 + (Math.sin((this.time.now + drop.phaseOffset) / 180) * 0.08);

            drop.orb.setScale(pulse);
            drop.glow.setScale(pulse * 1.18);
            drop.orb.setDepth(drop.orb.y + 24);
            drop.glow.setDepth(drop.orb.y + 23);

            if (distance <= ESSENCE_DROP_PICKUP_DISTANCE)
            {
                this.collectEssenceDrop(drop, index);
                continue;
            }

            if (distance <= pickupRadius)
            {
                const moveDistance = Math.min(distance, ESSENCE_DROP_MAGNET_SPEED * deltaSeconds);
                const directionX = deltaX / (distance || 1);
                const directionY = deltaY / (distance || 1);

                drop.orb.x += directionX * moveDistance;
                drop.orb.y += directionY * moveDistance;
                drop.glow.x = drop.orb.x;
                drop.glow.y = drop.orb.y;
            }
        }
    }

    collectEssenceDrop (drop, index)
    {
        this.progression.essence += drop.value;
        this.playSfx('sfx-pickup', { volume: 0.22 });

        const text = this.add.text(drop.orb.x, drop.orb.y - 18, this.translate('pickup.essence', {
            value: drop.value
        }), {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#bbf7d0',
            stroke: '#052e16',
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setDepth(6200);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            y: text.y - 22,
            onComplete: () => {

                text.destroy();

            }
        });

        drop.orb.destroy();
        drop.glow.destroy();
        this.essenceDrops.splice(index, 1);
    }

    trySpawnEssenceDrop (enemy)
    {
        const modifiers = this.player.character.modifiers ?? {};
        const chance = Math.min(0.82, ESSENCE_DROP_BASE_CHANCE + (this.wave.current * ESSENCE_DROP_WAVE_BONUS) + (modifiers.dropChanceBonus ?? 0));

        if (Math.random() > chance)
        {
            return;
        }

        const feet = this.getEnemyFeetPosition(enemy);
        const value = this.resolveEssenceDropValue();
        const color = value >= 3 ? 0xfbbf24 : value === 2 ? 0x93c5fd : 0x86efac;
        const orb = this.add.circle(feet.x + PhaserMath.Between(-12, 12), feet.y - 28, value >= 3 ? 11 : 9, color, 0.95)
            .setStrokeStyle(2, 0xf8fafc, 0.55);
        const glow = this.add.circle(orb.x, orb.y, value >= 3 ? 20 : 16, color, 0.18);

        this.essenceDrops.push({
            glow,
            orb,
            phaseOffset: PhaserMath.Between(0, 1000),
            value
        });
    }

    resolveEssenceDropValue ()
    {
        const modifiers = this.player.character.modifiers ?? {};
        let value = 1;

        if (Math.random() <= Math.min(0.28, 0.08 + (this.wave.current * 0.02)))
        {
            value += 1;
        }

        if ((modifiers.extraEssenceChance ?? 0) > 0 && Math.random() <= modifiers.extraEssenceChance)
        {
            value += 1;
        }

        return value;
    }

    spendUpgradePoint (upgradeId)
    {
        if (!this.canSpendUpgradePoint(upgradeId))
        {
            return false;
        }

        const previousRequirement = this.getNextEvolutionRequirement();

        this.progression.essence -= 1;
        this.progression.upgrades[upgradeId] += 1;
        this.progression.totalSpent += 1;

        this.recalculatePlayerStats();

        const nextRequirement = this.getNextEvolutionRequirement();

        if (!nextRequirement && this.progression.totalSpent >= PLAYER_TOTAL_UPGRADE_POINTS)
        {
            this.showWaveBanner(this.translate('banner.buildComplete'));
        }
        else if (previousRequirement && this.progression.totalSpent >= previousRequirement)
        {
            const nextCharacter = this.getPresentedCharacter(getNextPlayerCharacter(this.player.character.assetId));

            if (nextCharacter)
            {
                this.showWaveBanner(this.translate('banner.readyToEvolve', {
                    character: nextCharacter.label
                }));
            }
        }

        return true;
    }

    canSpendUpgradePoint (upgradeId)
    {
        const upgrade = getPlayerUpgradeById(upgradeId);

        if (!upgrade)
        {
            return false;
        }

        return (
            this.progression.essence > 0 &&
            this.progression.totalSpent < PLAYER_TOTAL_UPGRADE_POINTS &&
            this.progression.upgrades[upgradeId] < upgrade.maxLevel
        );
    }

    canEvolvePlayer ()
    {
        const nextCharacter = this.getPresentedCharacter(getNextPlayerCharacter(this.player.character.assetId));

        return Boolean(nextCharacter && this.progression.totalSpent >= nextCharacter.unlockSpent);
    }

    evolvePlayer ()
    {
        if (!this.canEvolvePlayer())
        {
            return false;
        }

        const nextCharacter = this.getPresentedCharacter(getNextPlayerCharacter(this.player.character.assetId));

        if (!nextCharacter)
        {
            return false;
        }

        this.player.character = nextCharacter;
        this.player.invulnerableUntil = this.time.now + 600;
        this.playerSprite.setTexture(getPlayerFrameKey(nextCharacter.assetId, 'idle', 0));
        this.recalculatePlayerStats({ fullHeal: true });
        this.playPlayerAnimationForState(this.player.state === 'dead' ? 'dead' : 'idle');
        this.progression.menuOpen = false;

        this.cameras.main.flash(240, 250, 240, 200, false);
        this.showWaveBanner(this.translate('banner.ascends', {
            character: nextCharacter.label
        }));

        return true;
    }

    recalculatePlayerStats (options = {})
    {
        const previousMaxHealth = this.player.maxHealth ?? this.player.character.maxHealth;
        const character = this.player.character;
        const modifiers = character.modifiers ?? {};
        const upgrades = this.progression.upgrades;
        const mobility = upgrades.mobility;
        const assault = upgrades.assault;
        const haste = upgrades.haste;
        const arcana = upgrades.arcana;
        const fortitude = upgrades.fortitude;
        const regeneration = upgrades.regeneration;
        const attackCooldownFactor = Math.max(0.45, 1 - (haste * (0.035 + (modifiers.hasteBonusPerLevel ?? 0))));
        const castCooldownFactor = Math.max(0.46, 1 - (haste * 0.03));

        this.player.stats = {
            attackCooldown: Math.round(character.attackCooldown * attackCooldownFactor * (modifiers.attackCooldownMultiplier ?? 1)),
            attackDamage: character.attackDamage + Math.ceil(assault * 0.7) + (modifiers.meleeDamageFlat ?? 0),
            castCooldown: Math.round(character.castCooldown * castCooldownFactor * (modifiers.castCooldownMultiplier ?? 1)),
            castDamage: character.castDamage + Math.ceil(arcana * 0.75) + (modifiers.castDamageFlat ?? 0),
            castTint: character.castTint,
            maxHealth: character.maxHealth + fortitude + (modifiers.maxHealthFlat ?? 0),
            meleeRadius: 48 + (assault * 2),
            meleeRange: PLAYER_ATTACK_EFFECT_DISTANCE + (assault * 2) + (modifiers.meleeRangeFlat ?? 0),
            pickupRadius: PLAYER_BASE_PICKUP_RADIUS + (mobility * 7) + (modifiers.pickupRadiusBonus ?? 0),
            projectileRadius: 10 + Math.floor(arcana / 3) + (modifiers.projectileRadiusBonus ?? 0),
            projectileSpeed: Math.round((character.projectileSpeed + (arcana * 18)) * (modifiers.projectileSpeedMultiplier ?? 1)),
            regenDelay: Math.max(900, PLAYER_BASE_REGEN_DELAY - (regeneration * 180)),
            regenPerSecond: Math.max(0, (regeneration * 0.18) + (modifiers.regenFlat ?? 0)),
            scoreMultiplier: modifiers.scoreMultiplier ?? 1,
            speed: Math.round((character.speed + (mobility * 12)) * (modifiers.speedMultiplier ?? 1))
        };

        this.player.maxHealth = this.player.stats.maxHealth;

        if (options.fullHeal)
        {
            this.player.health = this.player.maxHealth;
            return;
        }

        if (this.player.maxHealth > previousMaxHealth)
        {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + (this.player.maxHealth - previousMaxHealth));
            return;
        }

        this.player.health = Math.min(this.player.health, this.player.maxHealth);
    }

    getPlayerPickupRadius ()
    {
        return this.player.stats?.pickupRadius ?? PLAYER_BASE_PICKUP_RADIUS;
    }

    updatePlayerRegeneration (now)
    {
        if (
            !this.player?.stats ||
            this.player.state === 'dead' ||
            this.player.health >= this.player.maxHealth ||
            this.player.stats.regenPerSecond <= 0 ||
            now < this.player.lastDamageAt + this.player.stats.regenDelay
        )
        {
            return;
        }

        this.player.health = Math.min(
            this.player.maxHealth,
            this.player.health + (this.player.stats.regenPerSecond * (this.game.loop.delta / 1000))
        );
    }

    getNextEvolutionRequirement ()
    {
        const nextCharacter = getNextPlayerCharacter(this.player.character.assetId);

        return nextCharacter?.unlockSpent ?? null;
    }

    syncPlayerVisual ()
    {
        const feet = this.getPlayerFeetPosition();
        const playerDepth = feet.y + PLAYER_DEPTH_FRONT_OFFSET;

        this.playerShadow.setPosition(feet.x, feet.y + PLAYER_SHADOW_OFFSET_Y);
        this.playerShadow.setDepth(playerDepth - 3);
        this.playerShadow.setAlpha(this.player.state === 'dead' ? 0.1 : 0.18);

        this.playerSprite.setPosition(feet.x, feet.y);
        this.playerSprite.setFlipX(this.player.facing < 0);
        this.playerSprite.setDepth(playerDepth);
    }

    buildPlayerFrameList (assetId, state, frameCount)
    {
        return Array.from({ length: frameCount }, (_, index) => ({ key: getPlayerFrameKey(assetId, state, index) }));
    }

    buildEnemyFrameList (variant, state, frameCount)
    {
        return Array.from({ length: frameCount }, (_, index) => ({ key: getEnemyFrameKey(variant, state, index + 1) }));
    }

    updateGridCursor ()
    {
        if (!this.devMode || !this.currentPieceMarker || !this.currentWalkMarker || !this.cellStatusText)
        {
            return;
        }

        const feet = this.getPlayerFeetPosition();
        const pieceCell = this.getPieceCellAtWorldPosition(feet.x, feet.y);
        const walkCell = this.getWalkCellAtWorldPosition(feet.x, feet.y);

        if (!pieceCell || !walkCell)
        {
            this.currentPieceMarker.setVisible(false);
            this.currentWalkMarker.setVisible(false);
            this.cellStatusText.setText(this.translate('hud.outsideGrid'));

            return;
        }

        this.currentPieceMarker.setVisible(true);
        this.currentPieceMarker.setPosition(this.pieceCellLeft(pieceCell.column), this.pieceCellTop(pieceCell.row));

        this.currentWalkMarker.setVisible(true);
        this.currentWalkMarker.setPosition(this.walkCellLeft(walkCell.column), this.walkCellTop(walkCell.row));

        this.cellStatusText.setText(this.translate('hud.cellStatus', {
            layer: this.translate('hud.layerFront'),
            piece: pieceCell.id,
            walk: walkCell.id,
            walkable: this.translate(walkCell.walkable ? 'hud.walkableTrue' : 'hud.walkableFalse')
        }));
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
        if (this.player.state === 'dead')
        {
            return;
        }

        if (!this.wave.active)
        {
            if (now >= this.wave.upcomingAt)
            {
                this.startWave(this.wave.current + 1, now);
            }

            return;
        }

        if (this.wave.spawned >= this.wave.enemiesToSpawn)
        {
            if (this.getLivingEnemyCount() === 0)
            {
                this.completeWave(now);
            }

            return;
        }

        if (now < this.nextEnemySpawnAt)
        {
            return;
        }

        if (this.getLivingEnemyCount() >= this.getWaveConcurrentEnemyLimit())
        {
            this.nextEnemySpawnAt = now + 280;
            return;
        }

        const spawnPoint = this.findEnemySpawnPoint();

        this.nextEnemySpawnAt = now + this.getWaveSpawnInterval() + PhaserMath.Between(-this.getWaveSpawnVariance(), this.getWaveSpawnVariance());

        if (!spawnPoint)
        {
            return;
        }

        this.spawnEnemy(spawnPoint.x, spawnPoint.y);
        this.wave.spawned += 1;
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

            const speed = distance > ENEMY_RUN_DISTANCE ? enemy.walkSpeed : enemy.runSpeed;
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
        const variant = this.pickEnemyVariantForWave(this.wave.current);
        const stats = this.buildEnemyStats(variant, this.wave.current);
        const enemy = {
            actionToken: 0,
            attackToken: 0,
            attackDamage: stats.attackDamage,
            attackCooldown: stats.attackCooldown,
            facing: feetX >= this.getPlayerFeetPosition().x ? -1 : 1,
            health: stats.health,
            healthBarBg: this.add.rectangle(feetX, feetY - ENEMY_HEALTH_BAR_OFFSET_Y, ENEMY_HEALTH_BAR_WIDTH, ENEMY_HEALTH_BAR_HEIGHT, 0x7f1d1d, 0.92)
                .setVisible(false),
            healthBarFill: this.add.rectangle(feetX - (ENEMY_HEALTH_BAR_WIDTH / 2), feetY - ENEMY_HEALTH_BAR_OFFSET_Y, ENEMY_HEALTH_BAR_WIDTH, ENEMY_HEALTH_BAR_HEIGHT, 0x2ecc71, 0.98)
                .setOrigin(0, 0.5)
                .setVisible(false),
            hitbox: this.add.zone(feetX, feetY - (ENEMY_HITBOX_HEIGHT / 2), ENEMY_HITBOX_WIDTH, ENEMY_HITBOX_HEIGHT),
            id: ++this.enemyIdCounter,
            idleUntil: this.time.now + PhaserMath.Between(ENEMY_IDLE_MIN_MS, ENEMY_IDLE_MAX_MS),
            invulnerableUntil: 0,
            maxHealth: stats.health,
            nextAttackAt: this.time.now + 320,
            removeAt: 0,
            runSpeed: stats.runSpeed,
            scoreValue: stats.scoreValue,
            shadow: this.add.ellipse(feetX, feetY + ENEMY_SHADOW_OFFSET_Y, 46, 18, 0x000000, 0.16),
            sprite: this.add.sprite(feetX, feetY, getEnemyFrameKey(variant, 'idle', 1))
                .setOrigin(0.5, 1)
                .setScale(ENEMY_VISUAL_SCALE),
            state: 'jump',
            variant,
            walkSpeed: stats.walkSpeed,
            wave: this.wave.current
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

        enemy.nextAttackAt = now + enemy.attackCooldown;
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
                this.applyPlayerDamage(enemy.attackDamage);
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
        const depth = feet.y + 1;

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

    startWave (waveNumber, now)
    {
        this.wave.active = true;
        this.wave.clearedAt = 0;
        this.wave.current = waveNumber;
        this.wave.enemiesToSpawn = this.getWaveEnemyTotal(waveNumber);
        this.wave.spawned = 0;
        this.wave.upcomingAt = now;
        this.nextEnemySpawnAt = now + 360;

        this.showWaveBanner(this.translate('banner.wave', {
            wave: waveNumber
        }));
    }

    completeWave (now)
    {
        if (!this.wave.active)
        {
            return;
        }

        this.wave.active = false;
        this.wave.clearedAt = now;
        this.score += PLAYER_SCORE_PER_WAVE_CLEAR + (this.wave.current * 25);

        if (this.wave.current >= FINAL_WAVE)
        {
            this.wave.upcomingAt = Number.POSITIVE_INFINITY;
            this.winGame();
            return;
        }

        this.wave.upcomingAt = now + WAVE_BREAK_DURATION;

        this.showWaveBanner(this.translate('banner.waveCleared', {
            wave: this.wave.current
        }));
    }

getWaveEnemyTotal (waveNumber)
    {
        return WAVE_BASE_ENEMY_COUNT + ((waveNumber - 1) * WAVE_ENEMY_GROWTH);
    }

    getWaveConcurrentEnemyLimit ()
    {
        return Math.min(WAVE_CONCURRENT_MAX, WAVE_CONCURRENT_BASE + Math.floor((this.wave.current - 1) / 2));
    }

    getWaveSpawnInterval ()
    {
        return Math.max(1100, ENEMY_SPAWN_INTERVAL - ((this.wave.current - 1) * 180));
    }

    getWaveSpawnVariance ()
    {
        return Math.max(180, ENEMY_SPAWN_VARIANCE - ((this.wave.current - 1) * 40));
    }

    pickEnemyVariantForWave (waveNumber)
    {
        const variants = ENEMY_VARIANTS.filter((variant) => getEnemyTypeConfig(variant).unlockWave <= waveNumber);
        const weightedVariants = [];

        for (const variant of variants)
        {
            const { weight } = getEnemyTypeConfig(variant);

            for (let index = 0; index < weight; index++)
            {
                weightedVariants.push(variant);
            }
        }

        return weightedVariants[PhaserMath.Between(0, weightedVariants.length - 1)];
    }

    buildEnemyStats (variant, waveNumber)
    {
        const config = getEnemyTypeConfig(variant);
        const waveOffset = Math.max(0, waveNumber - config.unlockWave);

        return {
            attackCooldown: Math.max(600, config.attackCooldown - (waveOffset * 25)),
            attackDamage: config.attackDamage + Math.floor(waveOffset / 3),
            health: config.health + (waveOffset * config.healthGrowth),
            runSpeed: config.runSpeed + (waveOffset * config.runSpeedGrowth),
            scoreValue: config.scoreValue + (waveOffset * config.scoreGrowth),
            walkSpeed: config.walkSpeed + (waveOffset * config.walkSpeedGrowth)
        };
    }

    findEnemySpawnPoint ()
    {
        const cameraView = this.cameras.main.worldView;
        const fallbackPoints = [];

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
            const playerFeet = this.getPlayerFeetPosition();

            if (Math.hypot(playerFeet.x - x, playerFeet.y - y) < ENEMY_MIN_PLAYER_DISTANCE)
            {
                continue;
            }

            fallbackPoints.push({ x, y });

            if (this.isInsideExpandedCameraView(cameraView, x, y, ENEMY_SPAWN_VIEW_MARGIN))
            {
                continue;
            }

            return { x, y };
        }

        return fallbackPoints.length > 0
            ? fallbackPoints[PhaserMath.Between(0, fallbackPoints.length - 1)]
            : null;
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
        const pointerAttack = this.pointerQueuedAttack;
        const pointerCast = this.pointerQueuedCast;
        this.pointerQueuedAttack = false;
        this.pointerQueuedCast = false;

        if (this.player.state === 'dead')
        {
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
            (
                Input.Keyboard.JustDown(this.keys.attack) ||
                Input.Keyboard.JustDown(this.keys.attackAlt) ||
                Input.Keyboard.JustDown(this.keys.attackThird) ||
                pointerAttack
            ) &&
            this.canStartPlayerAction(now, 'attack')
        )
        {
            this.startPlayerAction('attack', now);
            return;
        }

        if ((Input.Keyboard.JustDown(this.keys.cast) || pointerCast) && this.canStartPlayerAction(now, 'cast'))
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
                (moveX / length) * this.player.stats.speed,
                (moveY / length) * this.player.stats.speed
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
                this.applyDamageToEnemy(hitEnemy, projectile.damage);
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
                continue;
            }

            projectile.previousX = projectile.x;
            projectile.previousY = projectile.y;
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
            this.player.nextAttackAt = now + this.player.stats.attackCooldown;
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
            this.player.nextCastAt = now + this.player.stats.castCooldown;
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
        const animationKey = getPlayerAnimationKey(this.player.character.assetId, state);

        if (this.playerSprite.anims.currentAnim?.key === animationKey)
        {
            return;
        }

        this.playerSprite.anims.play(animationKey, true);
    }

    handlePlayerAnimationComplete (animation)
    {
        if (this.isCurrentPlayerAnimation(animation, 'dead'))
        {
            this.goToGameOver();
            return;
        }

        if (this.isCurrentPlayerAnimation(animation, 'idle-blink'))
        {
            this.setPlayerState('idle');
            return;
        }

        if (
            this.isCurrentPlayerAnimation(animation, 'attack') ||
            this.isCurrentPlayerAnimation(animation, 'cast') ||
            this.isCurrentPlayerAnimation(animation, 'hurt') ||
            this.isCurrentPlayerAnimation(animation, 'taunt')
        )
        {
            this.setPlayerState('idle');
            this.player.idleBlinkAt = this.time.now + this.randomIdleBlinkDelay();
        }
    }

    isCurrentPlayerAnimation (animation, state)
    {
        return animation.key === getPlayerAnimationKey(this.player.character.assetId, state);
    }

    applyPlayerDamage (damage)
    {
        if (this.player.state === 'dead' || this.time.now < this.player.invulnerableUntil)
        {
            return;
        }

        this.player.health = Math.max(0, this.player.health - damage);
        this.player.invulnerableUntil = this.time.now + PLAYER_INVULNERABILITY_MS;
        this.player.lastDamageAt = this.time.now;

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
        this.playSfx('sfx-gameover', { volume: 0.28 });
    }

    winGame ()
    {
        if (this.player.gameOverQueued)
        {
            return;
        }

        this.wave.active = false;
        this.wave.upcomingAt = Number.POSITIVE_INFINITY;
        this.progression.menuOpen = false;
        this.playerHitbox.body.setVelocity(0, 0);
        this.showWaveBanner(this.translate('banner.victory'));
        this.queueResults('win', 700);
    }

    queueResults (result, delay = 120)
    {
        if (this.player.gameOverQueued)
        {
            return;
        }

        this.player.gameOverQueued = true;
        this.time.delayedCall(delay, () => {

            this.scene.start('GameOver', {
                characterAssetId: this.player.character.assetId,
                result,
                spent: this.progression.totalSpent,
                score: this.score,
                wave: this.wave.current
            });

        });
    }

    goToGameOver ()
    {
        this.queueResults('lose');
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
        const attackX = feet.x + (aim.x * this.player.stats.meleeRange);
        const attackY = feet.y - 30 + (aim.y * 26);

        this.playSfx('sfx-attack', { volume: 0.14 });

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

        this.applyDamageToEnemiesInRadius(attackX, attackY, this.player.stats.meleeRadius, this.player.stats.attackDamage);

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
        const ring = this.add.circle(feet.x, feet.y - 34, this.player.stats.projectileRadius + 5, this.player.stats.castTint, 0.22)
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
            this.player.stats.projectileRadius,
            this.player.stats.castTint,
            0.95
        );

        this.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocity(aim.x * this.player.stats.projectileSpeed, aim.y * this.player.stats.projectileSpeed);
        projectile.damage = this.player.stats.castDamage;
        projectile.expireAt = this.time.now + PLAYER_PROJECTILE_LIFETIME;
        projectile.previousX = projectile.x;
        projectile.previousY = projectile.y;
        projectile.setDepth(projectile.y + 6);

        this.playerProjectiles.push(projectile);
    }

    findEnemyHitByProjectile (projectile)
    {
        const previousX = projectile.previousX ?? projectile.x;
        const previousY = projectile.previousY ?? projectile.y;

        for (const enemy of this.enemies)
        {
            if (enemy.state === 'dead')
            {
                continue;
            }

            if (this.doesProjectilePathHitEnemy(projectile, enemy, previousX, previousY))
            {
                return enemy;
            }
        }

        return null;
    }

    doesProjectilePathHitEnemy (projectile, enemy, previousX, previousY)
    {
        const feet = this.getEnemyFeetPosition(enemy);
        const bodyTopY = feet.y - Math.max(54, enemy.sprite.displayHeight * 0.82);
        const bodyBottomY = feet.y - Math.max(10, enemy.sprite.displayHeight * 0.1);
        const bodyRadius = Math.max(18, enemy.sprite.displayWidth * 0.3) + projectile.radius;
        const headCenterY = feet.y - Math.max(46, enemy.sprite.displayHeight * 0.8);
        const headRadius = Math.max(18, enemy.sprite.displayWidth * 0.24) + projectile.radius;
        const feetRadius = Math.max(18, (ENEMY_HITBOX_WIDTH / 2) + projectile.radius);

        return (
            this.distanceSegmentToSegment(feet.x, bodyTopY, feet.x, bodyBottomY, previousX, previousY, projectile.x, projectile.y) <= bodyRadius ||
            this.distancePointToSegment(feet.x, headCenterY, previousX, previousY, projectile.x, projectile.y) <= headRadius ||
            this.distancePointToSegment(feet.x, feet.y - 10, previousX, previousY, projectile.x, projectile.y) <= feetRadius
        );
    }

    distancePointToSegment (pointX, pointY, startX, startY, endX, endY)
    {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const lengthSquared = (deltaX * deltaX) + (deltaY * deltaY);

        if (lengthSquared === 0)
        {
            return Math.hypot(pointX - startX, pointY - startY);
        }

        const projection = (((pointX - startX) * deltaX) + ((pointY - startY) * deltaY)) / lengthSquared;
        const clampedProjection = PhaserMath.Clamp(projection, 0, 1);
        const closestX = startX + (deltaX * clampedProjection);
        const closestY = startY + (deltaY * clampedProjection);

        return Math.hypot(pointX - closestX, pointY - closestY);
    }

    distanceSegmentToSegment (startAX, startAY, endAX, endAY, startBX, startBY, endBX, endBY)
    {
        if (this.doSegmentsIntersect(startAX, startAY, endAX, endAY, startBX, startBY, endBX, endBY))
        {
            return 0;
        }

        return Math.min(
            this.distancePointToSegment(startAX, startAY, startBX, startBY, endBX, endBY),
            this.distancePointToSegment(endAX, endAY, startBX, startBY, endBX, endBY),
            this.distancePointToSegment(startBX, startBY, startAX, startAY, endAX, endAY),
            this.distancePointToSegment(endBX, endBY, startAX, startAY, endAX, endAY)
        );
    }

    doSegmentsIntersect (startAX, startAY, endAX, endAY, startBX, startBY, endBX, endBY)
    {
        const orientation1 = this.segmentOrientation(startAX, startAY, endAX, endAY, startBX, startBY);
        const orientation2 = this.segmentOrientation(startAX, startAY, endAX, endAY, endBX, endBY);
        const orientation3 = this.segmentOrientation(startBX, startBY, endBX, endBY, startAX, startAY);
        const orientation4 = this.segmentOrientation(startBX, startBY, endBX, endBY, endAX, endAY);

        if (orientation1 !== orientation2 && orientation3 !== orientation4)
        {
            return true;
        }

        return (
            (orientation1 === 0 && this.isPointOnSegment(startAX, startAY, startBX, startBY, endAX, endAY)) ||
            (orientation2 === 0 && this.isPointOnSegment(startAX, startAY, endBX, endBY, endAX, endAY)) ||
            (orientation3 === 0 && this.isPointOnSegment(startBX, startBY, startAX, startAY, endBX, endBY)) ||
            (orientation4 === 0 && this.isPointOnSegment(startBX, startBY, endAX, endAY, endBX, endBY))
        );
    }

    segmentOrientation (startX, startY, endX, endY, pointX, pointY)
    {
        const value = ((endY - startY) * (pointX - endX)) - ((endX - startX) * (pointY - endY));

        if (Math.abs(value) < 0.0001)
        {
            return 0;
        }

        return value > 0 ? 1 : 2;
    }

    isPointOnSegment (startX, startY, pointX, pointY, endX, endY)
    {
        return (
            pointX <= Math.max(startX, endX) &&
            pointX >= Math.min(startX, endX) &&
            pointY <= Math.max(startY, endY) &&
            pointY >= Math.min(startY, endY)
        );
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

        const appliedDamage = Math.min(enemy.health, damage);

        enemy.health = Math.max(0, enemy.health - damage);
        enemy.invulnerableUntil = this.time.now + ENEMY_HIT_INVULNERABILITY_MS;
        this.spawnEnemyDamageNumber(enemy, appliedDamage, enemy.health <= 0);

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

    spawnEnemyDamageNumber (enemy, damage, fatal)
    {
        const feet = this.getEnemyFeetPosition(enemy);
        const text = this.add.text(feet.x + PhaserMath.Between(-12, 12), feet.y - 86, `${damage}`, {
            fontFamily: 'Arial Black',
            fontSize: fatal ? 24 : 20,
            color: fatal ? '#fde68a' : '#ffffff',
            stroke: fatal ? '#7c2d12' : '#991b1b',
            strokeThickness: 5
        })
            .setOrigin(0.5)
            .setDepth(enemy.sprite.depth + 5);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 520,
            ease: 'Quad.easeOut',
            y: text.y - 28,
            onComplete: () => {

                text.destroy();

            }
        });
    }

    killEnemy (enemy)
    {
        if (enemy.state === 'dead')
        {
            return;
        }

        this.trySpawnEssenceDrop(enemy);
        enemy.health = 0;
        enemy.removeAt = this.time.now + ENEMY_CORPSE_DURATION;
        enemy.hitbox.body.setVelocity(0, 0);
        enemy.hitbox.body.enable = false;
        enemy.shadow.setAlpha(0.08);
        ++enemy.actionToken;
        this.setEnemyState(enemy, 'dead');
        this.score += Math.round(enemy.scoreValue * (this.player.stats?.scoreMultiplier ?? 1));
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
}

Object.assign(Game.prototype, MapSystem, HudSystem);
