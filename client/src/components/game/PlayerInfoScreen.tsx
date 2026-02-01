import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { User, Briefcase, Award } from "lucide-react";

interface PlayerInfoScreenProps {
  onComplete: (data: { name: string; job: string; title: string }) => void;
}

const JOB_OPTIONS = [
  { id: "NONE", label: "None", description: "Undetermined class" },
  { id: "FIGHTER", label: "Fighter", description: "Melee combat specialist" },
  { id: "MAGE", label: "Mage", description: "Arcane arts wielder" },
  { id: "ASSASSIN", label: "Assassin", description: "Shadow striker" },
  { id: "HEALER", label: "Healer", description: "Life restoration expert" },
  { id: "TANK", label: "Tank", description: "Frontline defender" },
];

const TITLE_OPTIONS = [
  { id: "WOLF SLAYER", label: "Wolf Slayer" },
  { id: "SHADOW MONARCH", label: "Shadow Monarch" },
  { id: "IRON WILL", label: "Iron Will" },
  { id: "RISING HUNTER", label: "Rising Hunter" },
  { id: "AWAKENED ONE", label: "Awakened One" },
];

export function PlayerInfoScreen({ onComplete }: PlayerInfoScreenProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [job, setJob] = useState("NONE");
  const [title, setTitle] = useState("WOLF SLAYER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        onComplete({ name, job, title });
      }, 800);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, #000000 0%, #0a0a1a 50%, #000000 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isSubmitting ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px"
            style={{
              left: `${(i / 30) * 100}%`,
              top: 0,
              height: "100%",
              background: `linear-gradient(180deg, transparent, ${theme.colors.primary}40, transparent)`,
            }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <motion.div
            className="text-xs tracking-[0.4em] mb-2 text-center uppercase"
            style={{ color: theme.colors.primary }}
          >
            Hunter Registration
          </motion.div>
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: "40px",
                  background: i <= step ? theme.colors.primary : "rgba(255,255,255,0.2)",
                }}
                animate={{ scale: i === step ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: i === step ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <User className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                <h2 className="text-xl font-display mb-2" style={{ color: theme.colors.primary }}>
                  What is your name, Hunter?
                </h2>
                <p className="text-sm text-muted-foreground">
                  The System requires your designation
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full px-4 py-4 text-lg text-center font-display bg-black/50 border-2 rounded-lg focus:outline-none transition-colors"
                  style={{
                    borderColor: name ? theme.colors.primary : "rgba(255,255,255,0.2)",
                    color: theme.colors.primary,
                  }}
                  data-testid="input-player-name"
                  autoFocus
                />
                <motion.div
                  className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2"
                  style={{ background: theme.colors.primary }}
                  initial={{ width: 0 }}
                  animate={{ width: name ? "80%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                <h2 className="text-xl font-display mb-2" style={{ color: theme.colors.primary }}>
                  Select Your Class
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your combat specialization
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {JOB_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setJob(option.id)}
                    className="p-3 rounded-lg border-2 text-left transition-all"
                    style={{
                      borderColor: job === option.id ? theme.colors.primary : "rgba(255,255,255,0.1)",
                      background: job === option.id ? `${theme.colors.primary}15` : "rgba(0,0,0,0.3)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`button-job-${option.id.toLowerCase()}`}
                  >
                    <div
                      className="text-sm font-display"
                      style={{ color: job === option.id ? theme.colors.primary : "rgba(255,255,255,0.7)" }}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Award className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                <h2 className="text-xl font-display mb-2" style={{ color: theme.colors.primary }}>
                  Claim Your Title
                </h2>
                <p className="text-sm text-muted-foreground">
                  How shall the System address you?
                </p>
              </div>

              <div className="space-y-2">
                {TITLE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setTitle(option.id)}
                    className="w-full p-4 rounded-lg border-2 text-center transition-all"
                    style={{
                      borderColor: title === option.id ? theme.colors.primary : "rgba(255,255,255,0.1)",
                      background: title === option.id ? `${theme.colors.primary}15` : "rgba(0,0,0,0.3)",
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    data-testid={`button-title-${option.id.toLowerCase().replace(/ /g, "-")}`}
                  >
                    <div
                      className="font-display tracking-wider"
                      style={{ color: title === option.id ? theme.colors.primary : "rgba(255,255,255,0.7)" }}
                    >
                      {option.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="mt-10 flex gap-4">
          {step > 0 && (
            <motion.button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 font-display tracking-wider uppercase border-2 rounded-lg"
              style={{
                borderColor: "rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.7)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="button-back"
            >
              Back
            </motion.button>
          )}
          <motion.button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 font-display tracking-wider uppercase rounded-lg transition-all"
            style={{
              background: canProceed() ? theme.colors.primary : "rgba(255,255,255,0.1)",
              color: canProceed() ? "#000" : "rgba(255,255,255,0.3)",
              cursor: canProceed() ? "pointer" : "not-allowed",
            }}
            whileHover={canProceed() ? { scale: 1.02 } : {}}
            whileTap={canProceed() ? { scale: 0.98 } : {}}
            data-testid="button-next"
          >
            {step === 2 ? "Complete Registration" : "Continue"}
          </motion.button>
        </motion.div>
      </motion.div>

      {isSubmitting && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "#000" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-xl font-display tracking-widest"
            style={{ color: theme.colors.primary }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            SYNCHRONIZING...
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
