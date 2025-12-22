import {Scene, GameObjects} from 'phaser';

export class Game extends Scene {
    private meteors!: Phaser.Physics.Arcade.Group;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 1000;
    private menuBar!: GameObjects.Container;
    private quitButton!: GameObjects.Text;

    constructor() {
        super('Game');
    }

    preload(): void {
        this.load.image('meteorSmall', 'assets/sprites/meteor_detailedSmall.png');
        this.load.image('meteorLarge', 'assets/sprites/meteor_detailedLarge.png');
    }

    create(): void {
        this.meteors = this.physics.add.group();
        this.spawnMeteor();
        this.createMenuBar();
    }

    update(time: number): void {
        if (time > this.lastSpawnTime + this.spawnInterval) {
            this.spawnMeteor();
            this.lastSpawnTime = time;
        }

        this.meteors.getChildren().forEach((meteor: Phaser.GameObjects.GameObject) => {
            const go = meteor as Phaser.Physics.Arcade.Image;
            if (go.y > (this.game.config.height as number) + 100) {
                go.destroy();
            }
        });
    }

    private spawnMeteor(): void {
        const x = Phaser.Math.Between(50, (this.game.config.width as number) - 50);

        const texture = Phaser.Math.Between(0, 1) === 0 ? 'meteorSmall' : 'meteorLarge';
        const meteor = this.meteors.create(x, -50, texture);

        // Active la physique pour l'objet
        if (meteor.body) {
            const body = meteor.body as Phaser.Physics.Arcade.Body;

            const speed = texture === 'meteorLarge' ? Phaser.Math.Between(80, 200) : Phaser.Math.Between(150, 350);

            body.setVelocityY(speed);
            body.setAngularVelocity(Phaser.Math.Between(-50, 50));
        }
    }

    private createMenuBar(): void {
        const screenWidth = this.game.config.width as number;
        const screenHeight = this.game.config.height as number;

        const menuBarHeight = 50;
        const menuBarY = screenHeight - menuBarHeight;

        const background = this.add.rectangle(
            screenWidth / 2,
            menuBarY + menuBarHeight / 2,
            screenWidth,
            menuBarHeight,
            0x88AAD3,
            1
        );

        this.quitButton = this.add.text(
            screenWidth - 100,
            menuBarY + menuBarHeight / 2,
            'Quit',
            { fontFamily: 'Arial Black', fontSize: 24, color: '#000' }
        ).setOrigin(0.5);

        this.quitButton.setInteractive({ useHandCursor: true });

        this.quitButton.on('pointerdown', () => {
            this.quitGame();
        })

        const gameTitle = this.add.text(
            100,
            menuBarY + menuBarHeight / 2,
            'Planet defender',
            {
                fontFamily: 'Arial',
                fontSize: 18,
                color: '#000'
            }
        ).setOrigin(0.5);

        this.menuBar = this.add.container(0, 0, [background, gameTitle, this.quitButton]);
        this.menuBar.setDepth(1000);
    }


    private quitGame(): void {
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.time.delayedCall(500, () => {
            this.physics.pause();
            this.scene.start('MainMenu');
        })
    }
}
