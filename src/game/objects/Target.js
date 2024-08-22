export default class Target extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setVelocityY(Phaser.Math.Between(50, 100)); // Random speed for targets
        this.setCollideWorldBounds(true);
        this.setBounce(1);
    }

    update() {
        if (this.y > this.scene.scale.height) {
            this.destroy(); // Remove target if it goes off-screen
        }
    }
}