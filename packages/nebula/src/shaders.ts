/**
 * Full-screen quad + liquid-light nebula fragment shader.
 * Domain-warped FBM, additive brand fields, micro-noise — no discrete particles.
 * uSeed desyncs phase per card.
 */

/** FBM and its noise, shared by both stages verbatim. */
const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
`;

export const NEBULA_VERT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uSeed;
uniform vec2 uRes;
uniform float uRefAspect;
uniform float uSpeed;

attribute vec2 aPos;

varying vec2 vUv;
varying vec2 vP;
varying float vT;
varying float vS;
varying float vWobble;
varying vec2 vCA;
varying vec2 vCB;
varying vec2 vCC;
${NOISE}
void main() {
  vUv = aPos * 0.5 + 0.5;

  float screenAspect = uRes.x / max(uRes.y, 1.0);
  float ref = uRefAspect > 0.001 ? uRefAspect : screenAspect;
  vec2 span = vec2(ref, ref / max(screenAspect, 0.0001));
  vP = (vUv - 0.5) * span;

  float t = (uTime + uSeed * 19.7) * 0.11 * (uSpeed > 0.001 ? uSpeed : 1.0);
  float s = uSeed * 12.9898;
  vT = t;
  vS = s;

  vWobble = t + 0.35 * (fbm(vec2(t * 0.08, 1.7 + s)) - 0.5);

  vCA = vec2(
    ((fbm(vec2(t * 0.14, 3.1 + s)) - 0.5) * 0.72 + (fbm(vec2(t * 0.06, 19.4 + s * 2.1)) - 0.5) * 0.28) * span.x * 0.95,
    ((fbm(vec2(t * 0.12, 7.7 + s * 1.3)) - 0.5) * 0.7 + (fbm(vec2(t * 0.055, 23.1 + s)) - 0.5) * 0.3) * span.y * 0.9
  );
  vCB = vec2(
    ((fbm(vec2(t * 0.13, 11.2 + s * 1.7)) - 0.5) * 0.7 + (fbm(vec2(t * 0.05, 27.8 + s)) - 0.5) * 0.3) * span.x * 0.95,
    ((fbm(vec2(t * 0.15, 4.6 + s * 0.9)) - 0.5) * 0.72 + (fbm(vec2(t * 0.07, 31.5 + s * 2.3)) - 0.5) * 0.28) * span.y * 0.9
  );
  vCC = vec2(
    ((fbm(vec2(t * 0.11, 15.9 + s * 1.1)) - 0.5) * 0.68 + (fbm(vec2(t * 0.045, 8.3 + s * 1.5)) - 0.5) * 0.32) * span.x * 0.95,
    ((fbm(vec2(t * 0.135, 2.2 + s * 2.0)) - 0.5) * 0.7 + (fbm(vec2(t * 0.06, 41.0 + s)) - 0.5) * 0.3) * span.y * 0.9
  );

  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const NEBULA_FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform vec3 uBg;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

varying vec2 vUv;
varying vec2 vP;
varying float vT;
varying float vS;
varying float vWobble;
varying vec2 vCA;
varying vec2 vCB;
varying vec2 vCC;
${NOISE}
vec3 screenBlend(vec3 base, vec3 layer, float w) {
  vec3 s = 1.0 - (1.0 - base) * (1.0 - layer);
  return mix(base, s, clamp(w, 0.0, 1.0));
}

const float KNEE = 0.75;

vec3 shoulder(vec3 col) {
  vec3 head = min(col, vec3(KNEE));
  vec3 over = max(col - KNEE, 0.0);
  float room = 1.0 - KNEE;
  return head + room * (1.0 - exp(-over / room));
}

void main() {
  vec2 uv = vUv;
  vec2 p = vP;
  float t = vT;
  float s = vS;
  float tWobble = vWobble;

  vec2 q = vec2(
    fbm(p * 0.95 + vec2(tWobble * 0.55, s * 0.1)),
    fbm(p * 0.95 + vec2(5.2 + s, -tWobble * 0.48))
  );
  vec2 r = vec2(
    fbm(p * 1.35 + 2.8 * q + vec2(1.7 + tWobble * 0.2 + s * 0.2, 9.2)),
    fbm(p * 1.35 + 2.8 * q + vec2(8.3, 2.8 - tWobble * 0.18 + s * 0.15))
  );
  float n = fbm(p * 1.7 + 2.6 * r);

  float field = smoothstep(0.14, 0.9, n);
  field = pow(field, 0.75);

  vec2 flow = 0.55 * (r - 0.5);
  vec2 wp = p + flow;
  vec2 cA = vCA + flow * 0.4;
  vec2 cB = vCB + flow * 0.45;
  vec2 cC = vCC + flow * 0.42;

  float dA = length(wp - cA);
  float dB = length(wp - cB);
  float dC = length(wp - cC);

  float wA = exp(-dA * dA * 1.35) * (0.7 + 0.5 * field);
  float wB = exp(-dB * dB * 1.5) * (0.65 + 0.45 * field);
  float wC = exp(-dC * dC * 1.65) * (0.68 + 0.48 * field);

  float body = field * 0.45;
  vec3 col = uBg;

  col = screenBlend(col, uA, min(1.0, wA * 1.15 + body * 0.28));
  col = screenBlend(col, uB, min(1.0, wB * 1.0 + body * 0.22));
  col = screenBlend(col, uC, min(1.0, wC * 1.12 + body * 0.25));

  float overlap = wA * wB + wB * wC + wC * wA;
  col += overlap * 0.045 * (uA + uB + uC) / 3.0;
  col += field * 0.06 * (uA * 0.5 + uB * 0.2 + uC * 0.3);

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.12);

  float grain = hash(uv * uRes * 0.5 + t * 8.0 + s) - 0.5;
  col += grain * 0.022;

  float scrim = smoothstep(0.85, 0.05, uv.y) * 0.26;
  col *= 1.0 - scrim;

  col = shoulder(max(col, 0.0));
  gl_FragColor = vec4(col, 1.0);
}
`;
