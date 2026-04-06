/**
 * components/Diamond.jsx
 * Replaces all emoji/circle dots with angular diamond shape.
 * Glows with rank color.
 */

export default function Diamond({ color="#8892a4", size=7, pulse=false }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      background: color,
      transform: "rotate(45deg)",
      flexShrink: 0,
      boxShadow: `0 0 ${size}px ${color}`,
      animation: pulse ? "dPulse 1.5s ease infinite" : "none",
    }}>
      <style>{`
        @keyframes dPulse {
          0%,100% { opacity:1; box-shadow:0 0 ${size}px ${color}; }
          50%      { opacity:0.4; box-shadow:0 0 ${size*3}px ${color}; }
        }
      `}</style>
    </span>
  );
}
