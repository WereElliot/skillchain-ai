import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  isActive: boolean;
  color?: 'purple' | 'cyan';
  barCount?: number;
}

const VoiceWaveform = ({
  isActive,
  color = 'purple',
  barCount = 7,
}: VoiceWaveformProps) => {
  const colorClass = color === 'purple' ? 'bg-purple' : 'bg-cyan';

  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-0.5 rounded-full ${colorClass}`}
          animate={
            isActive
              ? {
                  height: [4, 12 + Math.random() * 14, 4],
                }
              : { height: 4 }
          }
          transition={
            isActive
              ? {
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.08,
                  ease: 'easeInOut',
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
