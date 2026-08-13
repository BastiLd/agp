import React from 'react';
import Svg, { Path, Circle, Ellipse, Polygon, G } from 'react-native-svg';
import { colors } from '../theme/colors';

// Avo - das Maskottchen 🥑
// Eine freundliche Avocado mit Krawatte. "mood" steuert das Gesicht:
//   'normal' = freundliches Lächeln
//   'happy'  = freut sich (lachende Augen, breites Lachen)
//   'sad'    = schaut traurig
// "size" bestimmt die Breite in Pixeln (Höhe wird automatisch passend berechnet).
export default function Avo({ size = 200, mood = 'normal' }) {
  const height = size * (260 / 220);

  // Mund je nach Stimmung
  let mouth;
  if (mood === 'happy') {
    mouth = (
      <G>
        <Path d="M88,116 Q110,138 132,116 Z" fill={colors.text} />
        <Ellipse cx="110" cy="130" rx="8" ry="4.5" fill="#EA8A82" />
      </G>
    );
  } else if (mood === 'sad') {
    mouth = (
      <Path d="M88,132 Q110,116 132,132" stroke={colors.text} strokeWidth={6} fill="none" strokeLinecap="round" />
    );
  } else {
    mouth = (
      <Path d="M88,118 Q110,136 132,118" stroke={colors.text} strokeWidth={6} fill="none" strokeLinecap="round" />
    );
  }

  return (
    <Svg width={size} height={height} viewBox="0 0 220 260">
      {/* weicher Bodenschatten */}
      <Ellipse cx="110" cy="248" rx="66" ry="9" fill="#000000" opacity={0.06} />

      {/* Körper / Schale (dunkleres Grün) */}
      <Path
        d="M110,24 C68,24 50,70 50,124 C50,196 78,238 110,238 C142,238 170,196 170,124 C170,70 152,24 110,24 Z"
        fill={colors.primary}
      />
      {/* Fruchtfleisch (helles Grün) */}
      <Path
        d="M110,42 C76,42 66,80 66,126 C66,192 88,222 110,222 C132,222 154,192 154,126 C154,80 144,42 110,42 Z"
        fill={colors.primaryLight}
      />
      {/* sanftes Glanzlicht oben links */}
      <Ellipse cx="80" cy="64" rx="10" ry="16" fill={colors.white} opacity={0.25} />

      {/* Kern / Bauch (Braun) mit kleinem Glanzpunkt */}
      <Circle cx="110" cy="176" r="36" fill={colors.pit} />
      <Ellipse cx="100" cy="165" rx="11" ry="15" fill="#B5743F" opacity={0.55} />

      {/* Wangen (Blush) */}
      <Ellipse cx="74" cy="118" rx="11" ry="7" fill="#F2A07B" opacity={0.55} />
      <Ellipse cx="146" cy="118" rx="11" ry="7" fill="#F2A07B" opacity={0.55} />

      {/* Augen */}
      {mood === 'happy' ? (
        <G>
          {/* lachende, geschlossene Augen */}
          <Path d="M76,98 Q90,84 104,98" stroke={colors.text} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M116,98 Q130,84 144,98" stroke={colors.text} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Circle cx="90" cy="96" r="16" fill={colors.white} />
          <Circle cx="130" cy="96" r="16" fill={colors.white} />
          <Circle cx="92" cy="99" r="9" fill={colors.text} />
          <Circle cx="128" cy="99" r="9" fill={colors.text} />
          {/* kleine Glanzpunkte in den Augen */}
          <Circle cx="96" cy="93" r="3.5" fill={colors.white} />
          <Circle cx="132" cy="93" r="3.5" fill={colors.white} />
        </G>
      )}

      {/* traurige Augenbrauen */}
      {mood === 'sad' && (
        <G>
          <Path d="M74,74 L98,84" stroke={colors.text} strokeWidth={5} strokeLinecap="round" />
          <Path d="M122,84 L146,74" stroke={colors.text} strokeWidth={5} strokeLinecap="round" />
        </G>
      )}

      {/* Mund */}
      {mouth}

      {/* Krawatte (Knoten + herabhängender Teil) */}
      <Polygon points="100,140 120,140 116,154 104,154" fill={colors.tie} />
      <Polygon points="104,154 116,154 122,182 110,194 98,182" fill={colors.tie} />
    </Svg>
  );
}
