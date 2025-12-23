import {Scene, GameObjects} from 'phaser';

export class Game extends Scene {
    private meteors!: Phaser.Physics.Arcade.Group;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 1000;
    private menuBar!: GameObjects.Container;
    private quitButton!: GameObjects.Text;
    private background!: GameObjects.Image;
    private spaceship!: Phaser.Physics.Arcade.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private scoreText!: GameObjects.Text;
    private spaceshipSpeed: number = 500;
    private explosions!: Phaser.GameObjects.Group;
    private integrity: number = 100;
    private lasers!: Phaser.Physics.Arcade.Group;

    constructor() {
        super('Game');
    }

    preload(): void {
        this.load.image('meteorBrown_big1', 'assets/sprites/meteorBrown_big1.png');
        this.load.image('meteorBrown_big2', 'assets/sprites/meteorBrown_big2.png');
        this.load.image('meteorBrown_big3', 'assets/sprites/meteorBrown_big3.png');
        this.load.image('meteorBrown_big4', 'assets/sprites/meteorBrown_big4.png');
        this.load.image('laser', 'assets/sprites/laserRed01.png');
        this.load.image('spaceship', 'assets/sprites/ship_red.png');
        this.load.spritesheet('explosion', 'assets/sprites/meteor_explosion.png', {
            frameWidth: 32,
            frameHeight: 32,
            endFrame: 16,
        });
    }

    create(): void {
        this.createSpaceship();

        this.meteors = this.physics.add.group();
        this.explosions = this.add.group();
        this.lasers = this.physics.add.group();

        this.physics.add.collider(
            this.meteors,
            this.meteors
        );

        this.spawnMeteor();
        this.createMenuBar();
        this.createExplosionAnimation();


        this.background = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'background'
        );
        this.background.setDisplaySize(
            this.cameras.main.width,
            this.cameras.main.height
        );

        this.background.setDepth(-1);

        this.physics.add.overlap(
            this.lasers,
            this.meteors,
            this.meteorDestroy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        this.physics.add.collider(
            this.spaceship,
            this.meteors,
            this.handleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
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

        this.handleSpaceshipControls();
        this.shooter();
    }

    private spawnMeteor(): void {
        const x = Phaser.Math.Between(50, (this.game.config.width as number) - 50);


        // const texture = Phaser.Math.Between(0, 1) === 0 ? 'meteorSmall' : 'meteorLarge';

        const textures = [
            'meteorBrown_big1',
            'meteorBrown_big2',
            'meteorBrown_big3',
            'meteorBrown_big4'
        ]

        const texture = Phaser.Utils.Array.GetRandom(textures);

        const meteor = this.meteors.create(x, -50, texture);

        // Active la physique pour l'objet
        if (meteor.body) {
            const body = meteor.body as Phaser.Physics.Arcade.Body;

            const speed = Phaser.Math.Between(80, 200);

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
            {fontFamily: 'Arial Black', fontSize: 24, color: '#000'}
        ).setOrigin(0.5);

        this.quitButton.setInteractive({useHandCursor: true});

        this.quitButton.on('pointerdown', () => {
            this.quitGame();
        })

        const gameTitle = this.add.text(
            100,
            menuBarY + menuBarHeight / 2,
            'Score: ' + this.score,
            {
                fontFamily: 'Arial',
                fontSize: 24,
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

    private createSpaceship(): void {
        const startX = this.cameras.main.centerX;
        const startY = (this.game.config.height as number) - 100;

        this.spaceship = this.physics.add.image(startX, startY, 'spaceship');
        this.spaceship.setCollideWorldBounds(true);
        this.spaceship.setDepth(10);

        this.spaceship.setImmovable(false)
        this.spaceship.setPushable(false)

        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    private handleSpaceshipControls(): void {
        this.spaceship.setVelocity(0, 0);

        if (this.cursors.left.isDown) {
            this.spaceship.setVelocityX(-this.spaceshipSpeed);
        } else if (this.cursors.right.isDown) {
            this.spaceship.setVelocityX(this.spaceshipSpeed);
        }
    }

    private handleCollision(spaceship: Phaser.Physics.Arcade.Image, meteor: Phaser.Physics.Arcade.Image): void {
        spaceship.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            spaceship.clearTint();
        });

        this.createExplosion(meteor.x, meteor.y);

        meteor.setVisible(false);
        meteor.setActive(false);

        if (meteor.body) {
            meteor.body.enable = false;
        }

        this.time.delayedCall(300, () => {
            meteor.destroy();
        });

        // Vous pouvez ajouter d'autres effets ici :
        // - Réduire la vie du joueur
        // - Faire exploser le météore
        // - Jouer un son
    }

    createExplosionAnimation(): void {
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion',
                {
                    start: 0,
                    end: 16,
                }
            ),
            frameRate: 60,
            repeat: 0,
            hideOnComplete: true,
        });
    }

    private createExplosion(x: number, y: number): void {
        // Crée une explosion à la position donnée
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.setDepth(20);
        explosion.play('explode');

        // Joue un son d'explosion (si vous avez un son)
        // this.sound.play('explosionSound');

        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
    }

    private createLaser(x: number, y: number): void {
        const laser = this.lasers.create(x, y, 'laser');

        if (laser) {
            laser.setDepth(10);
            // laser.setScale(0.5);
            laser.setVelocityY(-1000);

            // S'assurer que le corps physique est bien configuré
            if (laser.body) {
                const body = laser.body as Phaser.Physics.Arcade.Body;
                body.setCollideWorldBounds(false);
            }
        }
    }

    private shooter(): void {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.createLaser(this.spaceship.x, this.spaceship.y);
        }
    }

    private meteorDestroy(laser: Phaser.Physics.Arcade.Image, meteor: Phaser.Physics.Arcade.Image): void {
        this.createExplosion(meteor.x, meteor.y);

        meteor.setVisible(false);
        meteor.setActive(false);

        laser.setVisible(false);

        if (meteor.body) {
            meteor.body.enable = false;
        }

        laser.destroy()

        this.time.delayedCall(300, () => {
            meteor.destroy();
        });
    }
}
