/**
 * components/Icon.jsx
 * Reusable SVG icon component.
 *
 * USAGE:
 *   import Icon from "../components/Icon";
 *   <Icon path="M12 8v4..." size={18} color="#fff" />
 *
 * The 'path' value comes from constants/navItems.js or any heroicon.
 */

export default function Icon({ path, size = 18, color = "currentColor", strokeWidth = 1.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}
