﻿/// <reference path="babylon.light.ts" />

module BABYLON {
    export class DirectionalLight extends ShadowLight {

        private _shadowOrthoScale = 0.5;

        @serialize()
        public get shadowOrthoScale(): number {
            return this._shadowOrthoScale
        }
        public set shadowOrthoScale(value: number) {
            this._shadowOrthoScale = value;
            this.forceProjectionMatrixCompute();
        }

        @serialize()
        public autoUpdateExtends = true;

        // Cache
        private _orthoLeft = Number.MAX_VALUE;
        private _orthoRight = Number.MIN_VALUE;
        private _orthoTop = Number.MIN_VALUE;
        private _orthoBottom = Number.MAX_VALUE;

        /**
         * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).  
         * The directional light is emitted from everywhere in the given direction.  
         * It can cast shawdows.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, direction: Vector3, scene: Scene) {
            super(name, scene);
            this.position = direction.scale(-1.0);
            this.direction = direction;
        }

        /**
         * Returns the string "DirectionalLight".  
         */
        public getClassName(): string {
            return "DirectionalLight";
        }

        /**
         * Returns the integer 1.
         */
        public getTypeID(): number {
            return Light.LIGHTTYPEID_DIRECTIONALLIGHT;
        }

        /**
         * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.  
         * Returns the DirectionalLight.  
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;

            // Check extends
            if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
                var tempVector3 = Vector3.Zero();

                this._orthoLeft = Number.MAX_VALUE;
                this._orthoRight = Number.MIN_VALUE;
                this._orthoTop = Number.MIN_VALUE;
                this._orthoBottom = Number.MAX_VALUE;

                for (var meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                    var mesh = renderList[meshIndex];

                    if (!mesh) {
                        continue;
                    }

                    var boundingInfo = mesh.getBoundingInfo();

                    if (!boundingInfo) {
                        continue;
                    }

                    var boundingBox = boundingInfo.boundingBox;

                    for (var index = 0; index < boundingBox.vectorsWorld.length; index++) {
                        Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);

                        if (tempVector3.x < this._orthoLeft)
                            this._orthoLeft = tempVector3.x;
                        if (tempVector3.y < this._orthoBottom)
                            this._orthoBottom = tempVector3.y;

                        if (tempVector3.x > this._orthoRight)
                            this._orthoRight = tempVector3.x;
                        if (tempVector3.y > this._orthoTop)
                            this._orthoTop = tempVector3.y;
                    }
                }
            }

            var xOffset = this._orthoRight - this._orthoLeft;
            var yOffset = this._orthoTop - this._orthoBottom;

            Matrix.OrthoOffCenterLHToRef(this._orthoLeft - xOffset * this.shadowOrthoScale, this._orthoRight + xOffset * this.shadowOrthoScale,
                this._orthoBottom - yOffset * this.shadowOrthoScale, this._orthoTop + yOffset * this.shadowOrthoScale,
                this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix);
        }

        protected _buildUniformLayout(): void {
             this._uniformBuffer.addUniform("vLightData", 4);
             this._uniformBuffer.addUniform("vLightDiffuse", 4);
             this._uniformBuffer.addUniform("vLightSpecular", 3);
             this._uniformBuffer.addUniform("shadowsInfo", 3);
             this._uniformBuffer.create();
        }

        /**
         * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.  
         * Returns the DirectionalLight.  
         */
        public transferToEffect(effect: Effect, lightIndex: string): DirectionalLight {
            if (this.computeTransformedInformation()) {
               this._uniformBuffer.updateFloat4("vLightData", this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z, 1, lightIndex);
                return this;
            }
            this._uniformBuffer.updateFloat4("vLightData", this.direction.x, this.direction.y, this.direction.z, 1, lightIndex);
            return this;
        }
    }
}  