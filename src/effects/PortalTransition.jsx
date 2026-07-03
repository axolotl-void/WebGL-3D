import { forwardRef, useMemo } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Portal Transition Shader
// Combines: glass refraction, fragmented panels, displacement distortion,
// chromatic aberration, motion blur, edge glow, and white flash
// Driven by uProgress (0 = no effect, 1 = peak distortion + flash)
// ─────────────────────────────────────────────────────────────────────────────
const fragmentShader = /* glsl */`
  uniform float uProgress;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 hash22(vec2 p) {
    return vec2(hash21(p), hash21(p + 17.0));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float p = uProgress;

    vec2 center = vec2(0.5);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);

    // ── 1. FRAGMENTED PANELS ──
    // Grid subdivides as effect intensifies
    float gridSize = mix(1.0, 12.0, smoothstep(0.0, 0.5, p));
    vec2 cellId = floor(uv * gridSize);
    vec2 cellUV = fract(uv * gridSize);

    // Each panel shifts independently
    float panelDisplace = p * p * 0.08;
    vec2 panelOffset = (hash22(cellId) - 0.5) * panelDisplace;

    // ── 2. DISPLACEMENT DISTORTION ──
    float warp = sin(dist * 15.0 - p * 8.0) * p * 0.04;
    vec2 displaced = uv + toCenter * warp + panelOffset;

    // ── 3. GLASS REFRACTION ──
    float refraction = sin(uv.x * 30.0 + p * 5.0) * cos(uv.y * 30.0 - p * 3.0);
    displaced += vec2(refraction, -refraction) * p * 0.012;

    // ── 3. CHROMATIC ABERRATION ──
    float caAmount = p * 0.025;
    vec2 caDir = normalize(toCenter + 0.001) * caAmount;
    float r = texture(inputBuffer, displaced + caDir).r;
    float g = texture(inputBuffer, displaced).g;
    float b = texture(inputBuffer, displaced - caDir).b;
    vec3 color = vec3(r, g, b);

    // ── 4. MOTION BLUR (radial, from center) ──
    float blurAmount = p * p * 0.12;
    vec3 blur = color;
    for (int i = 1; i <= 6; i++) {
      float t = float(i) / 6.0;
      vec2 blurUV = displaced - toCenter * t * blurAmount;
      // Chromatic aberration in blur samples too
      float br = texture(inputBuffer, blurUV + caDir * 0.5).r;
      float bg = texture(inputBuffer, blurUV).g;
      float bb = texture(inputBuffer, blurUV - caDir * 0.5).b;
      blur += vec3(br, bg, bb);
    }
    color = blur / 7.0;


    // ── 7. WHITE FLASH AT PEAK ──
    float flash = smoothstep(0.7, 0.95, p);
    color = mix(color, vec3(1.0), flash);

    // ── 8. VIGNETTE ──
    float vignette = 1.0 - dist * p * 0.6;
    color *= max(vignette, 0.2);

    // Mix modified color back with the inputColor based on progress to avoid early returns and glitches
    vec3 finalOut = mix(inputColor.rgb, color, smoothstep(0.0, 0.005, p));
    outputColor = vec4(finalOut, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Effect class — reads progress from window.__portalProgress each frame
// ponytail: using global var is the simplest bridge between R3F scene
// and postprocessing; upgrade path is React context if needed
// ─────────────────────────────────────────────────────────────────────────────
class PortalTransitionImpl extends Effect {
  constructor() {
    super('PortalTransition', fragmentShader, {
      uniforms: new Map([
        ['uProgress', new Uniform(0)],
      ]),
    });
  }

  update() {
    this.uniforms.get('uProgress').value = window.__portalProgress || 0;
  }
}

// React wrapper for EffectComposer
const PortalTransition = forwardRef(function PortalTransition(_props, ref) {
  const effect = useMemo(() => new PortalTransitionImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default PortalTransition;
