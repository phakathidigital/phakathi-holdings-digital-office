import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Gift, X } from "lucide-react";

// Simple canvas confetti
function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 12 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 5,
      opacity: 1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.angle += p.spin;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const timeout = setTimeout(() => cancelAnimationFrame(animId), 8000);
    return () => { cancelAnimationFrame(animId); clearTimeout(timeout); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-40" />;
}

export default function BirthdayConfetti({ user }) {
  const [show, setShow] = useState(false);
  const [birthdayPerson, setBirthdayPerson] = useState(null);

  useEffect(() => {
    if (!user) return;

    const checkBirthday = async () => {
      try {
        // Check if today is user's own birthday
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        const profile = profiles?.[0];
        if (!profile?.birthday) return;

        const today = new Date();
        const bday = new Date(profile.birthday);
        const isToday = bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
        const currentYear = today.getFullYear().toString();

        if (isToday && profile.birthday_celebrated !== currentYear) {
          setBirthdayPerson({ name: user.full_name || user.email, isSelf: true });
          setShow(true);
          // Mark as celebrated
          await base44.entities.UserProfile.update(profile.id, { birthday_celebrated: currentYear });
        }
      } catch (e) {}
    };
    checkBirthday();
  }, [user]);

  if (!show) return null;

  return (
    <>
      <ConfettiCanvas />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 40 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-yellow-200 p-6 max-w-sm w-full mx-4 text-center"
        >
          <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
          <div className="text-5xl mb-3">🎂</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Happy Birthday!</h2>
          <p className="text-gray-600 text-sm">
            Wishing you an amazing day, <strong>{birthdayPerson?.name?.split(" ")[0]}</strong>! 🎉<br />
            From everyone at Phakathi Holdings.
          </p>
          <motion.div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl text-sm font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Gift className="w-4 h-4" />
            Have a wonderful day!
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}