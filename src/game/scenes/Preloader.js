import {
    ENEMY_ANIMATIONS,
    ENEMY_VARIANTS,
    getEnemyFrameKey,
    getEnemyFramePath
} from '../data/enemyAnimations';
import { Scene } from 'phaser';
import { MAP_ASSETS } from '../data/mapAssets';
import { PLAYER_CHARACTERS } from '../data/playerCharacters';
import {
    PLAYER_ANIMATIONS,
    getPlayerFrameKey,
    getPlayerFramePath
} from '../data/playerAnimations';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        this.load.setPath('assets');

        for (const [key, path] of MAP_ASSETS)
        {
            this.load.image(key, path);
        }

        for (const character of PLAYER_CHARACTERS)
        {
            for (const animation of PLAYER_ANIMATIONS)
            {
                for (let frame = 0; frame < animation.frames; frame++)
                {
                    this.load.image(
                        getPlayerFrameKey(character.assetId, animation.state, frame),
                        getPlayerFramePath(character.assetId, animation.state, frame)
                    );
                }
            }
        }

        for (const variant of ENEMY_VARIANTS)
        {
            for (const animation of ENEMY_ANIMATIONS)
            {
                for (let frame = 1; frame <= animation.frames; frame++)
                {
                    this.load.image(
                        getEnemyFrameKey(variant, animation.state, frame),
                        getEnemyFramePath(variant, animation.state, frame)
                    );
                }
            }
        }
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
