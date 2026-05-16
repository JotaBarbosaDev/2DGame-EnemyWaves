import { Scene } from 'phaser';
import {
    DEFAULT_GAME_SETTINGS,
    loadGameSettings,
    saveGameSettings
} from '../data/settings';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.settings = this.registry.get('settings') ?? loadGameSettings() ?? { ...DEFAULT_GAME_SETTINGS };
        this.cameras.main.setBackgroundColor(0x120f18);

        this.add.image(512, 384, 'background').setAlpha(0.28);

        this.add.text(512, 220, '2D Enemy Waves', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#fff7ed',
            stroke: '#1f2937',
            strokeThickness: 10
        }).setOrigin(0.5);

        this.add.text(512, 292, 'Sobrevive, luta e limpa o mapa', {
            fontFamily: 'Courier New',
            fontSize: 24,
            color: '#fde68a',
            stroke: '#3f2b18',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 356, 'WASD mover | Space/J/K/LMB atacar | E/RMB cast | U build | 1-5 gastar', {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: '#f8fafc',
            stroke: '#1f2937',
            strokeThickness: 5
        }).setOrigin(0.5);

        const startButton = this.add.rectangle(512, 450, 260, 76, 0x2f855a, 0.96)
            .setStrokeStyle(4, 0xd1fae5, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(512, 450, 'Comecar', {
            fontFamily: 'Arial Black',
            fontSize: 30,
            color: '#f0fdf4',
            stroke: '#14532d',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 520, 'Settings', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#dbeafe',
            stroke: '#1e3a8a',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.devModeButton = this.add.rectangle(512, 584, 320, 70, 0x1d4ed8, 0.96)
            .setStrokeStyle(4, 0xdbeafe, 1)
            .setInteractive({ useHandCursor: true });

        this.devModeLabel = this.add.text(512, 574, '', {
            fontFamily: 'Arial Black',
            fontSize: 26,
            color: '#eff6ff',
            stroke: '#1e3a8a',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.devModeHint = this.add.text(512, 606, '', {
            fontFamily: 'Courier New',
            fontSize: 15,
            color: '#dbeafe',
            stroke: '#1e3a8a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.refreshSettingsUi();

        startButton.on('pointerover', () => {

            startButton.setFillStyle(0x38a169, 1);

        });

        startButton.on('pointerout', () => {

            startButton.setFillStyle(0x2f855a, 0.96);

        });

        startButton.on('pointerdown', () => {

            this.scene.start('Game');

        });

        this.devModeButton.on('pointerover', () => {

            this.devModeButton.setFillStyle(this.settings.devMode ? 0x2563eb : 0x334155, 1);

        });

        this.devModeButton.on('pointerout', () => {

            this.refreshSettingsUi();

        });

        this.devModeButton.on('pointerdown', () => {

            this.settings = saveGameSettings({
                ...this.settings,
                devMode: !this.settings.devMode
            });
            this.registry.set('settings', this.settings);
            this.refreshSettingsUi();

        });
    }

    refreshSettingsUi ()
    {
        const enabled = Boolean(this.settings?.devMode);

        this.devModeButton.setFillStyle(enabled ? 0x1d4ed8 : 0x1f2937, 0.96);
        this.devModeButton.setStrokeStyle(4, enabled ? 0xdbeafe : 0xcbd5e1, 1);
        this.devModeLabel.setText(`Dev Mode ${enabled ? 'ON' : 'OFF'}`);
        this.devModeHint.setText(enabled ? 'Mostra grelha, celulas e marcadores de debug' : 'Esconde grelha e coordenadas do mapa');
    }
}
