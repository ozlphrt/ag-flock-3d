/**
 * Shared Post-Processing Shader Setup using standard three.js scripts
 */
class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.bloomPass = null;
    this.init();
  }

  init() {
    // Dynamic dependencies loading if needed.
    // Assuming EffectComposer, RenderPass, ShaderPass, UnrealBloomPass are loaded in main file.
    if (typeof THREE.EffectComposer !== 'undefined') {
      this.composer = new THREE.EffectComposer(this.renderer);
      
      const renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // UnrealBloomPass parameters: resolution, strength, radius, threshold
      if (typeof THREE.UnrealBloomPass !== 'undefined') {
        this.bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          1.5,  // strength
          0.4,  // radius
          0.1   // threshold
        );
        this.composer.addPass(this.bloomPass);
      }
    }
  }

  resize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  render() {
    if (this.composer) {
      this.composer.render();
      return true;
    }
    return false;
  }
}

window.PostFX = PostFX;
