import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrains} from '@remotion/google-fonts/JetBrainsMono';

const {fontFamily: inter} = loadInter();
const {fontFamily: mono} = loadJetBrains();

// ============================================================================
// DESIGN TOKENS — CLEAN MONOCHROME & LUMINOUS WHITE HIGHLIGHTS (NO TEAL)
// ============================================================================
const C = {
  bg: '#070809',
  surface: '#0D0F12',
  card: '#121518',
  panel: '#15191D',
  line: 'rgba(255, 255, 255, 0.08)',
  lineHighlight: 'rgba(255, 255, 255, 0.22)',
  white: '#FFFFFF',
  offWhite: '#F2F4F7',
  muted: '#8E95A0',
  subtle: '#4D545E',
  glowWhite: 'rgba(255, 255, 255, 0.35)',
  glowSoft: 'rgba(255, 255, 255, 0.12)',
  amber: '#F5B942',
  red: '#FF5E5B',
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.25, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: easeOut});
const img = (name: string) => staticFile(`cairn/${name}`);

// ============================================================================
// ATMOSPHERE & CINEMATIC LIGHTING
// ============================================================================
function Atmosphere() {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 70) * 15;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #16191E 0%, #0D0F12 50%, #070809 100%)'}}>
      {/* 3D Perspective Grid Horizon */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.45,
          transform: `perspective(1000px) rotateX(62deg) scale(2.2) translateY(${((f % 800) / 10) + drift}px)`,
          transformOrigin: 'center bottom',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
      {/* Subtle White Ambient Dome Glow */}
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1000,
          left: '50%',
          top: 150,
          transform: `translateX(-50%) scale(${1 + Math.sin(f / 45) * 0.04})`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 65%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
}

function Grain() {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.03,
        mixBlendMode: 'screen',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")`,
        transform: `translate(${f % 4}px, ${f % 6}px)`,
      }}
    />
  );
}

// ============================================================================
// CAMERA RIG WITH UP-CLOSE MACRO SAAS MOTION
// ============================================================================
function HumanCamera({
  start,
  end,
  macroScale = 1.35,
  macroPanX = 0,
  macroPanY = -40,
  pitchRange = [12, 6],
  yawRange = [-6, 3],
  children,
}: {
  start: number;
  end: number;
  macroScale?: number;
  macroPanX?: number;
  macroPanY?: number;
  pitchRange?: [number, number];
  yawRange?: [number, number];
  children: React.ReactNode;
}) {
  const f = useCurrentFrame();
  const local = f - start;
  const dur = end - start;
  const alpha = interpolate(f, [start, start + 14, end - 14, end], [0, 1, 1, 0], clamp);

  // Organic camera breathing drift
  const driftX = Math.sin(local / 24) * 8;
  const driftY = Math.cos(local / 28) * 6;
  const driftRoll = Math.sin(local / 35) * 0.3;

  // Macro Upclose Zoom Curve (smooth punch-in like Doks.ai 3.5s)
  const camScale = interpolate(
    local,
    [0, dur * 0.28, dur * 0.7, dur],
    [1.0, macroScale, macroScale * 1.03, macroScale * 1.06],
    {...clamp, easing: easeOut}
  );

  const camPanX = interpolate(local, [0, dur * 0.35, dur], [0, macroPanX, macroPanX + 10], {...clamp, easing: easeOut}) + driftX;
  const camPanY = interpolate(local, [0, dur * 0.35, dur], [10, macroPanY, macroPanY - 8], {...clamp, easing: easeOut}) + driftY;

  const camPitch = interpolate(local, [0, dur * 0.45, dur], [pitchRange[0], pitchRange[1], pitchRange[1] - 1.5], {...clamp, easing: easeInOut});
  const camYaw = interpolate(local, [0, dur * 0.45, dur], [yawRange[0], yawRange[1], yawRange[1] + 1], {...clamp, easing: easeInOut});

  // Specular light sweep across camera
  const sweepX = interpolate(local, [0, dur * 0.35], [-700, 2500], clamp);
  const sweepAlpha = interpolate(local, [0, 8, 26], [0, 0.4, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate3d(${camPanX}px, ${camPanY}px, 0) scale(${camScale}) perspective(1400px) rotateX(${camPitch}deg) rotateY(${camYaw}deg) rotateZ(${driftRoll}deg)`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      {/* Cinematic White Specular Glint Sweep */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          bottom: -150,
          left: sweepX,
          width: 320,
          transform: 'skewX(-22deg)',
          opacity: sweepAlpha,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 50%, transparent)',
          filter: 'blur(20px)',
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
}

// ============================================================================
// ACCURATE HUMAN CURSOR WITH BEZIER ARCS & TACTILE WHITE RIPPLES
// ============================================================================
interface CursorKeyframe {
  t: number;
  x: number;
  y: number;
}

function AccurateCursor({
  frame,
  points,
  clicks = [],
}: {
  frame: number;
  points: CursorKeyframe[];
  clicks?: number[];
}) {
  if (points.length < 2) return null;

  let p0 = points[0];
  let p1 = points[points.length - 1];

  for (let i = 0; i < points.length - 1; i++) {
    if (frame >= points[i].t && frame <= points[i + 1].t) {
      p0 = points[i];
      p1 = points[i + 1];
      break;
    }
  }

  const span = Math.max(1, p1.t - p0.t);
  const rawProgress = (frame - p0.t) / span;
  const clampedProgress = Math.max(0, Math.min(1, rawProgress));
  const easeProgress = easeOut(clampedProgress);

  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const arcHeight = Math.sin(clampedProgress * Math.PI) * (Math.abs(dx) + Math.abs(dy)) * 0.05;
  const curX = p0.x + dx * easeProgress - (dy > 0 ? arcHeight : -arcHeight);
  const curY = p0.y + dy * easeProgress + (dx > 0 ? arcHeight * 0.5 : -arcHeight * 0.5);

  const clickDist = clicks.map((c) => Math.abs(frame - c));
  const nearestClickDist = clickDist.length ? Math.min(...clickDist) : 999;
  const isPressing = nearestClickDist <= 5;
  const cursorScale = isPressing ? 0.82 : 1;

  const isVisible = fade(frame, points[0].t, points[0].t + 10) * (1 - fade(frame, points[points.length - 1].t - 15, points[points.length - 1].t));

  return (
    <>
      {clicks.map((clickFrame) => {
        const age = frame - clickFrame;
        if (age < 0 || age > 30) return null;
        const rippleScale = 0.5 + (age / 30) * 2.8;
        const rippleOpacity = (1 - age / 30) * 0.75;
        return (
          <div
            key={clickFrame}
            style={{
              position: 'absolute',
              left: curX,
              top: curY,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 24px rgba(255, 255, 255, 0.75)',
              transform: `translate(-50%, -50%) scale(${rippleScale})`,
              opacity: rippleOpacity,
              pointerEvents: 'none',
              zIndex: 98,
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: curX,
          top: curY,
          zIndex: 99,
          transform: `translate(-2px, -2px) rotate(-18deg) scale(${cursorScale})`,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.85)) drop-shadow(0 0 6px rgba(255,255,255,0.4))',
          opacity: isVisible,
          pointerEvents: 'none',
          willChange: 'transform, left, top',
        }}
      >
        <svg width="34" height="42" viewBox="0 0 42 52">
          <path
            d="M4 3L37 29L23 31L31 47L23 51L15 35L7 46Z"
            fill="#FFFFFF"
            stroke="#0A0D10"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}

// ============================================================================
// CLEAN MONOCHROME UI ATOMS (PURE WHITE BADGES, FOCUS FRAMES, CARDS)
// ============================================================================
function WhiteBadge({
  children,
  style = {},
  frame = 60,
  icon = true,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  frame?: number;
  icon?: boolean;
}) {
  const enter = fade(frame, 0, 16);
  const lift = interpolate(frame, [0, 30, 90], [12, 0, -3], clamp);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        background: 'linear-gradient(135deg, rgba(25, 29, 34, 0.92), rgba(12, 14, 17, 0.96))',
        borderRadius: 99,
        padding: '9px 18px',
        fontFamily: mono,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 1.5,
        color: C.white,
        boxShadow: '0 12px 35px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
        opacity: enter,
        transform: `translateY(${lift}px)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {icon && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: C.white,
            boxShadow: '0 0 10px #FFFFFF',
          }}
        />
      )}
      {children}
    </div>
  );
}

function CenteredTitleBlock({
  eyebrow,
  title,
  sub,
  style = {},
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 60,
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
        maxWidth: 820,
        ...style,
      }}
    >
      <div style={{fontFamily: mono, color: '#C8D1DC', fontSize: 13, letterSpacing: 3, fontWeight: 600, marginBottom: 12}}>
        {eyebrow}
      </div>
      <div style={{fontFamily: inter, fontSize: 44, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1.12, color: C.white, textShadow: '0 6px 35px rgba(0,0,0,0.9)'}}>
        {title}
      </div>
      <div style={{fontFamily: inter, fontSize: 18, color: C.muted, lineHeight: 1.45, marginTop: 12}}>
        {sub}
      </div>
    </div>
  );
}

// ============================================================================
// SCENE 1: INTRO / THE COMMAND CENTER (0.0s – 4.0s / Frames 0–120)
// ============================================================================
function IntroScene() {
  const f = useCurrentFrame();
  const enter = fade(f, 6, 32);
  const glow = interpolate(f, [0, 40, 95, 120], [0.1, 0.9, 0.6, 0], clamp);
  const tiltUp = interpolate(f, [0, 45, 115], [24, 6, 0], {...clamp, easing: easeOut});
  const riseY = interpolate(f, [0, 40, 115], [80, 0, -10], {...clamp, easing: easeOut});

  return (
    <HumanCamera start={0} end={120} macroScale={1.1} pitchRange={[18, 5]} yawRange={[-6, 0]}>
      <Atmosphere />

      {/* Rising 3D Geometric Horizon Arc */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 640,
          width: 1450,
          height: 600,
          borderTop: '2px solid rgba(255, 255, 255, 0.85)',
          borderRadius: '50%',
          transform: `translateX(-50%) scale(${0.8 + enter * 0.3})`,
          filter: 'blur(2px)',
          boxShadow: '0 -25px 120px rgba(255, 255, 255, 0.35)',
          opacity: glow,
        }}
      />

      {/* Hero Cairn Pyramid Logo */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 220,
          transform: `translateX(-50%) translateY(${riseY}px) perspective(1000px) rotateX(${tiltUp}deg)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: enter,
        }}
      >
        <Img
          src={img('logo-transparent.png')}
          style={{
            width: 720,
            height: 240,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 45px rgba(255, 255, 255, 0.3)) drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
          }}
        />

        {/* Informative Subtitle Pills */}
        <div style={{display: 'flex', gap: 14, marginTop: 40, opacity: fade(f, 28, 50)}}>
          <WhiteBadge frame={f - 28}>FORECAST BEFORE EXECUTION</WhiteBadge>
          <WhiteBadge frame={f - 34}>LOCAL-FIRST GATEWAY</WhiteBadge>
          <WhiteBadge frame={f - 40}>SAFE GIT RECOVERY</WhiteBadge>
        </div>

        <div
          style={{
            marginTop: 28,
            fontFamily: mono,
            fontSize: 16,
            letterSpacing: 4,
            color: C.muted,
            opacity: fade(f, 48, 70),
          }}
        >
          THE CONTROL PLANE FOR CODING AGENTS
        </div>
      </div>
    </HumanCamera>
  );
}

// ============================================================================
// SCENE 2: FORECAST & COST SIMULATION (3.5s – 12.0s / Frames 105–360)
// Hero Centered Macro Zoom into the PRD breakdown & live cost ranges (Like Doks.ai 3.5s)
// ============================================================================
function ForecastScene() {
  const f = useCurrentFrame();
  const local = f - 105;
  const alpha = interpolate(f, [105, 119, 346, 360], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* Crisp 2D HUD Header */}
      <CenteredTitleBlock
        eyebrow="01 / FORECAST BEFORE BUILD"
        title="Know the cost before you build."
        sub="Decompose any PRD and scan repository context for honest token & cost ranges."
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 60}} frame={local}>
        PROMPT CACHING (-68% SPEND)
      </WhiteBadge>

      {/* 3D Camera Rig for Product Cards */}
      <HumanCamera
        start={105}
        end={360}
        macroScale={1.32}
        macroPanX={0}
        macroPanY={40}
        pitchRange={[14, 6]}
        yawRange={[-6, 2]}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 240,
            width: 1360,
            height: 740,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: C.surface,
            boxShadow: '0 45px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}
        >
          <Img src={img('home.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />

          {/* HIGH-FIDELITY INFORMATIVE OVERLAY: PRD FORECAST ENGINE */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 110,
              width: 580,
              transform: 'translateX(-50%)',
              background: 'rgba(14, 18, 22, 0.96)',
              border: '2px solid #FFFFFF',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 35px rgba(255,255,255,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              backdropFilter: 'blur(16px)',
              opacity: fade(local, 15, 30),
              zIndex: 30,
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
              <span style={{fontFamily: mono, fontSize: 12, letterSpacing: 1.5, color: C.muted}}>PRD ANALYSIS · 18 ATOMIC TASKS</span>
              <span style={{fontFamily: mono, fontSize: 11, color: '#000000', background: '#FFFFFF', fontWeight: 700, padding: '3px 9px', borderRadius: 4}}>
                94% HIGH CONFIDENCE
              </span>
            </div>

            <div style={{fontFamily: inter, fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 14}}>
              Authentication & Local Gateway Module Refactor
            </div>

            {/* Range Display */}
            <div style={{background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 16}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 13, color: C.muted, marginBottom: 8}}>
                <span>LOW: $51.20</span>
                <span style={{color: C.white, fontWeight: 700}}>EXPECTED: $78.40</span>
                <span>HIGH: $114.60</span>
              </div>
              <div style={{height: 7, background: 'rgba(255,255,255,0.12)', borderRadius: 4, position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', left: '22%', width: '54%', height: '100%', background: '#FFFFFF', borderRadius: 4, boxShadow: '0 0 14px #FFFFFF'}} />
              </div>
            </div>

            {/* Model Comparison Chips */}
            <div style={{display: 'flex', gap: 10, fontFamily: mono, fontSize: 12}}>
              <span style={{background: 'rgba(255,255,255,0.16)', color: C.white, padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.35)', fontWeight: 600}}>
                Claude 3.5: $78.40
              </span>
              <span style={{background: 'rgba(255,255,255,0.06)', color: C.muted, padding: '5px 12px', borderRadius: 6}}>
                GPT-4o: $62.10
              </span>
              <span style={{background: 'rgba(255,255,255,0.06)', color: C.muted, padding: '5px 12px', borderRadius: 6}}>
                DeepSeek: $14.20
              </span>
            </div>
          </div>

          <AccurateCursor
            frame={local}
            points={[
              {t: 8, x: 400, y: 520},
              {t: 36, x: 680, y: 310},
              {t: 54, x: 680, y: 310},
              {t: 72, x: 680, y: 310},
              {t: 110, x: 880, y: 340},
            ]}
            clicks={[72]}
          />
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 3: LIVE TELEMETRY & LOCAL GATEWAY (11.5s – 20.0s / Frames 345–600)
// Hero Centered Macro Zoom into live agent token consumption & per-turn cost
// ============================================================================
function ActivityScene() {
  const f = useCurrentFrame();
  const local = f - 345;
  const alpha = interpolate(f, [345, 359, 586, 600], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* 2D Crisp HUD Header */}
      <CenteredTitleBlock
        eyebrow="02 / LIVE GATEWAY TELEMETRY"
        title="See every token, step by step."
        sub="Intercept agent traffic via local OpenAI/Anthropic compatible proxies with full audit trails."
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 60}} frame={local}>
        GATEWAY: 127.0.0.1:3000/V1
      </WhiteBadge>

      <HumanCamera
        start={345}
        end={600}
        macroScale={1.32}
        macroPanX={0}
        macroPanY={40}
        pitchRange={[14, 6]}
        yawRange={[6, -2]}
      >
        {/* Hero Centered Screen Container */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 240,
            width: 1360,
            height: 740,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: C.surface,
            boxShadow: '0 45px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}
        >
          <Img src={img('activity.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />

          {/* INFORMATIVE OVERLAY: LIVE STEP TELEMETRY CARD */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 140,
              width: 1100,
              transform: 'translateX(-50%)',
              background: 'rgba(12, 15, 18, 0.96)',
              border: '2px solid #FFFFFF',
              borderRadius: 14,
              padding: '20px 28px',
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              backdropFilter: 'blur(16px)',
              opacity: fade(local, 15, 30),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 30,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 12, height: 12, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 14px #FFFFFF'}} />
              <div>
                <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                  <span style={{fontFamily: mono, fontSize: 14, color: '#FFFFFF', fontWeight: 700}}>STEP 14 / 28</span>
                  <span style={{fontFamily: mono, fontSize: 11, color: C.muted, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 4}}>
                    CODEX AGENT
                  </span>
                  <span style={{fontFamily: mono, fontSize: 11, color: C.white, border: '1px solid rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: 4}}>
                    CLAUDE 3.5 SONNET
                  </span>
                </div>
                <div style={{fontFamily: inter, fontSize: 15, color: C.offWhite, marginTop: 6}}>
                  Refactor token bucket rate limiter in /src/gateway/server.ts
                </div>
              </div>
            </div>

            <div style={{textAlign: 'right'}}>
              <div style={{fontFamily: mono, fontSize: 18, fontWeight: 700, color: C.white}}>
                +$0.041 <span style={{fontSize: 13, color: C.muted, fontWeight: 400}}>this turn</span>
              </div>
              <div style={{fontFamily: mono, fontSize: 13, color: C.muted, marginTop: 4}}>
                14.2k tokens · 480ms latency
              </div>
            </div>
          </div>

          <AccurateCursor
            frame={local}
            points={[
              {t: 12, x: 920, y: 550},
              {t: 38, x: 700, y: 220},
              {t: 55, x: 700, y: 220},
              {t: 70, x: 700, y: 220},
              {t: 105, x: 880, y: 320},
            ]}
            clicks={[70]}
          />
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 4: BUDGET & POLICY ENGINE (19.5s – 28.0s / Frames 585–840)
// Hero Centered Macro Zoom into Budget Enforcement & Cache Read Velocity
// ============================================================================
function CostsScene() {
  const f = useCurrentFrame();
  const local = f - 585;
  const alpha = interpolate(f, [585, 599, 826, 840], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* 2D Crisp HUD Header */}
      <CenteredTitleBlock
        eyebrow="03 / BUDGET & GOVERNANCE"
        title="Enforce budgets. Stop runaway bills."
        sub="Set hard spend caps, grace thresholds, and automatic model downgrade policies."
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 60}} frame={local}>
        ZERO OVERSPEND GUARANTEE
      </WhiteBadge>

      <HumanCamera
        start={585}
        end={840}
        macroScale={1.32}
        macroPanX={0}
        macroPanY={40}
        pitchRange={[14, 6]}
        yawRange={[-6, 2]}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 240,
            width: 1360,
            height: 740,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: C.surface,
            boxShadow: '0 45px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}
        >
          <Img src={img('costs.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />

          {/* INFORMATIVE OVERLAY: HARD BUDGET CAP & CACHE SAVINGS */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 130,
              width: 580,
              transform: 'translateX(-50%)',
              background: 'rgba(15, 19, 23, 0.96)',
              border: '2px solid #FFFFFF',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 35px rgba(255,255,255,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              backdropFilter: 'blur(16px)',
              opacity: fade(local, 15, 30),
              zIndex: 30,
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 12, color: C.muted, marginBottom: 8}}>
              <span>HARD SPEND CEILING</span>
              <span style={{color: '#FFFFFF', fontWeight: 700}}>POLICY: ACTIVE</span>
            </div>

            <div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14}}>
              <span style={{fontFamily: inter, fontSize: 34, fontWeight: 700, color: C.white}}>$42.78</span>
              <span style={{fontFamily: mono, fontSize: 16, color: C.muted}}>/ $100.00 CAP</span>
              <span style={{marginLeft: 'auto', fontFamily: mono, fontSize: 13, color: '#000000', background: '#FFFFFF', fontWeight: 700, padding: '3px 9px', borderRadius: 4}}>
                42.8%
              </span>
            </div>

            {/* Clean White Progress Bar */}
            <div style={{height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', position: 'relative', marginBottom: 16}}>
              <div style={{width: '42.8%', height: '100%', background: '#FFFFFF', borderRadius: 4, boxShadow: '0 0 14px #FFFFFF'}} />
            </div>

            <div style={{fontFamily: mono, fontSize: 13, color: C.offWhite, lineHeight: 1.6}}>
              • Graceful wind-down triggered at 90%
              <br />
              • 342,000 cached tokens read ($18.90 saved)
            </div>
          </div>

          <AccurateCursor
            frame={local}
            points={[
              {t: 10, x: 920, y: 520},
              {t: 36, x: 680, y: 260},
              {t: 54, x: 680, y: 260},
              {t: 85, x: 880, y: 320},
            ]}
            clicks={[54]}
          />
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 5: SAFETY GATE & INSTANT GIT TIME MACHINE (27.5s – 36.0s / Frames 825–1080)
// High-risk shell intercept & 1-click restore checkpoint (Cairn Superpower)
// ============================================================================
function SafetyScene() {
  const f = useCurrentFrame();
  const local = f - 825;
  const alpha = interpolate(f, [825, 839, 1066, 1080], [0, 1, 1, 0], clamp);

  const isRestored = local >= 115;
  const sweep = interpolate(local, [110, 135], [700, -700], clamp);
  const restoreGlow = fade(local, 115, 130);

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* 2D Crisp HUD Header */}
      <CenteredTitleBlock
        eyebrow="04 / SAFE ACTIONS & RECOVERY"
        title="Intercept risk. Undo any mistake."
        sub="Dangerous agent terminal commands pause for approval. Restore clean Git shadow checkpoints instantly."
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 60}} frame={local}>
        GIT SHADOW ENGINE · TIME MACHINE
      </WhiteBadge>

      <HumanCamera
        start={825}
        end={1080}
        macroScale={1.32}
        macroPanX={0}
        macroPanY={40}
        pitchRange={[14, 6]}
        yawRange={[-6, 2]}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 240,
            width: 1360,
            height: 740,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: C.surface,
            boxShadow: '0 45px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}
        >
          <Img src={img('safety.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />

          {/* HIGH-RISK INTERCEPT MODAL OVERLAY */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 130,
              width: 620,
              transform: 'translateX(-50%)',
              background: 'rgba(15, 18, 22, 0.96)',
              border: `2px solid ${isRestored ? '#FFFFFF' : C.amber}`,
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: `0 30px 80px rgba(0,0,0,0.9), 0 0 35px ${isRestored ? 'rgba(255,255,255,0.45)' : 'rgba(245,185,66,0.35)'}`,
              backdropFilter: 'blur(16px)',
              opacity: fade(local, 15, 30),
              zIndex: 30,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
              <span style={{fontSize: 18}}>{isRestored ? '✓' : '⚠️'}</span>
              <span style={{fontFamily: mono, fontSize: 13, fontWeight: 700, color: isRestored ? C.white : C.amber, letterSpacing: 1.5}}>
                {isRestored ? 'SNAPSHOT RESTORED' : 'HIGH-RISK COMMAND BLOCKED'}
              </span>
            </div>

            <div style={{fontFamily: mono, fontSize: 14, color: '#FFFFFF', background: 'rgba(0,0,0,0.6)', padding: '12px 16px', borderRadius: 8, marginBottom: 14}}>
              $ {isRestored ? 'git reset --hard checkpoint_4a8f9c' : 'rm -rf ./packages/core/src/*'}
            </div>

            <div style={{fontFamily: inter, fontSize: 14, color: C.muted, marginBottom: 18}}>
              {isRestored
                ? 'Workspace returned to pristine state before dangerous command.'
                : 'Destructive deletion intercepted by Cairn Safety Gate. Awaiting human decision.'}
            </div>

            {/* Interactive Button */}
            <div style={{display: 'flex', gap: 12}}>
              <div
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  color: '#07090B',
                  fontFamily: mono,
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                }}
              >
                {isRestored ? 'WORKSPACE CLEAN' : '↺ RESTORE CHECKPOINT'}
              </div>
              {!isRestored && (
                <div
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.08)',
                    color: C.white,
                    fontFamily: mono,
                    fontSize: 13,
                  }}
                >
                  Inspect Diff
                </div>
              )}
            </div>
          </div>

          {/* White Rewind Wave Wipe */}
          {isRestored && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 10,
                background: '#FFFFFF',
                boxShadow: '0 0 45px 16px rgba(255, 255, 255, 0.9)',
                transform: `translateX(${sweep}px)`,
                opacity: restoreGlow,
              }}
            />
          )}

          <AccurateCursor
            frame={local}
            points={[
              {t: 12, x: 480, y: 460},
              {t: 45, x: 620, y: 310},
              {t: 65, x: 620, y: 310},
              {t: 98, x: 620, y: 310},
              {t: 135, x: 780, y: 420},
            ]}
            clicks={[98]}
          />
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 6: UNIVERSAL MOBILE REMOTE SUPERVISION (35.5s – 44.0s / Frames 1065–1320)
// Hero Centered Floating 3D iPhone mockup with live typing & IDE sync (Doks.ai 0.5s - 3.0s)
// ============================================================================
function ControlScene() {
  const f = useCurrentFrame();
  const local = f - 1065;
  const alpha = interpolate(f, [1065, 1079, 1306, 1320], [0, 1, 1, 0], clamp);

  const phoneRise = interpolate(local, [0, 35, 120], [90, 0, -10], {...clamp, easing: easeOut});
  const phoneTilt = interpolate(local, [0, 40, 120], [16, 6, 4], {...clamp, easing: easeOut});

  const promptMsg = 'Run test suite and checkpoint before commit.';
  const typeCount = Math.floor(interpolate(local, [40, 75], [0, promptMsg.length], clamp));

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* 2D Crisp HUD Header */}
      <CenteredTitleBlock
        eyebrow="05 / UNIVERSAL MOBILE REMOTE"
        title="Step away. Stay in control."
        sub="Monitor runs and steer connected IDE agents (Antigravity, Cursor, VS Code) straight from your phone."
        style={{top: 45}}
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 50}} frame={local}>
        DESK-FREE SUPERVISION
      </WhiteBadge>

      <HumanCamera
        start={1065}
        end={1320}
        macroScale={1.18}
        macroPanX={0}
        macroPanY={30}
        pitchRange={[10, 4]}
        yawRange={[-4, 2]}
      >
        {/* Desktop IDE in Background (Centered, Subtly Dimmed) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 240,
            width: 1360,
            height: 740,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: C.surface,
            boxShadow: '0 45px 120px rgba(0,0,0,0.9)',
            opacity: 0.45,
            filter: 'blur(3px)',
          }}
        >
          <Img src={img('control.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>

        {/* 3D FLOATING IPHONE MOCKUP IN FOREGROUND CENTER */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 200,
            width: 400,
            height: 760,
            borderRadius: 48,
            border: '3px solid rgba(255, 255, 255, 0.45)',
            background: '#090B0E',
            boxShadow: '0 35px 100px rgba(0,0,0,0.95), 0 0 60px rgba(255, 255, 255, 0.25), inset 0 2px 0 rgba(255,255,255,0.4)',
            transform: `translateX(-50%) translateY(${phoneRise}px) perspective(1200px) rotateY(${phoneTilt}deg) rotateX(4deg)`,
            overflow: 'hidden',
            padding: '26px 22px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
          }}
        >
          {/* Dynamic Island */}
          <div style={{width: 120, height: 28, background: '#000000', borderRadius: 18, margin: '0 auto 22px auto'}} />

          {/* Mobile Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <div>
              <div style={{fontFamily: mono, fontSize: 11, color: C.muted}}>CAIRN REMOTE</div>
              <div style={{fontFamily: inter, fontSize: 16, fontWeight: 700, color: C.white}}>Antigravity IDE Connected</div>
            </div>
            <span style={{width: 9, height: 9, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 12px #FFFFFF'}} />
          </div>

          {/* Live Run Card */}
          <div style={{background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.16)', marginBottom: 'auto'}}>
            <div style={{fontFamily: mono, fontSize: 12, color: C.muted, marginBottom: 6}}>STEP 22 OF 28</div>
            <div style={{fontFamily: inter, fontSize: 14, color: C.white, fontWeight: 600}}>All 24 test suites passed.</div>
            <div style={{fontFamily: mono, fontSize: 12, color: '#FFFFFF', marginTop: 10}}>+$0.02 · $42.78 Total</div>
          </div>

          {/* Live Chat Typing Input */}
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{fontFamily: mono, fontSize: 13, color: C.white, minHeight: 38}}>
              {promptMsg.slice(0, typeCount)}
              <span style={{color: '#FFFFFF', opacity: local % 10 < 5 ? 1 : 0}}>▍</span>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  padding: '8px 16px',
                  borderRadius: 99,
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 0 16px rgba(255, 255, 255, 0.6)',
                }}
              >
                SEND ➔
              </div>
            </div>
          </div>
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 7: UNIVERSAL AGENT COMPATIBILITY GRID (43.5s – 54.5s / Frames 1305–1635)
// Isometric 3D floor flyover (Matching Doks.ai 10.0s - 12.5s flyover)
// ============================================================================
function AgentsScene() {
  const f = useCurrentFrame();
  const local = f - 1305;
  const alpha = interpolate(f, [1305, 1319, 1621, 1635], [0, 1, 1, 0], clamp);

  const agents = [
    {name: 'Antigravity', tag: 'Native IDE Sync'},
    {name: 'Codex', tag: 'Local Daemon'},
    {name: 'Claude Code', tag: 'Anthropic Proxy'},
    {name: 'Cursor', tag: 'OpenAI BaseURL'},
    {name: 'OpenCode', tag: 'CLI Gateway'},
    {name: 'Hermes', tag: 'Autonomous'},
  ];

  return (
    <AbsoluteFill style={{opacity: alpha, pointerEvents: 'none'}}>
      <Atmosphere />

      {/* 2D Crisp HUD Header */}
      <CenteredTitleBlock
        eyebrow="MODEL & AGENT COMPATIBILITY"
        title="One gateway. Every coding agent."
        sub="Drop-in compatibility. Just set your base URL to localhost:3000/v1."
        style={{top: 45}}
      />
      <WhiteBadge style={{position: 'absolute', right: 100, top: 50}} frame={local}>
        STANDARDIZED PROTOCOL · LOCAL DAEMON
      </WhiteBadge>

      <HumanCamera
        start={1305}
        end={1635}
        macroScale={1.25}
        macroPanX={0}
        macroPanY={30}
        pitchRange={[24, 14]}
        yawRange={[-10, 4]}
      >
        {/* ISOMETRIC 3D FLYOVER GRID CENTERED */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 260,
            width: 960,
            transform: `translateX(-50%) perspective(1200px) rotateX(38deg) rotateZ(-12deg) translateX(${interpolate(local, [0, 300], [0, 30], clamp)}px)`,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {agents.map((agent, i) => {
            const p = fade(local, 10 + i * 14, 34 + i * 14);
            const isSelected = i === 1;
            return (
              <div
                key={agent.name}
                style={{
                  borderRadius: 16,
                  border: isSelected ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'linear-gradient(135deg, rgba(22, 26, 30, 0.95), rgba(11, 13, 16, 0.98))',
                  boxShadow: isSelected
                    ? '0 25px 65px rgba(0,0,0,0.9), 0 0 35px rgba(255, 255, 255, 0.35)'
                    : '0 20px 50px rgba(0,0,0,0.7)',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 45}px) translateZ(${isSelected ? 30 : 0}px)`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#000000' : '#FFFFFF',
                    fontFamily: mono,
                    fontSize: 22,
                    fontWeight: 700,
                    boxShadow: isSelected ? '0 0 20px #FFFFFF' : 'none',
                  }}
                >
                  {agent.name[0]}
                </div>
                <div>
                  <div style={{fontFamily: inter, fontSize: 22, fontWeight: 700, color: C.white}}>{agent.name}</div>
                  <div style={{fontFamily: mono, fontSize: 12, color: C.muted, marginTop: 4}}>{agent.tag}</div>
                </div>
              </div>
            );
          })}
        </div>
      </HumanCamera>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 8: FINALE & CALL TO ACTION (54.5s – 60.0s / Frames 1635–1800)
// Kinetic typography & hero CTA (Doks.ai 13.0s - 19.5s)
// ============================================================================
function OutroScene() {
  const f = useCurrentFrame();
  const local = f - 1635;
  const appear = fade(local, 8, 30);
  const glowArc = interpolate(local, [0, 40, 160], [0, 1, 0.8], clamp);

  const words = ['Know', 'the', 'cost.', 'Stay', 'in', 'control.'];

  return (
    <HumanCamera start={1635} end={1800} macroScale={1.05} pitchRange={[12, 0]} yawRange={[-6, 0]}>
      <Atmosphere />

      {/* Luminous Rising White Ground Arc */}
      <div
        style={{
          position: 'absolute',
          width: 1500,
          height: 600,
          borderTop: '3px solid #FFFFFF',
          borderRadius: '50%',
          left: '50%',
          top: 760,
          transform: `translateX(-50%) scale(${0.7 + glowArc * 0.45})`,
          filter: 'blur(2px)',
          boxShadow: '0 -25px 140px rgba(255, 255, 255, 0.4)',
          opacity: glowArc,
        }}
      />

      {/* Hero Cairn Wordmark */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 150,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: appear,
        }}
      >
        <Img
          src={img('logo-transparent.png')}
          style={{
            width: 740,
            height: 250,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 50px rgba(255, 255, 255, 0.35))',
          }}
        />

        {/* Kinetic Tagline Reveal */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 35,
            fontFamily: inter,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: C.white,
          }}
        >
          {words.map((word, i) => {
            const p = fade(local, 28 + i * 6, 40 + i * 6);
            return (
              <span key={word} style={{opacity: p, transform: `translateY(${(1 - p) * 22}px)`, textShadow: '0 4px 30px rgba(0,0,0,0.9)'}}>
                {word}
              </span>
            );
          })}
        </div>

        {/* Terminal Quickstart Pill */}
        <div
          style={{
            marginTop: 32,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 8,
            padding: '10px 22px',
            fontFamily: mono,
            fontSize: 15,
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            opacity: fade(local, 65, 80),
          }}
        >
          $ npx cairn start
        </div>

        {/* Hero White CTA Button */}
        <div
          style={{
            marginTop: 24,
            borderRadius: 99,
            padding: '15px 36px',
            background: '#FFFFFF',
            color: '#07090B',
            fontFamily: inter,
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 0 45px rgba(255, 255, 255, 0.5), 0 15px 35px rgba(0,0,0,0.8)',
            opacity: fade(local, 80, 100),
            transform: `scale(${1 + Math.sin(local / 12) * 0.02})`,
          }}
        >
          Get started with Cairn
        </div>
      </div>
    </HumanCamera>
  );
}

// ============================================================================
// POLISHED SFX HAPTIC TRACK (22 PRECISION CUES)
// ============================================================================
const hapticCues = [
  // Scene 1: Intro (0s – 4s)
  {frame: 0, file: 'soft-swish.wav', volume: 0.25},
  {frame: 10, file: 'riser.wav', volume: 0.2},
  {frame: 36, file: 'impact.wav', volume: 0.38},
  {frame: 38, file: 'chime.wav', volume: 0.24},

  // Scene 2: Forecast (3.5s – 12s)
  {frame: 105, file: 'whoosh_r.wav', volume: 0.28},
  {frame: 135, file: 'soft-thud.wav', volume: 0.22},
  {frame: 177, file: 'ui_click.wav', volume: 0.3},
  {frame: 178, file: 'soft-tap.wav', volume: 0.25},
  {frame: 205, file: 'ui-confirm.wav', volume: 0.28},

  // Scene 3: Telemetry (11.5s – 20s)
  {frame: 345, file: 'whoosh_l.wav', volume: 0.26},
  {frame: 375, file: 'soft-thud.wav', volume: 0.22},
  {frame: 415, file: 'scan.wav', volume: 0.22},
  {frame: 450, file: 'pop.wav', volume: 0.25},
  {frame: 505, file: 'ping.wav', volume: 0.28},

  // Scene 4: Costs & Budget (19.5s – 28s)
  {frame: 585, file: 'whoosh_r.wav', volume: 0.26},
  {frame: 615, file: 'impact.wav', volume: 0.24},
  {frame: 639, file: 'ui_click.wav', volume: 0.3},
  {frame: 640, file: 'soft-tap.wav', volume: 0.25},
  {frame: 675, file: 'chime.wav', volume: 0.26},

  // Scene 5: Safety Gate & Git Time Machine (27.5s – 36s)
  {frame: 825, file: 'whoosh_l.wav', volume: 0.26},
  {frame: 855, file: 'buzz.wav', volume: 0.22},
  {frame: 923, file: 'ui_click.wav', volume: 0.32},
  {frame: 924, file: 'soft-tap.wav', volume: 0.28},
  {frame: 935, file: 'rewind.wav', volume: 0.42},
  {frame: 940, file: 'reverse_swell.wav', volume: 0.25},
  {frame: 960, file: 'lock.wav', volume: 0.35},
  {frame: 975, file: 'ui-confirm.wav', volume: 0.3},

  // Scene 6: Mobile Remote (35.5s – 44s)
  {frame: 1065, file: 'whoosh_r.wav', volume: 0.26},
  {frame: 1095, file: 'pop.wav', volume: 0.28},
  {frame: 1115, file: 'soft-tap.wav', volume: 0.18},
  {frame: 1125, file: 'soft-tap.wav', volume: 0.18},
  {frame: 1135, file: 'soft-tap.wav', volume: 0.18},
  {frame: 1145, file: 'soft-tap.wav', volume: 0.18},
  {frame: 1180, file: 'ui_click.wav', volume: 0.28},
  {frame: 1205, file: 'ping.wav', volume: 0.32},

  // Scene 7: Compatibility Grid (43.5s – 54.5s)
  {frame: 1305, file: 'whoosh_r.wav', volume: 0.28},
  {frame: 1335, file: 'blip.wav', volume: 0.24},
  {frame: 1365, file: 'blip.wav', volume: 0.24},
  {frame: 1495, file: 'whoosh_l.wav', volume: 0.24},

  // Scene 8: Finale Outro (54.5s – 60s)
  {frame: 1635, file: 'impact.wav', volume: 0.32},
  {frame: 1640, file: 'reverse_swell.wav', volume: 0.25},
  {frame: 1675, file: 'chime.wav', volume: 0.32},
  {frame: 1715, file: 'ui-confirm.wav', volume: 0.3},
  {frame: 1770, file: 'chime.wav', volume: 0.26},
];

function HapticTrack() {
  return (
    <>
      {hapticCues.map((cue, i) => (
        <Sequence key={i} from={cue.frame}>
          <Audio src={staticFile(`audio/${cue.file}`)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
}

// ============================================================================
// ROOT COMPOSITION
// ============================================================================
export const CairnLaunch: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  const musicVolume = interpolate(f, [0, 40, durationInFrames - 90, durationInFrames - 1], [0, 0.58, 0.58, 0], clamp);

  return (
    <AbsoluteFill style={{background: C.bg, color: C.white, fontFamily: inter, overflow: 'hidden'}}>
      <IntroScene />
      <ForecastScene />
      <ActivityScene />
      <CostsScene />
      <SafetyScene />
      <ControlScene />
      <AgentsScene />
      <OutroScene />
      <Grain />
      <Audio src={staticFile('audio/cairn-ambient.wav')} volume={musicVolume} />
      <HapticTrack />
    </AbsoluteFill>
  );
};
