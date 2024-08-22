import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import Target from '../objects/Target';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite;
    private projectiles: Phaser.Physics.Arcade.Group;
    private targets: Phaser.Physics.Arcade.Group;
    private aimLine: Phaser.GameObjects.Graphics;
    private startPoint: Phaser.Input.Pointer;
    private isAiming: boolean = false;

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
        //this.add.image(400, 300, 'player').setScale(0.5, 1); // This will make it half as wide but keep its full height
        this.add.image(100, 100, 'gem').setScale(0.75, 1); // This will make it half as wide but keep its full height
        this.add.image(100, 100, 'food').setScale(0.75, 1); // This will make it half as wide but keep its full height
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        // Add player at the bottom center
        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height - 50, 'player').setScale(0.65);
        this.player.setCollideWorldBounds(true);

        // Initialize projectile group
        this.projectiles = this.physics.add.group();

        // Initialize targets group
        this.targets = this.physics.add.group();

        // Input handling
        this.input.on('pointerdown', this.startAiming, this);
        this.input.on('pointerup', this.shoot, this);

        // Line graphics for visualizing aim
        this.aimLine = this.add.graphics();

        // Spawn targets at intervals
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnTarget,
            callbackScope: this,
            loop: true
        });

        // Collision detection between projectiles and targets
        this.physics.add.overlap(this.projectiles, this.targets, this.hitTarget, null, this);

        EventBus.emit('current-scene-ready', this);
    }
    update() {
        // Update aim visualization
        if (this.isAiming) {
            this.updateAimLine();
        }

        // Update all targets
        this.targets.children.iterate((target: Phaser.GameObjects.GameObject) => {
            if (target instanceof Target) {
                (target as Target).update();
            }
            return void 0;
        });
    }

    changeScene() {
        this.scene.start('GameOver');
    }

    private startAiming(pointer: Phaser.Input.Pointer) {
        // Save the starting point for aiming
        this.startPoint = pointer;
        this.isAiming = true;
    }

    private shoot(pointer: Phaser.Input.Pointer) {
        // Only shoot if the player was aiming
        if (!this.isAiming) return;

        // Calculate direction and force
        const direction = Phaser.Math.Angle.Between(this.startPoint.x, this.startPoint.y, pointer.x, pointer.y);
        const distance = Phaser.Math.Distance.Between(this.startPoint.x, this.startPoint.y, pointer.x, pointer.y);

        // Create and launch projectile
        const projectile = this.projectiles.create(this.player.x, this.player.y, 'player') as Phaser.Physics.Arcade.Sprite; // Using player image for projectile temporarily
        projectile.setScale(0.5);
        this.physics.velocityFromRotation(direction, distance * 5, projectile.body!.velocity);

        // Clear aim line and reset aiming state
        this.aimLine.clear();
        this.isAiming = false;

        // Set projectile's lifespan
        this.time.addEvent({
            delay: 2000,
            callback: () => projectile.destroy(),
        });
    }

    private updateAimLine() {
        // Clear previous aim line
        this.aimLine.clear();

        // Calculate direction and distance
        const direction = Phaser.Math.Angle.Between(this.startPoint.x, this.startPoint.y, this.input.activePointer.x, this.input.activePointer.y);
        const distance = Phaser.Math.Distance.Between(this.startPoint.x, this.startPoint.y, this.input.activePointer.x, this.input.activePointer.y);

        // Draw the aim line
        this.aimLine.lineStyle(2, 0xff0000, 1);
        this.aimLine.beginPath();
        this.aimLine.moveTo(this.player.x, this.player.y);
        this.aimLine.lineTo(this.player.x - Math.cos(direction) * distance, this.player.y - Math.sin(direction) * distance);
        this.aimLine.strokePath();
    }

    private spawnTarget() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const texture = Phaser.Math.RND.pick(['gem', 'food']); // Randomly choose gem or food
        const target = new Target(this, x, 0, texture);
        this.targets.add(target);
    }

    private hitTarget(projectile: Phaser.Physics.Arcade.Sprite, target: Target) {
        target.destroy();
        projectile.destroy();
    }
}
