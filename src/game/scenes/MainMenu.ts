import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const btn = this.title = this.add.text(512, 460, 'Start game', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        btn.setInteractive({
            useHandCursor: true
        }).on('pointerdown', () => {
            this.startGame();
        });
    }

    private startGame(): void {
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.time.delayedCall(500, () => {
            this.physics.pause();
            this.scene.start('Game');
        })
    }
}
