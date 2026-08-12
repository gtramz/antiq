import { hexToRgb01, resolvePalette, type BubblePaletteInput } from "./palette.js";
import { resolveNebulaSeed } from "./seed.js";
import { NEBULA_FRAG, NEBULA_VERT } from "./shaders.js";

export type NebulaRendererOptions = {
  seed?: string | number | null;
  colors?: BubblePaletteInput | null;
};

export type NebulaRenderer = {
  setPalette: (colors?: BubblePaletteInput | null) => void;
  setSeed: (seed: string | number | null | undefined) => void;
  setSize: (cssWidth: number, cssHeight: number, dpr?: number) => void;
  setRefAspect: (aspect: number | null) => void;
  setSpeed: (speed: number | null) => void;
  render: (timeSeconds: number) => void;
  destroy: () => void;
};

type GlLike = WebGLRenderingContext | WebGL2RenderingContext;

function compile(gl: GlLike, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "compile error";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function link(gl: GlLike, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || "link error";
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

function toSeedNumber(
  seed: string | number | null | undefined,
  colors?: BubblePaletteInput | null,
): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed - Math.floor(seed) === 0 && seed > 1
      ? (seed % 1000) / 1000
      : seed;
  }
  if (typeof seed === "string") return resolveNebulaSeed(seed, colors);
  return resolveNebulaSeed(null, colors);
}

export function createNebulaRenderer(
  gl: GlLike,
  initialColorsOrOpts?: BubblePaletteInput | null | NebulaRendererOptions,
): NebulaRenderer {
  const opts: NebulaRendererOptions =
    initialColorsOrOpts &&
    typeof initialColorsOrOpts === "object" &&
    ("seed" in initialColorsOrOpts || "colors" in initialColorsOrOpts)
      ? (initialColorsOrOpts as NebulaRendererOptions)
      : { colors: initialColorsOrOpts as BubblePaletteInput | null | undefined };

  const program = link(gl, NEBULA_VERT, NEBULA_FRAG);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const aPos = gl.getAttribLocation(program, "aPos");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uSeed = gl.getUniformLocation(program, "uSeed");
  const uRes = gl.getUniformLocation(program, "uRes");
  const uRefAspect = gl.getUniformLocation(program, "uRefAspect");
  const uSpeed = gl.getUniformLocation(program, "uSpeed");
  const uBg = gl.getUniformLocation(program, "uBg");
  const uA = gl.getUniformLocation(program, "uA");
  const uB = gl.getUniformLocation(program, "uB");
  const uC = gl.getUniformLocation(program, "uC");

  let palette = resolvePalette(opts.colors);
  let seedValue = toSeedNumber(opts.seed, opts.colors);
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let refAspect = 0;
  let speed = 1;

  function applyPalette() {
    const bg = hexToRgb01(palette.bg);
    const a = hexToRgb01(palette.a);
    const b = hexToRgb01(palette.b);
    const c = hexToRgb01(palette.c);
    gl.useProgram(program);
    gl.uniform3f(uBg, bg[0], bg[1], bg[2]);
    gl.uniform3f(uA, a[0], a[1], a[2]);
    gl.uniform3f(uB, b[0], b[1], b[2]);
    gl.uniform3f(uC, c[0], c[1], c[2]);
  }

  function applySeed() {
    gl.useProgram(program);
    gl.uniform1f(uSeed, seedValue);
  }

  applyPalette();
  applySeed();

  return {
    setPalette(colors) {
      palette = resolvePalette(colors);
      applyPalette();
    },
    setSeed(seed) {
      seedValue = toSeedNumber(seed, palette);
      applySeed();
    },
    setSize(width, height, pixelRatio = 1) {
      cssW = Math.max(1, width);
      cssH = Math.max(1, height);
      dpr = Math.min(Math.max(pixelRatio, 0.5), 2);
      const bw = Math.max(1, Math.floor(cssW * dpr));
      const bh = Math.max(1, Math.floor(cssH * dpr));
      const canvas = (gl as WebGLRenderingContext).canvas as
        | (HTMLCanvasElement & { clientWidth?: number })
        | OffscreenCanvas
        | undefined;
      if (
        canvas &&
        "width" in canvas &&
        typeof (canvas as HTMLCanvasElement).style !== "undefined"
      ) {
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;
      }
      const vw =
        typeof (gl as WebGLRenderingContext).drawingBufferWidth === "number" &&
        (gl as WebGLRenderingContext).drawingBufferWidth > 0
          ? (gl as WebGLRenderingContext).drawingBufferWidth
          : bw;
      const vh =
        typeof (gl as WebGLRenderingContext).drawingBufferHeight === "number" &&
        (gl as WebGLRenderingContext).drawingBufferHeight > 0
          ? (gl as WebGLRenderingContext).drawingBufferHeight
          : bh;
      gl.viewport(0, 0, vw, vh);
    },
    setRefAspect(aspect) {
      refAspect =
        aspect != null && Number.isFinite(aspect) && aspect > 0 ? aspect : 0;
    },
    setSpeed(next) {
      speed = next != null && Number.isFinite(next) && next > 0 ? next : 1;
    },
    render(timeSeconds) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uTime, timeSeconds);
      gl.uniform1f(uSeed, seedValue);
      const vw =
        (gl as WebGLRenderingContext).drawingBufferWidth || cssW * dpr;
      const vh =
        (gl as WebGLRenderingContext).drawingBufferHeight || cssH * dpr;
      gl.uniform2f(uRes, vw, vh);
      gl.uniform1f(uRefAspect, refAspect);
      gl.uniform1f(uSpeed, speed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    },
  };
}
