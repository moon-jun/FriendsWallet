import type React from "react";
import "./components.css";

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="checkbox" type="checkbox" {...props} />;
}
