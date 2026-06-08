import { Scene } from 'phaser';
import { getPlayerCharacterByAssetId } from '../data/playerCharacters';
import { DEFAULT_GAME_SETTINGS } from '../data/settings';
import {
    applyDocumentLocalization,
    getLanguage,
    t
} from '../i18n';

const PLAYER_TOTAL_UPGRADE_POINTS = 30;

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data)
    {
        this.settings = this.registry.get('settings') ?? { ...DEFAULT_GAME_SETTINGS };
        this.language = getLanguage(this.settings);

        applyDocumentLocalization(this.language);

        const isVictory = data?.result === 'win';
        const backgroundColor = isVictory ? 0x0f2a1d : 0x2a0d13;
        const accentFill = isVictory ? 0x15803d : 0xb45309;
        const accentStroke = isVictory ? 0xdcfce7 : 0xffedd5;
        const character = getPlayerCharacterByAssetId(data?.characterAssetId ?? 'Wraith_01');
        const characterLabel = this.translate(character.labelKey);

        this.cameras.main.setBackgroundColor(backgroundColor);

        this.add.image(512, 384, 'background').setAlpha(0.22);

        this.add.text(512, 230, this.translate(isVictory ? 'gameover.titleWin' : 'gameover.titleLose'), {
            fontFamily: 'Arial Black',
            fontSize: 68,
            color: '#ffffff',
            stroke: isVictory ? '#14532d' : '#2b0b12',
            strokeThickness: 10,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 306, this.translate(isVictory ? 'gameover.subtitleWin' : 'gameover.subtitleLose'), {
            fontFamily: 'Courier New',
            fontSize: 22,
            color: isVictory ? '#dcfce7' : '#fecaca',
            stroke: isVictory ? '#14532d' : '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 346, this.translate('gameover.waveScore', {
            score: data?.score ?? 0,
            wave: data?.wave ?? 1
        }), {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: isVictory ? '#dcfce7' : '#fee2e2',
            stroke: isVictory ? '#14532d' : '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 378, this.translate('gameover.finalForm', {
            character: characterLabel
        }), {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: isVictory ? '#dcfce7' : '#fee2e2',
            stroke: isVictory ? '#14532d' : '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 410, this.translate('gameover.buildSpent', {
            spent: data?.spent ?? 0,
            total: PLAYER_TOTAL_UPGRADE_POINTS
        }), {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: isVictory ? '#dcfce7' : '#fee2e2',
            stroke: isVictory ? '#14532d' : '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        const restartButton = this.add.rectangle(512, 456, 280, 70, accentFill, 0.96)
            .setStrokeStyle(4, accentStroke, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(512, 456, this.translate('gameover.restart'), {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#fff7ed',
            stroke: isVictory ? '#14532d' : '#7c2d12',
            strokeThickness: 6
        }).setOrigin(0.5);

        const homeButton = this.add.rectangle(512, 548, 280, 70, 0x1d4ed8, 0.96)
            .setStrokeStyle(4, 0xdbeafe, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(512, 548, this.translate('gameover.home'), {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#eff6ff',
            stroke: '#1e3a8a',
            strokeThickness: 6
        }).setOrigin(0.5);

        restartButton.on('pointerover', () => {

            restartButton.setFillStyle(isVictory ? 0x16a34a : 0xc05621, 1);

        });

        restartButton.on('pointerout', () => {

            restartButton.setFillStyle(accentFill, 0.96);

        });

        restartButton.on('pointerdown', () => {

            this.scene.start('Game');

        });

        homeButton.on('pointerover', () => {

            homeButton.setFillStyle(0x2563eb, 1);

        });

        homeButton.on('pointerout', () => {

            homeButton.setFillStyle(0x1d4ed8, 0.96);

        });

        homeButton.on('pointerdown', () => {

            this.scene.start('MainMenu');

        });

        this.input.keyboard.on('keydown-R', () => {

            this.scene.start('Game');

        });

        this.input.keyboard.on('keydown-ESC', () => {

            this.scene.start('MainMenu');

        });
    }

    translate (key, params)
    {
        return t(this.language, key, params);
    }
}
