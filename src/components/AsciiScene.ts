import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

export class AsciiScene {
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer
  private effect!: AsciiEffect
  private controls!: TrackballControls
  private container: HTMLElement
  private model: THREE.Object3D | null = null
  private clock: THREE.Clock
  private helpers: THREE.Object3D[] = []
  private loadingManager: THREE.LoadingManager

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()
    
    // Create loading manager
    this.loadingManager = new THREE.LoadingManager()
    this.loadingManager.onProgress = (url, loaded, total) => {
      const progress = (loaded / total) * 100
      console.log(`Loading: ${Math.round(progress)}%`)
    }
    this.loadingManager.onError = (url) => {
      console.error(`Error loading ${url}`)
    }

    this.init()
  }

  private init(): void {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0, 0, 0)

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
    this.camera.position.set(0, 0, 500)

    // Add helpers
    this.addHelpers()

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0xffffff, 1, 0, 0)
    pointLight1.position.set(100, 100, 0)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xffffff, 12, 0, 0)
    pointLight2.position.set(-500, 100, -200)
    this.scene.add(pointLight2)

    // Add light helpers
    const pointLightHelper1 = new THREE.PointLightHelper(pointLight1, 10)
    this.helpers.push(pointLightHelper1)
    this.scene.add(pointLightHelper1)

    const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, 10)
    this.helpers.push(pointLightHelper2)
    this.scene.add(pointLightHelper2)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    
    // Set willReadFrequently on the canvas
    const canvas = this.renderer.domElement
    canvas.setAttribute('willReadFrequently', 'true')

    // ASCII effect with adjusted resolution
    this.effect = new AsciiEffect(this.renderer, ' .:-+*=%@#', { 
      invert: true,
      resolution: 0.205
    })
    this.effect.setSize(window.innerWidth, window.innerHeight)
    this.effect.domElement.style.color = 'white'
    this.effect.domElement.style.backgroundColor = 'black'

    // Add to DOM
    this.container.appendChild(this.effect.domElement)

    // Add helpers toggle checkbox
    const toggleContainer = document.createElement('div')
    toggleContainer.style.position = 'fixed'
    toggleContainer.style.top = '20px'
    toggleContainer.style.right = '20px'
    toggleContainer.style.zIndex = '1000'
    toggleContainer.style.color = 'white'
    toggleContainer.style.display = 'flex'
    toggleContainer.style.alignItems = 'center'
    toggleContainer.style.gap = '8px'
    toggleContainer.style.flexWrap = 'wrap'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = true
    checkbox.id = 'helpers-toggle'
    
    const label = document.createElement('label')
    label.htmlFor = 'helpers-toggle'
    label.textContent = 'Show Helpers'

    const cameraButton = document.createElement('button')
    cameraButton.textContent = 'Log Camera State'
    cameraButton.style.marginLeft = '20px'
    cameraButton.style.padding = '5px 10px'
    cameraButton.style.backgroundColor = '#333'
    cameraButton.style.color = 'white'
    cameraButton.style.border = '1px solid #666'
    cameraButton.style.borderRadius = '4px'
    cameraButton.style.cursor = 'pointer'

    // Add FOV controls
    const fovContainer = document.createElement('div')
    fovContainer.style.display = 'flex'
    fovContainer.style.alignItems = 'center'
    fovContainer.style.gap = '8px'
    fovContainer.style.marginLeft = '20px'

    const fovLabel = document.createElement('label')
    fovLabel.textContent = 'FOV:'
    fovLabel.style.marginRight = '8px'

    const fovSlider = document.createElement('input')
    fovSlider.type = 'range'
    fovSlider.min = '30'
    fovSlider.max = '120'
    fovSlider.value = '45'
    fovSlider.style.width = '100px'

    const fovNumber = document.createElement('input')
    fovNumber.type = 'number'
    fovNumber.min = '30'
    fovNumber.max = '120'
    fovNumber.value = '45'
    fovNumber.style.width = '60px'
    fovNumber.style.backgroundColor = '#333'
    fovNumber.style.color = 'white'
    fovNumber.style.border = '1px solid #666'
    fovNumber.style.borderRadius = '4px'
    fovNumber.style.padding = '2px 5px'

    // FOV change handler
    const updateFOV = (value: number) => {
      const fov = Math.min(Math.max(value, 30), 120)
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
      fovSlider.value = fov.toString()
      fovNumber.value = fov.toString()
    }

    fovSlider.addEventListener('input', (e) => updateFOV(Number((e.target as HTMLInputElement).value)))
    fovNumber.addEventListener('input', (e) => updateFOV(Number((e.target as HTMLInputElement).value)))

    fovContainer.appendChild(fovLabel)
    fovContainer.appendChild(fovSlider)
    fovContainer.appendChild(fovNumber)

    toggleContainer.appendChild(checkbox)
    toggleContainer.appendChild(label)
    toggleContainer.appendChild(cameraButton)
    toggleContainer.appendChild(fovContainer)
    this.container.appendChild(toggleContainer)

    checkbox.addEventListener('change', () => this.toggleHelpers(checkbox.checked))
    cameraButton.addEventListener('click', () => this.logCameraState())

    // Controls
    this.controls = new TrackballControls(this.camera, this.effect.domElement)
    this.controls.minDistance = 100
    this.controls.maxDistance = 800
    this.controls.rotateSpeed = 1.0
    this.controls.zoomSpeed = 1.2
    this.controls.panSpeed = 0.8

    // Event listeners
    window.addEventListener('resize', this.handleResize)

    // Load model
    this.loadModel()
  }

  private addHelpers(): void {
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(1000)
    this.helpers.push(axesHelper)
    this.scene.add(axesHelper)

    // Add grid helper
    const size = 1000
    const divisions = 10
    const gridHelper = new THREE.GridHelper(size, divisions)
    this.helpers.push(gridHelper)
    this.scene.add(gridHelper)
  }

  private loadModel(): void {
    // Initialize DRACO loader for compressed models
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    // Initialize GLTF loader
    const loader = new GLTFLoader(this.loadingManager)
    loader.setDRACOLoader(dracoLoader)

    try {
      loader.load(
        '/assets/lewis-head.glb', 
        (gltf) => {
          try {
            this.model = gltf.scene
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(this.model)
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 200 / maxDim
            this.model.scale.setScalar(scale)

            // Center the model
            const center = box.getCenter(new THREE.Vector3())
            this.model.position.sub(center.multiplyScalar(scale))

            this.scene.add(this.model)

          } catch (err) {
            console.error('Error processing model:', err)
          }
        },
        undefined,
        (error) => {
          console.error('Error loading the model:', error)
        }
      )
    } catch (err) {
      console.error('Error initiating model load:', err)
    }
  }

  private handleResize = (): void => {
    if (!this.camera || !this.effect) return
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.effect.setSize(window.innerWidth, window.innerHeight)
  }

  public animate = (): void => {
    requestAnimationFrame(this.animate)
    this.render()
  }

  private render(): void {
    if (!this.effect || !this.scene || !this.camera) return
    
    this.controls.update()
    this.effect.render(this.scene, this.camera)
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    this.container.removeChild(this.effect.domElement)
    this.controls.dispose()
    
    // Clean up helpers
    this.helpers.forEach(helper => {
      this.scene.remove(helper)
      if (helper instanceof THREE.Line) {
        helper.geometry.dispose()
      }
      if ('material' in helper && helper.material instanceof THREE.Material) {
        helper.material.dispose()
      }
    })
    
    if (this.model) {
      this.scene.remove(this.model)
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }
    
    this.renderer.dispose()
  }

  private toggleHelpers(show: boolean): void {
    this.helpers.forEach(helper => {
      helper.visible = show
    })
  }

  private logCameraState(): void {
    const cameraState = {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      rotation: {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z
      },
      fov: this.camera.fov,
      lookAt: { x: 0, y: 0, z: 0 }
    }
    
    console.log('Camera State:', cameraState)
    // Also log as a compact string for easy copying
    console.log(JSON.stringify(cameraState))
  }
} 