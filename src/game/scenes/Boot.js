import { Scene } from 'phaser';
import { loadGameSettings } from '../data/settings';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.image('background', 'assets/bg.png');
    }

    create ()
    {
        this.registry.set('settings', loadGameSettings());
        this.scene.start('Preloader');
    }
}
