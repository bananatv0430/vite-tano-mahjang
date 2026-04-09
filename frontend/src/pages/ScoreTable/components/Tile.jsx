import React from "react";

export default function Tile({ name, rotated = false, back = false, className }) {
  const basePath = "/images/cards/";
  const src = back ? `${basePath}back.png` : `${basePath}${name}.png`;

  return (
    <img
      src={src}
      alt={name}
      className={className}
      style={rotated ? { transform: "rotate(90deg)" } : undefined}
    />
  );
}