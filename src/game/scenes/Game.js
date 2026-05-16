import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x1d212d);

        this.add.image(512, 384, 'background').setAlpha(0.35);

        const logo = this.add.image(512, 300, 'logo').setScale(0.32);

        this.add.text(512, 620, 'Base do projeto Phaser + Vite', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: logo,
            y: 320,
            duration: 1400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}
