import { Scene } from 'phaser';
import {
    DEFAULT_GAME_SETTINGS,
    loadGameSettings,
    saveGameSettings
} from '../data/settings';
import {
    applyDocumentLocalization,
    getLanguage,
    t
} from '../i18n';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.settings = this.registry.get('settings') ?? loadGameSettings() ?? { ...DEFAULT_GAME_SETTINGS };
        this.language = getLanguage(this.settings);

        applyDocumentLocalization(this.language);

        this.cameras.main.setBackgroundColor(0x120f18);

        this.add.image(512, 384, 'background').setAlpha(0.28);

        this.titleText = this.add.text(512, 220, '', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#fff7ed',
            stroke: '#1f2937',
            strokeThickness: 10
        }).setOrigin(0.5);

        this.subtitleText = this.add.text(512, 292, '', {
            fontFamily: 'Courier New',
            fontSize: 24,
            color: '#fde68a',
            stroke: '#3f2b18',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.controlsText = this.add.text(512, 356, '', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#f8fafc',
            stroke: '#1f2937',
            strokeThickness: 5,
            wordWrap: { width: 860 }
        }).setOrigin(0.5);

        this.startButton = this.add.rectangle(512, 450, 260, 76, 0x2f855a, 0.96)
            .setStrokeStyle(4, 0xd1fae5, 1)
            .setInteractive({ useHandCursor: true });

        this.startButtonLabel = this.add.text(512, 450, '', {
            fontFamily: 'Arial Black',
            fontSize: 30,
            color: '#f0fdf4',
            stroke: '#14532d',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.settingsTitleText = this.add.text(512, 520, '', {
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

        this.languageTitleText = this.add.text(160, 554, '', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#fde68a',
            stroke: '#1f2937',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.ptButton = this.add.rectangle(108, 600, 88, 54, 0x1f2937, 0.94)
            .setStrokeStyle(3, 0xcbd5e1, 0.8)
            .setInteractive({ useHandCursor: true });

        this.ptLabel = this.add.text(108, 600, 'PT', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#eff6ff',
            stroke: '#0f1720',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.enButton = this.add.rectangle(212, 600, 88, 54, 0x1f2937, 0.94)
            .setStrokeStyle(3, 0xcbd5e1, 0.8)
            .setInteractive({ useHandCursor: true });

        this.enLabel = this.add.text(212, 600, 'EN', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#eff6ff',
            stroke: '#0f1720',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.refreshMenuUi();

        this.startButton.on('pointerover', () => {

            this.startButton.setFillStyle(0x38a169, 1);

        });

        this.startButton.on('pointerout', () => {

            this.startButton.setFillStyle(0x2f855a, 0.96);

        });

        this.startButton.on('pointerdown', () => {

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

        this.ptButton.on('pointerdown', () => this.changeLanguage('pt'));
        this.enButton.on('pointerdown', () => this.changeLanguage('en'));
    }

    translate (key, params)
    {
        return t(this.language, key, params);
    }

    changeLanguage (language)
    {
        this.settings = saveGameSettings({
            ...this.settings,
            language
        });
        this.registry.set('settings', this.settings);
        this.language = getLanguage(this.settings);

        applyDocumentLocalization(this.language);
        this.refreshMenuUi();
    }

    refreshMenuUi ()
    {
        this.titleText.setText(this.translate('menu.title'));
        this.subtitleText.setText(this.translate('menu.subtitle'));
        this.controlsText.setText(this.translate('menu.controls'));
        this.startButtonLabel.setText(this.translate('menu.start'));
        this.settingsTitleText.setText(this.translate('menu.settings'));
        this.languageTitleText.setText(this.translate('menu.language'));
        this.refreshSettingsUi();
        this.refreshLanguageUi();
    }

    refreshSettingsUi ()
    {
        const enabled = Boolean(this.settings?.devMode);
        const stateLabel = this.translate(enabled ? 'menu.on' : 'menu.off');

        this.devModeButton.setFillStyle(enabled ? 0x1d4ed8 : 0x1f2937, 0.96);
        this.devModeButton.setStrokeStyle(4, enabled ? 0xdbeafe : 0xcbd5e1, 1);
        this.devModeLabel.setText(this.translate('menu.devMode', { state: stateLabel }));
        this.devModeHint.setText(this.translate(enabled ? 'menu.devModeHintOn' : 'menu.devModeHintOff'));
    }

    refreshLanguageUi ()
    {
        const isPt = this.language === 'pt';

        this.ptButton.setFillStyle(isPt ? 0x2f855a : 0x1f2937, 0.94);
        this.ptButton.setStrokeStyle(3, isPt ? 0xd1fae5 : 0xcbd5e1, 0.9);
        this.enButton.setFillStyle(isPt ? 0x1f2937 : 0x1d4ed8, 0.94);
        this.enButton.setStrokeStyle(3, isPt ? 0xcbd5e1 : 0xdbeafe, 0.9);
    }
}
