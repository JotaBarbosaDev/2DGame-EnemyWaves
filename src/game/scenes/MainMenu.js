import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
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

        this.add.text(512, 356, 'WASD mover | Space/J/K/LMB atacar | E/RMB cast | Mira com o rato', {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: '#f8fafc',
            stroke: '#1f2937',
            strokeThickness: 5
        }).setOrigin(0.5);

        const startButton = this.add.rectangle(512, 470, 260, 76, 0x2f855a, 0.96)
            .setStrokeStyle(4, 0xd1fae5, 1)
            .setInteractive({ useHandCursor: true });

        const startLabel = this.add.text(512, 470, 'Comecar', {
            fontFamily: 'Arial Black',
            fontSize: 30,
            color: '#f0fdf4',
            stroke: '#14532d',
            strokeThickness: 6
        }).setOrigin(0.5);

        startButton.on('pointerover', () => {

            startButton.setFillStyle(0x38a169, 1);

        });

        startButton.on('pointerout', () => {

            startButton.setFillStyle(0x2f855a, 0.96);

        });

        startButton.on('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
