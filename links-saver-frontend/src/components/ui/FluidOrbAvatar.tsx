import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.6;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time * 0.22;
  vec2 drift = vec2(sin(t) + 0.6 * sin(t * 1.7 + 1.3), cos(t * 0.8) + 0.6 * cos(t * 1.3 + 2.1));
  vec2 p = vec2(uv.x * 1.8, uv.y) + drift * 0.7;
  vec2 q = vec2(fbm(p + drift), fbm(p + vec2(3.2, 1.5) - drift));
  float f = fbm(p + 1.2 * q);
  float g = clamp(1.0 - uv.y, 0.0, 1.0);
  float shade = clamp(g + (f - 0.5) * 0.8 * smoothstep(0.0, 0.3, uv.y), 0.0, 1.0);
  vec3 col = mix(vec3(0.99, 1.0, 1.0), mix(vec3(0.99, 1.0, 1.0), u_color, 0.5), smoothstep(0.28, 0.52, shade));
  col = mix(col, u_color, smoothstep(0.58, 0.88, shade));
  float edge = smoothstep(0.5, 0.49, distance(uv, vec2(0.5)));
  gl_FragColor = vec4(col * edge, edge);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function accentColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
  const hex = value.startsWith('#') ? value.slice(1) : '8b5cf6'
  const expanded = hex.length === 3 ? [...hex].map(part => part + part).join('') : hex
  const parsed = Number.parseInt(expanded, 16)
  if (Number.isNaN(parsed)) return [0.55, 0.36, 0.96] as const
  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255] as const
}

export function FluidOrbAvatar({ initial, label }: { initial: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' })
    if (!canvas || !gl) return

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const time = gl.getUniformLocation(program, 'u_time')
    gl.uniform3f(gl.getUniformLocation(program, 'u_color'), ...accentColor())
    const pixels = Math.min(Math.round(canvas.clientWidth * (window.devicePixelRatio || 1)), 96)
    canvas.width = pixels
    canvas.height = pixels
    gl.viewport(0, 0, pixels, pixels)
    gl.uniform2f(resolution, pixels, pixels)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now()
    let frame = 0
    let lastFrame = 0
    const draw = (now: number) => {
      if (now - lastFrame > 1000 / 24 || reducedMotion) {
        lastFrame = now
        gl.uniform1f(time, reducedMotion ? 0 : (now - started) / 1000)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      if (!reducedMotion) frame = requestAnimationFrame(draw)
    }
    draw(started)

    return () => {
      cancelAnimationFrame(frame)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return (
    <span className="relative grid size-full place-items-center overflow-hidden rounded-2xl" aria-label={label}>
      <span className="absolute inset-0 grid place-items-center rounded-2xl text-sm font-semibold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }} aria-hidden="true">{initial}</span>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
    </span>
  )
}
