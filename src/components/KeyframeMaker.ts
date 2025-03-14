import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import keyframesData from '../data/keyframes.json'

export class KeyframeMaker {
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
  private existingKeyframes = keyframesData.keyframes
  private currentFrameIndex = -1 // -1 means free camera
  private cameraDisplay: HTMLElement | null = null

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
    this.addKeyframeControls()
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
    this.controls.handleResize()
  }

  public animate = (): void => {
    requestAnimationFrame(this.animate)
    this.render()
  }

  private render(): void {
    if (!this.effect || !this.scene || !this.camera) return
    
    this.controls.update()
    this.effect.render(this.scene, this.camera)

    // Update camera display if it exists
    if (this.cameraDisplay) {
      const formatNumber = (num: number) => {
        const formatted = Number(num.toFixed(2))
        return formatted < 0 ? `<strong>${formatted}</strong>` : formatted
      }
      const pos = this.camera.position
      const rot = this.camera.rotation
      this.cameraDisplay.innerHTML = `
        <div style="font-family: monospace; font-size: 12px;">
          <div>Position:</div>
          <div>X: ${formatNumber(pos.x)}</div>
          <div>Y: ${formatNumber(pos.y)}</div>
          <div>Z: ${formatNumber(pos.z)}</div>
          <div style="margin-top: 8px">Rotation:</div>
          <div>X: ${formatNumber(rot.x)}</div>
          <div>Y: ${formatNumber(rot.y)}</div>
          <div>Z: ${formatNumber(rot.z)}</div>
          <div style="margin-top: 8px">FOV: ${formatNumber(this.camera.fov)}°</div>
        </div>
      `
    }
  }

  private addKeyframeControls(): void {
    const controlsContainer = document.createElement('div')
    controlsContainer.style.position = 'fixed'
    controlsContainer.style.top = '20px'
    controlsContainer.style.right = '20px'
    controlsContainer.style.zIndex = '1000'
    controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 1)'
    controlsContainer.style.padding = '10px'
    controlsContainer.style.borderRadius = '4px'
    controlsContainer.style.color = 'white'
    controlsContainer.style.display = 'flex'
    controlsContainer.style.flexDirection = 'column'
    controlsContainer.style.gap = '10px'

    // Add camera display section
    this.cameraDisplay = document.createElement('div')
    this.cameraDisplay.style.borderTop = '1px solid #666'
    this.cameraDisplay.style.paddingTop = '10px'
    this.cameraDisplay.style.marginTop = '10px'

    // Add navigation buttons
    const navContainer = document.createElement('div')
    navContainer.style.display = 'flex'
    navContainer.style.alignItems = 'center'
    navContainer.style.gap = '8px'
    navContainer.style.marginBottom = '10px'

    const prevButton = document.createElement('button')
    prevButton.textContent = '< Prev'
    prevButton.style.padding = '5px 10px'
    prevButton.style.backgroundColor = '#333'
    prevButton.style.color = 'white'
    prevButton.style.border = '1px solid #666'
    prevButton.style.borderRadius = '4px'
    prevButton.style.cursor = 'pointer'

    const nextButton = document.createElement('button')
    nextButton.textContent = 'Next >'
    nextButton.style.padding = '5px 10px'
    nextButton.style.backgroundColor = '#333'
    nextButton.style.color = 'white'
    nextButton.style.border = '1px solid #666'
    nextButton.style.borderRadius = '4px'
    nextButton.style.cursor = 'pointer'

    const frameDisplay = document.createElement('span')
    frameDisplay.style.margin = '0 10px'
    frameDisplay.textContent = 'Free Camera'

    const moveToFrame = (index: number) => {
      this.currentFrameIndex = index
      
      if (index === -1) {
        frameDisplay.textContent = 'Free Camera'
        this.controls.enabled = true
        return
      }

      frameDisplay.textContent = `Frame ${index + 1}/${this.existingKeyframes.length}`

      // Disable controls temporarily
      this.controls.enabled = false

      // Move camera to selected keyframe
      const frame = this.existingKeyframes[index]
      this.camera.position.set(frame.position.x, frame.position.y, frame.position.z)
      this.camera.rotation.set(frame.rotation.x, frame.rotation.y, frame.rotation.z)
      this.camera.fov = frame.fov
      this.camera.updateProjectionMatrix()

      // Re-enable controls after a short delay
      setTimeout(() => {
        this.controls.enabled = true
      }, 100)
    }

    prevButton.addEventListener('click', () => {
      const newIndex = Math.max(-1, this.currentFrameIndex - 1)
      moveToFrame(newIndex)
    })

    nextButton.addEventListener('click', () => {
      const newIndex = Math.min(this.existingKeyframes.length - 1, this.currentFrameIndex + 1)
      moveToFrame(newIndex)
    })

    navContainer.appendChild(prevButton)
    navContainer.appendChild(frameDisplay)
    navContainer.appendChild(nextButton)

    // Capture button
    const captureButton = document.createElement('button')
    captureButton.textContent = 'Capture Frame'
    captureButton.style.padding = '5px 10px'
    captureButton.style.backgroundColor = '#333'
    captureButton.style.color = 'white'
    captureButton.style.border = '1px solid #666'
    captureButton.style.borderRadius = '4px'
    captureButton.style.cursor = 'pointer'
    captureButton.style.width = '100%'

    captureButton.addEventListener('click', () => {
      const keyframe = {
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
      
      console.log('Captured Frame:')
      console.log(JSON.stringify(keyframe, null, 2))
    })

    controlsContainer.appendChild(navContainer)
    controlsContainer.appendChild(captureButton)
    controlsContainer.appendChild(this.cameraDisplay)
    this.container.appendChild(controlsContainer)
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
} 