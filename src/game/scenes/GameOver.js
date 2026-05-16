import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data)
    {
        this.cameras.main.setBackgroundColor(0x2a0d13);

        this.add.image(512, 384, 'background').setAlpha(0.22);

        this.add.text(512, 230, 'Game Over', {
            fontFamily: 'Arial Black',
            fontSize: 68,
            color: '#ffffff',
            stroke: '#2b0b12',
            strokeThickness: 10,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 306, 'Foste derrotado. Escolhe o proximo passo.', {
            fontFamily: 'Courier New',
            fontSize: 22,
            color: '#fecaca',
            stroke: '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 346, `Wave alcancada: ${data?.wave ?? 1} | Score: ${data?.score ?? 0}`, {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: '#fee2e2',
            stroke: '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 378, `Forma final: ${data?.character ?? 'Wraith I'}`, {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: '#fee2e2',
            stroke: '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(512, 410, `Build gasta: ${data?.spent ?? 0}/30`, {
            fontFamily: 'Courier New',
            fontSize: 20,
            color: '#fee2e2',
            stroke: '#3f0b14',
            strokeThickness: 5
        }).setOrigin(0.5);

        const restartButton = this.add.rectangle(512, 456, 280, 70, 0xb45309, 0.96)
            .setStrokeStyle(4, 0xffedd5, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(512, 456, 'Reiniciar', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#fff7ed',
            stroke: '#7c2d12',
            strokeThickness: 6
        }).setOrigin(0.5);

        const homeButton = this.add.rectangle(512, 548, 280, 70, 0x1d4ed8, 0.96)
            .setStrokeStyle(4, 0xdbeafe, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(512, 548, 'Home', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#eff6ff',
            stroke: '#1e3a8a',
            strokeThickness: 6
        }).setOrigin(0.5);

        restartButton.on('pointerover', () => {

            restartButton.setFillStyle(0xc05621, 1);

        });

        restartButton.on('pointerout', () => {

            restartButton.setFillStyle(0xb45309, 0.96);

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
    }
}
