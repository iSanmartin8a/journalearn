import { useEffect, useState } from "react";

type RandomRevealProps = {
  text: string;
  speed?: number; // ms entre frames
};

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default function RandomReveal({ text, speed = 30 }: RandomRevealProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let frame = 0;
    const totalFrames = text.length * 5; // cuantos ciclos de aleatorio por letra

    const interval = setInterval(() => {
      let newText = "";

      for (let i = 0; i < text.length; i++) {
        if (i < frame / 5) {
          newText += text[i]; // letra correcta
        } else {
          newText += characters[Math.floor(Math.random() * characters.length)];
        }
      }

      setDisplay(newText);

      frame++;
      if (frame > totalFrames) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className="font-mono">{display}</span>;
}
