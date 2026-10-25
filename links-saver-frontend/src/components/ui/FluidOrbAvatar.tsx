import { useEffect, useRef, useState } from 'react'

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
  float t = u_time * 0.34;
  vec2 p = (uv - 0.5) * vec2(3.4, 4.2);
  vec2 flow = vec2(
    fbm(p + vec2(0.0, -t)),
    fbm(p + vec2(2.8, 1.4) + vec2(t * 0.55, -t * 0.72))
  );
  float cloud = fbm(p * 1.35 + flow * 2.6 + vec2(0.0, -t * 1.5));
  float detail = fbm(p * 2.1 + flow * 3.8 + vec2(t * 0.8, -t * 1.9));

  // Curving, rising plumes make the movement read as smoke instead of a static gradient.
  float spine = 0.5 + 0.13 * sin(uv.y * 7.4 - t * 2.0) + 0.045 * sin(uv.y * 17.0 + t * 1.4);
  float plume = exp(-pow((uv.x - spine) / 0.27, 2.0));
  float secondSpine = 0.5 - 0.2 * sin(uv.y * 5.6 + t * 1.35);
  float secondPlume = exp(-pow((uv.x - secondSpine) / 0.19, 2.0));
  float density = max(
    smoothstep(0.38, 0.72, cloud) * plume,
    smoothstep(0.46, 0.76, detail) * secondPlume * 0.72
  );
  density *= smoothstep(0.0, 0.16, uv.y) * (1.0 - smoothstep(0.84, 1.0, uv.y));

  vec3 shadow = u_color * 0.22;
  vec3 smoke = mix(shadow, u_color, smoothstep(0.28, 0.78, cloud));
  smoke = mix(smoke, vec3(1.0, 0.91, 0.69), smoothstep(0.68, 0.88, detail) * 0.42);
  float edge = 1.0 - smoothstep(0.66, 0.72, distance(uv, vec2(0.5)));
  gl_FragColor = vec4(smoke, clamp(density * 0.92, 0.0, 0.86) * edge);
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

export function FluidOrbAvatar({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { alpha: true, antialias: true })
    if (!canvas) return
    if (!gl) {
      setWebglFailed(true)
      return
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) {
      setWebglFailed(true)
      if (vertex) gl.deleteShader(vertex)
      if (fragment) gl.deleteShader(fragment)
      if (program) gl.deleteProgram(program)
      return
    }
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglFailed(true)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      return
    }
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
    const resize = () => {
      const pixels = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2))
      canvas.width = pixels
      canvas.height = pixels
      gl.viewport(0, 0, pixels, pixels)
      gl.uniform2f(resolution, pixels, pixels)
    }
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now()
    let frame = 0
    const draw = (now: number) => {
      gl.uniform1f(time, reducedMotion ? 0 : (now - started) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (!reducedMotion) frame = requestAnimationFrame(draw)
    }
    draw(started)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return (
    <span
      className={'relative block size-full overflow-hidden rounded-full ' + className}
      style={{
        background: 'radial-gradient(circle at 50% 14%, color-mix(in srgb, var(--color-accent) 55%, #fff), transparent 43%), linear-gradient(145deg, #24201a, #09090b 72%)',
      }}
      aria-hidden="true"
    >
      <span
        className="orb-smoke-fallback-layer absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ opacity: webglFailed ? 1 : 0.56 }}
        aria-hidden="true"
      >
          <i className="orb-smoke-fallback orb-smoke-fallback-a" />
          <i className="orb-smoke-fallback orb-smoke-fallback-b" />
          <i className="orb-smoke-fallback orb-smoke-fallback-c" />
      </span>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 size-full rounded-[inherit]" />
    </span>
  )
}
