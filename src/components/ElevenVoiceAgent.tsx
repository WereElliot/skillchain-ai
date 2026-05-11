import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import VoiceWaveform from '@/components/VoiceWaveform';
import { toast } from '@/hooks/use-toast';
import { demoMode } from '@/lib/config';

interface ElevenVoiceAgentProps {
  onMessageReceived?: (message: string) => void;
}

const ElevenVoiceAgent = ({
  onMessageReceived,
}: ElevenVoiceAgentProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState(
    'Find me the best Solana frontend gigs and draft a proposal.',
  );
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
  } | null>(null);

  const supportsSpeechRecognition =
    typeof window !== 'undefined' &&
    (('SpeechRecognition' in window && window.SpeechRecognition) ||
      ('webkitSpeechRecognition' in window && window.webkitSpeechRecognition));
  const supportsSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const modeLabel = useMemo(() => {
    if (supportsSpeechRecognition) return 'Browser voice';
    if (demoMode.voice) return 'Transcript assist';
    return 'Voice assist';
  }, [supportsSpeechRecognition]);

  const buildRecognition = () => {
    const RecognitionCtor =
      window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      return null;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (nextTranscript) {
        setTranscript(nextTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: 'Voice capture interrupted',
        description: 'Microphone capture was interrupted. You can still send a typed transcript.',
      });
    };

    return recognition;
  };

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!supportsSpeechRecognition) {
      toast({
        title: 'Speech recognition unavailable',
        description: 'This browser does not expose speech recognition. Use the transcript box below.',
      });
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const recognition = buildRecognition();
      if (!recognition) {
        throw new Error('Speech recognition constructor unavailable.');
      }

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start voice capture:', error);
      toast({
        title: 'Microphone unavailable',
        description: 'Use the transcript box if microphone permission is blocked.',
      });
    }
  };

  const playAcknowledgement = () => {
    if (!supportsSpeechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      demoMode.voice
        ? 'Voice prompt captured and sent to the SkillChain agent.'
        : 'Voice prompt captured and sent to the SkillChain agent.',
    );
    utterance.rate = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendTranscript = async () => {
    const prompt = transcript.trim();
    if (!prompt) return;

    onMessageReceived?.(prompt);
    playAcknowledgement();
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => void toggleListening()}
          className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 ${
            isListening
              ? 'bg-cyan hover:bg-cyan/80 text-black shadow-glow-cyan animate-pulse'
              : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
          }`}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-3 border border-cyan/20 bg-cyan/10 px-4 py-2">
          <VoiceWaveform isActive={isListening || isSpeaking} color="cyan" barCount={7} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan">
            {modeLabel}
          </span>
        </div>
      </div>

      <div className="w-full border border-border bg-surface-1 p-4 text-left">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan">
              Voice Console
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Capture speech when supported, or send a polished transcript to the agent.
            </p>
          </div>
          {isSpeaking ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan" />
          ) : (
            <Volume2 className="h-4 w-4 text-cyan" />
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={3}
          className="w-full border border-border bg-[#050505] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan/40 focus:outline-none"
          placeholder="Simulated transcript..."
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={() => void handleSendTranscript()}
            className="rounded-none bg-cyan text-black hover:bg-cyan/90"
          >
            Send Transcript
          </Button>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Browser-native voice capture with transcript fallback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElevenVoiceAgent;
