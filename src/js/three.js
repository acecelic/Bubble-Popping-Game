import * as T from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { randInt } from 'three/src/math/MathUtils.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new T.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(0xFEFEFE);
    this.renderer.outputEncoding = T.sRGBEncoding;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.7;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableZoom = false;

    // this.clock = new T.Clock();

    this.raycaster = new T.Raycaster();
    this.mouse = new T.Vector2();

    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new T.AmbientLight(new T.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    this.hdrTextureUrl = new URL('../assets/chinese_garden_4k.hdr', import.meta.url);
    this.loader = new RGBELoader();
    this.loader.load(this.hdrTextureUrl, (texture) => {
      this.scene.background = texture;
      texture.mapping = T.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      this.scene.backgroundIntensity = 1;
      this.scene.backgroundBlurriness = 0.05;
    });

    this.bubble = new T.Mesh(
      new T.SphereGeometry(0.5,50,50),
      new T.MeshPhysicalMaterial({
          roughness: 0,
          metalness: 0,
          // color: 0xFFEA00,
          transmission: 1,
          ior: 2.33,
          iridescence: 0.5,
          iridescenceIOR: 1.6,
          iridescenceThicknessRange: [200, 400],
          sheen: 1.0,
          // sheenColor: 0xFFC0CB
          specularIntensity: 1.0
      })
    );

    this.populateBubbles();
    window.addEventListener('click', this.onMouseClick.bind(this));
  }

  populateBubbles() {
    const REGION_SIZE = 25;
    const NUM_BUBBLES = 2000;
    this.bubblesCount = NUM_BUBBLES;

    for (let i = 0; i < NUM_BUBBLES; i++) {
      let tempBubble = this.bubble.clone();
      tempBubble.translateX(randInt(0-REGION_SIZE, REGION_SIZE));
      tempBubble.translateY(randInt(0-REGION_SIZE, REGION_SIZE));
      tempBubble.translateZ(randInt(0-REGION_SIZE, REGION_SIZE));
      this.scene.add(tempBubble);
    }
  }

  onMouseClick(event) {
    this.mouse.x = (event.clientX / device.width) * 2 - 1;
    this.mouse.y = -(event.clientY / device.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      this.scene.remove(obj);
      this.bubblesCount -= 1;
      console.log("Bubbles left: ", this.bubblesCount);

      if (this.bubblesCount == 0) {
        console.log("No more bubbles")
        this.populateBubbles();
      }
    }
  }

  render() {
    // const elapsedTime = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
