import {
    PLAYER_TOTAL_UPGRADE_POINTS,
    PLAYER_UPGRADES
} from '../data/playerUpgrades';
import { getPlayerAnimationKey, getPlayerFrameKey } from '../data/playerAnimations';
import { getNextPlayerCharacter } from '../data/playerCharacters';
import {
    PLAYER_HEALTH_BAR_HEIGHT,
    PLAYER_HEALTH_BAR_WIDTH
} from '../data/gameConstants';

export const HudSystem = {
createHud ()
{
    const leftPanelX = 18;
    const topPanelY = 18;
    const leftPanelWidth = 480;
    const leftPanelHeight = 126;
    const rightPanelWidth = 380;
    const rightPanelHeight = 154;
    const rightPanelX = this.scale.width - rightPanelWidth - 18;
    const bottomHintWidth = 850;
    const bottomHintHeight = 38;
    const bottomHintX = (this.scale.width - bottomHintWidth) / 2;
    const bottomHintY = this.scale.height - bottomHintHeight - 18;

    this.add.rectangle(leftPanelX, topPanelY, leftPanelWidth, leftPanelHeight, 0x20150f, 0.72)
        .setOrigin(0)
        .setStrokeStyle(2, 0xe7c58f, 0.35)
        .setScrollFactor(0)
        .setDepth(4990);

    this.add.rectangle(rightPanelX, topPanelY, rightPanelWidth, rightPanelHeight, 0x131a25, 0.74)
        .setOrigin(0)
        .setStrokeStyle(2, 0x9dc5ff, 0.35)
        .setScrollFactor(0)
        .setDepth(4990);

    this.add.rectangle(bottomHintX, bottomHintY, bottomHintWidth, bottomHintHeight, 0x0f1720, 0.62)
        .setOrigin(0)
        .setStrokeStyle(1, 0xffffff, 0.12)
        .setScrollFactor(0)
        .setDepth(4990);

    this.playerHeaderText = this.add.text(leftPanelX + 16, topPanelY + 12, '', {
        fontFamily: 'Arial Black',
        fontSize: 22,
        color: '#fff7ed',
        stroke: '#4a2e18',
        strokeThickness: 5
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.playerStatusText = this.add.text(leftPanelX + 16, topPanelY + 42, '', {
        fontFamily: 'Courier New',
        fontSize: 16,
        color: '#fff3d1',
        stroke: '#4a2e18',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.playerCooldownText = this.add.text(leftPanelX + 16, topPanelY + 102, '', {
        fontFamily: 'Courier New',
        fontSize: 16,
        color: '#f7e7bb',
        stroke: '#4a2e18',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.waveStatusText = this.add.text(rightPanelX + 16, topPanelY + 14, '', {
        fontFamily: 'Arial Black',
        fontSize: 22,
        color: '#eff6ff',
        stroke: '#14243a',
        strokeThickness: 5
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.scoreStatusText = this.add.text(rightPanelX + 16, topPanelY + 48, '', {
        fontFamily: 'Courier New',
        fontSize: 17,
        color: '#dbeafe',
        stroke: '#14243a',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.enemyStatusText = this.add.text(rightPanelX + 16, topPanelY + 80, '', {
        fontFamily: 'Courier New',
        fontSize: 17,
        color: '#dbeafe',
        stroke: '#14243a',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.progressionStatusText = this.add.text(rightPanelX + 16, topPanelY + 112, '', {
        fontFamily: 'Courier New',
        fontSize: 17,
        color: '#dbeafe',
        stroke: '#14243a',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(5000);

    this.controlHintText = this.add.text(this.scale.width / 2, bottomHintY + (bottomHintHeight / 2), this.translate('hud.controls'), {
        fontFamily: 'Courier New',
        fontSize: 15,
        color: '#e5eefb',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(5000);

    if (this.devMode)
    {
        this.add.rectangle(18, this.scale.height - 116, 408, 52, 0x122333, 0.68)
            .setOrigin(0)
            .setStrokeStyle(1, 0x9dc5ff, 0.22)
            .setScrollFactor(0)
            .setDepth(4990);

        this.cellStatusText = this.add.text(34, this.scale.height - 100, '', {
            fontFamily: 'Courier New',
            fontSize: 15,
            color: '#d8ebff',
            stroke: '#122333',
            strokeThickness: 4
        })
            .setScrollFactor(0)
            .setDepth(5000);
    }

    this.playerHealthBarBg = this.add.rectangle(
        leftPanelX + 16,
        topPanelY + 76,
        PLAYER_HEALTH_BAR_WIDTH,
        PLAYER_HEALTH_BAR_HEIGHT,
        0x7f1d1d,
        0.9
    )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(5000);

    this.playerHealthBarFill = this.add.rectangle(
        leftPanelX + 16,
        topPanelY + 76,
        PLAYER_HEALTH_BAR_WIDTH,
        PLAYER_HEALTH_BAR_HEIGHT,
        0x2ecc71,
        0.95
    )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(5001);

    this.playerHealthBarLabel = this.add.text(leftPanelX + 16, topPanelY + 76, '', {
        fontFamily: 'Courier New',
        fontSize: 13,
        color: '#fff7ed',
        stroke: '#3f1d0d',
        strokeThickness: 3
    })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(5002);

    this.waveBannerText = this.add.text(this.scale.width / 2, topPanelY + leftPanelHeight + 20, '', {
        fontFamily: 'Arial Black',
        fontSize: 24,
        color: '#fef3c7',
        stroke: '#4a2e18',
        strokeThickness: 6
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(5003)
        .setAlpha(0);

    this.createEvolutionPanel();
},

createEvolutionPanel ()
{
    const panelWidth = 840;
    const panelHeight = 650;
    const panelLeft = (this.scale.width / 2) - (panelWidth / 2);
    const panelTop = (this.scale.height / 2) - (panelHeight / 2);
    const barLabelX = panelLeft + 44;
    const barStartX = panelLeft + 250;
    const segmentWidth = 20;
    const segmentGap = 4;
    const segmentCount = 10;
    const barWidth = (segmentWidth * segmentCount) + (segmentGap * (segmentCount - 1));
    const previewCenterX = panelLeft + 698;

    this.evolutionOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x04070b, 0.72)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(6900)
        .setVisible(false);

    this.evolutionPanel = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, panelWidth, panelHeight, 0x121820, 0.97)
        .setStrokeStyle(3, 0xd1e6ff, 0.3)
        .setScrollFactor(0)
        .setDepth(6901)
        .setVisible(false);

    this.evolutionTitleText = this.add.text(this.scale.width / 2, panelTop + 38, '', {
        fontFamily: 'Arial Black',
        fontSize: 32,
        color: '#fff7ed',
        stroke: '#0f1720',
        strokeThickness: 6
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionSummaryText = this.add.text(barLabelX, panelTop + 84, '', {
        fontFamily: 'Courier New',
        fontSize: 18,
        color: '#dbeafe',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionEssenceText = this.add.text(previewCenterX, panelTop + 84, '', {
        fontFamily: 'Arial Black',
        fontSize: 26,
        color: '#bbf7d0',
        stroke: '#0f1720',
        strokeThickness: 5
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionPreviewFrame = this.add.rectangle(previewCenterX, panelTop + 230, 210, 250, 0x1d2530, 0.92)
        .setStrokeStyle(2, 0xdbeafe, 0.2)
        .setScrollFactor(0)
        .setDepth(6901)
        .setVisible(false);

    this.evolutionCurrentLabel = this.add.text(previewCenterX, panelTop + 128, this.translate('build.currentForm'), {
        fontFamily: 'Arial Black',
        fontSize: 19,
        color: '#fef3c7',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionCurrentPreviewShadow = this.add.ellipse(previewCenterX, panelTop + 302, 80, 24, 0x000000, 0.2)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionCurrentPreview = this.add.sprite(previewCenterX, panelTop + 292, getPlayerFrameKey(this.player.character.assetId, 'idle', 0))
        .setOrigin(0.5, 1)
        .setScale(0.3)
        .setScrollFactor(0)
        .setDepth(6903)
        .setVisible(false);

    this.evolutionNextLabel = this.add.text(previewCenterX, panelTop + 364, '', {
        fontFamily: 'Arial Black',
        fontSize: 18,
        color: '#dbeafe',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionNextPreview = this.add.sprite(previewCenterX + 56, panelTop + 320, getPlayerFrameKey(this.player.character.assetId, 'idle', 0))
        .setOrigin(0.5, 1)
        .setScale(0.2)
        .setAlpha(0.42)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionArrowText = this.add.text(previewCenterX + 8, panelTop + 266, '->', {
        fontFamily: 'Arial Black',
        fontSize: 24,
        color: '#dbeafe',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionUpgradeRows = PLAYER_UPGRADES.map((upgrade, index) => {
        const rowTop = panelTop + 154 + (index * 54);
        const barY = rowTop + 28;
        const hotkeyBubble = this.add.circle(barLabelX + 12, rowTop + 12, 13, upgrade.color, 0.92)
            .setStrokeStyle(2, 0xffffff, 0.25)
            .setScrollFactor(0)
            .setDepth(6902)
            .setVisible(false);
        const hotkeyText = this.add.text(barLabelX + 12, rowTop + 12, upgrade.key, {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff',
            stroke: '#0f1720',
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(6903)
            .setVisible(false);
        const labelText = this.add.text(barLabelX + 34, rowTop, this.getUpgradeLabel(upgrade), {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#f8fafc',
            stroke: '#0f1720',
            strokeThickness: 4
        })
            .setScrollFactor(0)
            .setDepth(6902)
            .setVisible(false);
        const levelText = this.add.text(barStartX + barWidth, rowTop - 2, '', {
            fontFamily: 'Courier New',
            fontSize: 15,
            color: '#dbeafe',
            stroke: '#0f1720',
            strokeThickness: 4
        })
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(6902)
            .setVisible(false);
        const glow = this.add.rectangle(barStartX + (barWidth / 2), barY, barWidth + 18, 30, upgrade.color, 0.12)
            .setScrollFactor(0)
            .setDepth(6901)
            .setVisible(false);
        const frame = this.add.rectangle(barStartX + (barWidth / 2), barY, barWidth + 4, 24, 0x0b1020, 0.95)
            .setStrokeStyle(2, upgrade.color, 0.24)
            .setScrollFactor(0)
            .setDepth(6902)
            .setVisible(false);
        const segments = Array.from({ length: segmentCount }, (_, segmentIndex) => this.add.rectangle(
            barStartX + (segmentIndex * (segmentWidth + segmentGap)) + (segmentWidth / 2),
            barY,
            segmentWidth,
            16,
            0x1f2937,
            0.95
        )
            .setStrokeStyle(1, 0xffffff, 0.08)
            .setScrollFactor(0)
            .setDepth(6903)
            .setVisible(false));

        return {
            frame,
            glow,
            hotkeyBubble,
            hotkeyText,
            labelText,
            levelText,
            segments,
            upgrade
        };
    });

    this.evolutionTraitsTitleText = this.add.text(barLabelX, panelTop + 486, this.translate('build.traitsTitle'), {
        fontFamily: 'Arial Black',
        fontSize: 20,
        color: '#fef3c7',
        stroke: '#0f1720',
        strokeThickness: 5
    })
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionTraitTexts = [
        this.add.text(barLabelX, panelTop + 520, '', {
            fontFamily: 'Courier New',
            fontSize: 17,
            color: '#fde68a',
            stroke: '#0f1720',
            strokeThickness: 4,
            wordWrap: { width: 620 }
        }),
        this.add.text(barLabelX, panelTop + 552, '', {
            fontFamily: 'Courier New',
            fontSize: 17,
            color: '#fde68a',
            stroke: '#0f1720',
            strokeThickness: 4,
            wordWrap: { width: 620 }
        })
    ].map((text) => text
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false));

    this.evolutionStatusText = this.add.text(barLabelX, panelTop + 594, '', {
        fontFamily: 'Arial Black',
        fontSize: 20,
        color: '#bbf7d0',
        stroke: '#0f1720',
        strokeThickness: 5
    })
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);

    this.evolutionHintText = this.add.text(this.scale.width / 2, panelTop + 624, this.translate('build.hint'), {
        fontFamily: 'Courier New',
        fontSize: 17,
        color: '#dbeafe',
        stroke: '#0f1720',
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6902)
        .setVisible(false);
},

refreshEvolutionPanel ()
{
    const visible = Boolean(this.progression?.menuOpen);
    const nextCharacter = this.getPresentedCharacter(getNextPlayerCharacter(this.player.character.assetId));
    const nextRequirement = this.getNextEvolutionRequirement();
    const canEvolve = this.canEvolvePlayer();
    const spent = this.progression.totalSpent;
    const pulse = 0.55 + (0.35 * ((Math.sin(this.time.now / 170) + 1) / 2));

    this.evolutionOverlay.setVisible(visible);
    this.evolutionPanel.setVisible(visible);
    this.evolutionTitleText.setVisible(visible);
    this.evolutionSummaryText.setVisible(visible);
    this.evolutionEssenceText.setVisible(visible);
    this.evolutionPreviewFrame.setVisible(visible);
    this.evolutionCurrentLabel.setVisible(visible);
    this.evolutionCurrentPreviewShadow.setVisible(visible);
    this.evolutionCurrentPreview.setVisible(visible);
    this.evolutionArrowText.setVisible(visible);
    this.evolutionNextLabel.setVisible(visible);
    this.evolutionNextPreview.setVisible(visible);
    this.evolutionTraitsTitleText.setVisible(visible);
    this.evolutionStatusText.setVisible(visible);
    this.evolutionHintText.setVisible(visible);

    for (const row of this.evolutionUpgradeRows)
    {
        row.hotkeyBubble.setVisible(visible);
        row.hotkeyText.setVisible(visible);
        row.labelText.setVisible(visible);
        row.levelText.setVisible(visible);
        row.glow.setVisible(visible);
        row.frame.setVisible(visible);

        for (const segment of row.segments)
        {
            segment.setVisible(visible);
        }
    }

    for (const text of this.evolutionTraitTexts)
    {
        text.setVisible(visible);
    }

    if (!visible)
    {
        return;
    }

    this.evolutionTitleText.setText(this.translate('build.title', {
        character: this.player.character.label
    }));
    this.evolutionSummaryText.setText(this.translate('build.summary', {
        next: nextCharacter ? nextRequirement : 'MAX',
        spent,
        total: PLAYER_TOTAL_UPGRADE_POINTS
    }));
    this.evolutionEssenceText.setText(this.translate('build.points', {
        points: this.progression.essence
    }));

    this.evolutionCurrentLabel.setText(this.player.character.label);
    this.evolutionCurrentPreviewShadow.y = this.evolutionPreviewFrame.y + 74;
    this.evolutionCurrentPreview.y = this.evolutionPreviewFrame.y + 63 + (Math.sin(this.time.now / 240) * 4);
    this.evolutionCurrentPreview.setTexture(getPlayerFrameKey(this.player.character.assetId, 'idle', 0));
    this.evolutionCurrentPreview.anims.play(getPlayerAnimationKey(this.player.character.assetId, 'idle'), true);

    if (nextCharacter)
    {
        this.evolutionArrowText.setVisible(true);
        this.evolutionNextLabel.setVisible(true);
        this.evolutionNextPreview.setVisible(true);
        this.evolutionNextLabel.setText(this.translate(canEvolve ? 'build.ready' : 'build.next', {
            character: nextCharacter.label
        }));
        this.evolutionNextPreview.y = this.evolutionPreviewFrame.y + 94 + (Math.sin((this.time.now / 250) + 0.8) * 3);
        this.evolutionNextPreview.setTexture(getPlayerFrameKey(nextCharacter.assetId, 'idle', 0));
        this.evolutionNextPreview.anims.play(getPlayerAnimationKey(nextCharacter.assetId, 'idle'), true);
        this.evolutionNextPreview.setAlpha(canEvolve ? 0.8 : 0.42);
    }
    else
    {
        this.evolutionArrowText.setVisible(false);
        this.evolutionNextLabel.setVisible(true);
        this.evolutionNextLabel.setText(this.translate('build.finalForm'));
        this.evolutionNextPreview.setVisible(false);
    }

    this.evolutionUpgradeRows.forEach((row) => {
        const { upgrade } = row;
        const level = this.progression.upgrades[upgrade.id];
        const affordable = this.canSpendUpgradePoint(upgrade.id);
        const atMax = level >= upgrade.maxLevel;
        const nextSegmentIndex = Math.min(level, upgrade.maxLevel - 1);
        const labelColor = atMax ? '#a7f3d0' : affordable ? '#ffffff' : '#cbd5e1';

        row.labelText.setColor(labelColor);
        row.labelText.setText(this.getUpgradeLabel(upgrade));
        row.levelText.setText(`${level} / ${upgrade.maxLevel}`);
        row.hotkeyBubble.setFillStyle(upgrade.color, atMax ? 0.45 : 0.92);
        row.frame.setStrokeStyle(2, upgrade.color, affordable ? 0.62 : 0.22);
        row.glow.setFillStyle(upgrade.color, affordable ? 0.14 + (0.14 * pulse) : 0.08);

        row.segments.forEach((segment, segmentIndex) => {
            if (segmentIndex < level)
            {
                segment.setFillStyle(upgrade.color, 0.98);
                segment.setStrokeStyle(1, 0xffffff, 0.18);
                return;
            }

            if (affordable && segmentIndex === nextSegmentIndex)
            {
                segment.setFillStyle(upgrade.color, 0.18 + (0.48 * pulse));
                segment.setStrokeStyle(2, 0xffffff, 0.42 + (0.18 * pulse));
                return;
            }

            segment.setFillStyle(0x1f2937, 0.94);
            segment.setStrokeStyle(1, upgrade.color, 0.1);
        });
    });

    this.evolutionTraitTexts[0].setText(`1. ${this.player.character.traits[0]}`);
    this.evolutionTraitTexts[1].setText(`2. ${this.player.character.traits[1]}`);

    if (canEvolve && nextCharacter)
    {
        this.evolutionStatusText
            .setColor('#bbf7d0')
            .setText(this.translate('build.evolveReady', {
                character: nextCharacter.label
            }));
    }
    else if (!nextCharacter)
    {
        this.evolutionStatusText
            .setColor('#fde68a')
            .setText(this.translate('build.finalInProgress'));
    }
    else
    {
        this.evolutionStatusText
            .setColor('#dbeafe')
            .setText(this.translate('build.pointsMissing', {
                points: Math.max(0, nextRequirement - spent)
            }));
    }
},

updateHud (now)
{
    const attackCooldown = this.formatCooldown(this.player.nextAttackAt - now);
    const castCooldown = this.formatCooldown(this.player.nextCastAt - now);
    const waveStateLabel = this.translate(this.wave.active ? 'hud.waveStateActive' : 'hud.waveStatePrepare');
    const enemiesRemaining = Math.max(0, this.wave.enemiesToSpawn - this.wave.spawned);
    const enemies = this.getLivingEnemyCount();
    const healthRatio = this.player.health / this.player.maxHealth;
    const nextRequirement = this.getNextEvolutionRequirement();
    const evolutionLabel = nextRequirement ? `${Math.min(this.progression.totalSpent, nextRequirement)}/${nextRequirement}` : this.translate('hud.final');
    const regenLabel = this.player.stats.regenPerSecond > 0 ? `${this.player.stats.regenPerSecond.toFixed(1)}/s` : this.translate('hud.regenOff');

    this.playerHeaderText.setText(this.player.character.label);
    this.playerStatusText.setText(this.translate('hud.playerStatus', {
        health: this.formatHealthValue(this.player.health),
        maxHealth: this.formatHealthValue(this.player.maxHealth),
        state: this.formatPlayerStateLabel(this.player.state)
    }));
    this.playerCooldownText.setText(this.translate('hud.cooldowns', {
        attack: attackCooldown,
        cast: castCooldown,
        regen: regenLabel
    }));
    this.waveStatusText.setText(this.translate('hud.wave', {
        state: waveStateLabel,
        wave: Math.max(1, this.wave.current)
    }));
    this.scoreStatusText.setText(this.translate('hud.scoreEssence', {
        essence: this.progression.essence,
        score: this.score
    }));
    this.enemyStatusText.setText(this.translate('hud.enemies', {
        enemies,
        remaining: enemiesRemaining
    }));
    this.progressionStatusText.setText(this.translate('hud.progression', {
        evolution: evolutionLabel,
        spent: this.progression.totalSpent,
        total: PLAYER_TOTAL_UPGRADE_POINTS
    }));

    this.playerHealthBarFill.width = Math.max(0, PLAYER_HEALTH_BAR_WIDTH * healthRatio);
    this.playerHealthBarLabel.setText(this.translate('hud.health', {
        health: this.formatHealthValue(this.player.health),
        maxHealth: this.formatHealthValue(this.player.maxHealth)
    }));
},

showWaveBanner (label)
{
    if (!this.waveBannerText)
    {
        return;
    }

    this.waveBannerText.setText(label);
    this.waveBannerText.setAlpha(1);
    this.waveBannerText.setScale(0.92);

    this.tweens.killTweensOf(this.waveBannerText);
    this.tweens.add({
        targets: this.waveBannerText,
        alpha: 0,
        duration: 900,
        ease: 'Quad.easeOut',
        scaleX: 1.08,
        scaleY: 1.08
    });
},

formatPlayerStateLabel (state)
{
    switch (state)
    {
        case 'idle':
            return this.translate('states.idle');
        case 'idle-blink':
            return this.translate('states.idleBlink');
        case 'walk':
            return this.translate('states.walk');
        case 'attack':
            return this.translate('states.attack');
        case 'cast':
            return this.translate('states.cast');
        case 'hurt':
            return this.translate('states.hurt');
        case 'taunt':
            return this.translate('states.taunt');
        case 'dead':
            return this.translate('states.dead');
        default:
            return state;
    }
},

formatHealthValue (value)
{
    if (Math.abs(value - Math.round(value)) < 0.05)
    {
        return `${Math.round(value)}`;
    }

    return value.toFixed(1);
},

formatCooldown (remainingMs)
{
    if (remainingMs <= 0)
    {
        return this.translate('hud.ready');
    }

    return `${(remainingMs / 1000).toFixed(1)}s`;
}
};
