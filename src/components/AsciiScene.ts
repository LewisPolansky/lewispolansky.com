import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'

export class AsciiScene {
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer
  private effect!: AsciiEffect
  private container: HTMLElement
  private model: THREE.Object3D | null = null
  private clock: THREE.Clock
  private helpers: THREE.Object3D[] = []
  private loadingManager: THREE.LoadingManager

  // Animation properties
  private keyframes = [
    {
      position: { x: -22.502926463825847, y: 559.8196354659766, z: 571.0478036445851 },
      rotation: { x: -0.7754696794304033, y: -0.028132368733840715, z: -0.027796148008862744 },
      fov: 49,
      lookAt: { x: 0, y: 0, z: 0 }
    },
    {
      position: { x: 491.81518626554987, y: 274.71173839560987, z: 419.8142121686556 },
      rotation: { x: -0.5794376632330722, y: 0.7754415895918768, z: 0.4335069598295116 },
      fov: 49,
      lookAt: { x: 0, y: 0, z: 0 }
    },
    {
      position: { x: 36.363043101404585, y: 142.28603776814964, z: -444.76606221074695 },
      rotation: { x: -2.831969460895319, y: 0.07771315520491995, z: 3.0918565354668015 },
      fov: 49,
      lookAt: { x: 0, y: 0, z: 0 }
    },
    {
      position: { x: -191.20321964955951, y: 15.94545341775256, z: 322.0828817025111 },
      rotation: { x: -0.049466911025698945, y: -0.5351972396625484, z: -0.025243888847787093 },
      fov: 49,
      lookAt: { x: 0, y: 0, z: 0 }
    },
    {
      position: { x: 0.6708073950390417, y: -12.427571956351276, z: 326.1363537093675 },
      rotation: { x: 0.03808702096799697, y: 0.0020553365444296308, z: 0.0024860296439987934 },
      fov: 49,
      lookAt: { x: 0, y: 0, z: 0 }
    }
  ]

  private scrollProgress = 0
  private targetScrollProgress = 0
  private scrollSpeed = 0.1 // Adjust this value to control animation smoothness
  private scrollMultiplier = 0.001 // Adjust this to control scroll sensitivity

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
    this.addFrameControls()
    this.setupScrollHandler()
  }

  private init(): void {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0, 0, 0)

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
    
    // Set initial camera position from first keyframe
    const firstFrame = this.keyframes[0]
    this.camera.position.set(firstFrame.position.x, firstFrame.position.y, firstFrame.position.z)
    this.camera.rotation.set(firstFrame.rotation.x, firstFrame.rotation.y, firstFrame.rotation.z)
    this.camera.fov = firstFrame.fov
    this.camera.updateProjectionMatrix()

    if (firstFrame.lookAt) {
      this.camera.lookAt(new THREE.Vector3(firstFrame.lookAt.x, firstFrame.lookAt.y, firstFrame.lookAt.z))
    }

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

    toggleContainer.appendChild(checkbox)
    toggleContainer.appendChild(label)
    toggleContainer.appendChild(cameraButton)
    this.container.appendChild(toggleContainer)

    checkbox.addEventListener('change', () => this.toggleHelpers(checkbox.checked))
    cameraButton.addEventListener('click', () => this.logCameraState())

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
    this.updateCameraPosition()
    this.effect.render(this.scene, this.camera)
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    this.container.removeChild(this.effect.domElement)
    
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

  private addFrameControls(): void {
    const animContainer = document.createElement('div')
    animContainer.style.position = 'fixed'
    animContainer.style.top = '80px'
    animContainer.style.right = '20px'
    animContainer.style.zIndex = '1000'
    animContainer.style.color = 'white'
    animContainer.style.display = 'flex'
    animContainer.style.flexDirection = 'column'
    animContainer.style.gap = '8px'
    animContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    animContainer.style.padding = '10px'
    animContainer.style.borderRadius = '4px'

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
    frameDisplay.textContent = `Frame: ${this.scrollProgress.toFixed(2)}/${this.keyframes.length - 1}`

    prevButton.addEventListener('click', () => {
      this.targetScrollProgress = Math.max(0, Math.floor(this.scrollProgress) - 1)
    })

    nextButton.addEventListener('click', () => {
      this.targetScrollProgress = Math.min(this.keyframes.length - 1, Math.ceil(this.scrollProgress) + 1)
    })

    navContainer.appendChild(prevButton)
    navContainer.appendChild(frameDisplay)
    navContainer.appendChild(nextButton)

    animContainer.appendChild(navContainer)
    this.container.appendChild(animContainer)
  }

  private updateCameraToFrame(frameIndex: number): void {
    this.targetScrollProgress = frameIndex
  }

  private setupScrollHandler(): void {
    window.addEventListener('wheel', (event) => {
      // Update target scroll progress based on scroll direction
      this.targetScrollProgress = Math.max(0, Math.min(
        this.keyframes.length - 1,
        this.targetScrollProgress + event.deltaY * this.scrollMultiplier
      ))
    }, { passive: true })
  }

  private lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t
  }

  private lerpVector3(start: THREE.Vector3Like, end: THREE.Vector3Like, t: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.lerp(start.x, end.x, t),
      this.lerp(start.y, end.y, t),
      this.lerp(start.z, end.z, t)
    )
  }

  private lerpRotation(start: THREE.Vector3Like, end: THREE.Vector3Like, t: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.lerpAngle(start.x, end.x, t),
      this.lerpAngle(start.y, end.y, t),
      this.lerpAngle(start.z, end.z, t)
    )
  }

  private lerpAngle(start: number, end: number, t: number): number {
    // Ensure angles are between -PI and PI
    const normalize = (angle: number) => {
      while (angle > Math.PI) angle -= 2 * Math.PI
      while (angle < -Math.PI) angle += 2 * Math.PI
      return angle
    }
    
    start = normalize(start)
    end = normalize(end)
    
    // Choose shortest path
    let diff = end - start
    if (Math.abs(diff) > Math.PI) {
      if (diff > 0) {
        end -= 2 * Math.PI
      } else {
        end += 2 * Math.PI
      }
    }
    
    return this.lerp(start, end, t)
  }

  private updateCameraPosition(): void {
    // Smoothly update current scroll progress
    this.scrollProgress = this.lerp(
      this.scrollProgress,
      this.targetScrollProgress,
      this.scrollSpeed
    )

    // Get the current frame index and progress to next frame
    const currentFrameIndex = Math.floor(this.scrollProgress)
    const nextFrameIndex = Math.min(currentFrameIndex + 1, this.keyframes.length - 1)
    const frameLerpFactor = this.scrollProgress - currentFrameIndex

    const currentFrame = this.keyframes[currentFrameIndex]
    const nextFrame = this.keyframes[nextFrameIndex]

    // Interpolate position
    const position = this.lerpVector3(
      currentFrame.position,
      nextFrame.position,
      frameLerpFactor
    )

    // Interpolate rotation
    const rotation = this.lerpRotation(
      currentFrame.rotation,
      nextFrame.rotation,
      frameLerpFactor
    )

    // Interpolate FOV
    const fov = this.lerp(currentFrame.fov, nextFrame.fov, frameLerpFactor)

    // Apply interpolated values
    this.camera.position.copy(position)
    this.camera.rotation.set(rotation.x, rotation.y, rotation.z)
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()

    // Update frame display if it exists
    const frameDisplay = this.container.querySelector('span')
    if (frameDisplay) {
      frameDisplay.textContent = `Frame: ${this.scrollProgress.toFixed(2)}/${this.keyframes.length - 1}`
    }
  }
} 